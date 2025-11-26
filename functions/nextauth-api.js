const functions = require('firebase-functions');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  },
});

// JWT utilities
const jwt = require('jsonwebtoken');
const SECRET = process.env.NEXTAUTH_SECRET || 'np2t7fw7fVJyyHRHNlBDPYRc9XvGHbPf4LUEFmi8j8M=';

// Helper: Authenticate with Cognito
async function authenticateWithCognito(email, password) {
  console.log('🔍 Authenticating with AWS Cognito:', email);
  
  const authCommand = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  try {
    const response = await cognitoClient.send(authCommand);
    console.log('✅ Cognito authentication successful');
    return response;
  } catch (error) {
    console.error('❌ Cognito authentication failed:', error.message);
    
    if (error.name === 'NotAuthorizedException') {
      throw new Error('Invalid email or password');
    } else if (error.name === 'UserNotFoundException') {
      throw new Error('Invalid email or password');
    } else if (error.name === 'UserNotConfirmedException') {
      throw new Error('Please verify your email first');
    } else {
      throw new Error('Authentication failed. Please try again.');
    }
  }
}

// Helper: Get or create user profile in DynamoDB
async function getOrCreateUserProfile(email, cognitoResponse) {
  console.log('🔍 Looking up user profile in DynamoDB:', email);
  
  const scanCommand = new ScanCommand({
    TableName: process.env.NEXT_PUBLIC_DYNAMODB_USERS_TABLE || 'goryl-users',
    FilterExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email
    },
    Limit: 1
  });

  const dbResponse = await docClient.send(scanCommand);
  
  if (!dbResponse.Items || dbResponse.Items.length === 0) {
    console.warn('⚠️ No user profile found, creating one...');
    
    // Get user ID from Cognito token
    const userId = cognitoResponse.AuthenticationResult?.AccessToken 
      ? JSON.parse(Buffer.from(cognitoResponse.AuthenticationResult.AccessToken.split('.')[1], 'base64').toString()).sub
      : null;
    
    if (!userId) {
      throw new Error('Could not get user ID from Cognito');
    }
    
    // Create user profile
    const newUserProfile = {
      id: userId,
      email: email,
      name: email.split('@')[0],
      username: email.split('@')[0],
      role: 'user',
      accountType: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const putCommand = new PutCommand({
      TableName: process.env.NEXT_PUBLIC_DYNAMODB_USERS_TABLE || 'goryl-users',
      Item: newUserProfile
    });
    
    await docClient.send(putCommand);
    console.log('✅ User profile created in DynamoDB');
    
    return newUserProfile;
  }
  
  return dbResponse.Items[0];
}

// Helper: Create JWT token
function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      iat: Math.floor(Date.now() / 1000),
    },
    SECRET,
    { expiresIn: '30d' }
  );
}

// Helper: Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
}

// Helper: Parse cookies
function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      cookies[name] = decodeURIComponent(value);
    });
  }
  return cookies;
}

// Main NextAuth API Handler
exports.nextauth = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get the path - handle both direct path and URL
  let path = req.path || req.url || '';
  
  // If path is a full URL, extract just the pathname
  if (path.startsWith('http')) {
    try {
      const url = new URL(path);
      path = url.pathname;
    } catch (e) {
      // If URL parsing fails, try to extract path manually
      path = path.split('?')[0].split('#')[0];
      if (path.includes('://')) {
        path = '/' + path.split('://')[1].split('/').slice(1).join('/');
      }
    }
  }
  
  console.log('🔐 NextAuth API Request:', req.method, path);

  try {
    // Handle /api/auth/session
    if (path.includes('/session')) {
      const cookies = parseCookies(req.headers.cookie);
      const token = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'];
      
      if (!token) {
        return res.status(200).json({ user: null });
      }
      
      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(200).json({ user: null });
      }
      
      return res.status(200).json({
        user: {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
        },
        expires: new Date(decoded.exp * 1000).toISOString(),
      });
    }

    // Handle /api/auth/signin (POST)
    if (path.includes('/signin') || path.includes('/callback/credentials')) {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Parse body if it's a string
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          console.error('Failed to parse body:', e);
          return res.status(400).json({ error: 'Invalid request body' });
        }
      }

      const { email, password } = body || {};
      
      if (!email || !password) {
        console.error('Missing credentials:', { email: !!email, password: !!password });
        return res.status(400).json({ error: 'Email and password required' });
      }

      // Authenticate with Cognito
      const cognitoResponse = await authenticateWithCognito(email, password);
      
      // Get or create user profile
      const user = await getOrCreateUserProfile(email, cognitoResponse);
      
      // Create JWT token
      const token = createToken(user);
      
      // Set cookie
      const isSecure = process.env.NODE_ENV === 'production';
      const cookieName = isSecure ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
      
      res.setHeader('Set-Cookie', [
        `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${isSecure ? '; Secure' : ''}`,
      ]);
      
      return res.status(200).json({
        url: '/',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    }

    // Handle /api/auth/signout
    if (path.includes('/signout')) {
      const isSecure = process.env.NODE_ENV === 'production';
      const cookieName = isSecure ? '__Secure-next-auth.session-token' : 'next-auth.session-token';
      
      res.setHeader('Set-Cookie', [
        `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isSecure ? '; Secure' : ''}`,
      ]);
      
      return res.status(200).json({ url: '/' });
    }

    // Handle /api/auth/csrf
    if (path.includes('/csrf')) {
      return res.status(200).json({ csrfToken: 'not-required' });
    }

    // Handle /api/auth/providers
    if (path.includes('/providers')) {
      return res.status(200).json({
        credentials: {
          id: 'credentials',
          name: 'Credentials',
          type: 'credentials',
          signinUrl: '/api/auth/signin/credentials',
          callbackUrl: '/api/auth/callback/credentials',
        },
      });
    }

    // Default response
    return res.status(404).json({ error: 'Not found' });

  } catch (error) {
    console.error('❌ NextAuth API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
