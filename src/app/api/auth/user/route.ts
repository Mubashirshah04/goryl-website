import { NextRequest, NextResponse } from 'next/server';
import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';

const getCognitoClient = () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

  const config: any = { region: REGION };
  if (accessKeyId && secretAccessKey) {
    config.credentials = { accessKeyId, secretAccessKey };
  }

  return new CognitoIdentityProviderClient(config);
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace('Bearer ', '');

    const client = getCognitoClient();

    const command = new GetUserCommand({
      AccessToken: accessToken,
    });

    const response = await client.send(command);

    console.log('📦 Cognito GetUser response:', {
      hasUsername: !!response.Username,
      hasUserAttributes: !!response.UserAttributes,
      attributesCount: response.UserAttributes?.length || 0,
    });

    // Extract user attributes
    const attributes = response.UserAttributes || [];
    const user = {
      sub: attributes.find(attr => attr.Name === 'sub')?.Value || response.Username || '',
      email: attributes.find(attr => attr.Name === 'email')?.Value || '',
      name: attributes.find(attr => attr.Name === 'name')?.Value || '',
      email_verified: attributes.find(attr => attr.Name === 'email_verified')?.Value === 'true',
      phone_number: attributes.find(attr => attr.Name === 'phone_number')?.Value,
      phone_number_verified: attributes.find(attr => attr.Name === 'phone_number_verified')?.Value === 'true',
    };

    console.log('📋 Extracted user data:', {
      hasSub: !!user.sub,
      hasEmail: !!user.email,
      hasName: !!user.name,
    });

    if (!user.sub) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('❌ Get user error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.$metadata?.httpStatusCode);

    // If token is invalid or expired
    if (error.name === 'NotAuthorizedException' ||
      error.name === 'InvalidParameterException' ||
      error.name === 'ExpiredTokenException' ||
      error.message?.includes('expired') ||
      error.message?.includes('invalid')) {
      console.warn('⚠️ Token validation failed - token may be expired or invalid');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token. Please login again.',
          errorType: 'TOKEN_EXPIRED',
        },
        { status: 401 }
      );
    }

    // AWS credentials or configuration error
    if (error.name === 'CredentialsProviderError' ||
      error.message?.includes('credentials')) {
      console.error('❌ AWS credentials error - check environment variables');
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error',
          errorType: 'CONFIG_ERROR',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get user',
        errorType: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}

