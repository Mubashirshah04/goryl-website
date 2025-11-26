import { NextRequest, NextResponse } from 'next/server';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';

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

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    const client = getCognitoClient();
    
    const command = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name },
        ...(phone ? [{ Name: 'phone_number', Value: phone }] : []),
      ],
    });

    const response = await client.send(command);

    return NextResponse.json({
      success: true,
      userSub: response.UserSub,
      codeDeliveryDetails: response.CodeDeliveryDetails,
    });
  } catch (error: any) {
    console.error('❌ Sign up error:', error);
    
    let errorMessage = error.message || 'Sign up failed';
    if (error.name === 'UsernameExistsException') {
      errorMessage = 'An account with this email already exists';
    } else if (error.name === 'InvalidPasswordException') {
      errorMessage = 'Password does not meet requirements';
    } else if (error.name === 'InvalidParameterException') {
      errorMessage = 'Invalid email or password format';
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 400 }
    );
  }
}

