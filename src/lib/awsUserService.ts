/**
 * AWS DynamoDB Service for User Profiles
 * 
 * Migrated from Firebase to AWS DynamoDB
 * Fast, scalable, cost-effective
 */

import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

// AWS Configuration
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';
const USERS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_USERS_TABLE || 'goryl-users';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  customPhotoURL?: string;
  profilePic?: string;
  avatar?: string;
  bio?: string;
  about?: string;
  role: 'user' | 'personal_seller' | 'seller' | 'brand' | 'company' | 'admin';
  accountType?: 'user' | 'personal_seller' | 'brand' | 'company' | 'admin';
  username?: string;
  usernameLastChanged?: string;
  approved?: boolean;
  verified?: boolean;
  isVerified?: boolean;
  isActive?: boolean;
  followers: string[];
  following: string[];
  rating?: number;
  reviews?: number;
  totalSales?: number;
  totalProducts?: number;
  totalOrders?: number;
  totalRefunds?: number;
  location?: string;
  joinedAt: string;
  phone?: string;
  website?: string;
  coverPhoto?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  businessInfo?: {
    businessName?: string;
    businessType?: string;
    registrationNumber?: string;
    taxId?: string;
  };
  preferences?: {
    notifications: boolean;
    emailMarketing: boolean;
    publicProfile: boolean;
  };
  analytics?: {
    monthlySales: number;
    monthlyOrders: number;
    monthlyRefunds: number;
    topProducts: any[];
  };
  settings?: {
    shippingAddresses?: any[];
    security?: {
      twoFactorAuth: boolean;
      loginNotifications: boolean;
      deviceManagement: boolean;
    };
    privacy?: {
      profileVisibility: string;
      showOnlineStatus: boolean;
      allowMessages: boolean;
      dataSharing: boolean;
    };
    notifications?: {
      emailNotifications: boolean;
      pushNotifications: boolean;
      marketingCommunications: boolean;
    };
    paymentMethods?: any[];
    appearance?: {
      theme: string;
      language: string;
      fontSize: string;
      compactMode: boolean;
    };
  };
  createdAt?: string;
  updatedAt?: string;
  points?: number;
  redeemedCoupons?: string[];
}

