"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { User } from "lucide-react";
import { useAuthStore } from "@/store/authStoreCognito";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserProductsStore } from "@/store/userProductsStore";
import { useUserReviewsStore } from "@/store/userReviewsStore";
import NormalUserProfile from "@/components/profiles/NormalUserProfile";
import SellerProfile from "@/components/profiles/SellerProfile";
import BrandProfile from "@/components/profiles/BrandProfile";
import CompanyProfile from "@/components/profiles/CompanyProfile";
import AdminControls from "@/components/profiles/AdminControls";
import PublicProfileBanner from "@/components/profiles/PublicProfileBanner";
import cachingService, { CacheRegion } from "@/lib/cachingService";
import { getProducts } from "@/lib/awsDynamoService";
import { getUserProfile } from "@/lib/awsUserService";

export default function ProfilePageClient({ uid: propUid }: { uid?: string }) {
  const searchParams = useSearchParams();
  const uidFromQuery = searchParams.get("uid");
  // Normalize uid to ensure consistent comparison
  const uid = (propUid || uidFromQuery || "").trim();

  // REMOVED: No longer attempting to use cached profile data
  // This was causing profile ID mismatch issues
  useEffect(() => {
    if (!uid) return;
    // We're now always loading fresh profile data
    console.log("🔄 Will fetch fresh profile data for:", uid);
  }, [uid]);

  // Log the uid source for debugging
  useEffect(() => {
    if (uid) {
      console.log(
        `Profile uid source: ${propUid ? "prop" : "query"}, value: ${uid}`,
      );
    }
  }, [propUid, uid]);

  const { user } = useAuthStore();
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    fetchProfile,
    subscribeToProfile,
    followUser,
    unfollowUser,
    updateProfile,
  } = useUserProfileStore();
  const { products, loading: productsLoading } = useUserProductsStore();
  const { reviews, loading: reviewsLoading } = useUserReviewsStore();

  const [isFollowing, setIsFollowing] = useState(false);
  const [lastFetchedUid, setLastFetchedUid] = useState<string | null>(null);
  const fetchingRef = useRef<string | null>(null);

  // More robust check for profile ownership - ensure user is authenticated and profile is loaded
  const isOwnProfile = Boolean(
    user?.sub &&
      uid &&
      profile?.id &&
      user.sub === uid &&
      user.sub === profile.id,
  );
  const isAdmin = user?.role === "admin";
  // No need for this line as we're using setState directly

  // Fetch profile once - ULTRA STRICT duplicate prevention
  // Prefetch user's activity data in background
  const prefetchUserActivityData = async (userId: string) => {
    if (!userId) return;

    try {
      // Prefetch in parallel to avoid blocking
      Promise.all([
        // Prefetch user's products in background via AWS DynamoDB
        cachingService.get(
          CacheRegion.PRODUCTS,
          `user_products_${userId}`,
          async () => {
            const items = await getProducts({ sellerId: userId }, "createdAt", "desc", 10);
            return items.map((p: any) => ({
              ...p,
              id: p.id,
              _lastUpdated: Date.now(),
            }));
          },
          { background: true },
        ),

        // Prefetch user's followers in background via AWS DynamoDB
        cachingService.get(
          CacheRegion.PROFILES,
          `followers_${userId}`,
          async () => {
            const profile = await getUserProfile(userId);
            return Array.isArray(profile?.followers) ? profile!.followers : [];
          },
          { background: true },
        ),
      ]);
    } catch (error) {
      console.warn("Background prefetch failed:", error);
    }
  };

  // Fetch profile once - SIMPLIFIED for reliability over caching
  useEffect(() => {
    // Validate that we have a userId and it's a valid string
    if (!uid || uid.trim() === "") {
      console.log("❌ No valid UID provided:", uid);
      useUserProfileStore.setState({
        loading: false,
        error: "Invalid user ID",
      });
      return;
    }

    // Clear any existing profile data first to prevent stale data
    const { clearProfile } = useUserProfileStore.getState();
    clearProfile();

    // Always set loading state
    useUserProfileStore.setState({ loading: true, error: null });

    console.log("🔍 Fetching fresh profile data for UID:", uid);

    // Reset fetching state
    setLastFetchedUid(uid);
    fetchingRef.current = uid;

    // Fetch the profile - ALWAYS FRESH
    fetchProfile(uid)
      .then(() => {
        // Verify the profile ID matches
        const fetchedProfile = useUserProfileStore.getState().profile;
        if (fetchedProfile) {
          const fetchedId = String(fetchedProfile.id || "").trim();
          const requestedId = String(uid || "").trim();

          if (fetchedId !== requestedId) {
            console.error("❌ Profile ID mismatch - forcing reload:", {
              requestedUid: requestedId,
              fetchedProfileId: fetchedId,
            });

            // Force clear the incorrect profile
            useUserProfileStore.setState({
              profile: null,
              loading: false,
              error: "Profile ID mismatch - please reload",
            });
          } else {
            console.log("✅ Profile loaded successfully:", fetchedId);
          }
        }
      })
      .catch((error) => {
        console.error("❌ Error fetching profile:", error);
        useUserProfileStore.setState({
          loading: false,
          error: "Failed to load profile. Please try again.",
        });
      });
  }, [uid]); // Only depend on uid to prevent loops

  // Keep isFollowing in sync with profile followers and current user
  useEffect(() => {
    if (!user || !profile) return;
    const followers = Array.isArray(profile.followers) ? profile.followers : [];
    setIsFollowing(followers.includes(user.sub));
  }, [user?.sub, profile?.id, profile?.followers]);

  // Handle follow/unfollow - now just refreshes profile data since BrandProfile handles its own state
  const handleFollow = async () => {
    if (!user || !profile || !uid) return;
    
    // Refresh profile data to get updated follow status
    try {
      await fetchProfile(uid);
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  };

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${uid}`;
    const shareData = {
      title: `${profile?.name || "User"}'s Profile - Zaillisy`,
      text: `Check out ${profile?.name || "this user"}'s profile on Zaillisy!`,
      url: profileUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success("Profile shared successfully!");
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(profileUrl);
        toast.success("Profile link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(profileUrl);
        toast.success("Profile link copied to clipboard!");
      } catch (clipboardError) {
        toast.error("Failed to share profile");
      }
    }
  };

  const handleMessage = () => {
    if (!user) {
      toast.error("Please login to send messages");
      router.push("/auth-login");
      return;
    }

    if (isOwnProfile) {
      toast.info("You cannot message yourself");
      return;
    }

    // Navigate to chat page
    router.push(`/chat/${userId}`);
  };

  const handleBack = () => {
    // Implement back functionality
    window.history.back();
  };

  // Admin actions
  const handleApprove = async (userId: string) => {
    // Implement approve functionality
    toast.info("Approve functionality not implemented yet");
  };

  const handleReject = async (userId: string) => {
    // Implement reject functionality
    toast.info("Reject functionality not implemented yet");
  };

  const handleBan = async (userId: string) => {
    // Implement ban functionality
    toast.info("Ban functionality not implemented yet");
  };

  const handleDelete = async (userId: string) => {
    // Implement delete functionality
    toast.info("Delete functionality not implemented yet");
  };

  // Show loading state if we're still validating the uid
  if (!uid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Profile Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">No user ID provided in the URL.</p>
        </div>
      </div>
    );
  }

  // Show error if profile failed to load
  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Profile Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {profileError ||
              "This profile could not be loaded. It may not exist or be private."}
          </p>
          <button
            onClick={() => {
              setLastFetchedUid(null);
              fetchingRef.current = null;
              if (uid) fetchProfile(uid);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ✅ Instagram/TikTok-style instant skeleton loader
  if (profileLoading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Skeleton Banner */}
        <div className="relative bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 h-40 md:h-48 animate-pulse" />

        {/* Skeleton Profile Section */}
        <div className="px-4 md:px-8 -mt-16 relative z-10 max-w-4xl mx-auto">
          <div className="flex items-end gap-6 mb-6">
            {/* Skeleton Avatar */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse border-4 border-background" />

            {/* Skeleton Name & Stats */}
            <div className="flex-1 mb-4">
              <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-4" />
              <div className="flex gap-4">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Skeleton Content */}
          <div className="space-y-4 mt-8">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate profile component based on user role
  const renderProfileComponent = () => {
    if (!profile) return null;

    // Double-check that we're displaying the correct profile
    // Double check profile ID matches requested ID
    const normalizedProfileId = String(profile.id || "").trim();
    const normalizedUid = String(uid || "").trim();

    // If we have an ID mismatch, return an error with reload option
    if (normalizedProfileId !== normalizedUid) {
      console.error("Profile ID mismatch in render:", {
        profileId: normalizedProfileId,
        requestedUid: normalizedUid,
      });

      // Force clear all profile cache
      try {
        cachingService.clearRegion(CacheRegion.PROFILES);
      } catch (e) {
        console.error("Failed to clear profile cache:", e);
      }

      return (
        <div className="text-red-500 p-4 bg-red-50 rounded-lg border border-red-200 m-4">
          <h2 className="text-xl font-semibold mb-2">
            Error: Profile Mismatch
          </h2>
          <p className="mb-2">
            Profile data issue detected. Please reload the page.
          </p>
          <button
            onClick={() => {
              // Clear everything and force reload
              useUserProfileStore.getState().clearProfile();
              localStorage.removeItem(`profile:${normalizedUid}`);
              localStorage.removeItem(`profile:${normalizedProfileId}`);
              window.location.href = `/profile/${normalizedUid}`;
            }}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors"
          >
            Reload Correct Profile
          </button>
        </div>
      );
    }

    switch (profile.role) {
      case "personal_seller": // Personal sellers (application approved)
        return (
          <SellerProfile
            profile={profile}
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            onFollow={handleFollow}
            onShare={handleShare}
            onMessage={handleMessage}
            onBack={handleBack}
            isLoggedIn={!!user}
          />
        );
      case "brand":
        return (
          <BrandProfile
            profile={profile}
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            onFollow={handleFollow}
            onShare={handleShare}
            onMessage={handleMessage}
            onBack={handleBack}
            isLoggedIn={!!user}
          />
        );
      case "company":
        return (
          <CompanyProfile
            profile={profile}
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            onFollow={handleFollow}
            onShare={handleShare}
            onMessage={handleMessage}
            onBack={handleBack}
            isLoggedIn={!!user}
          />
        );
      default:
        return (
          <NormalUserProfile
            profile={profile}
            isOwnProfile={isOwnProfile}
            isFollowing={isFollowing}
            onFollow={handleFollow}
            onShare={handleShare}
            onMessage={handleMessage}
            onBack={handleBack}
            isLoggedIn={!!user}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Public Profile Banner - Shows role info and login prompt */}
      {profile && profile.id === uid && (
        <PublicProfileBanner profile={profile} isLoggedIn={!!user} />
      )}

      {renderProfileComponent()}

      {/* Debug info in development mode */}
      {process.env.NODE_ENV === "development" && (
        <div className="p-4 text-xs text-gray-500 border-t border-gray-200 mt-8">
          <p>
            Debug: uid={uid}, profileId={profile?.id}, matched=
            {profile && profile.id === uid ? "yes" : "no"}
          </p>
          <p>Cache disabled for profiles to prevent ID mismatch issues</p>
        </div>
      )}
    </div>
  );
}

