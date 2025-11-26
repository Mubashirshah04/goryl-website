/**
 * AWS Cognito Authentication Service
 * Replaces Firebase Auth with AWS Cognito
 */

import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GetUserCommand,
  UpdateUserAttributesCommand,
  GlobalSignOutCommand,
  ResendConfirmationCodeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserAttribute,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js';
import { jwtDecode } from 'jwt-decode';

// AWS Configuration
import { AWS_CONFIG } from './awsConfig';
import type { AwsPublicConfig } from '@/types/awsConfig';

declare global {
  interface Window {
    __AWS_CONFIG__?: AwsPublicConfig;
  }
}

const fetchClientConfig = async (): Promise<AwsPublicConfig | null> => {
  if (typeof window === 'undefined') return null;
  try {
    const response = await fetch('/api/aws-config', { cache: 'no-store' });
    if (!response.ok) return null;
    const result = (await response.json()) as AwsPublicConfig;
    window.__AWS_CONFIG__ = {
      ...result,
      ...window.__AWS_CONFIG__
    };
    return window.__AWS_CONFIG__;
  } catch (error) {
    console.error('Failed to fetch AWS config:', error);
    return null;
  }
};

const resolveAwsConfig = (): AwsPublicConfig => {
  if (typeof window !== 'undefined') {
    if (window.__AWS_CONFIG__) {
      return window.__AWS_CONFIG__;
    }
    fetchClientConfig();
    return window.__AWS_CONFIG__ || {};
  }
  return AWS_CONFIG as AwsPublicConfig;
};

type RequiredCognitoConfig = AwsPublicConfig & { userPoolId: string; clientId: string };

const getRequiredCognitoConfig = (): RequiredCognitoConfig => {
  const config = resolveAwsConfig();
  if (!config.userPoolId || !config.clientId) {
    console.error('AWS Config:', {
      userPoolId: config.userPoolId,
      clientId: config.clientId,
    });
    throw new Error('Cognito User Pool ID or Client ID not configured');
  }
  return { ...config, userPoolId: config.userPoolId, clientId: config.clientId };
};

const getRegion = () =>
  resolveAwsConfig().region || process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || 'ap-south-1';

const isBrowser = typeof window !== 'undefined';

// Browser-side Cognito helpers
const getUserPool = async () => {
  if (!isBrowser) return null;

  let config = resolveAwsConfig();
  
  if (!config.userPoolId || !config.clientId) {
    const fetched = await fetchClientConfig();
    if (fetched) {
      config = fetched;
    }
  }
  
  if (!config.userPoolId || !config.clientId) {
    console.error('AWS Config:', {
      userPoolId: config.userPoolId,
      clientId: config.clientId,
    });
    throw new Error('Cognito User Pool ID or Client ID not configured');
  }

  return new CognitoUserPool({
    UserPoolId: config.userPoolId,
    ClientId: config.clientId,
  });
};

const buildCognitoUser = async (email: string) => {
  const pool = await getUserPool();
  if (!pool) return null;
  return new CognitoUser({
    Username: email,
    Pool: pool,
  });
};

const cacheTokens = (session: any) => {
  if (!isBrowser || !session) return;
  const accessToken = session.getAccessToken()?.getJwtToken();
  const idToken = session.getIdToken()?.getJwtToken();
  const refreshToken = session.getRefreshToken()?.getToken();

  if (accessToken) {
    localStorage.setItem('cognito_access_token', accessToken);
  }
  if (idToken) {
    localStorage.setItem('cognito_id_token', idToken);
  }
  if (refreshToken) {
    localStorage.setItem('cognito_refresh_token', refreshToken);
  }
};

// Get AWS Credentials (server-side only)
const getAWSCredentials = () => {
  const accessKeyId = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '';

  if (!accessKeyId || !secretAccessKey) {
    if (typeof window === 'undefined') {
      // Server-side: can use IAM role
      return undefined;
    } else {
      // Client-side: should use API routes
      return undefined;
    }
  }

  return {
    accessKeyId,
    secretAccessKey,
  };
};

// Initialize Cognito Client
let cognitoClient: CognitoIdentityProviderClient | null = null;

const getCognitoClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('❌ getCognitoClient() cannot be called client-side. Use API routes instead.');
  }

  if (!cognitoClient) {
    const credentials = getAWSCredentials();
    const config: any = {
      region: getRegion(),
    };

    if (credentials) {
      config.credentials = credentials;
    }

    cognitoClient = new CognitoIdentityProviderClient(config);
  }

  return cognitoClient;
};

// User Data Interface (decoded from JWT)
export interface CognitoUserData {
  sub: string; // User ID
  email: string;
  email_verified: boolean;
  name?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
  'custom:role'?: string;
  'custom:username'?: string;
  'custom:photoURL'?: string;
}

