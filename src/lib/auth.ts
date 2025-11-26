/**
 * Authentication Service
 * Migrated from Firebase to AWS Cognito
 */

import {
  signIn as cognitoSignIn,
  signUp as cognitoSignUp,
  signOut as cognitoSignOut,
  signInWithGoogle as cognitoSignInWithGoogle,
  getCurrentUser as cognitoGetCurrentUser,
  forgotPassword as cognitoForgotPassword,
  CognitoUserData,
  SignInResult
} from './awsCognitoService';
import { getUserProfile, createOrUpdateUserProfile } from './awsUserService';

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  role: 'user' | 'personal_seller' | 'brand' | 'company' | 'admin'
  accountType: 'user' | 'personal_seller' | 'brand' | 'company' | 'admin'
  approved?: boolean
  isVerifiedSeller?: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Convert Cognito user to AuthUser format
 */
function cognitoUserToAuthUser(cognitoUser: CognitoUserData, userData?: any): AuthUser {
  return {
    uid: cognitoUser.sub,
    email: cognitoUser.email,
    displayName: userData?.name || cognitoUser.name || cognitoUser.email?.split('@')[0] || 'User',
    photoURL: userData?.image || userData?.photoURL || cognitoUser['custom:photoURL'] || null,
    role: userData?.role || 'user',
    accountType: userData?.accountType || 'user',
    approved: userData?.approved || false,
    isVerifiedSeller: userData?.isVerifiedSeller || false,
    createdAt: userData?.createdAt ? new Date(userData.createdAt) : new Date(),
    updatedAt: userData?.updatedAt ? new Date(userData.updatedAt) : new Date(),
  };
}

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string): Promise<AuthUser> => {
  try {
    console.log('🔐 Starting signin process for:', email);
    const result: SignInResult = await cognitoSignIn(email, password);

    // If new password required (first login for admin created users)
    if (result.challengeName === 'NEW_PASSWORD_REQUIRED') {
      throw new Error('New password required. Please reset your password.');
    }

    if (!result.user) {
      throw new Error('Sign in failed - no user data returned');
    }

    console.log('✅ Cognito signin successful for user:', result.user.sub);

    // Get or create user data in DynamoDB
    let userData = await getUserData(result.user.sub);

    // If user profile doesn't exist in DynamoDB, create it
    if (!userData) {
      console.log('⚠️ User profile not found in DynamoDB, creating...');
      try {
        await createOrUpdateUserProfile(result.user.sub, {
          id: result.user.sub,
          email: result.user.email || email,
          name: result.user.name || email.split('@')[0],
          username: email.split('@')[0],
          role: 'user',
          accountType: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ User profile created in DynamoDB');

        // Fetch the newly created profile
        userData = await getUserData(result.user.sub);
      } catch (dynamoError) {
        console.warn('⚠️ Could not create user profile in DynamoDB:', dynamoError);
        // Continue with signin even if profile creation fails
      }
    } else {
      console.log('✅ User profile found in DynamoDB');
    }

    return cognitoUserToAuthUser(result.user, userData);
  } catch (error: any) {
    console.error('❌ Error signing in:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    throw error;
  }
}

/**
 * Sign up with email and password
 */
export const signUp = async (
  email: string,
  password: string,
  displayName: string,
  role: 'user' | 'personal_seller' | 'brand' | 'company' = 'user'
): Promise<AuthUser> => {
  try {
    const result = await cognitoSignUp(email, password, displayName);

    // Create user profile in DynamoDB
    const userId = result.userSub;

    try {
      await createOrUpdateUserProfile(userId, {
        id: userId,
        email: email,
        name: displayName,
        username: email.split('@')[0],
        role: role,
        accountType: role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ User profile created in DynamoDB');
    } catch (dynamoError) {
      console.warn('Could not create user document in DynamoDB:', dynamoError);
    }

    // Return partial auth user (since they need to confirm email usually)
    // For now, assuming auto-confirm or immediate login flow if supported
    return {
      uid: userId,
      email: email,
      displayName: displayName,
      photoURL: null,
      role: role,
      accountType: role,
      approved: false,
      isVerifiedSeller: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error: any) {
    console.error('Signup error:', error);
    throw error;
  }
}

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<void> => {
  try {
    await cognitoSignInWithGoogle();
    // Redirects to Cognito Hosted UI, so no return value
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
  try {
    await cognitoSignOut();
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Reset Password
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await cognitoForgotPassword(email);
  } catch (error: any) {
    console.error('Error requesting password reset:', error);
    throw error;
  }
}

/**
 * Get Current User
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const user = await cognitoGetCurrentUser();
    if (!user) return null;

    const userData = await getUserData(user.sub);
    return cognitoUserToAuthUser(user, userData);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Auth State Change Listener
 * Note: Cognito doesn't have a real-time listener like Firebase.
 * We simulate it by checking current user on load/interval if needed.
 */
export const onAuthChange = (callback: (user: AuthUser | null) => void) => {
  // Check immediately
  getCurrentUser().then(callback);

  // Return unsubscribe function (no-op for now as we don't have a real listener)
  return () => { };
}

/**
 * Get User Data - Uses AWS DynamoDB
 */
export const getUserData = async (uid: string): Promise<any | null> => {
  try {
    const userProfile = await getUserProfile(uid);
    if (userProfile) {
      return userProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user data from DynamoDB:', error);
    return null;
  }
}

/**
 * Update User Profile - Uses AWS DynamoDB
 */
export const updateUserProfile = async (uid: string, updates: any) => {
  try {
    const { updateUserProfile: updateProfileDynamoDB } = await import('./awsUserService');
    await updateProfileDynamoDB(uid, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    console.log('✅ User profile updated in AWS DynamoDB');
  } catch (error) {
    console.error('Error updating user profile in DynamoDB:', error);
    throw error;
  }
}

export const checkUserRole = async (uid: string): Promise<string> => {
  try {
    const userData = await getUserData(uid);
    return userData?.role || 'user';
  } catch (error) {
    console.error('Error checking user role:', error);
    return 'user';
  }
}

export const checkAccountType = async (uid: string): Promise<string> => {
  try {
    const userData = await getUserData(uid);
    return userData?.accountType || 'user';
  } catch (error) {
    console.error('Error checking account type:', error);
    return 'user';
  }
}

export const isAdmin = async (uid: string): Promise<boolean> => {
  const role = await checkUserRole(uid);
  return role === 'admin';
}

export const isSeller = async (uid: string): Promise<boolean> => {
  const accountType = await checkAccountType(uid);
  return ['personal_seller', 'brand', 'company'].includes(accountType);
}

