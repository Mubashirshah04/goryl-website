import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { increment } from '@aws-sdk/util-dynamodb';

const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';
const LIKES_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_LIKES_TABLE || 'goryl-likes';
const PRODUCTS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_PRODUCTS_TABLE || 'goryl-products';

// Initialize DynamoDB client (server-side only)
const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function POST(request: NextRequest) {
  try {
    const { userId, productId, itemType } = await request.json();

    if (!userId || !productId || !itemType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('📌 Like API: Processing like request', { userId, productId, itemType });

    // Create like ID
    const likeId = `${userId}_${itemType}_${productId}`;

    // Check if already liked
    try {
      const getCommand = new GetCommand({
        TableName: LIKES_TABLE,
        Key: { id: likeId }
      });
      const existingLike = await docClient.send(getCommand);
      
      if (existingLike.Item) {
        // Unlike - delete the like
        console.log('📌 Like API: Removing like');
        const deleteCommand = new DeleteCommand({
          TableName: LIKES_TABLE,
          Key: { id: likeId }
        });
        await docClient.send(deleteCommand);

        // Decrement product like count
        const updateCommand = new UpdateCommand({
          TableName: PRODUCTS_TABLE,
          Key: { id: productId },
          UpdateExpression: 'SET likeCount = if_not_exists(likeCount, :zero) - :one',
          ExpressionAttributeValues: {
            ':zero': 0,
            ':one': 1
          }
        });
        await docClient.send(updateCommand);

        return NextResponse.json({ liked: false, message: 'Unliked' });
      }
    } catch (err: any) {
      if (err.name !== 'ResourceNotFoundException') {
        console.error('Error checking like status:', err);
      }
    }

    // Like - create new like record
    console.log('📌 Like API: Adding like');
    const now = new Date().toISOString();
    const putCommand = new PutCommand({
      TableName: LIKES_TABLE,
      Item: {
        id: likeId,
        userId,
        targetType: itemType,
        targetId: productId,
        createdAt: now
      }
    });
    await docClient.send(putCommand);

    // Increment product like count
    const updateCommand = new UpdateCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId },
      UpdateExpression: 'SET likeCount = if_not_exists(likeCount, :zero) + :one',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':one': 1
      }
    });
    await docClient.send(updateCommand);

    return NextResponse.json({ liked: true, message: 'Liked' });
  } catch (error) {
    console.error('❌ Error in like API:', error);
    return NextResponse.json(
      { error: 'Failed to process like' },
      { status: 500 }
    );
  }
}
