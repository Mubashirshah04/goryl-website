'use client';

import { useEffect } from 'react';
import type { AwsPublicConfig } from '@/types/awsConfig';

export function AwsConfigProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mergeConfig = (config: AwsPublicConfig) => {
      if (!window.__AWS_CONFIG__) {
        window.__AWS_CONFIG__ = config;
      } else {
        window.__AWS_CONFIG__ = {
          ...config,
          ...window.__AWS_CONFIG__
        };
      }
    };

    const envConfig: AwsPublicConfig = {
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
    };

    mergeConfig(envConfig);
    console.log('AWS Config (env) initialized:', {
      configured: !!(window.__AWS_CONFIG__?.userPoolId && window.__AWS_CONFIG__?.clientId)
    });

    const fetchRuntimeConfig = async () => {
      try {
        const response = await fetch('/api/aws-config', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const runtimeConfig = (await response.json()) as AwsPublicConfig;
        mergeConfig(runtimeConfig);
        console.log('AWS Config (runtime) updated:', {
          configured: !!(window.__AWS_CONFIG__?.userPoolId && window.__AWS_CONFIG__?.clientId)
        });
      } catch (error) {
        console.error('Failed to fetch runtime AWS config:', error);
      }
    };

    fetchRuntimeConfig();
  }, []);

  return null;
}
