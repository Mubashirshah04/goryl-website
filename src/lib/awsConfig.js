// AWS Configuration
const getConfig = () => {
  const config = {
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    cognitoDomain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
    productsTable: process.env.NEXT_PUBLIC_DYNAMODB_PRODUCTS_TABLE,
    usersTable: process.env.NEXT_PUBLIC_DYNAMODB_USERS_TABLE,
    reelsTable: process.env.NEXT_PUBLIC_DYNAMODB_REELS_TABLE,
    chatsTable: process.env.NEXT_PUBLIC_DYNAMODB_CHATS_TABLE,
    messagesTable: process.env.NEXT_PUBLIC_DYNAMODB_MESSAGES_TABLE,
    s3Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
    s3CdnUrl: process.env.NEXT_PUBLIC_S3_CDN_URL
  };

  if (typeof window !== 'undefined' && window.__AWS_CONFIG__) {
    return {
      ...config,
      ...window.__AWS_CONFIG__
    };
  }

  return config;
};

export const AWS_CONFIG = getConfig();

// AWS SDK Configuration
export const getAwsConfig = () => {
  // Validate required config
  if (!AWS_CONFIG.region || !AWS_CONFIG.userPoolId || !AWS_CONFIG.clientId) {
    console.error('AWS Config:', AWS_CONFIG);
    throw new Error('Missing required AWS configuration');
  }

  return {
    region: AWS_CONFIG.region,
    userPoolId: AWS_CONFIG.userPoolId,
    clientId: AWS_CONFIG.clientId
  };
};

// DynamoDB Table Names
export const TABLES = {
  PRODUCTS: AWS_CONFIG.productsTable,
  USERS: AWS_CONFIG.usersTable,
  REELS: AWS_CONFIG.reelsTable,
  CHATS: AWS_CONFIG.chatsTable,
  MESSAGES: AWS_CONFIG.messagesTable
};

// API Configuration
export const API_CONFIG = {
  baseUrl: AWS_CONFIG.apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
};
