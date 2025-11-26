/**
 * Multi-Account Service - Uses Firebase Auth
 */

import { signIn, signOut } from './awsCognitoService';

// Firebase auth functions
// Use AWS Cognito sign in/out

interface SavedAccount {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: string;
  lastUsed: number;
  password?: string; // Store password for instant switching
}

const STORAGE_KEY = 'goryl_saved_accounts';
const MAX_ACCOUNTS = 5;

/**
 * Get all saved accounts from localStorage
 */
export function getSavedAccounts(): SavedAccount[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    
    const accounts = JSON.parse(saved) as SavedAccount[];
    // Sort by last used
    return accounts.sort((a, b) => b.lastUsed - a.lastUsed);
  } catch (error) {
    console.error('Error getting saved accounts:', error);
    return [];
  }
}

/**
 * Save current account to localStorage
 */
export function saveCurrentAccount(
  uid: string,
  email: string,
  displayName: string,
  photoURL?: string,
  role?: string,
  password?: string
): void {
  try {
    const accounts = getSavedAccounts();
    console.log('Current saved accounts before adding:', accounts);
    
    // Check if account already exists
    const existingAccount = accounts.find(acc => acc.uid === uid);
    
    // If account exists and has password, and no new password provided, don't overwrite
    if (existingAccount && existingAccount.password && !password) {
      console.log('Account already exists with password, not overwriting');
      return;
    }
    
    // If account exists and has password, and new password provided, update it
    if (existingAccount && existingAccount.password && password) {
      console.log('Updating existing account with new password');
    }
    
    // Remove if already exists
    const filtered = accounts.filter(acc => acc.uid !== uid);
    
    // Add current account at the beginning
    const newAccount: SavedAccount = {
      uid,
      email,
      displayName,
      photoURL,
      role,
      lastUsed: Date.now(),
      password: password || existingAccount?.password // Use new password or preserve existing
    };
    
    console.log('Saving new account:', newAccount);
    
    filtered.unshift(newAccount);
    
    // Keep only MAX_ACCOUNTS
    const limited = filtered.slice(0, MAX_ACCOUNTS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    console.log('Account saved successfully');
  } catch (error) {
    console.error('Error saving account:', error);
  }
}

/**
 * Remove account from saved list
 */
export function removeSavedAccount(uid: string): void {
  try {
    const accounts = getSavedAccounts();
    const filtered = accounts.filter(acc => acc.uid !== uid);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing account:', error);
  }
}

/**
 * Switch to a different account - Uses AWS Cognito
 */
export async function switchAccount(email: string, password: string): Promise<void> {
  try {
    // Sign out current user
    await signOut();
    
    // Sign in with new account using AWS Cognito
    await signIn(email, password);
  } catch (error: any) {
    console.error('Error switching account:', error);
    throw new Error(error.message || 'Failed to switch account');
  }
}

/**
 * Instant account switching using saved password - Uses AWS Cognito
 */
export async function instantSwitchAccount(email: string): Promise<void> {
  try {
    const accounts = getSavedAccounts();
    console.log('Saved accounts:', accounts);
    const account = accounts.find(acc => acc.email === email);
    console.log('Found account for switching:', account);
    
    if (!account) {
      throw new Error(`ACCOUNT_NOT_FOUND:${email}`);
    }
    
    if (!account.password) {
      throw new Error(`PASSWORD_NOT_SAVED:${email}`);
    }
    
    console.log('Attempting instant switch to:', email);
    
    // Sign out current user
    await signOut();
    
    // Sign in with saved password using AWS Cognito
    const { user } = await signIn(email, account.password);
    
    // Update last used timestamp
    updateAccountLastUsed(account.uid);
    
    // Force update the auth store with the new user
    const { useAuthStore } = await import('@/store/authStoreCognito');
    const authStore = useAuthStore.getState();
    
    // Get user data and update the store
    const { getUserData } = await import('@/lib/auth');
    const userData = await getUserData(user.sub);
    
    const authUser = {
      ...user,
      uid: user.sub,
      role: userData?.role,
      userData
    };
    
    // Update the auth store
    authStore.setUser(authUser);
    authStore.setUserData(userData);
    
    // Also update the user profile store
    const { useUserProfileStore } = await import('@/store/userProfileStore');
    const userProfileStore = useUserProfileStore.getState();
    
    // Clear the current profile and fetch the new one
    userProfileStore.clearProfile();
    await userProfileStore.fetchProfile(user.sub);
    
    // Force a page refresh to ensure all components update with new user data
    window.location.reload();
    
    console.log('Instant switch successful');
    
  } catch (error: any) {
    console.error('Error in instant switch:', error);
    throw new Error(error.message || 'Failed to switch account');
  }
}

/**
 * Update last used timestamp for an account
 */
export function updateAccountLastUsed(uid: string): void {
  try {
    const accounts = getSavedAccounts();
    const account = accounts.find(acc => acc.uid === uid);
    
    if (account) {
      account.lastUsed = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    }
  } catch (error) {
    console.error('Error updating last used:', error);
  }
}

/**
 * Debug function to check saved accounts
 */
export function debugSavedAccounts(): void {
  const accounts = getSavedAccounts();
  console.log('=== DEBUG: Saved Accounts ===');
  accounts.forEach((account, index) => {
    console.log(`Account ${index + 1}:`, {
      email: account.email,
      displayName: account.displayName,
      hasPassword: !!account.password,
      passwordLength: account.password?.length || 0,
      uid: account.uid
    });
  });
  console.log('=== END DEBUG ===');
}

/**
 * Force save account with password (for login form)
 */
export function forceSaveAccountWithPassword(
  uid: string,
  email: string,
  displayName: string,
  photoURL?: string,
  role?: string,
  password: string
): void {
  try {
    console.log('=== FORCE SAVE ACCOUNT WITH PASSWORD ===');
    console.log('Input UID:', uid);
    console.log('Input Email:', email);
    console.log('Input Password length:', password.length);
    
    const accounts = getSavedAccounts();
    console.log('Current saved accounts before force save:', accounts);
    
    // Remove if already exists
    const filtered = accounts.filter(acc => acc.uid !== uid);
    console.log('Filtered accounts (removed existing):', filtered);
    
    // Add current account at the beginning with password
    const newAccount: SavedAccount = {
      uid,
      email,
      displayName,
      photoURL,
      role,
      lastUsed: Date.now(),
      password
    };
    
    console.log('New account to save:', {
      uid: newAccount.uid,
      email: newAccount.email,
      displayName: newAccount.displayName,
      hasPassword: !!newAccount.password,
      passwordLength: newAccount.password?.length || 0
    });
    
    filtered.unshift(newAccount);
    
    // Keep only MAX_ACCOUNTS
    const limited = filtered.slice(0, MAX_ACCOUNTS);
    
    console.log('Final accounts to save:', limited.map(acc => ({
      email: acc.email,
      hasPassword: !!acc.password,
      passwordLength: acc.password?.length || 0
    })));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    console.log('Account with password saved successfully to localStorage');
    
    // Verify it was saved
    const verifyAccounts = getSavedAccounts();
    console.log('Verification - accounts after save:', verifyAccounts.map(acc => ({
      email: acc.email,
      hasPassword: !!acc.password,
      passwordLength: acc.password?.length || 0
    })));
    
  } catch (error) {
    console.error('Error force saving account:', error);
  }
}

/**
 * Check if account needs to be logged in again (no password saved)
 */
export function needsLoginAgain(email: string): boolean {
  const accounts = getSavedAccounts();
  const account = accounts.find(acc => acc.email === email);
  return !account || !account.password;
}

/**
 * Clear all saved accounts (for logout)
 */
export function clearAllSavedAccounts(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('All saved accounts cleared');
  } catch (error) {
    console.error('Error clearing saved accounts:', error);
  }
}

