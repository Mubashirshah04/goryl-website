import { create } from "zustand";
import cachingService, { CacheRegion } from "@/lib/cachingService";
import { getUserProfile, updateUserProfile as updateUserProfileAWS, createOrUpdateUserProfile } from "@/lib/awsUserService";

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
  role: "user" | "personal_seller" | "seller" | "brand" | "company" | "admin";
  username?: string;
  usernameLastChanged?: string;
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
}

interface UserProfileStore {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: (userId: string) => Promise<void>;
  subscribeToProfile: (userId: string) => () => void;
  updateProfile: (
    userId: string,
    updates: Partial<UserProfile>,
  ) => Promise<void>;
  createProfile: (
    userId: string,
    profileData: Omit<UserProfile, "id" | "joinedAt">,
  ) => Promise<void>;
  followUser: (userId: string, targetUserId: string) => Promise<void>;
  unfollowUser: (userId: string, targetUserId: string) => Promise<void>;
  fetchUserAnalytics: (userId: string) => Promise<any>;
  clearProfile: () => void;
  clearUserCache: (userId: string) => void;
}

// Initialize caching service
cachingService
  .initialize()
  .catch((err) => console.error("Failed to initialize cache service:", err));

// Global fetch tracker - NOT permanent anymore to prevent excessive caching
const globalFetchTracker = new Map<string, { timestamp: number; inProgress: boolean }>();

// Clean user data function
function cleanUserData(data: any): any {
  if (!data) return data;

  const cleaned = { ...data };

  // Clean name field
  if (cleaned.name && typeof cleaned.name === "string") {
    cleaned.name =
      cleaned.name
        .replace(
          /dkjArdF4Q9P4Wx2Nl7nfnt6O5Rn1aNnliXy7QFYKFDwjPfrvDXJkTbm1/g,
          "",
        )
        .trim() || "User";
  }

  // Clean bio field
  if (cleaned.bio && typeof cleaned.bio === "string") {
    cleaned.bio = cleaned.bio
      .replace(/dkjArdF4Q9P4Wx2Nl7nfnt6O5Rn1aNnliXy7QFYKFDwjPfrvDXJkTbm1/g, "")
      .trim();
  }

  // Force ID normalization
  if (cleaned.id) {
    cleaned.id = String(cleaned.id).trim();
  }

  return cleaned;
}

