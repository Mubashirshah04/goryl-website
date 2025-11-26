"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  MoreHorizontal,
  Smile,
  Phone,
  Star,
  ShoppingCart,
  MessageCircle,
  Share2,
  Heart,
  Bookmark,
  Package,
  Users,
  TrendingUp,
  BarChart3,
  Plus,
  X,
  Settings,
  Edit3,
  Trash2,
  Edit,
  Copy,
  QrCode,
  ExternalLink,
  Flag,
} from "lucide-react";
import { UserProfile } from "@/store/userProfileStore";
import { useUserProductsStore } from "@/store/userProductsStore";
import { useUserReviewsStore } from "@/store/userReviewsStore";
import { useUserOrders } from "@/hooks/useUserOrders";
import { useGlobalProfileStore } from "@/store/globalProfileStore";
import { clearBlobUrls } from "@/utils/clearBlobUrls";
import { toast } from "sonner";
import ProfileImage from "@/components/ProfileImage";
import { doc, deleteDoc } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { Film, Eye } from "lucide-react";

interface SellerProfileProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollow: () => void;
  onShare: () => void;
  onMessage: () => void;
  onBack?: () => void;
  isLoggedIn?: boolean;
}

export default function SellerProfile({
  profile,
  isOwnProfile,
  isFollowing,
  onFollow,
  onShare,
  onMessage,
  onBack,
  isLoggedIn = true,
}: SellerProfileProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "products" | "orders" | "followers" | "following"
  >("products");
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersType, setFollowersType] = useState<"followers" | "following">(
    "followers",
  );
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    profilePicture: globalProfilePicture,
    bannerImage: globalBannerImage,
    updateProfilePicture,
    updateBannerImage,
    compressImage,
  } = useGlobalProfileStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMoreOptions(false);
      }
    };

    if (showMoreOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreOptions]);

  // Only use global store images if this is the user's own profile
  const profilePicture = isOwnProfile ? globalProfilePicture : null;
  const bannerImage = isOwnProfile ? globalBannerImage : null;
  const { products, loading: productsLoading } = useUserProductsStore();
  const { reviews, loading: reviewsLoading } = useUserReviewsStore();
  const { orders, loading: ordersLoading } = useUserOrders(profile.id, 5);


  // Delete product function
  const handleDeleteProduct = async (productId: string, productTitle: string) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md mx-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Delete Product</h3>
          <p class="text-gray-600 mb-6">Are you sure you want to delete "${productTitle}"? This action cannot be undone.</p>
          <div class="flex space-x-3">
            <button id="cancel" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
            <button id="confirm" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
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
    
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'products', productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  // Edit product function
  const handleEditProduct = (productId: string) => {
    // Store product data for editing
    const product = products.find(p => p.id === productId);
    if (product) {
      sessionStorage.setItem('editProduct', JSON.stringify(product));
      window.location.href = `/product/upload?edit=${productId}`;
    }
  };

  // Show all products (no filtering needed since everything is published directly)
  const filteredProducts = products;

  // Fetch user products when component mounts
  useEffect(() => {
    if (profile.id) {
      // console.log('🔄 Fetching products for user:', profile.id);
      const unsubscribe = useUserProductsStore
        .getState()
        .fetchUserProductsRealtime(profile.id);
      return unsubscribe;
    }
  }, [profile.id]);

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/profile/${profile.username || profile.id}`
      : "";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success("Profile link copied!");
  };

  const handleMoreOptions = () => {
    setShowMoreOptions(!showMoreOptions);
  };

  const handleOptionClick = async (option: string) => {
    setShowMoreOptions(false);
    switch (option) {
      case 'Edit Profile':
        router.push('/profile/edit');
        break;
      case 'Settings':
        router.push('/settings');
        break;
      case 'Share Profile':
        setShowShareMenu(true);
        break;
      case 'Copy Link':
        handleCopyLink();
        break;
      case 'QR Code':
        setShowShareMenu(true);
        break;
      case 'Logout':
        const confirmed = await new Promise<boolean>((resolve) => {
          const modal = document.createElement('div');
          modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
          modal.innerHTML = `
            <div class="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md mx-4 text-black dark:text-white">
              <h3 class="text-lg font-semibold mb-4">Logout</h3>
              <p class="mb-6">Are you sure you want to logout?</p>
              <div class="flex space-x-3">
                <button id="cancel" class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
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
      case 'Report Seller':
        toast.info('Report feature coming soon!');
        break;
      case 'Block Seller':
        toast.info('Block feature coming soon!');
        break;
    }
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name}'s Profile`,
          text: `Check out ${profile.name}'s profile on Goryl`,
          url: profileUrl,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      handleCopyLink();
    }
  };

  // Clean follower count to remove any strange text
  const cleanFollowerCount = (): number => {
    const followers: any = profile.followers;
    if (typeof followers === "number") return followers;
    if (typeof followers === "string") {
      // Remove the strange text and parse as number
      const cleaned = followers
        .replace(
          /dkjArdF4Q9P4Wx2Nl7nfnt6O5Rn1aNnliXy7QFYKFDwjPfrvDXJkTbm1/g,
          "",
        )
        .trim();
      const parsed = parseInt(cleaned, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    if (Array.isArray(followers)) return followers.length;
    return 0;
  };

  const cleanFollowingCount = (): number => {
    const following: any = profile.following;
    if (typeof following === "number") return following;
    if (Array.isArray(following)) return following.length;
    return 0;
  };

  // Get clean counts
  const followersCount = cleanFollowerCount();
  const followingCount = cleanFollowingCount();

  // Clear any blob URLs from localStorage on component mount
  useEffect(() => {
    clearBlobUrls();

    // Check for any blob URLs and clear them immediately
    if (profilePicture && profilePicture.startsWith("blob:")) {
      console.warn("Found blob URL in profilePicture, clearing...");
      if (isOwnProfile) {
        updateProfilePicture("");
      }
    }
    if (bannerImage && bannerImage.startsWith("blob:")) {
      console.warn("Found blob URL in bannerImage, clearing...");
      if (isOwnProfile) {
        updateBannerImage("");
      }
    }
  }, []);

  const handleFollowersClick = (type: "followers" | "following") => {
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
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.style.display = "none";
      document.body.appendChild(input);

      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          // Validate file type
          if (!file.type.startsWith("image/")) {
            toast.error("Please select a valid image file");
            return;
          }

          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
          }

          // Compress image before storing to avoid localStorage quota issues
          compressImage(file, 100)
            .then((compressedDataURL) => {
              console.log(
                "Compressed profile picture:",
                compressedDataURL.substring(0, 50) + "...",
              );

              // Only update global store if this is the user's own profile
              if (isOwnProfile) {
                updateProfilePicture(compressedDataURL);
              }

              // Update profile picture in the profile object
              profile.profilePic = compressedDataURL;
            })
            .catch((error) => {
              console.error("Failed to compress image:", error);
              toast.error("Failed to process image");
            });

          console.log("Profile picture selected:", file);
          toast.success("Profile picture updated!");
        }
        // Clean up
        document.body.removeChild(input);
      };

      input.click();
    } catch (error) {
      console.error("Error opening file picker:", error);
      toast.error("Error opening file picker");
    }
  };

  // Handle camera click for banner
  const handleBannerCameraClick = () => {
    console.log("Banner camera clicked!");
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.style.display = "none";
      document.body.appendChild(input);

      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          // Validate file type
          if (!file.type.startsWith("image/")) {
            toast.error("Please select a valid image file");
            return;
          }

          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
          }

          // Compress image before storing to avoid localStorage quota issues
          compressImage(file, 100)
            .then((compressedDataURL) => {
              console.log(
                "Compressed banner image:",
                compressedDataURL.substring(0, 50) + "...",
              );

              // Only update global store if this is the user's own profile
              if (isOwnProfile) {
                updateBannerImage(compressedDataURL);
              }

              // Update cover photo in the profile object
              profile.coverPhoto = compressedDataURL;
            })
            .catch((error) => {
              console.error("Failed to compress image:", error);
              toast.error("Failed to process image");
            });

          console.log("Banner selected:", file);
          toast.success("Banner updated!");
        }
        // Clean up
        document.body.removeChild(input);
      };

      input.click();
    } catch (error) {
      console.error("Error opening file picker:", error);
      toast.error("Error opening file picker");
    }
  };

  // Format count for followers/following
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Cover Photo */}
      <div className="relative h-48 w-full bg-gradient-to-r from-blue-400 to-purple-500">
        {bannerImage || profile.coverPhoto ? (
          <img
            src={bannerImage || profile.coverPhoto}
            alt="Cover Photo"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500"></div>
        )}


        {/* Banner Camera Button - Always visible for testing */}
        <div className="absolute bottom-4 right-4 z-20">
        {/* Banner Edit Button - Only for own profile */}
        {isOwnProfile && (
          <button
            onClick={handleBannerCameraClick}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 hover:scale-110 transition-all shadow-lg border-2 border-gray-200 cursor-pointer"
            title="Change banner photo"
          >
            <Camera className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        )}
        </div>
      </div>

      {/* Share Menu Dropdown */}
      {showShareMenu && (
        <>
          {/* Background overlay for click outside to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowShareMenu(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div 
              className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden w-64 sm:w-72 mx-4 pointer-events-auto text-black dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Close Button */}
              <div className="flex justify-between items-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-black dark:text-white">
                  Share Profile
                </h3>
                <button
                  onClick={() => setShowShareMenu(false)}
                  className="w-6 h-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-black/70 dark:text-gray-400" />
                </button>
              </div>

              {/* QR Code Section */}
              <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
                <div className="flex justify-center mb-2">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg">
                    <img
                      src={qrCodeUrl}
                      alt="Profile QR Code"
                      className="w-20 h-20 sm:w-24 sm:h-24"
                    />
                  </div>
                </div>
                <p className="text-xs text-black/80 dark:text-gray-300 text-center">
                  Scan to view profile
                </p>
              </div>

              {/* Share Options */}
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    handleCopyLink();
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center space-x-2 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Share2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-xs text-black dark:text-white">
                      Copy Link
                    </p>
                    <p className="text-xs text-black/70 dark:text-gray-400">
                      Share profile URL
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    handleShareNative();
                    setShowShareMenu(false);
                  }}
                  className="w-full flex items-center space-x-2 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Share2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-xs text-black dark:text-white">
                      Share
                    </p>
                    <p className="text-xs text-black/70 dark:text-gray-400">
                      Share via apps
                    </p>
                  </div>
                </button>

                <div className="pt-1 border-t border-gray-200 dark:border-gray-700">
                  <div className="px-2 py-1">
                    <p className="text-xs text-black/70 dark:text-gray-400 mb-1">
                      Profile URL
                    </p>
                    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1">
                      <input
                        type="text"
                        value={profileUrl}
                        readOnly
                        className="flex-1 bg-transparent text-xs text-black dark:text-gray-300 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Profile Picture - Overlapping Cover Photo */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="flex justify-start">
          <div className="relative">
            <div className="relative w-32 h-32 rounded-full border-4 border-background overflow-hidden bg-muted">
              {(() => {
                const imageSrc = profilePicture || profile.profilePic;

                // Reject blob URLs immediately
                if (imageSrc && imageSrc.startsWith("blob:")) {
                  console.warn(
                    "Rejecting blob URL for profile picture:",
                    imageSrc,
                  );
                  return (
                    <ProfileImage
                      user={profile}
                      size={128}
                      className="rounded-full object-cover w-full h-full"
                    />
                  );
                }

                return imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="Profile Picture"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.error("Image load error for:", imageSrc);
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <ProfileImage
                    user={profile}
                    size={128}
                    className="rounded-full object-cover w-full h-full"
                  />
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
          <h1 className="text-2xl font-bold text-foreground">
            {profile.name || "User"}
          </h1>
          {profile.verified && (
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white dark:text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>
        {profile.verified && (
          <p className="text-blue-500 text-sm font-semibold mb-1">
            ✓ Verified Seller
          </p>
        )}
        {profile.username && (
          <p className="text-muted-foreground text-sm mb-1">
            @{profile.username}
          </p>
        )}
        <div className="flex space-x-4 mb-2">
          <button
            onClick={() => handleFollowersClick("followers")}
            className="text-muted-foreground text-sm hover:text-primary transition-colors"
          >
            {formatCount(followersCount)} followers
          </button>
          <button
            onClick={() => handleFollowersClick("following")}
            className="text-muted-foreground text-sm hover:text-primary transition-colors"
          >
            {formatCount(followingCount)} following
          </button>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {profile.bio ||
            profile.about ||
            "Personal Shopping Assistant - Helping you find the best products!"}
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
                onClick={() => onFollow && onFollow()}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 hover:bg-blue-600 transition-colors"
              >
                {isFollowing ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    <span>Follow</span>
                  </>
                )}
              </button>
            </>
          )}
          <div className="relative dropdown-container" ref={dropdownRef}>
            <button 
              onClick={handleMoreOptions} 
              className="w-12 h-10 bg-accent text-foreground rounded-lg flex items-center justify-center hover:bg-accent/80 transition-colors"
            >
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
                        className="w-full px-4 py-2 text-left text-sm text-black dark:text-white hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit Profile
                      </button>
                      <button
                        onClick={() => handleOptionClick('Settings')}
                        className="w-full px-4 py-2 text-left text-sm text-black dark:text-white hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <div className="border-t border-border my-1"></div>
                      <button
                        onClick={() => handleOptionClick('Share Profile')}
                        className="w-full px-4 py-2 text-left text-sm text-black dark:text-white hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Share Profile
                      </button>
                      <button
                        onClick={() => handleOptionClick('Copy Link')}
                        className="w-full px-4 py-2 text-left text-sm text-black dark:text-white hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </button>
                      <button
                        onClick={() => handleOptionClick('QR Code')}
                        className="w-full px-4 py-2 text-left text-sm text-black dark:text-white hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        QR Code
                      </button>
                      <div className="border-t border-border my-1"></div>
                      <button
                        onClick={() => handleOptionClick('Logout')}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleOptionClick('Share Profile')}
                        className="w-full px-4 py-2 text-left text-sm text-black dark:text-white hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Share Profile
                      </button>
                      <button
                        onClick={() => handleOptionClick('Copy Link')}
                        className="w-full px-4 py-2 text-left text-sm text-black dark:text-white hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </button>
                      <button
                        onClick={() => handleOptionClick('QR Code')}
                        className="w-full px-4 py-2 text-left text-sm text-black dark:text-white hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        QR Code
                      </button>
                      <div className="border-t border-border my-1"></div>
                      <button
                        onClick={() => handleOptionClick('Report Seller')}
                        className="w-full px-4 py-2 text-left text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-2"
                      >
                        <Flag className="w-4 h-4" />
                        Report Seller
                      </button>
                      <button
                        onClick={() => handleOptionClick('Block Seller')}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Block Seller
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="px-4 py-6">
        {/* Seller Stats */}
        <div className="mt-6 px-4">
          <div className="grid grid-cols-3 gap-4 bg-accent rounded-lg p-4">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {products?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Products</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {profile.totalSales?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-muted-foreground">Sales</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">
                {(reviews?.length
                  ? reviews.reduce(
                      (sum, review) => sum + (review.rating || 0),
                      0,
                    ) / reviews.length
                  : 0
                ).toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">Rating</div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons for Seller */}
        {isOwnProfile && (
          <div className="px-4 mt-6">
            <div className="grid grid-cols-4 gap-2">
              <Link
                href={`/shop/${profile.id}`}
                className="flex flex-col items-center justify-center p-3 bg-accent rounded-lg hover:bg-accent/80 transition"
              >
                <ShoppingCart className="w-5 h-5 text-blue-600 mb-1" />
                <span className="text-xs text-center text-foreground">
                  Shop
                </span>
              </Link>
              <Link
                href="/product/upload"
                className="flex flex-col items-center justify-center p-3 bg-accent rounded-lg hover:bg-accent/80 transition"
              >
                <Package className="w-5 h-5 text-green-600 mb-1" />
                <span className="text-xs text-center text-foreground">
                  Add Product
                </span>
              </Link>
              <Link
                href={`/shop/${profile.id}`}
                className="flex flex-col items-center justify-center p-3 bg-accent rounded-lg hover:bg-accent/80 transition"
              >
                <TrendingUp className="w-5 h-5 text-purple-600 mb-1" />
                <span className="text-xs text-center text-foreground">
                  Analytics
                </span>
              </Link>
              <Link
                href="/seller/dashboard"
                className="flex flex-col items-center justify-center p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition"
              >
                <BarChart3 className="w-5 h-5 text-white mb-1" />
                <span className="text-xs text-center text-white font-medium">
                  Dashboard
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* Additional Action Buttons for Non-Own Profile */}
        {!isOwnProfile && (
          <div className="flex justify-center space-x-4 mt-8 px-4">
            <button
              onClick={onMessage}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Message</span>
            </button>
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center space-x-2 px-6 py-3 border border-border text-foreground rounded-lg font-medium"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>
        )}

        {/* Tabs for Content */}
        <div className="border-t border-border mt-8 pt-6">
          <nav className="flex space-x-8 mb-6 px-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab("products")}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "products"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Products ({products.length})
            </button>
            {/* Orders tab - Only visible to profile owner */}
            {isOwnProfile && (
              <>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "orders"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Orders
                </button>
              </>
            )}
          </nav>

          {/* Tab Content */}
          <div className="px-4">

            {activeTab === "products" && (
              <div>

                {productsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredProducts.map((product: any) => (
                      <div
                        key={product.id}
                        className="bg-accent rounded-lg overflow-hidden hover:bg-accent/80 transition relative group"
                      >
                        <Link href={`/product/${product.id}`} className="block">
                          <div className="aspect-square relative">
                            <img
                              src={
                                product.images?.[0] ||
                                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=="
                              }
                              alt={product.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                              }}
                            />
                            {/* Views - Always visible at bottom */}
                            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm z-10">
                              <Eye className="w-3 h-3" />
                              <span>{product.viewCount ?? product.views ?? 0}</span>
                            </div>
                            
                            {/* Edit/Delete buttons - only show for own profile */}
                            {isOwnProfile && (
                              <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleEditProduct(product.id);
                                  }}
                                  className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full transition-colors"
                                  title="Edit Product"
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDeleteProduct(product.id, product.title);
                                  }}
                                  className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                                  title="Delete Product"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <h3 className="text-foreground text-xs font-medium truncate">
                              {product.title}
                            </h3>
                            <p className="text-blue-600 text-xs font-bold mt-1">
                              ${product.price}
                            </p>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">
                      {isOwnProfile ? "No products yet" : "No products yet"}
                    </p>
                    {isOwnProfile && (
                      <Link
                        href="/product/upload"
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Product</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab Content - Only visible to profile owner */}
            {isOwnProfile && activeTab === "orders" && (
              <div>
                {ordersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.map((order: any) => (
                      <div key={order.id} className="bg-accent rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-foreground font-medium">
                              Order #{order.id.slice(0, 8)}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {new Date(
                                order.createdAt?.toDate(),
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              order.status === "delivered"
                                ? "bg-green-100 text-green-800"
                                : order.status === "shipped"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className="text-blue-600 font-bold">
                          ${order.total}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No orders yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Saved tab removed */}

            {activeTab === "followers" && (
              <div>
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {cleanFollowerCount()} followers
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Followers/Following Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-transparent z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col border border-border">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-foreground font-semibold text-lg">
                {followersType === "followers" ? "Followers" : "Following"}
              </h3>
              <button
                onClick={() => setShowFollowersModal(false)}
                className="p-2 hover:bg-accent rounded-full transition"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {followersType === "followers" ? (
                Array.isArray(profile.followers) &&
                profile.followers.length > 0 ? (
                  <div className="space-y-3">
                    {profile.followers.map(
                      (followerId: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center space-x-3 p-3 bg-accent rounded-lg"
                        >
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-foreground font-medium">
                              User {index + 1}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              @user{index + 1}
                            </p>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No followers yet</p>
                  </div>
                )
              ) : Array.isArray(profile.following) &&
                profile.following.length > 0 ? (
                <div className="space-y-3">
                  {profile.following.map(
                    (followingId: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-accent rounded-lg"
                      >
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-foreground font-medium">
                            User {index + 1}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            @user{index + 1}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Not following anyone yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
