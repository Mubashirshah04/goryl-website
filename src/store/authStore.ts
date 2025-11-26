import { create } from 'zustand';
import { AuthUser, getCurrentUser, onAuthChange } from '@/lib/auth';
import { User as UserType } from '@/lib/types';

interface AuthStore {
  user: AuthUser | null;
  userData: UserType | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  setUserData: (userData: UserType | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
  refreshUserData: () => Promise<void>;
  unsubscribeUserListener: (() => void) | null;
  setUnsubscribeUserListener: (unsubscribe: (() => void) | null) => void;
}

// Load cached auth state from sessionStorage for instant load
const loadCachedAuthState = (): { user: AuthUser | null; userData: UserType | null } => {
  if (typeof window === 'undefined') return { user: null, userData: null };

  try {
    const cachedUser = sessionStorage.getItem('auth_user');
    const cachedUserData = sessionStorage.getItem('auth_userData');

    if (cachedUser) {
      const user = JSON.parse(cachedUser) as AuthUser;
      const userData = cachedUserData ? JSON.parse(cachedUserData) as UserType : null;
      return { user, userData };
    }
  } catch (error) {
    console.warn('Error loading cached auth state:', error);
  }

  return { user: null, userData: null };
};

export const useAuthStore = create<AuthStore>((set, get) => {
  // ✅ INSTANT LOAD: Load cached state immediately
  const cached = loadCachedAuthState();

  return {
    user: cached.user,
    userData: cached.userData,
    loading: false, // ✅ Start with false - cached data shows instantly
    unsubscribeUserListener: null,
    setUser: (user) => {
      set({ user });
      // Cache user for instant load
      if (typeof window !== 'undefined') {
        try {
          if (user) {
            sessionStorage.setItem('auth_user', JSON.stringify(user));
          } else {
            sessionStorage.removeItem('auth_user');
          }
        } catch (e) {
          console.warn('Error caching user:', e);
        }
      }
    },
    setUserData: (userData) => {
      set({ userData });
      // Cache userData for instant load
      if (typeof window !== 'undefined') {
        try {
          if (userData) {
            sessionStorage.setItem('auth_userData', JSON.stringify(userData));
          } else {
            sessionStorage.removeItem('auth_userData');
          }
        } catch (e) {
          console.warn('Error caching userData:', e);
        }
      }
    },
    setLoading: (loading) => set({ loading }),
    setUnsubscribeUserListener: (unsubscribe) => set({ unsubscribeUserListener: unsubscribe }),
    initialize: () => {
      console.log('🔄 Initializing auth listener (AWS Cognito)...');

      // Check localStorage for tokens first (faster than Cognito API call)
      const hasTokens = typeof window !== 'undefined' &&
        localStorage.getItem('cognito_access_token') &&
        localStorage.getItem('cognito_id_token');

      if (hasTokens) {
        console.log('✅ Found tokens in localStorage, fetching user...');
      }

      // Check current user immediately
      getCurrentUser().then(user => {
        if (user) {
          console.log('✅ User logged in detected:', user.email);
          set({ user, loading: false });

          // Cache instantly
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('auth_user', JSON.stringify(user));
            } catch (e) {
              console.warn('Error caching user:', e);
            }
          }

          // Initialize profile store
          import('@/store/userProfileStore').then(({ useUserProfileStore }) => {
            const userProfileStore = useUserProfileStore.getState();
            userProfileStore.fetchProfile(user.uid).catch(err => {
              console.warn('Profile fetch error (non-critical):', err);
            });
          });
        } else {
          console.log('❌ No user found, clearing auth state');
          // Clear everything if no user
          set({ user: null, userData: null, loading: false });
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('auth_user');
            sessionStorage.removeItem('auth_userData');
            // Also clear Cognito tokens if getCurrentUser returns null
            localStorage.removeItem('cognito_access_token');
            localStorage.removeItem('cognito_id_token');
            localStorage.removeItem('cognito_refresh_token');
          }
        }
      }).catch(error => {
        console.error('❌ Error initializing auth:', error);
        set({ user: null, userData: null, loading: false });
      });

      // Set up listener (simulated for Cognito)
      const unsubscribe = onAuthChange((user) => {
        if (user) {
          console.log('🔄 Auth change detected: user logged in');
          set({ user, loading: false });
        } else {
          console.log('🔄 Auth change detected: user logged out');
          set({ user: null, userData: null, loading: false });
        }
      });

      return unsubscribe;
    },
    refreshUserData: async () => {
      const { user } = get();
      if (user) {
        try {
          const { getUserData } = await import('@/lib/auth');
          const userData = await getUserData(user.uid);

          const authUser: AuthUser = {
            ...user,
            role: userData?.role || user.role
          };

          // Update both userData and user role
          set({
            userData,
            user: authUser
          });

          // Cache updated data
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('auth_user', JSON.stringify(authUser));
              if (userData) {
                sessionStorage.setItem('auth_userData', JSON.stringify(userData));
              }
            } catch (e) {
              console.warn('Error caching refreshed user data:', e);
            }
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      }
    },
  };
});

// Initialize auth state listener immediately
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize();
  console.log('🔐 Auth store initialized - checking AWS Cognito auth state...');
}
