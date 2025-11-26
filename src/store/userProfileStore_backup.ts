import { create } from 'zustand';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from '@/lib/firestore';
import { db } from '@/lib/firebase';

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
  username?: string;
  usernameLastChanged?: Date;
  approved?: boolean;
  verified?: boolean;
  followers: string[];
  following: string[];
  rating?: number;
  reviews?: number;
  totalSales?: number;
  totalProducts?: number;
  totalOrders?: number;
  totalRefunds?: number;
  location?: string;
  joinedAt: Date;
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
}

interface UserProfileStore {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: (userId: string) => Promise<void>;
  subscribeToProfile: (userId: string) => () => void;
  updateProfile: (userId: string, updates: Partial<UserProfile>) => Promise<void>;
  createProfile: (userId: string, profileData: Omit<UserProfile, 'id' | 'joinedAt'>) => Promise<void>;
  followUser: (userId: string, targetUserId: string) => Promise<void>;
  unfollowUser: (userId: string, targetUserId: string) => Promise<void>;
  fetchUserAnalytics: (userId: string) => Promise<any>;
  clearProfile: () => void;
}

// Global fetch tracker to prevent infinite loops
const globalFetchTracker = new Map<string, boolean>();

// Clean user data function
function cleanUserData(data: any): any {
  if (!data) return data;
  
  const cleaned = { ...data };
  
  // Clean name field
  if (cleaned.name && typeof cleaned.name === 'string') {
    cleaned.name = cleaned.name
      .replace(/dkjArdF4Q9P4Wx2Nl7nfnt6O5Rn1aNnliXy7QFYKFDwjPfrvDXJkTbm1/g, '')
      .trim() || 'User';
  }
  
  // Clean bio field
  if (cleaned.bio && typeof cleaned.bio === 'string') {
    cleaned.bio = cleaned.bio
      .replace(/dkjArdF4Q9P4Wx2Nl7nfnt6O5Rn1aNnliXy7QFYKFDwjPfrvDXJkTbm1/g, '')
      .trim();
  }
  
  return cleaned;
}

export const useUserProfileStore = create<UserProfileStore>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  fetchProfile: async (userId: string) => {
    // AGGRESSIVE DUPLICATE PREVENTION
    if (globalFetchTracker.get(userId)) {
      console.log('🚫 BLOCKED: Already fetching profile for:', userId);
      return;
    }

    console.log('🔍 Store: Starting fetchProfile for:', userId);
    globalFetchTracker.set(userId, true);
    set({ loading: true, error: null });

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (userDoc.exists()) {
        const snapshotData = userDoc.data();
        const userData = cleanUserData({
          id: userDoc.id,
          ...snapshotData,
          customPhotoURL: snapshotData.customPhotoURL || '',
          photoURL: snapshotData.photoURL || '',
          profilePic: snapshotData.profilePic || '',
          avatar: snapshotData.avatar || '',
          name: snapshotData.name && typeof snapshotData.name === 'string' 
            ? snapshotData.name.trim() || 'User'
            : 'User',
          bio: snapshotData.bio && typeof snapshotData.bio === 'string'
            ? snapshotData.bio.trim()
            : ''
        }) as UserProfile;

        console.log('✅ Store: Profile loaded successfully:', userData.name, userData.id);
        set({ profile: userData, loading: false });
      } else {
        console.log('❌ Store: Profile document does not exist for:', userId);
        set({ error: 'Profile not found in database', loading: false });
      }
    } catch (error) {
      console.error('❌ Store: Firestore error:', error);
      set({ error: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`, loading: false });
    } finally {
      // Clear the fetch tracker after a delay
      setTimeout(() => {
        globalFetchTracker.delete(userId);
      }, 2000);
    }
  },

  // DISABLED: Real-time subscription to prevent infinite loops
  subscribeToProfile: (userId: string) => {
    console.log('🔔 Subscription disabled to prevent infinite loops for:', userId);
    return () => {};
  },

  updateProfile: async (userId: string, updates: Partial<UserProfile>) => {
    try {
      await updateDoc(doc(db, 'users', userId), updates);
      const currentProfile = get().profile;
      if (currentProfile && currentProfile.id === userId) {
        set({ profile: { ...currentProfile, ...updates } });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  createProfile: async (userId: string, profileData: Omit<UserProfile, 'id' | 'joinedAt'>) => {
    try {
      const newProfile: UserProfile = {
        ...profileData,
        id: userId,
        joinedAt: new Date(),
      };
      await setDoc(doc(db, 'users', userId), newProfile);
      set({ profile: newProfile, loading: false, error: null });
    } catch (error) {
      console.error('Error creating profile:', error);
      set({ error: 'Failed to create profile', loading: false });
    }
  },

  followUser: async (userId: string, targetUserId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const targetRef = doc(db, 'users', targetUserId);
      
      await updateDoc(userRef, { following: arrayUnion(targetUserId) });
      await updateDoc(targetRef, { followers: arrayUnion(userId) });
      
      const currentProfile = get().profile;
      if (currentProfile && currentProfile.id === userId) {
        const currentFollowing = Array.isArray(currentProfile.following) 
          ? currentProfile.following 
          : [];
        set({ 
          profile: { 
            ...currentProfile, 
            following: [...currentFollowing.filter(id => id !== targetUserId), targetUserId] 
          } 
        });
      }
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  },

  unfollowUser: async (userId: string, targetUserId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const targetRef = doc(db, 'users', targetUserId);
      
      await updateDoc(userRef, { following: arrayRemove(targetUserId) });
      await updateDoc(targetRef, { followers: arrayRemove(userId) });
      
      const currentProfile = get().profile;
      if (currentProfile && currentProfile.id === userId) {
        const currentFollowing = Array.isArray(currentProfile.following) 
          ? currentProfile.following 
          : [];
        set({ 
          profile: { 
            ...currentProfile, 
            following: currentFollowing.filter(id => id !== targetUserId) 
          } 
        });
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  },

  fetchUserAnalytics: async (userId: string) => {
    try {
      return {
        monthlySales: 0,
        monthlyOrders: 0,
        monthlyRefunds: 0,
        topProducts: []
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  },

  clearProfile: () => {
    set({ profile: null, loading: false, error: null });
  }
}));