// In-memory cache for user profiles
const userCache = new Map<string, { data: UserProfile; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get DynamoDB client (server-side only)
 */
const getDynamoClient = () => {
  // Client-side: Use API route instead
  if (typeof window !== 'undefined') {
    throw new Error('getDynamoClient should only be called server-side. Use API routes on client-side.');
  }

  // Server-side: Import and use DynamoDB client
  const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
  const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '';

  const config: any = {
    region: REGION,
  };

  // Only add credentials if they are provided
  // If not provided, AWS SDK will use default credential chain (IAM role, env vars, etc.)
  if (accessKeyId && secretAccessKey) {
    if (accessKeyId.length < 16 || secretAccessKey.length < 20) {
      console.error('❌ AWS credentials appear to be invalid (too short)');
      throw new Error('Invalid AWS credentials: credentials are too short');
    }
    config.credentials = {
      accessKeyId,
      secretAccessKey,
    };
    console.log('✅ Using AWS credentials from environment variables');
  } else {
    console.warn('⚠️ AWS credentials not found in environment variables.');
    console.warn('   Attempting to use default credential chain (IAM role, etc.)');
    console.warn('   If this fails, set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables');
    // Don't add credentials - let AWS SDK use default credential chain
    // This works on AWS Lambda, EC2 with IAM roles, etc.
  }

  try {
    const dynamoClient = new DynamoDBClient(config);
    const docClient = DynamoDBDocumentClient.from(dynamoClient);
    console.log(`✅ DynamoDB client initialized for region: ${REGION}, table: ${USERS_TABLE}`);
    return { docClient };
  } catch (error: any) {
    console.error('❌ Error creating DynamoDB client:', error);
    console.error('   Region:', REGION);
    console.error('   Table:', USERS_TABLE);
    console.error('   Has Access Key:', !!accessKeyId);
    console.error('   Has Secret Key:', !!secretAccessKey);

    if (error.message?.includes('Credential')) {
      throw new Error(`AWS credentials missing. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables. Error: ${error.message}`);
    }
    throw new Error(`Failed to initialize DynamoDB client: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  // Normalize userId
  const normalizedUserId = userId?.trim() || '';
  if (!normalizedUserId) {
    console.log('❌ Invalid userId provided:', userId);
    return null;
  }

  // Check cache first
  const cacheKey = `user_${normalizedUserId}`;
  const cached = userCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // ✅ Client-side: ALWAYS use API route (never call DynamoDB directly)
  const isClientSide = typeof window !== 'undefined';
  if (isClientSide) {
    try {
      // Use AbortController for better browser compatibility
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout (increased)

      const response = await fetch(`/api/user/profile?id=${normalizedUserId}`, {
        signal: controller.signal
      }).catch((error) => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError' || error.message?.includes('timeout')) {
          console.warn('⚠️ Request timeout for user profile:', normalizedUserId);
          return null; // Return null instead of throwing
        }
        if (error.message?.includes('Failed to fetch')) {
          console.warn('⚠️ Network error fetching user profile:', normalizedUserId);
          return null; // Return null instead of throwing
        }
        throw error;
      });

      clearTimeout(timeoutId);

      if (!response) {
        return null; // Timeout or network error
      }
      if (!response.ok) {
        console.error(`❌ API error: ${response.status} - ${response.statusText}`);
        if (response.status === 404) {
          console.error('❌ Profile not found in AWS DynamoDB:', normalizedUserId);
        }
        return null;
      }

      const profile = await response.json();
      if (profile && !profile.error) {
        userCache.set(cacheKey, { data: profile, timestamp: Date.now() });
        return profile;
      }

      // If API returns error in response body
      if (profile?.error) {
        console.error('❌ API returned error:', profile.error);
        return null;
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching user profile via API:', error);
      return null;
    }
  }

  // ✅ Server-side: Use DynamoDB directly (only if not client-side)
  if (isClientSide) {
    console.error('❌ getUserProfile called on client-side but reached server-side code. This should not happen.');
    return null;
  }

  try {
    console.log(`🔍 Server-side: Fetching profile from DynamoDB table "${USERS_TABLE}" for ID: ${normalizedUserId}`);
    const { docClient } = getDynamoClient();
    const command = new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: normalizedUserId }
    });

    const response = await docClient.send(command);

    if (response.Item) {
      const profile = response.Item as UserProfile;
      console.log(`✅ Server-side: Profile found in DynamoDB: ${profile.name || profile.id}`);

      // Ensure arrays are arrays
      if (!Array.isArray(profile.followers)) profile.followers = [];
      if (!Array.isArray(profile.following)) profile.following = [];
      if (!Array.isArray(profile.redeemedCoupons)) profile.redeemedCoupons = [];

      // Ensure name is a string
      if (!profile.name || typeof profile.name !== 'string') {
        profile.name = 'User';
      } else {
        profile.name = profile.name.trim() || 'User';
      }

      // Ensure bio is a string
      if (profile.bio && typeof profile.bio === 'string') {
        profile.bio = profile.bio.trim();
      } else {
        profile.bio = '';
      }

      // Ensure points is a number
      if (typeof profile.points !== 'number') {
        profile.points = 0;
      }

      // Cache the result
      userCache.set(cacheKey, { data: profile, timestamp: Date.now() });
      return profile;
    }

    console.error(`❌ Server-side: Profile not found in DynamoDB for ID: ${normalizedUserId}`);
    return null;
  } catch (error: any) {
    console.error('❌ Server-side: Error getting user profile from DynamoDB:', error);
    console.error('  - Table:', USERS_TABLE);
    console.error('  - Region:', REGION);
    console.error('  - User ID:', normalizedUserId);
    console.error('  - Error details:', error.message || error);
    return null;
  }
};

/**
 * Create or update user profile
 */
export const createOrUpdateUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<void> => {
  // Client-side: Use API route
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, profileData }),
      });
      return;
    } catch (error) {
      console.error('Error updating user profile via API:', error);
      throw error;
    }
  }

  // Server-side: Use DynamoDB directly
  try {
    const { docClient } = getDynamoClient();
    const command = new PutCommand({
      TableName: USERS_TABLE,
      Item: {
        id: userId,
        points: 0,
        redeemedCoupons: [],
        ...profileData,
        updatedAt: new Date().toISOString(),
      }
    });

    await docClient.send(command);

    // Clear cache
    userCache.delete(`user_${userId}`);
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
};

// Backwards-compatible alias for older callers
export const createUserProfile = createOrUpdateUserProfile;

/**
 * Update user profile
 */
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  // Client-side: Use API route
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update user profile: ${response.statusText}`);
      }

      // Clear cache
      userCache.delete(`user_${userId}`);
      return;
    } catch (error) {
      console.error('Error updating user profile via API:', error);
      throw error;
    }
  }

  // Server-side: Use DynamoDB directly
  try {
    const { docClient } = getDynamoClient();
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.keys(updates).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      updateExpression.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = updates[key as keyof UserProfile];
    });

    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    await docClient.send(command);

    // Clear cache
    userCache.delete(`user_${userId}`);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Add points to user
 */