// Sign In Result Interface
export interface SignInResult {
  success?: boolean;
  AccessToken?: string;
  IdToken?: string;
  RefreshToken?: string;
  user?: CognitoUserData | null;
  challengeName?: string;
  session?: string;
}

// Sign Up
export const signUp = async (email: string, password: string, name: string, phone?: string) => {
  if (isBrowser) {
    const userPool = await getUserPool();
    if (!userPool) throw new Error('User pool not configured');

    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'name', Value: name }),
      ...(phone ? [new CognitoUserAttribute({ Name: 'phone_number', Value: phone })] : []),
    ];

    return await new Promise((resolve, reject) => {
      userPool.signUp(email, password, attributeList, [], (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          userSub: result?.userSub,
          codeDeliveryDetails: result?.codeDeliveryDetails,
        });
      });
    });
  }

  // Server-side
  const client = getCognitoClient();

  const { clientId } = getRequiredCognitoConfig();

  const command = new SignUpCommand({
    ClientId: clientId,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'name', Value: name },
      ...(phone ? [{ Name: 'phone_number', Value: phone }] : []),
    ],
  });

  const response = await client.send(command);
  return {
    userSub: response.UserSub,
    codeDeliveryDetails: response.CodeDeliveryDetails,
  };
};

// Confirm Sign Up
export const confirmSignUp = async (email: string, code: string) => {
  if (isBrowser) {
    const user = await buildCognitoUser(email);
    if (!user) throw new Error('User pool not configured');

    return await new Promise((resolve, reject) => {
      user.confirmRegistration(code, true, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({ success: true, result });
      });
    });
  }

  // Server-side
  const client = getCognitoClient();

  const { clientId } = getRequiredCognitoConfig();

  const command = new ConfirmSignUpCommand({
    ClientId: clientId,
    Username: email,
    ConfirmationCode: code,
  });

  await client.send(command);
  return { success: true };
};

