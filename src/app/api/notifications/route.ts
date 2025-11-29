import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

console.log('🔧 Initializing DynamoDB client...');
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

const NOTIFICATIONS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_NOTIFICATIONS_TABLE || 'goryl-notifications';
console.log('📊 Notifications table:', NOTIFICATIONS_TABLE);

// GET /api/notifications?userId=xxx - Fetch user's notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    console.log('🔍 Fetching notifications for user:', userId);
    console.log('📊 Using table:', NOTIFICATIONS_TABLE);

    try {
      const queryCommand = new QueryCommand({
        TableName: NOTIFICATIONS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: false, // Most recent first
      });

      const queryResult = await docClient.send(queryCommand);
      const notifications = queryResult.Items || [];
      console.log('✅ Query successful! Notifications fetched:', notifications.length);
      return NextResponse.json(notifications);
    } catch (queryError) {
      console.log('⚠️ Query failed, error:', String(queryError));
      console.log('🔄 Attempting Scan with filter...');
      
      const scanCommand = new ScanCommand({
        TableName: NOTIFICATIONS_TABLE,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      });

      const scanResult = await docClient.send(scanCommand);
      const notifications = scanResult.Items || [];
      console.log('✅ Scan successful! Notifications fetched:', notifications.length);
      if (notifications.length > 0) {
        console.log('📋 First notification:', JSON.stringify(notifications[0], null, 2));
      }
      return NextResponse.json(notifications);
    }
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications', details: String(error) }, { status: 500 });
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    console.log('📨 POST /api/notifications called');
    const body = await request.json();
    console.log('📥 Request body:', JSON.stringify(body));
    const { userId, type, title, message, data } = body;

    if (!userId || !type || !title || !message) {
      console.error('❌ Missing required fields:', { userId: !!userId, type: !!type, title: !!title, message: !!message });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const notification = {
      id: notificationId,
      userId,
      type,
      title,
      message,
      read: false,
      data: data || {},
      createdAt: now,
      updatedAt: now,
    };

    console.log('💾 Saving notification for user:', userId);
    console.log('📊 Using table:', NOTIFICATIONS_TABLE);
    console.log('📋 Notification data:', JSON.stringify(notification, null, 2));

    const command = new PutCommand({
      TableName: NOTIFICATIONS_TABLE,
      Item: notification,
    });

    console.log('🔄 Executing PutCommand...');
    await docClient.send(command);
    console.log('✅ Notification saved successfully:', notificationId);

    return NextResponse.json(notification);
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    console.error('📋 Error details:', String(error));
    return NextResponse.json({ error: 'Failed to create notification', details: String(error) }, { status: 500 });
  }
}

// PATCH /api/notifications/:id - Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, userId, read } = body;

    if (!notificationId || !userId) {
      return NextResponse.json({ error: 'notificationId and userId are required' }, { status: 400 });
    }

    console.log('📝 Updating notification:', notificationId, 'for user:', userId);

    const command = new UpdateCommand({
      TableName: NOTIFICATIONS_TABLE,
      Key: { 
        userId: userId,
        id: notificationId 
      },
      UpdateExpression: 'SET #read = :read, updatedAt = :now',
      ExpressionAttributeNames: {
        '#read': 'read',
      },
      ExpressionAttributeValues: {
        ':read': read !== undefined ? read : true,
        ':now': new Date().toISOString(),
      },
    });

    await docClient.send(command);

    console.log('✅ Notification updated');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
