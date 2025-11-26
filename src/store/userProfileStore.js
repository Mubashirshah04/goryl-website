import { create } from 'zustand';
// ✅ AWS DYNAMODB - Firestore completely removed
// Using AWS User Service for all profile operations

// Clean user data function
function cleanUserData(data) {
    if (!data) return data;
    const cleaned = Object.assign({}, data);

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

export const useUserProfileStore = create((set, get) => ({
    profile: null,
    loading: false,
    error: null,

    fetchProfile: async (userId) => {
        set({ loading: true, error: null });

        try {
            console.log('🔍 Store: Fetching profile from AWS for:', userId);

            // ✅ AWS DynamoDB via awsUserService
            const { getUserProfile } = await import('@/lib/awsUserService');
            const userData = await getUserProfile(userId);

            if (userData) {
                const cleanedData = cleanUserData(userData);
                console.log('✅ Store: Profile loaded from AWS:', cleanedData.name, cleanedData.id);
                set({ profile: cleanedData, loading: false });
            } else {
                console.log('❌ Store: Profile not found in AWS for:', userId);
                set({
                    profile: null,
                    loading: false,
                    error: 'Profile not found. This user may not exist or their profile may be private.'
                });
            }
        } catch (error) {
            console.error('❌ Store: AWS error:', error);
            set({
                profile: null,
                loading: false,
                error: 'Failed to load profile. Please check your internet connection and try again.'
            });
        }
    },

    subscribeToProfile: (userId) => {
        console.log('🔔 Setting up polling for profile (AWS):', userId);

        // ✅ AWS DynamoDB doesn't support realtime - use polling
        get().fetchProfile(userId);

        const intervalId = setInterval(() => {
            get().fetchProfile(userId);
        }, 30000); // Poll every 30 seconds

        return () => {
            clearInterval(intervalId);
            console.log('🛑 Stopped polling for profile');
        };
    },

    updateProfile: async (userId, updates) => {
        try {
            // ✅ AWS DynamoDB via awsUserService
            const { updateUserProfile } = await import('@/lib/awsUserService');
            await updateUserProfile(userId, updates);

            const currentProfile = get().profile;
            if (currentProfile && currentProfile.id === userId) {
                set({ profile: Object.assign(Object.assign({}, currentProfile), updates) });
            }

            console.log('✅ Profile updated in AWS');
        } catch (error) {
            console.error('❌ Error updating profile in AWS:', error);
            throw error;
        }
    },

    createProfile: async (userId, profileData) => {
        try {
            // ✅ AWS DynamoDB via awsUserService
            const { createUserProfile } = await import('@/lib/awsUserService');
            const newProfile = Object.assign(Object.assign({}, profileData), {
                id: userId,
                joinedAt: new Date()
            });

            await createUserProfile(userId, newProfile);
            set({ profile: newProfile, loading: false, error: null });
            console.log('✅ Profile created in AWS');
        } catch (error) {
            console.error('❌ Error creating profile in AWS:', error);
            set({ error: 'Failed to create profile', loading: false });
        }
    },

    followUser: async (userId, targetUserId) => {
        try {
            // ✅ AWS DynamoDB via awsUserService
            const { followUser } = await import('@/lib/awsUserService');
            await followUser(userId, targetUserId);

            const currentProfile = get().profile;
            if (currentProfile && currentProfile.id === userId) {
                const currentFollowing = Array.isArray(currentProfile.following)
                    ? currentProfile.following
                    : [];
                set({
                    profile: Object.assign(Object.assign({}, currentProfile), {
                        following: [...currentFollowing.filter(id => id !== targetUserId), targetUserId]
                    })
                });
            }
            console.log('✅ User followed in AWS');
        } catch (error) {
            console.error('❌ Error following user in AWS:', error);
            throw error;
        }
    },

    unfollowUser: async (userId, targetUserId) => {
        try {
            // ✅ AWS DynamoDB via awsUserService
            const { unfollowUser } = await import('@/lib/awsUserService');
            await unfollowUser(userId, targetUserId);

            const currentProfile = get().profile;
            if (currentProfile && currentProfile.id === userId) {
                const currentFollowing = Array.isArray(currentProfile.following)
                    ? currentProfile.following
                    : [];
                set({
                    profile: Object.assign(Object.assign({}, currentProfile), {
                        following: currentFollowing.filter(id => id !== targetUserId)
                    })
                });
            }
            console.log('✅ User unfollowed in AWS');
        } catch (error) {
            console.error('❌ Error unfollowing user in AWS:', error);
            throw error;
        }
    },

    fetchUserAnalytics: async (userId) => {
        try {
            // TODO: Implement AWS analytics
            console.warn('⚠️ Analytics not yet implemented in AWS');
            return {
                monthlySales: 0,
                monthlyOrders: 0,
                monthlyRefunds: 0,
                topProducts: []
            };
        } catch (error) {
            console.error('❌ Error fetching analytics:', error);
            throw error;
        }
    },

    clearProfile: () => {
        set({ profile: null, loading: false, error: null });
    },

    clearUserCache: (userId) => {
        console.log('🗑️ Cache cleared for:', userId);
        // AWS doesn't need cache clearing
    }
}));
