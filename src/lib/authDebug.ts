import { useAuthStore } from '@/store/authStoreCognito';
import { getUserData } from './auth';

// Utility function to debug auth state
export const debugAuthState = async () => {
  const { user, userData } = useAuthStore.getState();
  
  console.log('=== Auth Debug Info ===');
  console.log('Firebase User:', user);
  console.log('User Data:', userData);
  console.log('User Role:', user?.role);
  console.log('User ID:', user?.sub);
  
  if (user?.sub) {
    try {
      const freshUserData = await getUserData(user.sub);
      console.log('Fresh User Data from Firestore:', freshUserData);
      console.log('Fresh User Role:', freshUserData?.role);
    } catch (error) {
      console.error('Error fetching fresh user data:', error);
    }
  }
  
  console.log('========================');
};

// Function to force refresh auth state
export const forceRefreshAuth = async () => {
  console.log('Forcing auth state refresh...');
  const { refreshUserData } = useAuthStore.getState();
  await refreshUserData();
  console.log('Auth state refresh completed');
  await debugAuthState();
};

// Function to check if user is a seller
export const isUserSeller = (): boolean => {
  const { user } = useAuthStore.getState();
  const sellerRoles = ['seller', 'brand', 'company', 'personal_seller'];
  return user?.role ? sellerRoles.includes(user.role) : false;
};

