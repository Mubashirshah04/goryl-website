import { NextResponse } from 'next/server';

export async function GET() {
  // Read from environment at request time
  const PUBLIC_KEYS = {
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1',
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'ap-south-1_UrgROe7bY',
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '1dnqju9c3c6fhtq937fl5gmh8e',
    cognitoDomain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || 'zaillisy-auth.auth.ap-south-1.amazoncognito.com',
    productsTable: process.env.NEXT_PUBLIC_DYNAMODB_PRODUCTS_TABLE || 'goryl-products',
    usersTable: process.env.NEXT_PUBLIC_DYNAMODB_USERS_TABLE || 'goryl-users',
    reelsTable: process.env.NEXT_PUBLIC_DYNAMODB_REELS_TABLE || 'goryl-reels',
    chatsTable: process.env.NEXT_PUBLIC_DYNAMODB_CHATS_TABLE || 'goryl-chats',
    messagesTable: process.env.NEXT_PUBLIC_DYNAMODB_MESSAGES_TABLE || 'goryl-messages',
    s3Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'goryl-storage',
    s3CdnUrl: process.env.NEXT_PUBLIC_S3_CDN_URL || 'https://zaillisy-storage.s3.ap-south-1.amazonaws.com'
  };

  return NextResponse.json(PUBLIC_KEYS, {
    headers: {
      'Cache-Control': 'no-store'
    }
  });
}
