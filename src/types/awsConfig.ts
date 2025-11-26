export interface AwsPublicConfig {
  region?: string;
  userPoolId?: string;
  clientId?: string;
  cognitoDomain?: string;
  productsTable?: string;
  usersTable?: string;
  reelsTable?: string;
  chatsTable?: string;
  messagesTable?: string;
  s3Bucket?: string;
  s3CdnUrl?: string;
}
