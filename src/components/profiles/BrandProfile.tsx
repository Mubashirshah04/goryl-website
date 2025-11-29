'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Star,
  MoreHorizontal,
  MessageCircle,
  Share2,
  Camera,
  Edit3,
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  Phone,
  Mail,
  MapPin,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  BarChart3,
  Copy,
  QrCode,
  Flag,
  Shield,
  Download,
  ExternalLink,
  Settings,
  User,
  Heart,
  Bookmark,
} from 'lucide-react';
import { UserProfile } from '@/store/userProfileStore';
import { useUserProductsStore } from '@/store/userProductsStore';
import { useUserReviewsStore } from '@/store/userReviewsStore';
import { UserProduct } from '@/store/userProductsStore';
import { UserReview } from '@/store/userReviewsStore';
import { useGlobalProfileStore } from '@/store/globalProfileStore';
import { clearBlobUrls } from '@/utils/clearBlobUrls';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStoreCognito';
// ✅ AWS DYNAMODB ONLY - Firestore completely removed
import dynamic from 'next/dynamic';

const PublicContentTabs = dynamic(() => import('@/components/profiles/PublicContentTabs'), {
  loading: () => <div className="w-full h-48 bg-gray-200 animate-pulse rounded-lg"></div>,
  ssr: false
});

interface BrandProfileProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollow: () => void;
  onShare: () => void;
  onMessage: () => void;
  onBack?: () => void;
  isLoggedIn?: boolean;
}