// Sign In
export const signIn = async (email: string, password: string): Promise<SignInResult> => {
  if (isBrowser) {
    const user = await buildCognitoUser(email);
    if (!user) throw new Error('User pool not configured');

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    return await new Promise((resolve, reject) => {
      user.authenticateUser(authDetails, {
        onSuccess: (session) => {
          cacheTokens(session);

          const IdToken = session.getIdToken()?.getJwtToken();
          let userData: any = null;
          if (IdToken) {
            try {
              userData = jwtDecode(IdToken);
            } catch (error) {
              console.warn('Failed to decode ID token:', error);
            }
          }

          resolve({
            success: true,
            AccessToken: session.getAccessToken()?.getJwtToken(),
            IdToken,
            RefreshToken: session.getRefreshToken()?.getToken(),
            user: userData
              ? {
                sub: userData.sub,
                email: userData.email,
                name: userData.name,
                email_verified: userData.email_verified,
              }
              : null,
          });
        },
        onFailure: (err) => {
          reject(err);
        },
        newPasswordRequired: () => {
          reject({
            challengeName: 'NEW_PASSWORD_REQUIRED',
            message: 'New password required',
          });
        },
      });
    });
  }

  // Server-side
  const client = getCognitoClient();

  const { clientId } = getRequiredCognitoConfig();

  const command = new InitiateAuthCommand({
    ClientId: clientId,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const response = await client.send(command);

  if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
    return {
      challengeName: 'NEW_PASSWORD_REQUIRED',
      session: response.Session,
    };
  }

  return {
    AccessToken: response.AuthenticationResult?.AccessToken,
    IdToken: response.AuthenticationResult?.IdToken,
    RefreshToken: response.AuthenticationResult?.RefreshToken,
    user: response.AuthenticationResult?.IdToken ? parseJWT(response.AuthenticationResult.IdToken) : null,
  };
};

// Sign Out
export const signOut = async () => {
  if (isBrowser) {
    try {
      const pool = await getUserPool();
      const user = pool?.getCurrentUser();
      user?.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }

    localStorage.removeItem('cognito_access_token');
    localStorage.removeItem('cognito_id_token');
    localStorage.removeItem('cognito_refresh_token');
    sessionStorage.removeItem('cognito_user');
    sessionStorage.removeItem('cognito_userData');
    return;
  }

  // Server-side
  const accessToken = localStorage.getItem('cognito_access_token');
  if (!accessToken) return;

  const client = getCognitoClient();

  const command = new GlobalSignOutCommand({
    AccessToken: accessToken,
  });

  await client.send(command);
};

// Get Current User
export const getCurrentUser = async (): Promise<CognitoUserData | null> => {
  if (isBrowser) {
    // First, try to get user from Cognito UserPool
    const pool = await getUserPool();
    const user = pool?.getCurrentUser();

    if (user) {
      return await new Promise<CognitoUserData | null>((resolve) => {
        user.getSession((err: any, session: any) => {
          if (err || !session?.isValid()) {
            console.warn('Session invalid or expired:', err);
            // Session expired, try to decode from localStorage tokens
            const userData = decodeUserFromTokens();
            resolve(userData);
            return;
          }

          cacheTokens(session);

          user.getUserAttributes((attrErr: any, attributes: any) => {
            if (attrErr) {
              console.error('Error fetching user attributes:', attrErr);
              // Try to decode from localStorage tokens as fallback
              const userData = decodeUserFromTokens();
              resolve(userData);
              return;
            }

            const attributeMap: Record<string, string> = {};
            attributes?.forEach((attr: any) => {
              attributeMap[attr.getName()] = attr.getValue();
            });

            resolve({
              sub: attributeMap.sub || user.getUsername(),
              email: attributeMap.email,
              name: attributeMap.name,
              email_verified: attributeMap.email_verified === 'true',
            });
          });
        });
      });
    }

    // No Cognito user session, try to decode from localStorage tokens
    console.log('🔍 No Cognito session, checking localStorage tokens...');
    return decodeUserFromTokens();
  }

  // Server-side - should not be called directly
  console.warn('⚠️ getCurrentUser called server-side, returning null');
  return null;
};

// Helper function to decode user data from localStorage tokens
function decodeUserFromTokens(): CognitoUserData | null {
  if (typeof window === 'undefined') return null;

  try {
    const idToken = localStorage.getItem('cognito_id_token');
    if (!idToken) {
      console.log('❌ No ID token found in localStorage');
      return null;
    }

    // Decode JWT token
    const decoded = jwtDecode<any>(idToken);
    console.log('✅ Decoded user from localStorage token:', decoded.email);

    return {
      sub: decoded.sub,
      email: decoded.email,
      name: decoded.name || decoded.email?.split('@')[0],
      email_verified: decoded.email_verified || false,
    };
  } catch (error) {
    console.error('❌ Error decoding token:', error);
    return null;
  }
}

// Forgot Password
export const forgotPassword = async (email: string) => {
  if (isBrowser) {
    const user = await buildCognitoUser(email);
    if (!user) throw new Error('User pool not configured');

    return await new Promise((resolve, reject) => {
      user.forgotPassword({
        onSuccess: (data: any) => resolve({ success: true, data }),
        onFailure: (err: any) => reject(err),
      });
    });
  }

  // Server-side
  const client = getCognitoClient();

  const { clientId } = getRequiredCognitoConfig();

  const command = new ForgotPasswordCommand({
    ClientId: clientId,
    Username: email,
  });

  await client.send(command);
  return { success: true };
};

// Confirm Forgot Password
export const confirmForgotPassword = async (email: string, code: string, newPassword: string) => {
  if (isBrowser) {
    const user = await buildCognitoUser(email);
    if (!user) throw new Error('User pool not configured');

    return await new Promise((resolve, reject) => {
      user.confirmPassword(code, newPassword, {
        onSuccess: () => resolve({ success: true }),
        onFailure: (err: any) => reject(err),
      });
    });
  }

  // Server-side
  const client = getCognitoClient();

  const { clientId } = getRequiredCognitoConfig();

  const command = new ConfirmForgotPasswordCommand({
    ClientId: clientId,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  });

  await client.send(command);
  return { success: true };
};

// Sign In with Google (OAuth)
export const signInWithGoogle = () => {
  const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '';
  const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';
  const REDIRECT_URI = typeof window !== 'undefined'
    ? `${window.location.origin}/auth/callback`
    : '';

  if (!COGNITO_DOMAIN || !CLIENT_ID || !REDIRECT_URI) {
    throw new Error('Cognito domain, client ID, or redirect URI not configured');
  }

  // Build Cognito Hosted UI URL for Google OAuth
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    identity_provider: 'Google',
    scope: 'email openid profile',
  });

  const authUrl = `https://${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;

  // Redirect to Cognito Hosted UI
  if (typeof window !== 'undefined') {
    window.location.href = authUrl;
  }
};

// Helper: Parse JWT
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

export default {
  signUp,
  confirmSignUp,
  signIn,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  forgotPassword,
  confirmForgotPassword,
};

// Additional compatibility exports expected by hybridAuthService and other modules
export const refreshSession = async (): Promise<any> => {
  // Placeholder: implement token refresh via Cognito refresh token if needed
  return null;
};

export const updateProfile = async (userId: string, data: any): Promise<any> => {
  // Placeholder for updating attributes via Cognito or user service
  return null;
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<any> => {
  // Placeholder for changing password
  return null;
};

export const initializeAuth = () => {
  // No-op initializer for compatibility
  return;
};

export type AuthUser = CognitoUserData;
