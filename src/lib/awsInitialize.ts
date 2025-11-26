// Initialize AWS config using public environment variables defined in .env.local
const config = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || '',
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '',
  cognitoDomain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '',
  productsTable: process.env.NEXT_PUBLIC_DYNAMODB_PRODUCTS_TABLE || '',
  usersTable: process.env.NEXT_PUBLIC_DYNAMODB_USERS_TABLE || '',
  reelsTable: process.env.NEXT_PUBLIC_DYNAMODB_REELS_TABLE || '',
  chatsTable: process.env.NEXT_PUBLIC_DYNAMODB_CHATS_TABLE || '',
  messagesTable: process.env.NEXT_PUBLIC_DYNAMODB_MESSAGES_TABLE || '',
  s3Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || '',
  s3CdnUrl: process.env.NEXT_PUBLIC_S3_CDN_URL || ''
} as const;

// Debug log to check if config is loaded
console.log('AWS Config Status:', {
  userPoolId: config.userPoolId ? 'Set' : 'Missing',
  clientId: config.clientId ? 'Set' : 'Missing',
  region: config.region
});

// Make config available globally
if (typeof window !== 'undefined') {
  if (!window.__AWS_CONFIG__) {
    window.__AWS_CONFIG__ = config;
  } else {
    // Update existing config with any missing values
    window.__AWS_CONFIG__ = {
      ...window.__AWS_CONFIG__,
      ...config
    };
  }
}

export default config;
