'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStoreCognito';
import { useUserProfileStore } from '@/store/userProfileStore';
import { useUserProductsStore } from '@/store/userProductsStore';
import { useUserReviewsStore } from '@/store/userReviewsStore';
import NormalUserProfile from '@/components/profiles/NormalUserProfile';
import SellerProfile from '@/components/profiles/SellerProfile';
import BrandProfile from '@/components/profiles/BrandProfile';
// CompanyProfile removed - company profiles feature deleted
import PublicProfileBanner from '@/components/profiles/PublicProfileBanner';
export default function ProfilePageClient({ uid: propUid }) {
    const searchParams = useSearchParams();
    const uidFromQuery = searchParams.get('uid');
    const uid = propUid || uidFromQuery;
    const { user } = useAuthStore();
    const { profile, loading: profileLoading, error: profileError, fetchProfile, subscribeToProfile, followUser, unfollowUser } = useUserProfileStore();
    const { products, loading: productsLoading } = useUserProductsStore();
    const { reviews, loading: reviewsLoading } = useUserReviewsStore();
    const [isFollowing, setIsFollowing] = useState(false);
    const [lastFetchedUid, setLastFetchedUid] = useState(null);
    const fetchingRef = useRef(null);
    const isOwnProfile = (user === null || user === void 0 ? void 0 : user.sub) === uid;
    const isAdmin = (user === null || user === void 0 ? void 0 : user.role) === 'admin';
    // Fetch profile once - ULTRA STRICT duplicate prevention
    useEffect(() => {
        // Validate that we have a userId and it's a valid string
        if (!uid || typeof uid !== 'string' || uid.trim() === '') {
            console.log('❌ No valid UID provided:', uid);
            useUserProfileStore.setState({ loading: false, error: 'Invalid user ID' });
            return;
        }
        // ULTRA STRICT: Prevent duplicate fetches for the same UID using multiple checks
        if (lastFetchedUid === uid || fetchingRef.current === uid) {
            console.log('⏭️ CLIENT BLOCK: Already fetched/fetching for:', uid);
            return;
        }
        // Check if we already have this profile loaded
        const currentProfile = useUserProfileStore.getState().profile;
        if (currentProfile && currentProfile.id === uid) {
            console.log('💾 CLIENT CACHE HIT: Profile already loaded for:', uid);
            setLastFetchedUid(uid);
            return;
        }
        console.log('🔄 New profile requested - clearing previous profile');
        // Clear previous profile immediately to prevent showing wrong profile
        const { clearProfile } = useUserProfileStore.getState();
        clearProfile();
        // Set loading state manually since clearProfile sets it to false
        useUserProfileStore.setState({ loading: true, error: null });
        console.log('🔍 Fetching profile for UID:', uid);
        setLastFetchedUid(uid);
        fetchingRef.current = uid;
        // Fetch the profile with proper error handling
        fetchProfile(uid).catch((error) => {
            console.error('❌ Error fetching profile:', error);
            useUserProfileStore.setState({
                loading: false,
                error: 'Failed to load profile. Please try again.'
            });
        }).finally(() => {
            // Keep the fetching ref to prevent future calls
            // fetchingRef.current = null; // REMOVED - keep permanent block
        });
    }, [uid]); // Only depend on uid to prevent loops
    // Keep isFollowing in sync with profile followers and current user
    useEffect(() => {
        if (!user || !profile)
            return;
        const followers = Array.isArray(profile.followers) ? profile.followers : [];
        setIsFollowing(followers.includes(user.sub));
    }, [user === null || user === void 0 ? void 0 : user.sub, profile === null || profile === void 0 ? void 0 : profile.id, profile === null || profile === void 0 ? void 0 : profile.followers]);
    // Handle follow/unfollow - now just refreshes profile data since BrandProfile handles its own state
    const handleFollow = async () => {
        if (!user || !profile || !uid)
            return;
        try {
            // Refresh profile data to get updated follow status
            await fetchProfile(uid);
        }
        catch (error) {
            console.error('Error refreshing profile:', error);
        }
    };
    const handleShare = () => {
        // Implement share functionality
        toast.info('Share functionality not implemented yet');
    };
    const handleMessage = () => {
        // Implement message functionality
        toast.info('Message functionality not implemented yet');
    };
    const handleBack = () => {
        // Implement back functionality
        window.history.back();
    };
    // Admin actions
    const handleApprove = async (userId) => {
        // Implement approve functionality
        toast.info('Approve functionality not implemented yet');
    };
    const handleReject = async (userId) => {
        // Implement reject functionality
        toast.info('Reject functionality not implemented yet');
    };
    const handleBan = async (userId) => {
        // Implement ban functionality
        toast.info('Ban functionality not implemented yet');
    };
    const handleDelete = async (userId) => {
        // Implement delete functionality
        toast.info('Delete functionality not implemented yet');
    };
    // Show loading state if we're still validating the uid
    if (!uid) {
        return (<div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Profile Not Found</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    No user ID provided in the URL.
                </p>
            </div>
        </div>);
    }
    // Show error if profile failed to load
    if (profileError) {
        return (<div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Profile Not Found</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {profileError || 'This profile could not be loaded. It may not exist or be private.'}
                </p>
                <button onClick={() => {
                    setLastFetchedUid(null);
                    fetchingRef.current = null;
                    if (uid)
                        fetchProfile(uid);
                }} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Try Again
                </button>
            </div>
        </div>);
    }
    // Show loading spinner while fetching profile OR if no profile yet
    if (profileLoading || !profile) {
        return (<div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Loading profile...</p>
            </div>
        </div>);
    }
    // Render appropriate profile component based on user role
    const renderProfileComponent = () => {
        if (!profile)
            return null;
        switch (profile.role) {
        { profile && (<PublicProfileBanner profile={profile} isLoggedIn={!!user} />) }

        { renderProfileComponent() }

    </div >);
}

