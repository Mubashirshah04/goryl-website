/**
 * Pure AWS Cognito Auth Service
 * 
 * Uses AWS Cognito only - no Firebase fallback
 * Fast, scalable, perfect for e-commerce
 */

import { 
  signUp as cognitoSignUp, 
  confirmSignUp as cognitoConfirmSignUp,
  signIn as cognitoSignIn, 
  signOut as cognitoSignOut,
  getCurrentUser as cognitoGetCurrentUser,
  refreshSession as cognitoRefreshSession,
  forgotPassword as cognitoForgotPassword,
  confirmForgotPassword as cognitoConfirmForgotPassword,
  updateProfile as cognitoUpdateProfile,
  changePassword as cognitoChangePassword,
  initializeAuth as cognitoInitializeAuth,
  signInWithGoogle as cognitoSignInWithGoogle,
  AuthUser 
} from './awsCognitoService';

// Pure AWS - always use Cognito
const USE_COGNITO = true;

/**
 * Sign Up User
 */
export const signUp = async (
  email: string,
  password: string,
  name?: string
): Promise<{ userId: string; requiresConfirmation: boolean }> => {
  try {
    // Pure AWS Cognito - no Firebase fallback
    console.log('🚀 Using AWS Cognito for sign up');
    return await cognitoSignUp(email, password, name);
  } catch (error: any) {
    console.error('Error signing up with Cognito:', error);
    throw error; // No Firebase fallback - pure AWS
  }
};

/**
 * Confirm Sign Up
 */
export const confirmSignUp = async (
  email: string,
  confirmationCode: string
): Promise<void> => {
  try {
    if (USE_COGNITO) {
      return await cognitoConfirmSignUp(email, confirmationCode);
    } else {
      // Firebase doesn't require email confirmation in this flow
      console.log('Firebase sign up confirmation not required');
      return;
    }
  } catch (error: any) {
    console.error('Error confirming sign up:', error);
    throw error;
  }
};

/**
 * Sign In User
 */
export const signIn = async (
  email: string,
  password: string
): Promise<{ user: AuthUser; session: any }> => {
  try {
    // Pure AWS Cognito - no Firebase fallback
    console.log('🚀 Using AWS Cognito for sign in');
    return await cognitoSignIn(email, password);
  } catch (error: any) {
    console.error('Error signing in with Cognito:', error);
    throw error; // No Firebase fallback - pure AWS
  }
};

/**
 * Sign Out
 */
export const signOut = async (): Promise<void> => {
  try {
    // Pure AWS Cognito - no Firebase fallback
    return await cognitoSignOut();
  } catch (error: any) {
    console.error('Error signing out from Cognito:', error);
    throw error; // No Firebase fallback - pure AWS
  }
};

/**
 * Get Current User
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    // Pure AWS Cognito - no Firebase fallback
    return await cognitoGetCurrentUser();
  } catch (error: any) {
    console.error('Error getting current user from Cognito:', error);
    return null; // Return null on error, don't fallback to Firebase
  }
};

/**
 * Forgot Password
 */
export const forgotPassword = async (email: string): Promise<void> => {
  try {
    // Pure AWS Cognito - no Firebase fallback
    return await cognitoForgotPassword(email);
  } catch (error: any) {
    console.error('Error requesting password reset from Cognito:', error);
    throw error; // No Firebase fallback - pure AWS
  }
};

/**
 * Update Profile
 */
export const updateProfile = async (updates: {
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
}): Promise<void> => {
  try {
    // Pure AWS Cognito - no Firebase fallback
    return await cognitoUpdateProfile(updates);
  } catch (error: any) {
    console.error('Error updating profile in Cognito:', error);
    throw error; // No Firebase fallback - pure AWS
  }
};

/**
 * Initialize Auth
 */
export const initializeAuth = async (): Promise<AuthUser | null> => {
  try {
    // Pure AWS Cognito - no Firebase fallback
    return await cognitoInitializeAuth();
  } catch (error) {
    console.error('Error initializing Cognito auth:', error);
    return null;
  }
};

/**
 * Sign in with Google - Uses AWS Cognito
 */
export const signInWithGoogle = async () => {
  try {
    // Pure AWS Cognito - no Firebase fallback
    console.log('🚀 Using AWS Cognito for Google sign-in');
    return await cognitoSignInWithGoogle();
  } catch (error: any) {
    console.error('Error signing in with Google via Cognito:', error);
    throw error; // No Firebase fallback - pure AWS
  }
};

export default {
  signUp,
  confirmSignUp,
  signIn,
  signOut,
  getCurrentUser,
  forgotPassword,
  updateProfile,
  initializeAuth,
  signInWithGoogle,
};