export const useUserProfileStore = create<UserProfileStore>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  fetchProfile: async (userId: string) => {
    // Normalize userId to ensure consistent comparisons
    const normalizedUserId = userId?.trim() || "";
    if (!normalizedUserId) {
      console.log("❌ Invalid userId provided:", userId);
      set({ loading: false, error: "Invalid user ID" });
      return;
    }

    // Check if there's already a fetch in progress (but allow refetching after 5 seconds)
    const tracker = globalFetchTracker.get(normalizedUserId);
    const now = Date.now();
    if (tracker && tracker.inProgress && now - tracker.timestamp < 5000) {
      console.log(
        "⏳ Recent fetch in progress for:",
        normalizedUserId,
        `(${now - tracker.timestamp}ms ago)`
      );
      return;
    }

    // Mark as being fetched with timestamp
    globalFetchTracker.set(normalizedUserId, { timestamp: now, inProgress: true });

    // Always set loading state (no caching for profiles)
    set({ loading: true, error: null });
    console.log(
      "🔍 Store: Fetching fresh profile from AWS DynamoDB for:",
      normalizedUserId,
    );

    try {
      const userData = await getUserProfile(normalizedUserId);

      if (userData) {
        // Verify the ID matches what was requested (double check)
        if (userData.id !== normalizedUserId) {
          console.error(
            "⚠️ ID mismatch in profile fetch. Requested:",
            normalizedUserId,
            "Loaded:",
            userData.id,
          );
          userData.id = normalizedUserId; // Force correct ID
        }

        console.log(
          "✅ Store: Profile loaded successfully:",
          userData.name,
          userData.id,
        );

        // Cache the profile with advanced caching system
        await cachingService.set(
          CacheRegion.PROFILES,
          normalizedUserId,
          userData,
          { ttl: 15 * 60 * 1000 } // 15 minutes cache
        );

        set({ profile: userData, loading: false });
      } else {
        console.log(
          "❌ Store: Profile document does not exist for:",
          normalizedUserId,
        );
        // Update tracker to indicate fetch is complete, but keep timestamp
        const tracker = globalFetchTracker.get(normalizedUserId);
        if (tracker) {
          globalFetchTracker.set(normalizedUserId, {
            timestamp: tracker.timestamp,
            inProgress: false,
          });
        }

        set({
          profile: null,
          loading: false,
          error:
            "Profile not found. This user may not exist or their profile may be private.",
        });
      }
    } catch (error) {
      console.error("❌ Store: DynamoDB error:", error);
      // Update tracker to indicate fetch is complete, but keep timestamp
      const tracker = globalFetchTracker.get(normalizedUserId);
      if (tracker) {
        globalFetchTracker.set(normalizedUserId, {
          timestamp: tracker.timestamp,
          inProgress: false,
        });
      }

      set({
        profile: null,
        loading: false,
        error:
          "Failed to load profile. Please check your internet connection and try again.",
      });
    }
  },

  // DISABLED: Real-time subscription to prevent infinite loops
  subscribeToProfile: (userId: string) => {
    console.log(
      "🔔 Subscription disabled to prevent infinite loops for:",
      userId,
    );
    return () => {};
  },

  updateProfile: async (userId: string, updates: Partial<UserProfile>) => {
    try {
      await updateUserProfileAWS(userId, updates);
      const currentProfile = get().profile;
      if (currentProfile && currentProfile.id === userId) {
        set({ profile: { ...currentProfile, ...updates } });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  createProfile: async (
    userId: string,
    profileData: Omit<UserProfile, "id" | "joinedAt">,
  ) => {
    try {
      const newProfile: UserProfile = {
        ...profileData,
        id: userId,
        joinedAt: new Date().toISOString(),
      };
      await createOrUpdateUserProfile(userId, newProfile);
      set({ profile: newProfile, loading: false, error: null });
    } catch (error) {
      console.error("Error creating profile:", error);
      set({ error: "Failed to create profile", loading: false });
    }
  },

  followUser: async (userId: string, targetUserId: string) => {
    try {
      const currentProfile = get().profile;
      const currentFollowing = Array.isArray(currentProfile?.following)
        ? currentProfile!.following
        : [];
      const updatedFollowing = Array.from(new Set([...currentFollowing, targetUserId]));

      await updateUserProfileAWS(userId, { following: updatedFollowing });
      await updateUserProfileAWS(targetUserId, {
        followers: Array.from(new Set([...(currentProfile?.followers || []), userId])),
      });

      if (currentProfile && currentProfile.id === userId) {
        set({ profile: { ...currentProfile, following: updatedFollowing } });
      }
    } catch (error) {
      console.error("Error following user:", error);
      throw error;
    }
  },

  unfollowUser: async (userId: string, targetUserId: string) => {
    try {
      const currentProfile = get().profile;
      const currentFollowing = Array.isArray(currentProfile?.following)
        ? currentProfile!.following
        : [];
      const updatedFollowing = currentFollowing.filter((id) => id !== targetUserId);

      await updateUserProfileAWS(userId, { following: updatedFollowing });
      await updateUserProfileAWS(targetUserId, {
        followers: (currentProfile?.followers || []).filter((id) => id !== userId),
      });

      if (currentProfile && currentProfile.id === userId) {
        set({ profile: { ...currentProfile, following: updatedFollowing } });
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      throw error;
    }
  },

  fetchUserAnalytics: async (userId: string) => {
    try {
      return {
        monthlySales: 0,
        monthlyOrders: 0,
        monthlyRefunds: 0,
        topProducts: [],
      };
    } catch (error) {
      console.error("Error fetching analytics:", error);
      throw error;
    }
  },

  clearProfile: () => {
    console.log("🧹 Clearing profile data from store");
    set({ profile: null, loading: false, error: null });
  },

  // Clear cache and tracker for a specific user (for debugging)
  clearUserCache: (userId: string) => {
    const normalizedUserId = userId?.trim() || "";
    if (!normalizedUserId) return;

    // Clear from advanced cache system
    cachingService.remove(CacheRegion.PROFILES, normalizedUserId);
    globalFetchTracker.delete(normalizedUserId);
    console.log("🗑️ Cleared cache and tracker for:", normalizedUserId);
  },
}));
