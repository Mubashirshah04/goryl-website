import { NextRequest, NextResponse } from 'next/server';

const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';
const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '';
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json();

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: 'Authorization code and redirect URI are required' },
        { status: 400 }
      );
    }

    if (!COGNITO_DOMAIN || !CLIENT_ID) {
      return NextResponse.json(
        { error: 'Cognito configuration missing' },
        { status: 500 }
      );
    }

    // Exchange authorization code for tokens
    const tokenEndpoint = `https://${COGNITO_DOMAIN}/oauth2/token`;
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code: code,
      redirect_uri: redirectUri,
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Token exchange error:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      return NextResponse.json(
        { 
          error: errorData.error || errorData.error_description || 'Token exchange failed',
          error_description: errorData.error_description 
        },
        { status: response.status }
      );
    }

    const tokens = await response.json();

    // Parse user info from ID token
    let user = null;
    if (tokens.id_token) {
      try {
        const base64Url = tokens.id_token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        user = {
          sub: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          email_verified: decoded.email_verified,
        };
      } catch (error) {
        console.error('Error parsing ID token:', error);
      }
    }

    return NextResponse.json({
      success: true,
      AccessToken: tokens.access_token,
      IdToken: tokens.id_token,
      RefreshToken: tokens.refresh_token,
      user,
    });
  } catch (error: any) {
    console.error('❌ OAuth callback error:', error);
    return NextResponse.json(
      {
        error: error.message || 'OAuth callback failed',
      },
      { status: 500 }
    );
  }
}

