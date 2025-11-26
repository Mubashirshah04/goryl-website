import { create } from 'zustand';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from '@/lib/firestore';
import { db } from '@/lib/firebase';
// Global fetch tracker to prevent infinite loops
const globalFetchTracker = new Map();
// Clean user data function
function cleanUserData(data) {
    if (!data)
        return data;
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
                const userData = cleanUserData(Object.assign(Object.assign({ id: userDoc.id }, snapshotData), { customPhotoURL: snapshotData.customPhotoURL || '', photoURL: snapshotData.photoURL || '', profilePic: snapshotData.profilePic || '', avatar: snapshotData.avatar || '', name: snapshotData.name && typeof snapshotData.name === 'string'
                        ? snapshotData.name.trim() || 'User'
                        : 'User', bio: snapshotData.bio && typeof snapshotData.bio === 'string'
                        ? snapshotData.bio.trim()
                        : '' }));
                console.log('✅ Store: Profile loaded successfully:', userData.name, userData.id);
                set({ profile: userData, loading: false });
            }
            else {
                console.log('❌ Store: Profile document does not exist for:', userId);
                set({ error: 'Profile not found in database', loading: false });
            }
        }
        catch (error) {
            console.error('❌ Store: Firestore error:', error);
            set({ error: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`, loading: false });
        }
        finally {
            // Clear the fetch tracker after a delay
            setTimeout(() => {
                globalFetchTracker.delete(userId);
            }, 2000);
        }
    },
    // DISABLED: Real-time subscription to prevent infinite loops
    subscribeToProfile: (userId) => {
        console.log('🔔 Subscription disabled to prevent infinite loops for:', userId);
        return () => { };
    },
    updateProfile: async (userId, updates) => {
        try {
            await updateDoc(doc(db, 'users', userId), updates);
            const currentProfile = get().profile;
            if (currentProfile && currentProfile.id === userId) {
                set({ profile: Object.assign(Object.assign({}, currentProfile), updates) });
            }
        }
        catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },
    createProfile: async (userId, profileData) => {
        try {
            const newProfile = Object.assign(Object.assign({}, profileData), { id: userId, joinedAt: new Date() });
            await setDoc(doc(db, 'users', userId), newProfile);
            set({ profile: newProfile, loading: false, error: null });
        }
        catch (error) {
            console.error('Error creating profile:', error);
            set({ error: 'Failed to create profile', loading: false });
        }
    },
    followUser: async (userId, targetUserId) => {
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
                    profile: Object.assign(Object.assign({}, currentProfile), { following: [...currentFollowing.filter(id => id !== targetUserId), targetUserId] })
                });
            }
        }
        catch (error) {
            console.error('Error following user:', error);
            throw error;
        }
    },
    unfollowUser: async (userId, targetUserId) => {
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
                    profile: Object.assign(Object.assign({}, currentProfile), { following: currentFollowing.filter(id => id !== targetUserId) })
                });
            }
        }
        catch (error) {
            console.error('Error unfollowing user:', error);
            throw error;
        }
    },
    fetchUserAnalytics: async (userId) => {
        try {
            return {
                monthlySales: 0,
                monthlyOrders: 0,
                monthlyRefunds: 0,
                topProducts: []
            };
        }
        catch (error) {
            console.error('Error fetching analytics:', error);
            throw error;
        }
    },
    clearProfile: () => {
        set({ profile: null, loading: false, error: null });
    }
}));