export default function BrandProfile({
  profile,
  isOwnProfile,
  isFollowing,
  onFollow,
  onShare,
  onMessage,
  onBack,
  isLoggedIn = true,
}: BrandProfileProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { products, loading: productsLoading, fetchUserProductsRealtime } = useUserProductsStore();
  const { reviews, loading: reviewsLoading, fetchUserReviewsRealtime } = useUserReviewsStore();

  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersType, setFollowersType] = useState<'followers' | 'following'>('followers');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'liked' | 'saved'>('products');

  // Local follow state for instant updates - initialize with database check
  const [localIsFollowing, setLocalIsFollowing] = useState(() => {
    if (!user || !profile || isOwnProfile) return false;
    const isFollowing = profile.followers?.includes(user.sub) || false;
    console.log('🔍 BrandProfile: Initial follow state:', {
      userId: user.sub,
      profileId: profile.id,
      followers: profile.followers,
      isFollowing
    });
    return isFollowing;
  });
  const [localFollowersCount, setLocalFollowersCount] = useState(profile.followers?.length || 0);

  const { profilePicture: globalProfilePicture, bannerImage: globalBannerImage, updateProfilePicture, updateBannerImage, compressImage } = useGlobalProfileStore();

  // Sync local state with props - removed since we calculate from database directly

  // Check follow status from database on mount and when user/profile changes
  useEffect(() => {
    const checkFollowStatus = () => {
      if (!user || !profile || isOwnProfile) return;

      // Check if current user is in the profile's followers array
      const isCurrentlyFollowing = profile.followers?.includes(user.sub) || false;
      console.log('🔍 BrandProfile: Checking follow status:', {
        userId: user.sub,
        profileId: profile.id,
        followers: profile.followers,
        isCurrentlyFollowing
      });

      setLocalIsFollowing(isCurrentlyFollowing);

      // Use actual followers count from database
      const actualFollowersCount = profile.followers?.length || 0;
      setLocalFollowersCount(actualFollowersCount);
    };

    checkFollowStatus();
  }, [user?.sub, profile.id, profile.followers, isOwnProfile]);

  // Instant follow/unfollow function - AWS DynamoDB
  const handleInstantFollow = async () => {
    if (!user) {
      toast.error('Please login to follow');
      return;
    }

    if (isOwnProfile) {
      toast.info('You cannot follow your own profile');
      return;
    }

    try {
      const newFollowingState = !localIsFollowing;
      
      // Update local state immediately - INSTANT
      setLocalIsFollowing(newFollowingState);
      setLocalFollowersCount(prev => newFollowingState ? prev + 1 : Math.max(0, prev - 1));

      // Update AWS DynamoDB in background
      const response = await fetch(`/api/user/follow`, {
        method: newFollowingState ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.sub,
          targetUserId: profile.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update follow status');
      }

      // Show success message
      toast.success(newFollowingState ? 'Following!' : 'Unfollowed');

      // Notify parent component
      if (onFollow) onFollow();
    } catch (error) {
      console.error("Error updating follow status:", error);
      // Revert local state on error
      setLocalIsFollowing(!localIsFollowing);
      setLocalFollowersCount(profile.followers?.length || 0);
      toast.error('Failed to update follow status');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMoreOptions) {
        const target = event.target as Element;
        if (!target.closest('.dropdown-container')) {
          setShowMoreOptions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreOptions]);

  // Only use global store images if this is the user's own profile
  const profilePicture = isOwnProfile ? globalProfilePicture : null;
  const bannerImage = isOwnProfile ? globalBannerImage : null;

  // Use refs to track subscriptions and prevent reloading
  const subscriptionsRef = useRef<{
    products: (() => void) | null;
    reviews: (() => void) | null;
  }>({
    products: null,
    reviews: null
  });

  // Fetch products and reviews for this brand only once when component mounts
  useEffect(() => {
    // Only set up subscriptions if they haven't been set up yet
    if (profile.id && !subscriptionsRef.current.products && !subscriptionsRef.current.reviews) {
      // Set up subscriptions
      subscriptionsRef.current.products = fetchUserProductsRealtime(profile.id);
      subscriptionsRef.current.reviews = fetchUserReviewsRealtime(profile.id);

      // Set image URLs - only set if they exist to avoid 404 errors
      if (profile.coverPhoto) {
        setBannerUrl(profile.coverPhoto);
      } else {
        // Don't set a default banner that doesn't exist
        setBannerUrl('');
      }

      // Try different avatar fields
      const avatarUrl = profile.customPhotoURL || profile.photoURL || profile.profilePic || profile.avatar;
      if (avatarUrl) {
        setLogoUrl(avatarUrl);
      } else {
        // Don't set a default logo that doesn't exist
        setLogoUrl('');
      }
    }

    // Cleanup function
    return () => {
      if (subscriptionsRef.current.products) {
        subscriptionsRef.current.products();
      }
      if (subscriptionsRef.current.reviews) {
        subscriptionsRef.current.reviews();
      }
    };
  }, []); // Empty dependency array ensures this only runs once

  // Calculate real analytics from data
  const calculateAnalytics = () => {
    if (reviews.length === 0) return { averageRating: 0, totalReviews: 0 };
    const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return {
      averageRating: total / reviews.length,
      totalReviews: reviews.length
    };
  };

  const analytics = calculateAnalytics();
  const totalProducts = products?.length || 0;
  const totalSales = profile.totalSales || 0;

  // Ensure consistent followers/following count
  const followersCount = localFollowersCount;
  const followingCount = profile.following?.length || 0;

  // Clear any blob URLs from localStorage on component mount
  useEffect(() => {
    clearBlobUrls();

    // Debug current state
    console.log('BrandProfile mounted with state:', {
      profilePicture,
      bannerImage,
      logoUrl,
      profilePic: profile.profilePic,
      coverPhoto: profile.coverPhoto
    });

    // Check for any blob URLs and clear them immediately
    if (profilePicture && profilePicture.startsWith('blob:')) {
      console.warn('Found blob URL in profilePicture, clearing...');
      if (isOwnProfile) {
        updateProfilePicture('');
      }
    }
    if (bannerImage && bannerImage.startsWith('blob:')) {
      console.warn('Found blob URL in bannerImage, clearing...');
      if (isOwnProfile) {
        updateBannerImage('');
      }
    }
    if (logoUrl && logoUrl.startsWith('blob:')) {
      console.warn('Found blob URL in logoUrl, clearing...');
      setLogoUrl('');
    }
  }, []);

  // Handle more options menu
  const handleMoreOptions = () => {
    setShowMoreOptions(!showMoreOptions);
  };

  const handleOptionClick = async (option: string) => {
    setShowMoreOptions(false);
    switch (option) {
      case 'Edit Profile':
        window.location.href = '/profile/edit';
        break;
      case 'Settings':
        window.location.href = '/settings';
        break;
      case 'Share Profile':
        setShowShareModal(true);
        break;
      case 'Copy Link':
        navigator.clipboard.writeText(window.location.href);
        toast.success('Profile link copied to clipboard!');
        break;
      case 'QR Code':
        setShowShareModal(true);
        break;
      case 'Social Share':
        setShowShareModal(true);
        break;
      case 'Logout':
        const confirmed = await new Promise<boolean>((resolve) => {
          const modal = document.createElement('div');
          modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
          modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Logout</h3>
              <p class="text-gray-600 mb-6">Are you sure you want to logout?</p>
              <div class="flex space-x-3">
                <button id="cancel" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                <button id="confirm" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Logout</button>
              </div>
            </div>
          `;
          document.body.appendChild(modal);

          modal.querySelector('#cancel')?.addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(false);
          });
          modal.querySelector('#confirm')?.addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(true);
          });
        });

        if (confirmed) {
          window.location.href = '/login';
        }
        break;
      case 'Report Brand':
        setShowReportModal(true);
        break;
      case 'Block Brand':
        setShowBlockModal(true);
        break;
      case 'View Profile':
        window.location.href = `/profile/${profile.username || profile.id}`;
        break;
      case 'Follow':
        onFollow();
        break;
      case 'Message':
        onMessage();
        break;
      case 'Bookmark':
        toast.success('Profile bookmarked!');
        break;
      case 'Download QR':
        if (qrCodeUrl) {
          const link = document.createElement('a');
          link.href = qrCodeUrl;
          link.download = `${profile.name}-qr-code.png`;
          link.click();
        }
        break;
    }
  };

  // Generate QR Code
  const generateQRCode = () => {
    const qrCodeData = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`;
    setQrCodeUrl(qrCodeData);
  };

  // Social media sharing
  const shareToSocial = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(`${profile.name}'s Profile`);

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${title} ${url}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  // Report functionality
  const handleReport = (reason: string) => {
    // Here you would typically send the report to your backend
    console.log('Report submitted:', { profileId: profile.id, reason });
    toast.success('Report submitted successfully!');
    setShowReportModal(false);
  };

  // Block functionality
  const handleBlock = () => {
    // Here you would typically send the block request to your backend
    console.log('User blocked:', profile.id);
    toast.success('User blocked successfully!');
    setShowBlockModal(false);
  };

  // Format follower count
  const formatFollowerCount = (count: number | undefined): string => {
    if (!count || typeof count !== 'number') return '0';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Format count for followers/following
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  // Handle followers/following click
  const handleFollowersClick = (type: 'followers' | 'following') => {
    setFollowersType(type);
    setShowFollowersModal(true);
  };

  // Handle edit profile click
  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  // Handle camera click for profile picture
  const handleCameraClick = () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input);

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          // Validate file type
          if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
          }

          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
          }

          try {
            // Get user ID from profile (since we're on own profile)
            const userId = profile?.id;
            if (!userId) {
              toast.error('User ID not found');
              return;
            }
            
            // Upload to AWS S3
            const { uploadFile } = await import('@/lib/firebaseStorage');
            const result = await uploadFile(file, `profile-images/${userId}/${file.name}`);
            
            console.log('✅ Profile picture uploaded to S3:', result.url);
            
            // Automatically save to database
            const { updateUserProfile } = await import('@/lib/awsUserService');
            await updateUserProfile(userId, {
              photoURL: result.url,
              customPhotoURL: result.url
            });
            
            console.log('✅ Profile picture saved to database');
            
            // Update UI
            setLogoUrl(result.url);
            if (isOwnProfile) {
              updateProfilePicture(result.url);
            }
            profile.profilePic = result.url;
            
            toast.success('Profile picture updated successfully!');
          } catch (uploadError) {
            console.error('Upload failed:', uploadError);
            toast.error('Failed to upload profile picture');
          }
        }
        // Clean up
        document.body.removeChild(input);
      };

      input.click();
    } catch (error) {
      console.error('Error opening file picker:', error);
    }
  };

  // Handle camera click for banner
  const handleBannerCameraClick = () => {
    console.log('Banner camera clicked!');
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input);

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          // Validate file type
          if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
          }

          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
          }

          try {
            // Get user ID from profile (since we're on own profile)
            const userId = profile?.id;
            if (!userId) {
              toast.error('User ID not found');
              return;
            }
            
            // Upload to AWS S3
            const { uploadFile } = await import('@/lib/firebaseStorage');
            const result = await uploadFile(file, `banner-images/${userId}/${file.name}`);
            
            console.log('✅ Banner image uploaded to S3:', result.url);
            
            // Automatically save to database
            const { updateUserProfile } = await import('@/lib/awsUserService');
            await updateUserProfile(userId, {
              bannerImage: result.url,
              coverPhoto: result.url
            });
            
            console.log('✅ Banner image saved to database');
            
            // Update UI
            setBannerUrl(result.url);
            if (isOwnProfile) {
              updateBannerImage(result.url);
            }
            profile.coverPhoto = result.url;
            
            toast.success('Banner image updated successfully!');
          } catch (uploadError) {
            console.error('Upload failed:', uploadError);
            toast.error('Failed to upload banner image');
          }
        }
        // Clean up
        document.body.removeChild(input);
      };

      input.click();
    } catch (error) {
      console.error('Error opening file picker:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Cover Photo */}
      <div className="relative h-48 w-full bg-gradient-to-r from-blue-400 to-purple-500">
        {bannerImage || bannerUrl ? (
          <img
            src={bannerImage || bannerUrl}
            alt="Cover Photo"
            className="w-full h-full object-cover"
            onError={(e: any) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500"></div>
        )}


        {/* Banner edit button - only for owner */}
        {isOwnProfile && (
          <div className="absolute bottom-4 right-4 z-20">
            <button
              onClick={handleBannerCameraClick}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 hover:scale-110 transition-all shadow-lg border-2 border-gray-200 cursor-pointer"
              title="Change banner photo"
            >
              <Camera className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        )}
      </div>

      {/* Profile Picture - Overlapping Cover Photo */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="flex justify-start">
          <div className="relative">
            <div className="relative w-32 h-32 rounded-full border-4 border-background overflow-hidden bg-muted">
              {(() => {
                const imageSrc = profilePicture || logoUrl || profile.profilePic || '';

                // Reject blob URLs immediately
                if (imageSrc && imageSrc.startsWith('blob:')) {
                  console.warn('Rejecting blob URL for profile picture:', imageSrc);
                  return <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full" />;
                }

                console.log('Profile picture sources:', {
                  profilePicture,
                  logoUrl,
                  profilePic: profile.profilePic,
                  finalSrc: imageSrc,
                  isBlob: imageSrc.startsWith('blob:'),
                  isData: imageSrc.startsWith('data:')
                });

                return imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Profile Picture"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.error('Image load error for:', imageSrc);
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full" />
                );
              })()}
            </div>
            {isOwnProfile && (
              <button
                onClick={handleCameraClick}
                className="absolute bottom-0 right-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center border-2 border-white hover:bg-gray-700 transition-colors"
              >
                <Camera className="w-4 h-4 text-white dark:text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Name and Bio Section - Below Profile Picture */}
      <div className="px-4 mt-4">
        <div className="flex items-center space-x-2 mb-1">
          <h1 className="text-2xl font-bold text-foreground">{profile.name || 'Brand'}</h1>
          {profile.verified && (
            <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
              <svg className="w-4 h-4 text-white dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        {profile.verified && (
          <p className="text-blue-500 text-sm font-semibold mb-1">✓ Verified Brand</p>
        )}
        {profile.username && (
          <p className="text-muted-foreground text-sm mb-1">@{profile.username}</p>
        )}
        <div className="flex space-x-4 mb-2">
          <button
            onClick={() => handleFollowersClick('followers')}
            className="text-muted-foreground text-sm hover:text-primary transition-colors"
          >
            {formatCount(followersCount)} followers
          </button>
          <button
            onClick={() => handleFollowersClick('following')}
            className="text-muted-foreground text-sm hover:text-primary transition-colors"
          >
            {formatCount(followingCount)} following
          </button>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {profile.bio || profile.about || 'Welcome to my brand! Discover amazing products and connect with our community.'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="px-4 mt-4">
        <div className="flex space-x-2">
          {isOwnProfile ? (
            <>
              <button
                onClick={handleEditProfile}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-blue-600 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit profile</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleInstantFollow}
                className={`flex-1 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${localIsFollowing
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
              >
                {localIsFollowing ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Follow</span>
                  </>
                )}
              </button>
              <button
                onClick={() => onMessage && onMessage(profile.id, profile.name)}
                className="flex-1 bg-accent text-foreground px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-accent/80 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Message</span>
              </button>
            </>
          )}
          <div className="relative dropdown-container">
            <button onClick={handleMoreOptions} className="w-12 h-10 bg-accent text-foreground rounded-lg flex items-center justify-center hover:bg-accent/80 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showMoreOptions && (
              <div className="absolute right-0 top-12 w-56 bg-background border border-border rounded-lg shadow-lg z-50">
                <div className="py-1">
                  {isOwnProfile ? (
                    <>
                      <button
                        onClick={() => handleOptionClick('Edit Profile')}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Profile
                      </button>
                      <button
                        onClick={() => handleOptionClick('Settings')}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <div className="border-t border-border my-1"></div>
                      <button
                        onClick={() => handleOptionClick('Share Profile')}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Share Profile
                      </button>
                      <button
                        onClick={() => handleOptionClick('Copy Link')}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </button>
                      <button
                        onClick={() => handleOptionClick('QR Code')}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        QR Code
                      </button>
                      <div className="border-t border-border my-1"></div>
                      <button
                        onClick={() => handleOptionClick('Logout')}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleOptionClick('Share Profile')}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Share Profile
                      </button>
                      <button
                        onClick={() => handleOptionClick('Copy Link')}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </button>
                      <button
                        onClick={() => handleOptionClick('QR Code')}
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        QR Code
                      </button>
                      <div className="border-t border-border my-1"></div>
                      <button
                        onClick={() => handleOptionClick('Report Brand')}
                        className="w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-2"
                      >
                        <Flag className="w-4 h-4" />
                        Report Brand
                      </button>
                      <button
                        onClick={() => handleOptionClick('Block Brand')}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Block Brand
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Quick Action Buttons for Brand - Only for owner */}
      {isOwnProfile && (
        <div className="px-4 mt-6">
          <div className="grid grid-cols-4 gap-2">
            <Link
              href={`/shop/${profile.id}`}
              className="flex flex-col items-center justify-center p-3 bg-accent rounded-lg hover:bg-accent/80 transition"
            >
              <ShoppingCart className="w-5 h-5 text-blue-600 mb-1" />
              <span className="text-xs text-center text-foreground">Shop</span>
            </Link>
            <Link
              href={`/shop/${profile.id}`}
              className="flex flex-col items-center justify-center p-3 bg-accent rounded-lg hover:bg-accent/80 transition"
            >
              <Package className="w-5 h-5 text-green-600 mb-1" />
              <span className="text-xs text-center text-foreground">Products</span>
            </Link>
            <Link
              href={`/analytics/${profile.id}`}
              className="flex flex-col items-center justify-center p-3 bg-accent rounded-lg hover:bg-accent/80 transition"
            >
              <TrendingUp className="w-5 h-5 text-purple-600 mb-1" />
              <span className="text-xs text-center text-foreground">Analytics</span>
            </Link>
            <Link
              href="/seller/dashboard"
              className="flex flex-col items-center justify-center p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition"
            >
              <BarChart3 className="w-5 h-5 text-white mb-1" />
              <span className="text-xs text-center text-white font-medium">Dashboard</span>
            </Link>
          </div>
        </div>
      )}

      {/* Contact Information */}
      {(profile.phone || profile.email || profile.location || profile.website || profile.socialLinks) && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-semibold mb-3 text-foreground">Contact Information</h2>
          <div className="bg-accent rounded-lg p-4 space-y-3">
            {profile.phone && (
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-muted-foreground mr-3" />
                <span className="text-foreground">{profile.phone}</span>
              </div>
            )}
            {/* Email removed from public view */}
            {profile.location && (
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-muted-foreground mr-3" />
                <span className="text-foreground">{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-muted-foreground mr-3" />
                <span className="text-blue-600">{profile.website}</span>
              </div>
            )}
            {profile.socialLinks && (
              <div className="flex space-x-4 pt-2">
                {profile.socialLinks.instagram && (
                  <a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                    <Instagram className="w-5 h-5 text-pink-500" />
                  </a>
                )}
                {profile.socialLinks.facebook && (
                  <a href={profile.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                    <Facebook className="w-5 h-5 text-blue-600" />
                  </a>
                )}
                {profile.socialLinks.twitter && (
                  <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                    <Twitter className="w-5 h-5 text-blue-400" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reviews Section - Rating and Stats */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-2 text-foreground">Based on Reviews</h2>
        <div className="flex items-center space-x-2">
          <span className="text-3xl font-bold text-foreground">{analytics.averageRating.toFixed(1) || 0}</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${i < Math.round(analytics.averageRating || 0)
                    ? 'text-yellow-400 fill-current'
                    : 'text-muted-foreground'
                  }`}
              />
            ))}
          </div>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          {analytics.totalReviews?.toLocaleString() || 0} customer reviews
        </p>
      </div>

      {/* Business Stats */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-3 text-foreground">Business Stats</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-accent p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-foreground">{totalProducts}</div>
            <div className="text-sm text-muted-foreground">Products</div>
          </div>
          <div className="bg-accent p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-foreground">{analytics.totalReviews}</div>
            <div className="text-sm text-muted-foreground">Reviews</div>
          </div>
          <div className="bg-accent p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-foreground">{analytics.averageRating.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Rating</div>
          </div>
        </div>
      </div>

      {/* Team Management section removed from public view */}

      {/* Quick Info Cards */}
      <div className="px-4 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Email card removed from public view */}
          {/* Phone Card */}
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className="bg-accent p-4 rounded-lg text-center hover:bg-accent/80 transition group"
            >
              <Phone className="w-6 h-6 mx-auto mb-2 text-green-600 group-hover:scale-110 transition" />
              <p className="text-xs font-medium text-foreground">Call</p>
            </a>
          )}
          {/* Location Card */}
          {profile.location && (
            <div className="bg-accent p-4 rounded-lg text-center">
              <MapPin className="w-6 h-6 mx-auto mb-2 text-red-600" />
              <p className="text-xs font-medium truncate text-foreground">{profile.location}</p>
            </div>
          )}
          {/* Website Card */}
          {(profile.businessInfo as any)?.website && (
            <a
              href={(profile.businessInfo as any).website}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent p-4 rounded-lg text-center hover:bg-accent/80 transition group"
            >
              <Globe className="w-6 h-6 mx-auto mb-2 text-purple-600 group-hover:scale-110 transition" />
              <p className="text-xs font-medium text-foreground">Website</p>
            </a>
          )}
        </div>
      </div>

      {/* Most Selling Products */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-semibold mb-3 text-foreground">Most Selling Products</h2>
        {productsLoading ? (
          <p className="text-muted-foreground">Loading products...</p>
        ) : products.filter((p: UserProduct) => (p.sold || 0) > 0).length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {products
              .filter((p: UserProduct) => (p.sold || 0) > 0)
              .sort((a: UserProduct, b: UserProduct) => (b.sold || 0) - (a.sold || 0))
              .slice(0, 4)
              .map((product: UserProduct) => (
                <div
                  key={product.id}
                  className="bg-accent p-3 rounded-lg flex flex-col items-center hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => window.location.href = `/product/${product.id}`}
                >
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={product.images[0] || '/product-placeholder.jpg'}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/product-placeholder.jpg';
                      }}
                    />
                    {/* Sales badge */}
                    <div className="absolute top-1 right-1 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      📦 {product.sold}
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-medium truncate w-full text-center text-foreground">{product.title}</p>
                  <p className="text-xs text-muted-foreground">${product.price}</p>
                  <p className="text-xs text-green-600 font-semibold mt-1">{product.sold} sold</p>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No sold products yet</p>
        )}
      </div>

      {/* Customer Reviews */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-semibold mb-3 text-foreground">Customer Reviews</h2>
        {reviewsLoading ? (
          <p className="text-muted-foreground">Loading reviews...</p>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.slice(0, 3).map((review: UserReview) => (
              <div
                key={review.id}
                className="bg-accent p-4 rounded-lg"
              >
                <div className="flex items-center mb-2">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2 bg-muted">
                    <img
                      src={review.userPhoto || '/default-avatar.png'}
                      alt={review.userName}
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/default-avatar.png';
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{review.userName}</p>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-muted-foreground'
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-foreground">{review.comment}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {review.createdAt instanceof Date
                    ? review.createdAt.toLocaleDateString()
                    : new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No reviews available</p>
        )}
      </div>

      {/* About section removed from public view */}

      {/* Public Content Tabs */}
      <div className="mt-8">
        <PublicContentTabs
          profile={profile}
          isOwnProfile={isOwnProfile}
          isLoggedIn={isLoggedIn}
        />
      </div>

      {/* Followers/Following Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-transparent z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col border border-border">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-foreground font-semibold text-lg">
                {followersType === 'followers' ? 'Followers' : 'Following'}
              </h3>
              <button
                onClick={() => setShowFollowersModal(false)}
                className="p-2 hover:bg-accent rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {followersType === 'followers' ? (
                Array.isArray(profile.followers) && profile.followers.length > 0 ? (
                  <div className="space-y-3">
                    {profile.followers.map((followerId: string, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-accent rounded-lg">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Follower {index + 1}</p>
                          <p className="text-sm text-muted-foreground">@{followerId}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No followers yet</p>
                  </div>
                )
              ) : (
                Array.isArray(profile.following) && profile.following.length > 0 ? (
                  <div className="space-y-3">
                    {profile.following.map((followingId: string, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-accent rounded-lg">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Following {index + 1}</p>
                          <p className="text-sm text-muted-foreground">@{followingId}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Not following anyone yet</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-sm sm:max-w-md shadow-xl border border-gray-200 dark:border-gray-700 text-black dark:text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-black dark:text-white">Share Profile</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-black/70 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* QR Code Section */}
              <div className="text-center">
                <h4 className="text-sm font-medium text-black dark:text-white mb-3">QR Code</h4>
                {qrCodeUrl ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 sm:w-32 sm:h-32" />
                    </div>
                    <button
                      onClick={() => handleOptionClick('Download QR')}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download QR
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={generateQRCode}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium mx-auto"
                  >
                    <QrCode className="w-4 h-4" />
                    Generate QR Code
                  </button>
                )}
              </div>

              {/* Social Media Sharing */}
              <div>
                <h4 className="text-sm font-medium text-black dark:text-white mb-3">Share on Social</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => shareToSocial('twitter')}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </button>
                  <button
                    onClick={() => shareToSocial('facebook')}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </button>
                  <button
                    onClick={() => shareToSocial('whatsapp')}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => shareToSocial('telegram')}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium"
                  >
                    <Share2 className="w-4 h-4" />
                    Telegram
                  </button>
                </div>
              </div>

              {/* Copy Link */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <button
                  onClick={() => handleOptionClick('Copy Link')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <Copy className="w-4 h-4" />
                  Copy Profile Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-sm sm:max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report Brand</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Why are you reporting this brand?</p>
              <div className="space-y-1">
                {[
                  'Spam or fake content',
                  'Inappropriate content',
                  'Harassment or bullying',
                  'Impersonation',
                  'Violence or dangerous content',
                  'Other'
                ].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => handleReport(reason)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-sm sm:max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Block Brand</h3>
              <button
                onClick={() => setShowBlockModal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to block <strong className="text-gray-900 dark:text-white">{profile.name}</strong>?
                  You won't see their content or be able to interact with them.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlock}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Block Brand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
