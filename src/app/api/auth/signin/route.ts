import { NextRequest, NextResponse } from 'next/server';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createOrUpdateUserProfile } from '@/lib/awsUserService';

const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';

const getCognitoClient = () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';

  const config: any = { region: REGION };
  if (accessKeyId && secretAccessKey) {
    config.credentials = { accessKeyId, secretAccessKey };
  }

  return new CognitoIdentityProviderClient(config);
};

function parseJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const client = getCognitoClient();
    
    const command = new InitiateAuthCommand({
      ClientId: CLIENT_ID,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await client.send(command);
    
    if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      return NextResponse.json({
        success: false,
        challengeName: 'NEW_PASSWORD_REQUIRED',
        session: response.Session,
        error: 'New password required',
      }, { status: 200 });
    }

    const user = response.AuthenticationResult?.IdToken 
      ? parseJWT(response.AuthenticationResult.IdToken) 
      : null;

    // Create or update user profile in DynamoDB
    if (user?.sub) {
      try {
        await createOrUpdateUserProfile({
          id: user.sub,
          email: user.email || '',
          name: user.name || user.email?.split('@')[0] || 'User',
          role: 'user',
          joinedAt: new Date().toISOString(),
          followers: [],
          following: [],
        });
        console.log('✅ User profile created/updated in DynamoDB:', user.sub);
      } catch (profileError) {
        console.error('⚠️ Failed to create profile, but login succeeded:', profileError);
        // Don't fail login if profile creation fails
      }
    }

    return NextResponse.json({
      success: true,
      AccessToken: response.AuthenticationResult?.AccessToken,
      IdToken: response.AuthenticationResult?.IdToken,
      RefreshToken: response.AuthenticationResult?.RefreshToken,
      user: {
        id: user?.sub,
        sub: user?.sub,
        email: user?.email,
        name: user?.name,
        email_verified: user?.email_verified,
        role: 'user',
      },
    });
  } catch (error: any) {
    console.error('❌ Sign in error:', error);
    
    // Handle specific Cognito errors
    let errorMessage = error.message || 'Sign in failed';
    if (error.name === 'NotAuthorizedException') {
      errorMessage = 'Incorrect email or password';
    } else if (error.name === 'UserNotConfirmedException') {
      errorMessage = 'Please verify your email address';
    } else if (error.name === 'UserNotFoundException') {
      errorMessage = 'No account found with this email';
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 401 }
    );
  }
}