export const addPoints = async (userId: string, points: number): Promise<void> => {
  // Client-side: Use API route
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/user/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, points }),
      });

      if (!response.ok) {
        throw new Error('Failed to add points');
      }

      // Clear cache
      userCache.delete(`user_${userId}`);
      return;
    } catch (error) {
      console.error('Error adding points via API:', error);
      throw error;
    }
  }

  // Server-side: Use DynamoDB directly
  try {
    const { docClient } = getDynamoClient();
    const command = new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: 'SET points = if_not_exists(points, :zero) + :points, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':points': points,
        ':zero': 0,
        ':updatedAt': new Date().toISOString(),
      },
    });

    await docClient.send(command);
    userCache.delete(`user_${userId}`);
  } catch (error) {
    console.error('Error adding points:', error);
    throw error;
  }
};

/**
 * Redeem coupon
 */
export const redeemCoupon = async (userId: string, cost: number, couponCode: string): Promise<boolean> => {
  // Client-side: Use API route
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/user/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, cost, couponCode }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      userCache.delete(`user_${userId}`);
      return data.success;
    } catch (error) {
      console.error('Error redeeming coupon via API:', error);
      return false;
    }
  }

  // Server-side: Use DynamoDB directly
  try {
    const { docClient } = getDynamoClient();

    // First check if user has enough points
    const user = await getUserProfile(userId);
    if (!user || (user.points || 0) < cost) {
      return false;
    }

    // Check if already redeemed
    if (user.redeemedCoupons?.includes(couponCode)) {
      return false; // Already redeemed
    }

    const command = new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: 'SET points = points - :cost, redeemedCoupons = list_append(if_not_exists(redeemedCoupons, :emptyList), :newCoupon), updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':cost': cost,
        ':newCoupon': [couponCode],
        ':emptyList': [],
        ':updatedAt': new Date().toISOString(),
      },
      ConditionExpression: 'points >= :cost', // Ensure atomic check
    });

    await docClient.send(command);
    userCache.delete(`user_${userId}`);
    return true;
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    return false;
  }
};

/**
 * Follow a user
 */
