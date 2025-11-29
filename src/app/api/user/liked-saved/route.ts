import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';
const LIKES_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_LIKES_TABLE || 'goryl-likes';
const SAVES_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_SAVES_TABLE || 'goryl-saves';

const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'liked' or 'saved'

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'Missing userId or type' },
        { status: 400 }
      );
    }

    console.log(`📌 Fetching ${type} products for user:`, userId);

    const table = type === 'liked' ? LIKES_TABLE : SAVES_TABLE;

    // Query all items for this user
    const queryCommand = new QueryCommand({
      TableName: table,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });

    const result = await docClient.send(queryCommand);
    const items = result.Items || [];

    console.log(`✅ Found ${items.length} ${type} items for user`);

    return NextResponse.json({
      success: true,
      items: items.map((item: any) => ({
        id: item.id,
        productId: item.targetId,
        userId: item.userId,
        createdAt: item.createdAt
      }))
    });
  } catch (error) {
    console.error(`❌ Error fetching ${type} products:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}
