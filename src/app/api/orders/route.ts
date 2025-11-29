import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

console.log('🔧 Initializing DynamoDB client for orders...');
console.log('📍 AWS Region:', process.env.AWS_REGION || 'ap-south-1');
console.log('🔑 AWS Access Key ID available:', !!process.env.AWS_ACCESS_KEY_ID);
console.log('🔑 AWS Secret Access Key available:', !!process.env.AWS_SECRET_ACCESS_KEY);

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined
});
const docClient = DynamoDBDocumentClient.from(client);

const ORDERS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_ORDERS_TABLE || 'goryl-orders';

// GET /api/orders?userId=xxx - Fetch user's orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    console.log('🔍 Fetching orders for user:', userId);
    console.log('📊 Using table:', ORDERS_TABLE);

    // Try Query first (if userId is partition key)
    try {
      console.log('🔄 Attempting Query...');
      const queryCommand = new QueryCommand({
        TableName: ORDERS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      });

      const queryResult = await docClient.send(queryCommand);
      const orders = queryResult.Items || [];
      console.log('✅ Query successful! Orders found:', orders.length);
      if (orders.length > 0) {
        console.log('📋 First order:', JSON.stringify(orders[0], null, 2));
      }
      return NextResponse.json(orders);
    } catch (queryError) {
      // If Query fails, try Scan with filter (fallback)
      console.log('⚠️ Query failed, error:', String(queryError));
      console.log('🔄 Attempting Scan with filter...');
      
      const scanCommand = new ScanCommand({
        TableName: ORDERS_TABLE,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      });

      const scanResult = await docClient.send(scanCommand);
      const orders = scanResult.Items || [];
      console.log('✅ Scan successful! Orders found:', orders.length);
      if (orders.length > 0) {
        console.log('📋 First order:', JSON.stringify(orders[0], null, 2));
      }
      return NextResponse.json(orders);
    }
  } catch (error) {
    console.error('❌ Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders', details: String(error) }, { status: 500 });
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, items, subtotal, tax, shipping, total, shippingAddress, paymentMethod, trackingNumber } = body;

    if (!userId || !items || !total) {
      console.error('❌ Missing required fields:', { userId: !!userId, items: !!items, total: !!total });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const order = {
      id: orderId,
      userId,
      items,
      subtotal: subtotal || 0,
      tax: tax || 0,
      shipping: shipping || 0,
      total,
      shippingAddress,
      paymentMethod: paymentMethod || 'cod',
      status: 'pending',
      trackingNumber: trackingNumber || `GW${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    console.log('💾 Saving order to DynamoDB:', orderId);
    console.log('📊 Using table:', ORDERS_TABLE);
    console.log('👤 User ID:', userId);
    console.log('📋 Order data:', JSON.stringify(order, null, 2));

    const command = new PutCommand({
      TableName: ORDERS_TABLE,
      Item: order,
    });

    await docClient.send(command);

    console.log('✅ Order saved successfully:', orderId);
    console.log('🔄 Order should now be queryable by userId:', userId);

    // Send notifications to buyer and sellers
    try {
      console.log('📢 Sending notifications...');
      
      // 1. Notification for buyer
      const buyerNotification = {
        userId,
        type: 'order_placed',
        title: 'Order Placed Successfully! 🎉',
        message: `Your order #${orderId.slice(-8).toUpperCase()} has been placed. Total: Rs ${total.toFixed(2)}`,
        data: {
          orderId,
          orderNumber: orderId.slice(-8).toUpperCase(),
          total,
          itemCount: items.length,
        },
      };

      console.log('📤 Sending buyer notification:', JSON.stringify(buyerNotification));
      const buyerResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buyerNotification),
      });

      if (!buyerResponse.ok) {
        console.error('❌ Buyer notification failed:', buyerResponse.status, await buyerResponse.text());
      } else {
        console.log('✅ Buyer notification sent');
      }

      // 2. Notifications for sellers (one per unique seller)
      const sellerIds = new Set<string>();
      items.forEach((item: any) => {
        if (item.sellerId) {
          sellerIds.add(item.sellerId);
        }
      });

      for (const sellerId of sellerIds) {
        const sellerItems = items.filter((item: any) => item.sellerId === sellerId);
        const sellerNotification = {
          userId: sellerId,
          type: 'order_received',
          title: 'New Order Received! 📦',
          message: `You received a new order with ${sellerItems.length} item(s). Order #${orderId.slice(-8).toUpperCase()}`,
          data: {
            orderId,
            orderNumber: orderId.slice(-8).toUpperCase(),
            buyerId: userId,
            itemCount: sellerItems.length,
            total: sellerItems.reduce((sum: number, item: any) => sum + (item.product?.price || 0) * item.quantity, 0),
          },
        };

        console.log('📤 Sending seller notification to:', sellerId, JSON.stringify(sellerNotification));
        const sellerResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sellerNotification),
        });

        if (!sellerResponse.ok) {
          console.error('❌ Seller notification failed for', sellerId, ':', sellerResponse.status, await sellerResponse.text());
        } else {
          console.log('✅ Seller notification sent to:', sellerId);
        }
      }
    } catch (notificationError) {
      console.error('⚠️ Error sending notifications:', notificationError);
      // Don't fail the order creation if notifications fail
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('❌ Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order', details: String(error) }, { status: 500 });
  }
}