export const followUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  try {
    // 1. Add targetUserId to currentUserId's following list
    const currentUser = await getUserProfile(currentUserId);
    if (currentUser) {
      const following = currentUser.following || [];
      if (!following.includes(targetUserId)) {
        await updateUserProfile(currentUserId, {
          following: [...following, targetUserId]
        });
      }
    }

    // 2. Add currentUserId to targetUserId's followers list
    const targetUser = await getUserProfile(targetUserId);
    if (targetUser) {
      const followers = targetUser.followers || [];
      if (!followers.includes(currentUserId)) {
        await updateUserProfile(targetUserId, {
          followers: [...followers, currentUserId]
        });
      }
    }
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  try {
    // 1. Remove targetUserId from currentUserId's following list
    const currentUser = await getUserProfile(currentUserId);
    if (currentUser) {
      const following = currentUser.following || [];
      if (following.includes(targetUserId)) {
        await updateUserProfile(currentUserId, {
          following: following.filter(id => id !== targetUserId)
        });
      }
    }

    // 2. Remove currentUserId from targetUserId's followers list
    const targetUser = await getUserProfile(targetUserId);
    if (targetUser) {
      const followers = targetUser.followers || [];
      if (followers.includes(currentUserId)) {
        await updateUserProfile(targetUserId, {
          followers: followers.filter(id => id !== currentUserId)
        });
      }
    }
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
};

/**
 * Query users by username
 */
export const getUserByUsername = async (username: string): Promise<UserProfile | null> => {
  // ✅ Client-side: ALWAYS use API route
  const isClientSide = typeof window !== 'undefined';
  if (isClientSide) {
    try {
      const response = await fetch(`/api/user/profile?username=${encodeURIComponent(username)}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`⚠️ User with username "${username}" not found in database`);
        }
        return null;
      }
      const profile = await response.json();
      if (profile && !profile.error) {
        return profile;
      }
      return null;
    } catch (error) {
      console.error('❌ Error fetching user by username via API:', error);
      return null;
    }
  }

  // ✅ Server-side: Use DynamoDB directly (only if not client-side)
  try {
    console.log(`🔍 Server-side: Querying DynamoDB table "${USERS_TABLE}" for username: ${username}`);
    const { docClient } = getDynamoClient();
    const command = new ScanCommand({
      TableName: USERS_TABLE,
      FilterExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': username
      }
    });

    const response = await docClient.send(command);

    if (response.Items && response.Items.length > 0) {
      return response.Items[0] as UserProfile;
    }

    console.error(`❌ Server-side: Username "${username}" not found in DynamoDB`);
    return null;
  } catch (error) {
    console.error('Error querying user by username:', error);
    return null;
  }
};

/**
 * Get multiple user profiles
 */
export const getMultipleUserProfiles = async (userIds: string[]): Promise<UserProfile[]> => {
  // Client-side: Use API route
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch('/api/user/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      });
      if (!response.ok) {
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching multiple user profiles via API:', error);
      return [];
    }
  }

  // Server-side: Use DynamoDB directly
  try {
    const { docClient } = getDynamoClient();
    const profiles: UserProfile[] = [];

    // Batch get (DynamoDB supports up to 100 items per batch)
    for (let i = 0; i < userIds.length; i += 100) {
      const batch = userIds.slice(i, i + 100);
      const requests = batch.map(id => ({
        TableName: USERS_TABLE,
        Key: { id }
      }));

      // Note: BatchGetCommand would be better, but using individual GetCommands for simplicity
      const promises = requests.map(request => {
        const command = new GetCommand({
          TableName: request.TableName,
          Key: request.Key
        });
        return docClient.send(command);
      });

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        if (response.Item) {
          profiles.push(response.Item as UserProfile);
        }
      });
    }

    return profiles;
  } catch (error) {
    console.error('Error getting multiple user profiles:', error);
    return [];
  }
};

/**
 * Alias for getUserProfile (for compatibility with existing code)
 */
export const getUser = getUserProfile;

/**
 * Alias for updateUserProfile (for compatibility with existing code)
 */
export const updateUser = updateUserProfile;
