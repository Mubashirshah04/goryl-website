"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Mail, Share, UserPlus, UserMinus } from "lucide-react";
// Using AWS DynamoDB instead of Firebase Firestore
import { useSession } from "@/hooks/useCustomSession";
import dynamic from "next/dynamic";
const NormalUserProfile = dynamic(
  () => import("@/components/profiles/NormalUserProfile").then(m => m.default),
  { ssr: false }
);
const SellerProfile = dynamic(
  () => import("@/components/profiles/SellerProfile").then(m => m.default),
  { ssr: false }
);
const BrandProfile = dynamic(
  () => import("@/components/profiles/BrandProfile").then(m => m.default),
  { ssr: false }
);
// CompanyProfile removed - company profiles feature deleted
const PublicProfileBanner = dynamic(
  () => import("@/components/profiles/PublicProfileBanner").then(m => m.default),
  { ssr: false }
);
import Link from "next/link";

// Define UserProfile interface
interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  bio?: string;
  role: "user" | "personal_seller" | "seller" | "brand" | "company" | "admin";
  followers: string[];
  following: string[];
  username?: string;
  rating?: number;
  verified?: boolean;
  joinedAt: Date;
  [key: string]: any; // Allow for additional properties
}

export default function ProfilePageClient({ uid: propUid, username: propUsername }: { uid?: string; username?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uidFromQuery = searchParams.get("uid");
  const usernameFromQuery = searchParams.get("username");

  // Normalize identifiers - ensure they're strings and trimmed
  const uid = (propUid || uidFromQuery || "").trim();
  const username = (propUsername || usernameFromQuery || "").trim();

  const { data: session } = useSession();
  const user = session?.user;

  // State for profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  // Function to fetch profile by username or UID
  const fetchProfileDirectly = async (identifier: string, isUsername: boolean = false) => {
    if (!identifier || identifier.trim() === "") {
      setError("Invalid profile identifier");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`🔍 Fetching profile for ${isUsername ? 'username' : 'ID'}: ${identifier}`);

      let profileData: any = null;

      // ✅ AWS DynamoDB ONLY - No Firestore fallback
      const { getUserProfile, getUserByUsername } = await import("@/lib/awsUserService");

      if (isUsername) {
        // Try to fetch by username first
        console.log(`🔍 Fetching user from AWS DynamoDB by username: ${identifier}`);
        profileData = await getUserByUsername(identifier);

        if (!profileData) {
          // If username not found, try as UID as fallback
          console.log(`⚠️ Username "${identifier}" not found in DynamoDB, trying as UID...`);
          profileData = await getUserProfile(identifier);
        }
      } else {
        // Fetch by UID
        console.log(`🔍 Fetching user from AWS DynamoDB by ID: ${identifier}`);
        profileData = await getUserProfile(identifier);
      }

      if (profileData) {
        console.log('✅ User data from AWS DynamoDB');
      } else {
        console.error('❌ Profile not found in AWS DynamoDB:', identifier);
        setError("Profile not found. This user may not exist in the database.");
        setLoading(false);
        return;
      }

      // Convert DynamoDB data to profile format
      const newProfile = {
        ...profileData,
        id: profileData.id,
        // Ensure correct date objects (DynamoDB stores as ISO strings)
        joinedAt: profileData.joinedAt
          ? (typeof profileData.joinedAt === 'string' ? new Date(profileData.joinedAt) : profileData.joinedAt)
          : new Date(),
        followers: Array.isArray(profileData.followers)
          ? profileData.followers
          : [],
        following: Array.isArray(profileData.following)
          ? profileData.following
          : [],
      } as UserProfile;

      console.log(
        `✅ Profile fetched successfully: ${newProfile.name} (${newProfile.username || newProfile.id})`,
      );

      setProfile(newProfile);

      // Check if current user is following this profile
      if (user && newProfile.followers) {
        setIsFollowing(newProfile.followers.includes(user.id));
      }

      // If accessed by UID and username exists, redirect to username-based URL
      if (!isUsername && newProfile.username && identifier === newProfile.id) {
        console.log(`🔄 Redirecting to username-based URL: /profile/${newProfile.username}`);
        router.replace(`/profile/${newProfile.username}`);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
      setLoading(false);
    }
  };

  // Fetch profile when username or uid changes
  useEffect(() => {
    // Prioritize username if provided
    if (username && username.trim() !== '') {
      fetchProfileDirectly(username, true);
      return;
    }

    // Fallback to UID if username not provided
    if (uid && uid.trim() !== '') {
      fetchProfileDirectly(uid, false);
      return;
    }

    // If no identifier provided and user is logged in, try to get their username
    if (user?.id) {
      // Try to get current user's username from their profile
      const getCurrentUserProfile = async () => {
        try {
          // Try AWS DynamoDB first
          try {
            const { getUserProfile } = await import("@/lib/awsUserService");
            const userData = await getUserProfile(user.id);

            if (userData) {
              if (userData.username) {
                router.replace(`/profile/${userData.username}`);
              } else {
                router.replace(`/profile/${user.id}`);
              }
              return;
            }
          } catch (dynamoError) {
            console.warn('DynamoDB fetch failed:', dynamoError);
          }

          // If no profile found, redirect to UID-based URL
          router.replace(`/profile/${user.id}`);
        } catch (err) {
          console.error("Error fetching current user profile:", err);
          router.replace(`/profile/${user.id}`);
        }
      };

      getCurrentUserProfile();
      return;
    }

    // If no identifier and no user, show error
    setError("No profile identifier provided");
    setLoading(false);
  }, [uid, username, user?.id, router]);

  // Handle follow/unfollow - Using AWS DynamoDB
  const handleFollow = async () => {
    if (!user || !profile) return;

    // Skip follow for mock/test sellers
    if (profile.id === 'mock-seller' || profile.id.startsWith('mock-')) {
      console.log('Skipping follow for mock seller:', profile.id);
      return;
    }

    try {
      const { followUser, unfollowUser } = await import("@/lib/followService");
      const { getUserProfile } = await import("@/lib/awsUserService");

      // OPTIMISTIC UPDATE: Update UI immediately before API call
      if (isFollowing) {
        // Unfollow: Update optimistically
        setIsFollowing(false);
        setProfile(prev => {
          if (!prev) return null;
          const newFollowersCount = Math.max(0, (prev.followersCount || 0) - 1);
          const newFollowingCount = user && user.id === profile.id ? Math.max(0, (prev.followingCount || 0) - 1) : (prev.followingCount || 0);
          return {
            ...prev,
            followersCount: newFollowersCount,
            followingCount: newFollowingCount
          };
        });

        // AWS unfollow
        await unfollowUser(user.id, profile.id);
      } else {
        // Follow: Update optimistically
        setIsFollowing(true);
        setProfile(prev => {
          if (!prev) return null;
          const newFollowersCount = (prev.followersCount || 0) + 1;
          const newFollowingCount = user && user.id === profile.id ? (prev.followingCount || 0) + 1 : (prev.followingCount || 0);
          return {
            ...prev,
            followersCount: newFollowersCount,
            followingCount: newFollowingCount
          };
        });

        // AWS follow
        await followUser(user.id, profile.id);
      }

      // Refresh profile data from AWS to ensure sync (non-blocking)
      try {
        const refreshedProfile = await getUserProfile(profile.id);
        if (refreshedProfile) {
          setProfile(prev => {
            if (!prev) return null;
            return {
              ...prev,
              followersCount: refreshedProfile.followers?.length || 0,
              followingCount: refreshedProfile.following?.length || 0
            };
          });
        }

        // If viewing own profile, also refresh current user's data
        if (user && user.id === profile.id) {
          const refreshedCurrentUser = await getUserProfile(user.id);
          if (refreshedCurrentUser) {
            setProfile(prev => {
              if (!prev) return null;
              return {
                ...prev,
                followingCount: refreshedCurrentUser.following?.length || 0
              };
            });
          }
        }
      } catch (refreshError) {
        console.warn('Could not refresh profile after follow/unfollow:', refreshError);
      }

      console.log('✅ Follow/unfollow updated in AWS');
    } catch (error) {
      console.error("Error updating follow status:", error);
      // Revert optimistic update on error
      setIsFollowing(!isFollowing);
      toast.error("Failed to update follow status");
    }
  };

  // Handle sharing profile
  const handleShare = async () => {
    if (!profile) return;

    const url = `${window.location.origin}/profile/${profile.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile.name}'s Profile`,
          text: `Check out ${profile.name}'s profile on Zaillisy!`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Profile link copied to clipboard");
      }
    } catch (err) {
      console.error("Error sharing profile:", err);
      // Ignore user cancellations
    }
  };

  // Handle messaging
  const handleMessage = () => {
    if (!user) {
      toast.error("Please login to send messages");
      router.push("/auth-login");
      return;
    }

    if (profile && user.id === profile.id) {
      toast.error("You cannot message yourself");
      return;
    }

    if (profile) {
      router.push(`/chat/${profile.id}`);
    }
  };

  // Handle back button
  const handleBack = () => {
    router.back();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 h-48"></div>
        <div className="px-4 -mt-16 relative z-10 max-w-4xl mx-auto">
          {/* Skeleton loading UI */}
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-gray-300 animate-pulse border-4 border-white mb-4"></div>
            <div className="h-6 w-48 bg-gray-300 animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 animate-pulse mb-4"></div>
            <div className="flex gap-4 mb-8">
              <div className="h-10 w-24 rounded-full bg-gray-300 animate-pulse"></div>
              <div className="h-10 w-24 rounded-full bg-gray-300 animate-pulse"></div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Profile Error
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => uid && fetchProfileDirectly(uid)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No profile data
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Profile Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This profile could not be loaded.
          </p>
          <Link
            href="/"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Determine if this is the current user's profile
  const isOwnProfile = user && user.id && profile && user.id === profile.id;

  // Debug log to help troubleshoot
  if (profile) {
    console.log('🔍 Profile check:', {
      hasUser: !!user,
      userId: user?.sub,
      profileId: profile.id,
      isOwnProfile,
    });
  }

  // Render profile based on role
  const renderProfileContent = () => {
    switch (profile.role) {
      case "personal_seller":
      case "seller":
        return (
          <SellerProfile
            profile={profile}
            isOwnProfile={!!isOwnProfile}
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
            isOwnProfile={!!isOwnProfile}
            isFollowing={isFollowing}
            onFollow={handleFollow}
            onShare={handleShare}
            onMessage={handleMessage}
            onBack={handleBack}
            isLoggedIn={!!user}
          />
        );

      // Company role removed - using brand profile instead
      case "company":
        return (
          <BrandProfile
            profile={profile}
            isOwnProfile={!!isOwnProfile}
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
            isOwnProfile={!!isOwnProfile}
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

  // Main profile render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile banner removed - showing only profile content */}

      {/* Render the appropriate profile component */}
      {renderProfileContent()}

      {/* Debug info - only in development */}
      {/* Debug section removed */}
    </div>
  );
}
