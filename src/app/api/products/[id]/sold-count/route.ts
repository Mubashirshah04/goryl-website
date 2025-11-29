import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';
const ORDERS_TABLE = 'goryl-orders';

const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle Next.js 15 async params
    const resolvedParams = params instanceof Promise ? await params : params;
    const productId = resolvedParams.id;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Scan orders table to count sold items
    const scanCommand = new ScanCommand({
      TableName: ORDERS_TABLE,
      FilterExpression: 'attribute_exists(#items)',
      ExpressionAttributeNames: {
        '#items': 'items'
      }
    });

    const result = await docClient.send(scanCommand);
    const orders = result.Items || [];

    // Count how many times this product appears in all orders
    let soldCount = 0;
    orders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          if (item.productId === productId) {
            soldCount += item.quantity || 1;
          }
        });
      }
    });

    return NextResponse.json({
      success: true,
      productId,
      sold: soldCount
    });
  } catch (error: any) {
    console.error('Error calculating sold count:', error);
    // Return 0 if there's an error
    return NextResponse.json({
      success: true,
      sold: 0
    });
  }
}
