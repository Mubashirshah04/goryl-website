import { create } from 'zustand';
import { getCurrentUser, signOut as cognitoSignOut } from '@/lib/awsCognitoService';
import { getUserProfile, createOrUpdateUserProfile } from '@/lib/awsUserService';
import { User as UserType } from '@/lib/types';

const ENABLE_PROFILE_FETCH = process.env.NEXT_PUBLIC_ENABLE_PROFILE_FETCH !== 'false'; // Default to true

interface CognitoAuthUser {
  sub: string;
  email: string;
  name?: string;
  email_verified: boolean;
  role?: 'user' | 'personal_seller' | 'brand' | 'admin';
  userData?: UserType;
}

interface AuthStore {
  user: CognitoAuthUser | null;
  userData: UserType | null;
  loading: boolean;
  setUser: (user: CognitoAuthUser | null) => void;
  setUserData: (userData: UserType | null) => void;
  setLoading: (loading: boolean) => void;
  unsubscribeUserListener: (() => void) | null;
  setUnsubscribeUserListener: (unsubscribe: (() => void) | null) => void;
  initialize: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Load cached auth state from sessionStorage for instant load
const loadCachedAuthState = (): { user: CognitoAuthUser | null; userData: UserType | null } => {
  if (typeof window === 'undefined') return { user: null, userData: null };

  try {
    const cachedUser = sessionStorage.getItem('cognito_user');
    const cachedUserData = sessionStorage.getItem('cognito_userData');

    if (cachedUser) {
      const user = JSON.parse(cachedUser) as CognitoAuthUser;
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
            sessionStorage.setItem('cognito_user', JSON.stringify(user));
          } else {
            sessionStorage.removeItem('cognito_user');
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
            sessionStorage.setItem('cognito_userData', JSON.stringify(userData));
          } else {
            sessionStorage.removeItem('cognito_userData');
          }
        } catch (e) {
          console.warn('Error caching userData:', e);
        }
      }
    },
    setLoading: (loading) => set({ loading }),
    setUnsubscribeUserListener: (unsubscribe) => set({ unsubscribeUserListener: unsubscribe }),
    initialize: async () => {
      console.log('🔄 Initializing Cognito auth...');

      // Check for stored tokens
      const accessToken = typeof window !== 'undefined'
        ? localStorage.getItem('cognito_access_token')
        : null;

      console.log('🔍 Access token check:', { hasToken: !!accessToken });

      if (!accessToken) {
        console.warn('⚠️ No access token found');
        // Do NOT clear cached user immediately — keep cached session state so
        // UI can show an instant profile while tokens are being set by login flows.
        // If tokens are not present, just stop initialization here.
        set({ loading: false });
        return;
      }

      try {
        set({ loading: true });
        console.log('📡 Attempting to get user from Cognito API...');

        // Try to get user from Cognito API
        let cognitoUser = null;
        try {
          cognitoUser = await getCurrentUser();
          console.log('📦 getCurrentUser response:', {
            hasUser: !!cognitoUser,
            userId: cognitoUser?.sub
          });
        } catch (getUserError) {
          console.error('❌ Error calling getCurrentUser:', getUserError);
          console.error('Error details:', {
            message: getUserError instanceof Error ? getUserError.message : String(getUserError),
            stack: getUserError instanceof Error ? getUserError.stack : undefined,
          });
          cognitoUser = null;
        }

        // If API fails, try to parse from ID token
        if (!cognitoUser && typeof window !== 'undefined') {
          console.log('⚠️ API failed, trying to parse from ID token...');
          const idToken = localStorage.getItem('cognito_id_token');
          if (idToken) {
            try {
              // Parse JWT token
              const base64Url = idToken.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const tokenData = JSON.parse(jsonPayload);
              console.log('📋 Token data parsed:', {
                sub: tokenData.sub,
                email: tokenData.email,
                hasName: !!tokenData.name
              });

              cognitoUser = {
                sub: tokenData.sub || '',
                email: tokenData.email || '',
                name: tokenData.name || tokenData['cognito:username'] || '',
                email_verified: tokenData.email_verified === 'true' || tokenData.email_verified === true,
              };
              console.log('✅ Parsed user from ID token:', cognitoUser);
            } catch (parseError) {
              console.error('❌ Error parsing ID token:', parseError);
            }
          } else {
            console.warn('⚠️ No ID token found in localStorage');
          }
        }

        if (cognitoUser && cognitoUser.sub) {
          if (!ENABLE_PROFILE_FETCH) {
            console.log('⚡ Profile fetch disabled, using Cognito user only');
            const user: CognitoAuthUser = {
              sub: cognitoUser.sub,
              email: cognitoUser.email || '',
              name: cognitoUser.name,
              email_verified: cognitoUser.email_verified || false,
              role: 'user',
            };

            set({ user, userData: null, loading: false });

            if (typeof window !== 'undefined') {
              sessionStorage.setItem('cognito_user', JSON.stringify(user));
              sessionStorage.removeItem('cognito_userData');
            }

            return;
          }

          console.log('✅ Cognito user found, fetching profile from DynamoDB...');

          // Fetch user data from AWS DynamoDB
          let userData: UserType | null = null;

          // ✅ SET USER IMMEDIATELY - Don't wait for DynamoDB!
          console.log('✅ Setting user from Cognito data immediately...');

          // Create temporary user data from Cognito attributes to show UI immediately
          const tempUserData = {
            id: cognitoUser.sub,
            email: cognitoUser.email || '',
            username: cognitoUser['custom:username'] || cognitoUser.email?.split('@')[0] || 'user',
            name: cognitoUser.name || cognitoUser.email?.split('@')[0] || 'User',
            role: cognitoUser['custom:role'] || 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isOnline: true,
            lastSeen: new Date().toISOString(),
            photoURL: cognitoUser['custom:photoURL'] || null,
            bio: '',
            followers: [],
            following: [],
            isVerified: false, // Correct property name matching User interface
            isActive: true,
            rating: 0,
            totalSales: 0,
            
          };

          set({
            user: {
              sub: cognitoUser.sub,
              email: cognitoUser.email || '',
              name: cognitoUser.name || cognitoUser.email?.split('@')[0] || 'User',
              email_verified: cognitoUser.email_verified || false,
            },
            userData: tempUserData as any, // Cast to any to avoid strict type checks for temp data
            loading: false
          });

          // Fetch DynamoDB profile in background (non-blocking)
          try {
            console.log('📡 Fetching full profile from DynamoDB in background...');
            const profileData = await getUserProfile(cognitoUser.sub);
            console.log('📦 getUserProfile response:', {
              hasUserData: !!profileData,
              userId: cognitoUser.sub
            });

            if (profileData) {
              // Map UserProfile to User type to fix type errors
              const mappedUserData: any = {
                ...profileData,
                isVerified: profileData.isVerified || profileData.verified || false,
                isActive: profileData.isActive ?? true,
                rating: profileData.rating || 0,
                totalSales: profileData.totalSales || 0,
                // Ensure dates are Date objects if they are strings
                createdAt: profileData.createdAt ? new Date(profileData.createdAt) : new Date(),
                updatedAt: profileData.updatedAt ? new Date(profileData.updatedAt) : new Date()
              };

              set({ userData: mappedUserData, loading: false });

              // Cache in session storage
              sessionStorage.setItem('cognito_userData', JSON.stringify(mappedUserData));
            } else {
              // Create profile if it doesn't exist
              console.log('⚠️ User profile not found in DynamoDB, creating default profile...');
              try {
                console.log('📦 Profile after creation:', {
                  hasUserData: !!userData,
                  userId: userData?.id
                });

                // Update userData if fetch succeeded
                if (userData) {
                  set({ userData });
                }
              } catch (fetchError) {
                console.error('❌ Error fetching profile after creation:', fetchError);
                userData = null;
              }
            }
          } catch (error) {
            console.error('❌ Error creating user profile:', error);
            console.error('Error details:', {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            });
          }
          const user: CognitoAuthUser = {
            sub: cognitoUser.sub,
            email: cognitoUser.email || '',
            name: cognitoUser.name,
            email_verified: cognitoUser.email_verified || false,
            role: userData?.role as any || 'user',
            userData: userData || undefined,
          };

          set({ user, userData, loading: false });

          // Cache for instant load
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('cognito_user', JSON.stringify(user));
            if (userData) {
              sessionStorage.setItem('cognito_userData', JSON.stringify(userData));
            }
          }
        } else {
          console.warn('⚠️ No user found, clearing auth state');
          set({ user: null, userData: null, loading: false });
        }
      } catch (error) {
        console.error('❌ Error initializing Cognito auth:', error);
        set({ user: null, userData: null, loading: false });
      }
    },
    refreshUserData: async () => {
      const { user } = get();
      if (!user?.sub) return;

      try {
        console.log('🔄 Refreshing user data for:', user.sub);
        const userData = await getUserProfile(user.sub);
        console.log('✅ Fresh user data received:', {
          role: userData?.role,
          username: userData?.username,
          businessName: userData?.businessName
        });

        set({ userData });

        if (typeof window !== 'undefined' && userData) {
          // Clear old cache first
          sessionStorage.removeItem('cognito_userData');
          // Set new data
          sessionStorage.setItem('cognito_userData', JSON.stringify(userData));
          console.log('💾 Session storage updated with new user data');
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    },
    signOut: async () => {
      try {
        await cognitoSignOut();

        // Clear all stored data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cognito_access_token');
          localStorage.removeItem('cognito_id_token');
          localStorage.removeItem('cognito_refresh_token');
          sessionStorage.removeItem('cognito_user');
          sessionStorage.removeItem('cognito_userData');
        }

        set({ user: null, userData: null });
      } catch (error) {
        console.error('Error signing out:', error);
        // Clear local state anyway
        set({ user: null, userData: null });
      }
    },
  };
});

