import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ADDRESSES_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_ADDRESSES_TABLE || 'goryl-addresses';

// GET /api/addresses?userId=xxx - Fetch user's addresses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    console.log('🔍 Fetching addresses for user:', userId);

    const command = new QueryCommand({
      TableName: ADDRESSES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });

    const result = await docClient.send(command);
    const addresses = result.Items || [];

    console.log('📍 Addresses found:', addresses.length);
    return NextResponse.json(addresses);
  } catch (error) {
    console.error('❌ Error fetching addresses:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

// POST /api/addresses - Create a new address
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, firstName, lastName, addressLine1, city, state, postalCode, country, phone, company, addressLine2, isDefault } = body;

    if (!userId || !firstName || !lastName || !addressLine1 || !city || !state || !postalCode || !country || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const addressId = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const address = {
      id: addressId,
      userId,
      firstName,
      lastName,
      addressLine1,
      addressLine2: addressLine2 || '',
      city,
      state,
      postalCode,
      country,
      phone,
      company: company || '',
      isDefault: isDefault || false,
      type: 'home',
      createdAt: now,
      updatedAt: now,
    };

    console.log('💾 Saving address to DynamoDB:', addressId);

    const command = new PutCommand({
      TableName: ADDRESSES_TABLE,
      Item: address,
    });

    await docClient.send(command);

    console.log('✅ Address saved successfully:', addressId);
    return NextResponse.json({ id: addressId, ...address });
  } catch (error) {
    console.error('❌ Error creating address:', error);
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}
