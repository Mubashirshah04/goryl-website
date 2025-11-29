import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';
const SAVES_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_SAVES_TABLE || 'goryl-saves';
const PRODUCTS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_PRODUCTS_TABLE || 'goryl-products';

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

    console.log('📌 Save API: Processing save request', { userId, productId, itemType });

    const saveId = `${userId}_${itemType}_${productId}`;

    // Check if already saved
    try {
      const getCommand = new GetCommand({
        TableName: SAVES_TABLE,
        Key: { id: saveId }
      });
      const existingSave = await docClient.send(getCommand);
      
      if (existingSave.Item) {
        // Unsave - delete the save
        console.log('📌 Save API: Removing save');
        const deleteCommand = new DeleteCommand({
          TableName: SAVES_TABLE,
          Key: { id: saveId }
        });
        await docClient.send(deleteCommand);

        return NextResponse.json({ saved: false, message: 'Removed from saved' });
      }
    } catch (err: any) {
      if (err.name !== 'ResourceNotFoundException') {
        console.error('Error checking save status:', err);
      }
    }

    // Save - create new save record
    console.log('📌 Save API: Adding save');
    const now = new Date().toISOString();
    const putCommand = new PutCommand({
      TableName: SAVES_TABLE,
      Item: {
        id: saveId,
        userId,
        targetType: itemType,
        targetId: productId,
        createdAt: now
      }
    });
    await docClient.send(putCommand);

    return NextResponse.json({ saved: true, message: 'Saved' });
  } catch (error) {
    console.error('❌ Error in save API:', error);
    return NextResponse.json(
      { error: 'Failed to process save' },
      { status: 500 }
    );
  }
}