// Note: Initialize is called by components when needed (e.g., Layout component)
// Not auto-initializing here to prevent potential infinite loops

// Auto-initialize auth store on client so components don't need to call `initialize` manually.
if (typeof window !== 'undefined') {
  // Call initialize but don't await — it's safe and idempotent.
  useAuthStore.getState().initialize().catch((err) => {
    console.warn('Auth auto-initialize failed:', err);
  });
  
  // Listen for role updates from admin approval
  window.addEventListener('storage', (e) => {
    if (e.key === 'role_updated' && e.newValue) {
      try {
        const data = JSON.parse(e.newValue)
        const currentUser = useAuthStore.getState().user
        
        console.log('🔔 Storage event detected:', {
          key: e.key,
          userId: data.userId,
          newRole: data.newRole,
          currentUserId: currentUser?.sub
        })
        
        // If this is the user whose role was updated, refresh their data
        if (currentUser && currentUser.sub === data.userId) {
          console.log('🔄 Role updated detected for current user, refreshing...')
          useAuthStore.getState().refreshUserData().then(() => {
            console.log('✅ User data refreshed, reloading page...')
            // Clear all cache before reload
            sessionStorage.clear()
            localStorage.removeItem('role_updated')
            // Force page reload to update UI completely
            setTimeout(() => window.location.reload(), 500)
          })
        }
      } catch (error) {
        console.error('Error handling role update:', error)
      }
    }
  })
  
  // Also listen for same-tab updates using custom event
  window.addEventListener('role_updated_event', ((e: CustomEvent) => {
    const data = e.detail
    const currentUser = useAuthStore.getState().user
    
    console.log('🔔 Custom event detected:', {
      userId: data.userId,
      newRole: data.newRole,
      currentUserId: currentUser?.sub
    })
    
    if (currentUser && currentUser.sub === data.userId) {
      console.log('🔄 Role updated (same tab), refreshing user data...')
      useAuthStore.getState().refreshUserData().then(() => {
        console.log('✅ User data refreshed, reloading page...')
        // Clear all cache before reload
        sessionStorage.clear()
        localStorage.removeItem('role_updated')
        // Force page reload to update UI completely
        setTimeout(() => window.location.reload(), 500)
      })
    }
  }) as EventListener)
}
