"use client";

import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  ShoppingCart,
} from "lucide-react";
// Removed Firebase imports - using AWS DynamoDB now
import { useAuthStore } from "@/store/authStoreCognito";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import { useWishlistStore } from "@/store/wishlistStore";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
// Using AWS DynamoDB services
import { getProducts } from "@/lib/hybridProductService";
import optimizedProductService, {
  OptimizedProduct,
  getOptimizedImageUrl,
  preloadProductImages,
} from "@/lib/optimizedProductService";
import performanceService from "@/lib/performanceService";
import performanceMonitor, {
  startTiming,
  endTiming,
  logPerformanceReport,
} from "@/lib/performanceMonitor";
import { useYouTubeLevelPerformance, useRealtimeData, useRecommendations } from "@/hooks/useYouTubeLevelPerformance";
import youtubeLevelPerformanceService from "@/lib/youtubeLevelPerformanceService";
import realtimeDataService from "@/lib/realtimeDataService";
import algorithmOptimizationService from "@/lib/algorithmOptimizationService";
import { useYouTubeLevelSocial, useInstantLoading, useSocialAlgorithm } from "@/hooks/useYouTubeLevelSocial";
import youtubeLevelSocialAlgorithm from "@/lib/youtubeLevelSocialAlgorithm";
import youtubeLevelInstantLoadingService from "@/lib/youtubeLevelInstantLoadingService";
import cloudflareService from "@/lib/cloudflareService";
import { useSocialRecommendations } from "@/hooks/useSocialRecommendations";
// Use AWS DynamoDB for follow/unfollow instead of Firestore
import { getProductPlaceholder, AVATAR_PLACEHOLDER, getProductPlaceholderBySize } from "@/lib/imageUtils";
import { useTheme } from "next-themes";
import { Product as FirebaseProduct } from '@/lib/types'
import { db, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from '@/lib/firestore'

interface Product extends FirebaseProduct {
  sellerRef?: {
    id: string;
    name: string;
    username?: string;
    photoURL?: string;
    followers?: number;
  };
  seller?: {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
    profilePic?: string;
    photoURL?: string;
    isVerified: boolean;
    rating: number;
    followers?: number;
  };
  comments?: number;
  likeCount?: number;
  likesCount?: number;
  viewCount?: number;
  shareCount?: number;
  updatedAt?: Date;
  originalPrice?: number;
  discount?: number;
}

interface CommentSectionProps {
  productId: string;
  isExpanded: boolean;
}

// Product Image Carousel Component
function ProductImageCarousel({ product }: { product: Product }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const images = product.images || [];
  const hasMultipleImages = images.length > 1;

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentImageIndex < images.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    }
    if (isRightSwipe && currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  const goToImage = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  // Desktop: Click on left/right side of image
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasMultipleImages) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // If click is on left 40% of image
    if (x < width * 0.4 && currentImageIndex > 0) {
      e.preventDefault();
      e.stopPropagation();
      setCurrentImageIndex((prev) => prev - 1);
    }
    // If click is on right 40% of image
    else if (x > width * 0.6 && currentImageIndex < images.length - 1) {
      e.preventDefault();
      e.stopPropagation();
      setCurrentImageIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="relative group">
      <Link href={`/product/${product.id}`} className="block relative">
        <div
          className="bg-gray-900 dark:bg-gray-700 rounded-xl m-3 mb-0 aspect-square overflow-hidden relative cursor-pointer"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleImageClick}
        >
          <img
            src={
              images[currentImageIndex] ||
              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE2NS4zIDE1MCAxMzcgMTc4LjMgMTM3IDIxM0MxMzcgMjQ3LjcgMTY1LjMgMjc2IDIwMCAyNzZDMjM0LjcgMjc2IDI2MyAyNDcuNyAyNjMgMjEzQzI2MyAxNzguMyAyMzQuNyAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE1MCAyMDBIMjUwVjI1MEgxNTBWMjAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K"
            }
            alt={product.title}
            className="object-cover w-full h-full transition-all duration-300 pointer-events-none"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-product.jpg";
            }}
          />

          {/* Desktop Click Zones Indicator */}
          {hasMultipleImages && (
            <div className="hidden md:block absolute inset-0 pointer-events-none">
              {/* Left zone hint */}
              {currentImageIndex > 0 && (
                <div className="absolute left-0 top-0 bottom-0 w-[40%] bg-gradient-to-r from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              {/* Right zone hint */}
              {currentImageIndex < images.length - 1 && (
                <div className="absolute right-0 top-0 bottom-0 w-[40%] bg-gradient-to-l from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          )}

          {/* Pagination dots */}
          {hasMultipleImages && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => goToImage(e, index)}
                  className={`h-2 rounded-full transition-all ${index === currentImageIndex
                      ? "bg-white w-6"
                      : "bg-white/60 w-2"
                    }`}
                />
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

function CommentSection({ productId, isExpanded }: CommentSectionProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!isExpanded || !productId) return;

    const commentsRef = collection(db, "products", productId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "desc"), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [isExpanded, productId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || loading) return;

    setLoading(true);
    try {
      const commentsRef = collection(db, "products", productId, "comments");
      await addDoc(commentsRef, {
        text: newComment.trim(),
        authorId: user.sub,
        authorName: user.name || user.email?.split('@')[0] || "Anonymous",
        authorPhoto: user.photoURL || "",
        createdAt: serverTimestamp(),
      });

      // Update comment count on product
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, {
        comments: increment(1),
      });

      setNewComment("");
      toast.success("Comment posted!");
    } catch (error) {
      toast.error("Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  if (!isExpanded) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white border-t border-gray-200"
    >
      {/* Comments List */}
      <div className="max-h-64 overflow-y-auto p-4 space-y-3">
        {comments.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            <p className="text-sm">No comments yet</p>
            <p className="text-xs">Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <img
                src={
                  comment.authorPhoto ||
                  AVATAR_PLACEHOLDER
                }
                alt={comment.authorName}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = AVATAR_PLACEHOLDER;
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-xs text-gray-900 dark:text-white">
                    {comment.authorName}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    {comment.createdAt?.toDate?.()?.toLocaleDateString() ||
                      "Just now"}
                  </span>
                </div>
                <p className="text-gray-800 dark:text-gray-200 text-xs mt-1 break-words">
                  {comment.text}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Input */}
      <form
        onSubmit={handleSubmitComment}
        className="p-4 border-t border-gray-100"
      >
        <div className="flex space-x-3">
          <img
            src={
              user?.photoURL ||
              AVATAR_PLACEHOLDER
            }
            alt="Your profile"
            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              e.currentTarget.src = AVATAR_PLACEHOLDER;
            }}
          />
          <div className="flex-1 flex space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 border border-gray-300 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="bg-purple-600 text-white px-3 py-1.5 rounded-full disabled:opacity-50 hover:bg-purple-700 transition-colors text-sm"
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}

export default function HomePage() {
  // Get user FIRST before using it in other hooks
  const { user, userData, loading: authLoading } = useAuthStore();

  // YouTube-level social media integration
  const {
    socialData,
    isLoading: socialLoading,
    isOptimized: socialOptimized,
    performanceScore: socialScore,
    trackInteraction: trackSocialInteraction,
    getPersonalizedRecommendations,
    optimizePerformance: optimizeSocialPerformance
  } = useYouTubeLevelSocial(user?.sub || 'current-user');

  const { loadingPerformance, preloadResource, instantLoadPage } = useInstantLoading();
  const { trackInteraction: trackAlgorithmInteraction, getPersonalizedFeed } = useSocialAlgorithm(user?.sub || 'current-user');

  // YouTube-level performance integration
  const {
    performanceData,
    isLoading: performanceLoading,
    isOptimized,
    performanceScore,
    optimizePerformance,
    trackInteraction: trackPerformanceInteraction,
    prefetchRoute
  } = useYouTubeLevelPerformance();

  const realtimeData = useRealtimeData();
  const { recommendations: algorithmRecommendations } = useRecommendations(10);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false); // Instant loading - no loading screen
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  // Initialize followingUsers from sessionStorage if available
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('followingUsers');
        if (saved) {
          return new Set(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Error loading followingUsers from sessionStorage:', e);
      }
    }
    return new Set();
  });
  const [pendingLikes, setPendingLikes] = useState<Map<string, string[]>>(new Map()); // Track optimistic likes
  const timeoutRefs = React.useRef<Set<NodeJS.Timeout>>(new Set()); // Track all timeouts for cleanup
  const followingUnsubscribeRef = React.useRef<(() => void) | null>(null); // Track following subscription

  // YouTube-level social media & performance initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('🚀 Initializing YouTube-level social media & performance...');

    // Optimize performance (call once on mount)
    optimizePerformance();
    optimizeSocialPerformance();

    console.log(`📊 Performance Score: ${performanceScore}/100`);
    console.log(`📱 Social Score: ${socialScore}/100`);
    console.log(`⚡ Optimized: ${isOptimized && socialOptimized ? 'Yes' : 'No'}`);

    // Cleanup on unmount
    return () => {
      // Clear all pending timeouts
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
      console.log('🧹 Homepage: Cleaned up all timers and subscriptions');
    };
    // Empty dependency array - run only once on mount to prevent infinite loop
  }, []);

  // Persistent state management to prevent reloading
  useEffect(() => {
    // Restore state from sessionStorage on page load
    const savedProducts = sessionStorage.getItem('homepage_products');

    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
        console.log('🔄 Restored products from sessionStorage');
      } catch (error) {
        console.warn('Failed to restore products from sessionStorage:', error);
      }
    }
  }, []);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (products.length > 0) {
      sessionStorage.setItem('homepage_products', JSON.stringify(products));
    }
  }, [products]);

  // Enhanced interaction tracking with YouTube-level social media & performance
  const trackInteraction = async (productId: string, type: string) => {
    // Track in all services
    trackPerformanceInteraction(productId, type as 'view' | 'like' | 'share' | 'purchase');
    trackSocialInteraction(productId, type as 'view' | 'like' | 'share' | 'comment' | 'purchase' | 'skip');
    trackAlgorithmInteraction(productId, type as 'view' | 'like' | 'share' | 'comment' | 'purchase' | 'skip');

    // Track in legacy services
    algorithmOptimizationService.trackInteraction('current-user', productId, type as 'view' | 'like' | 'share' | 'purchase');
    realtimeDataService.trackProductInteraction(productId, type as 'view' | 'like' | 'share' | 'purchase');

    // Preload related content
    preloadResource(`/api/products/${productId}`, 'important');

    console.log(`📊 Tracked ${type} for product ${productId} across all systems`);
  };
  const { addToCart, getCartItemCount } = useCartStore();
  const router = useRouter();
  const { addToWishlist, removeFromWishlist, isInWishlist, wishlist } =
    useWishlistStore();

  useEffect(() => {
    // Only run on client side to prevent hydration issues
    if (typeof window === "undefined") return;

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Initialize cart and wishlist if user is logged in
    if (user && user.sub) {
      useCartStore.getState().initializeCart(user.sub);
      useWishlistStore.getState().initializeWishlist(user.sub);

      // Load user's following list from Firebase
      const loadFollowingList = async () => {
        try {
          const { subscribeToUserFollowing } = await import("@/lib/firestore");
          followingUnsubscribeRef.current = subscribeToUserFollowing(user.sub, (followingIds) => {
            const followingSet = new Set(followingIds);
            setFollowingUsers(followingSet);
            // Save to sessionStorage for persistence
            if (typeof window !== 'undefined') {
              try {
                sessionStorage.setItem('followingUsers', JSON.stringify(Array.from(followingSet)));
              } catch (e) {
                console.error('Error saving followingUsers to sessionStorage:', e);
              }
            }
          });
        } catch (error) {
          console.error('Error loading following list:', error);
        }
      };

      loadFollowingList();

      return () => {
        if (followingUnsubscribeRef.current) {
          followingUnsubscribeRef.current();
          followingUnsubscribeRef.current = null;
        }
      };
    } else {
      // Clear followingUsers when user logs out
      setFollowingUsers(new Set());
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('followingUsers');
      }
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true; // Track if component is still mounted

    // ✅ ULTRA FAST LOADING with AWS DynamoDB
    console.log('🏠 Homepage: Starting ULTRA FAST AWS DynamoDB load...');
    setLoading(true);
    startTiming("homepage_load");

    // Load products from AWS DynamoDB
    const loadProducts = async () => {
      if (!isMounted) return; // Don't update state if unmounted
      try {
        const { getProducts } = await import('@/lib/hybridProductService');
        const products = await getProducts(
          { status: 'active' },
          'createdAt',
          'desc',
          10
        );

        console.log('🏠 Homepage: Received products from DynamoDB:', products.length);

        // Capture current pending likes state
        setPendingLikes(currentPending => {
          const capturedPendingLikes = new Map(currentPending);

          // INSTANT PROCESSING - Minimal data processing
          if (products.length === 0) {
            console.log('🏠 Homepage: No products found, showing mock data');

            // Minimal mock data
            const mockProducts: Product[] = [
              {
                id: 'mock-1',
                title: 'Welcome Product',
                description: 'Get started with our amazing products',
                price: 99.99,
                originalPrice: 149.99,
                discount: 33,
                images: [getProductPlaceholderBySize(300, 300, false)],
                category: 'Electronics',
                seller: { id: 'mock-seller', name: 'Sample Seller', avatar: '', profilePic: '', isVerified: true, rating: 4.5 },
                rating: 4.5,
                reviewCount: 128,
                likesCount: 45,
                views: 1200,
                stock: 50,
                tags: ['new', 'popular'],
                createdAt: new Date(),
                updatedAt: new Date(),
                sellerId: 'mock-seller',
                sellerName: 'Sample Seller',
                likes: [],
                status: 'active',
                reviewStatus: 'approved'
              }
            ];

            setProducts(mockProducts);
            setLoading(false);
            return currentPending; // Return unchanged
          }

          // FAST PROCESSING - Convert DynamoDB products to Product format
          const productsData: Product[] = products.map((product: any) => {
            const productId = product.id;

            // Check if there are pending likes for this product (don't overwrite optimistic update)
            const pendingLikesForProduct = capturedPendingLikes.get(productId);
            const likesArray = pendingLikesForProduct || product.likes || [];
            const likesCountValue = pendingLikesForProduct ? pendingLikesForProduct.length : (product.likes?.length || product.likeCount || 0);

            const sellerId = product.sellerId || productId;
            const sellerData = product.seller || product.sellerRef || {};
            const followersArray = Array.isArray(sellerData.followers) ? sellerData.followers : [];
            const followersCount = followersArray.length || sellerData.followers || 0;

            return {
              id: productId,
              title: product.title || 'Product',
              description: product.description || '',
              price: product.price || 0,
              originalPrice: product.originalPrice || product.price || 0,
              discount: product.discount || 0,
              images: product.images || [],
              category: product.category || 'General',
              seller: {
                id: sellerId,
                name: sellerData.name || product.sellerName || 'Seller',
                avatar: sellerData.avatar || sellerData.photoURL || product.sellerPhoto || '',
                profilePic: sellerData.profilePic || sellerData.avatar || '',
                isVerified: sellerData.isVerified || false,
                rating: sellerData.rating || product.rating || 0
              },
              rating: product.rating || 0,
              reviewCount: product.reviewCount || 0,
              likes: likesArray, // Use pending likes if available
              likesCount: likesCountValue,
              views: product.views || product.viewCount || 0,
              stock: product.stock || 0,
              tags: product.tags || [],
              status: 'active',
              reviewStatus: 'approved',
              createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
              updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date(),
              sellerId: sellerId,
              sellerName: sellerData.name || product.sellerName || 'Seller',
              sellerRef: {
                id: sellerId,
                name: sellerData.name || product.sellerName || 'Seller',
                photoURL: sellerData.avatar || sellerData.photoURL || product.sellerPhoto || '',
                followers: followersArray,
                followersCount: followersCount,
                isVerified: sellerData.isVerified || false,
                rating: sellerData.rating || product.rating || 0
              }
            } as Product;
          });

          console.log('🏠 Homepage: Processed products from DynamoDB:', productsData.length);

          // INSTANT UPDATE - Merge with existing products to preserve pending likes
          if (!isMounted) return;
          setProducts(prevProducts => {
            return productsData.map(newProduct => {
              // Check if product has pending likes (preserve optimistic update)
              const pendingLikesForProduct = newProduct.id ? capturedPendingLikes.get(newProduct.id) : undefined;
              if (pendingLikesForProduct) {
                return {
                  ...newProduct,
                  likes: pendingLikesForProduct,
                  likesCount: pendingLikesForProduct.length
                };
              }
              // Otherwise, merge with existing product to preserve any local state
              const existingProduct = prevProducts.find(p => p.id === newProduct.id);
              if (existingProduct && existingProduct.likes) {
                return {
                  ...newProduct,
                  likes: existingProduct.likes,
                  likesCount: existingProduct.likes.length || existingProduct.likesCount || newProduct.likesCount
                };
              }
              // Otherwise, use new data from DynamoDB
              return newProduct;
            });
          });
          if (!isMounted) return;
          setLoading(false);

          // Preload only first 4 images for speed
          preloadProductImages(productsData.slice(0, 4) as any);

          endTiming("homepage_load");

          return currentPending; // Return unchanged pending likes
        });
      } catch (error) {
        console.error('🏠 Homepage: DynamoDB error:', error);
        setLoading(false);
      }
    };

    loadProducts();

    // Cleanup function
    return () => {
      isMounted = false;
      console.log('🧹 Homepage: Component unmounting, stopping all operations');
    };
  }, []); // No dependencies for instant loading

  // Handle follow functionality - Using Firebase (Instant)
  const handleFollow = async (sellerId: string, sellerName: string) => {
    if (!user) {
      toast.error("Please login to follow users");
      return;
    }

    if (!sellerId || sellerId.trim() === '') {
      console.error("Invalid seller ID:", sellerId);
      toast.error("Invalid seller information");
      return;
    }

    // Skip follow for mock/test sellers
    if (sellerId === 'mock-seller' || sellerId.startsWith('mock-')) {
      console.log('Skipping follow for mock seller:', sellerId);
      return;
    }

    if (user.sub === sellerId) {
      toast.error("You cannot follow yourself");
      return;
    }

    const isFollowing = followingUsers.has(sellerId);

    try {
      // OPTIMISTIC UPDATE: Update UI immediately before API call
      if (isFollowing) {
        // Unfollow: Remove optimistically
        setFollowingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(sellerId);
          // Save to sessionStorage
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('followingUsers', JSON.stringify(Array.from(newSet)));
            } catch (e) {
              console.error('Error saving to sessionStorage:', e);
            }
          }
          return newSet;
        });

        // Update products list optimistically
        setProducts(prev => prev.map(p => {
          if (p.sellerId === sellerId || p.sellerRef?.id === sellerId) {
            return {
              ...p,
              sellerRef: {
                ...p.sellerRef,
                followers: Math.max(0, (Array.isArray(p.sellerRef?.followers) ? p.sellerRef.followers.length : (p.sellerRef?.followers || 0)) - 1)
              }
            };
          }
          return p;
        }));

        // Firebase unfollow
        const { unfollowUser } = await import("@/lib/firestore");
        await unfollowUser(user.sub, sellerId);
      } else {
        // Follow: Add optimistically
        setFollowingUsers((prev) => {
          const newSet = new Set(prev).add(sellerId);
          // Save to sessionStorage
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem('followingUsers', JSON.stringify(Array.from(newSet)));
            } catch (e) {
              console.error('Error saving to sessionStorage:', e);
            }
          }
          return newSet;
        });

        // Update products list optimistically
        setProducts(prev => prev.map(p => {
          if (p.sellerId === sellerId || p.sellerRef?.id === sellerId) {
            return {
              ...p,
              sellerRef: {
                ...p.sellerRef,
                followers: (Array.isArray(p.sellerRef?.followers) ? p.sellerRef.followers.length : (p.sellerRef?.followers || 0)) + 1
              }
            };
          }
          return p;
        }));

        // Firebase follow
        const { followUser } = await import("@/lib/firestore");
        await followUser(user.sub, sellerId);
      }

      console.log('✅ Follow/unfollow updated in Firebase - Instant like TikTok/Instagram');
    } catch (error: any) {
      console.error("Error following/unfollowing user:", error);
      // Revert optimistic update on error
      if (isFollowing) {
        setFollowingUsers((prev) => new Set(prev).add(sellerId));
      } else {
        setFollowingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(sellerId);
          return newSet;
        });
      }
      const errorMessage = error?.message || "Failed to update follow status";
      toast.error(errorMessage);
    }
  };

  // Recommendations disabled temporarily
  // useEffect(() => {
  //   if (recommendations.length > 0) {
  //     setProducts(filteredProducts);
  //     setLoading(false);
  //   }
  // }, [recommendations]);

  // No loading timeout needed - instant loading

  // Handle like functionality
  const handleLike = async (productId: string) => {
    if (!user) {
      toast.error("Please login to like products");
      return;
    }

    try {
      await toggleProductLike(productId, user.sub);

      // Track for social algorithm
      await trackInteraction(productId, "like");

      toast.success("Like updated!");
    } catch (error) {
      console.error("Firebase update failed:", error);
      toast.error("Failed to update like");
    }
  };

  // Handle save/wishlist functionality
  const handleSave = async (product: Product) => {
    if (!user) {
      toast.error("Please login to save products");
      return;
    }

    const isSaved = isInWishlist(product.id || "");

    try {
      if (isSaved) {
        await removeFromWishlist(product.id || "");
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(product);

        // Track for social algorithm
        await trackInteraction(product.id || "", "save");

        toast.success("Added to wishlist!");
      }
    } catch (error) {
      toast.error("Failed to update wishlist");
    }
  };

  // Handle add to cart
  const handleAddToCart = async (product: Product) => {
    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }

    try {
      await addToCart(product, 1);
      toast.success("Added to cart!");
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  // Handle share functionality
  const handleShare = async (productId: string, productTitle: string) => {
    const url = `${window.location.origin}/product/${productId}`;

    // Track for social algorithm
    await trackInteraction(productId, "share");

    if (navigator.share) {
      try {
        await navigator.share({
          title: productTitle,
          url: url,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  // Handle comment section toggle
  const handleComment = (productId: string) => {
    setExpandedComments(expandedComments === productId ? null : productId);
  };

  // Handle product view tracking
  const handleProductView = async (product: Product) => {
    if (product.id) {
      await trackInteraction(product.id, "view");
    }
  };

  // Loading skeleton for when products are loading
  const ProductSkeleton = () => (
    <div className="glass-strong rounded-3xl overflow-hidden border border-white/50 dark:border-white/10 shadow-premium-lg">
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded w-1/3 animate-pulse mb-1"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded w-1/4 animate-pulse"></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-300 via-gray-200 to-gray-300 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 aspect-square rounded-2xl animate-pulse mb-3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  // Use isClient state to prevent hydration mismatch
  const [isClient, setIsClient] = useState(false);


  // Run once on component mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/20">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#FF6868]/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/10 to-[#A29BFE]/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Mobile Feed Layout - Premium Next Level Style */}
      <div className="md:hidden">
        <div className="w-full space-y-8 pb-20 px-4 pt-4">
          {!isClient || products.length === 0
            ? // Show skeleton while loading from Firebase or during server render
            Array.from({ length: 3 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))
            : products && products.length > 0
              ? products.map((product, index) => {
                return (
                  <React.Fragment key={product.id}>
                    {/* Premium Product Card - Instagram Style Compact */}
                    <motion.div
                      key={product.id}
                      initial={isHydrated ? { opacity: 0, y: 30 } : undefined}
                      animate={isHydrated ? { opacity: 1, y: 0 } : undefined}
                      transition={
                        isHydrated ? { delay: index * 0.08 } : undefined
                      }
                      whileHover={isHydrated ? { scale: 1.01 } : undefined}
                      className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-[#FF6868]/30 transition-all duration-300 shadow-md hover:shadow-xl relative group"
                    >
                      {/* Product Image Area - Instagram Square */}
                      <div className="bg-gray-100 dark:bg-gray-800 aspect-square relative group overflow-hidden">
                        <Link
                          href={`/product/${product.id}`}
                          className="block w-full h-full"
                        >
                          <img
                            src={
                              product.images && product.images[0]
                                ? product.images[0]
                                : getProductPlaceholder(false)
                            }
                            alt={product.title || "Product"}
                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              console.log(
                                "🖼️ Image load error for product:",
                                product.id,
                              );
                              const target = e.target as HTMLImageElement;
                              target.src = getProductPlaceholder(false);
                            }}
                          />
                        </Link>
                      </div>

                      {/* Product Info Section - Instagram Compact */}
                      <div className="p-3 space-y-2">
                        {/* Action Buttons Row - Instagram Style Thumb Icons */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Like Button - Premium Style */}
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!user || !user.sub) {
                                  toast.error("Please login to like products");
                                  return;
                                }
                                if (!product.id || product.id.trim() === '') {
                                  console.error("Invalid product ID for like");
                                  return;
                                }

                                // Get current like state
                                const currentLikes = product.likes || [];
                                const isCurrentlyLiked = currentLikes.includes(user.sub);

                                // INSTANT UPDATE - Optimistic update (update UI immediately)
                                const newLikes = isCurrentlyLiked
                                  ? currentLikes.filter((id: string) => id !== user.sub)
                                  : [...currentLikes, user.sub];

                                // Store pending likes to prevent listener from overwriting
                                setPendingLikes(prev => {
                                  const newMap = new Map(prev);
                                  if (product.id) {
                                    newMap.set(product.id, newLikes);
                                  }
                                  return newMap;
                                });

                                // Update product in state IMMEDIATELY
                                setProducts(prev => prev.map(p =>
                                  p.id === product.id
                                    ? {
                                      ...p,
                                      likes: newLikes,
                                      likesCount: newLikes.length
                                    }
                                    : p
                                ));

                                // Then update Firebase in background
                                try {
                                  if (product.id) {
                                    await toggleProductLike(product.id, user.sub);
                                    await trackInteraction(product.id, "like");
                                  }

                                  // Clear pending likes after successful Firebase update (with delay to ensure listener gets new data)
                                  const timeoutId = setTimeout(() => {
                                    setPendingLikes(prev => {
                                      const newMap = new Map(prev);
                                      if (product.id) {
                                        newMap.delete(product.id);
                                      }
                                      return newMap;
                                    });
                                    timeoutRefs.current.delete(timeoutId);
                                  }, 1000);
                                  timeoutRefs.current.add(timeoutId);
                                } catch (error: any) {
                                  console.error("Like error:", error);
                                  // Remove from pending on error
                                  setPendingLikes(prev => {
                                    const newMap = new Map(prev);
                                    if (product.id) {
                                      newMap.delete(product.id);
                                    }
                                    return newMap;
                                  });
                                  // Revert optimistic update on error
                                  setProducts(prev => prev.map(p =>
                                    p.id === product.id
                                      ? {
                                        ...p,
                                        likes: currentLikes,
                                        likesCount: currentLikes.length
                                      }
                                      : p
                                  ));
                                  toast.error(error?.message || "Failed to update like");
                                }
                              }}
                              className="flex items-center space-x-1 hover:opacity-80 transition-all duration-200 group"
                            >
                              <div className="relative">
                                <svg
                                  className={`w-7 h-7 transition-all duration-300 ${product.likes?.includes(user?.sub || "")
                                      ? "text-[#FF6868] fill-[#FF6868] heartbeat"
                                      : "text-gray-600 dark:text-gray-400"
                                    }`}
                                  fill={product.likes?.includes(user?.sub || "") ? "#FF6868" : "none"}
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                                  />
                                </svg>
                              </div>
                              <span className={`text-sm font-bold ${product.likes?.includes(user?.sub || "")
                                  ? "text-[#FF6868]"
                                  : "text-gray-600 dark:text-gray-300"
                                }`}>
                                {product.likes?.length || product.likesCount || 0}
                              </span>
                            </button>

                            {/* Comment Button - Instagram Style */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!product.id || product.id.trim() === '') {
                                  console.error("Invalid product ID for comment");
                                  return;
                                }
                                handleComment(product.id);
                              }}
                              className="flex items-center space-x-1 hover:opacity-80 transition-all duration-200 group"
                            >
                              <svg
                                className="w-7 h-7 text-gray-600 dark:text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.084 3.528-.24L12 20.25z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375"
                                />
                              </svg>
                              <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                {product.comments || 0}
                              </span>
                            </button>

                            {/* Share Button - Instagram Style */}
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!product.id || product.id.trim() === '') {
                                  console.error("Invalid product ID for share");
                                  return;
                                }
                                const shareUrl = `${window.location.origin}/product/${product.id}`;
                                const shareText = `${product.title}\n\nPrice: $${product.price}\nSeller: ${product.sellerRef?.name || product.sellerName || "Seller"}\n\nCheck it out!`;

                                try {
                                  await trackInteraction(product.id, "share");
                                  if (navigator.share) {
                                    await navigator.share({
                                      title: product.title,
                                      text: shareText,
                                      url: shareUrl,
                                    });
                                  } else {
                                    await navigator.clipboard.writeText(
                                      `${shareText}\n\n${shareUrl}`,
                                    );
                                    toast.success("Link copied to clipboard!");
                                  }
                                } catch (error: any) {
                                  if (error?.name !== 'AbortError') {
                                    console.error("Share error:", error);
                                  }
                                }
                              }}
                              className="hover:opacity-80 transition-all duration-200"
                            >
                              <svg
                                className="w-7 h-7 text-gray-600 dark:text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186z"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Product Name & Price - Instagram Style */}
                        <Link
                          href={`/product/${product.id}`}
                          className="block"
                        >
                          <h3 className="text-gray-900 dark:text-white font-semibold text-sm mb-0.5 line-clamp-2">
                            {product.title || "Product"}
                          </h3>
                        </Link>

                        {/* Price */}
                        <p className="text-gray-900 dark:text-white font-bold text-base">
                          ${product.price?.toFixed(2) || "0.00"}
                        </p>

                        {/* Follow Seller Button - Compact Instagram Style */}
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!user) {
                              toast.error("Please login to follow sellers");
                              return;
                            }
                            const sellerId = product.sellerRef?.id || product.sellerId || "";
                            const sellerName = product.sellerRef?.name || product.sellerName || "Seller";

                            if (!sellerId || sellerId.trim() === '') {
                              console.error("Invalid seller ID for follow");
                              toast.error("Invalid seller information");
                              return;
                            }

                            handleFollow(sellerId, sellerName);
                          }}
                          className={`w-full font-semibold text-xs py-1 rounded-lg transition-all duration-200 ${followingUsers.has(product.sellerRef?.id || product.sellerId || "")
                              ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                              : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm hover:shadow-md border border-gray-300 dark:border-gray-700"
                            }`}
                        >
                          {followingUsers.has(product.sellerRef?.id || product.sellerId || "")
                            ? "Following"
                            : "Follow"}
                        </button>

                        {/* Buy Now & Cart Buttons - Instagram Compact */}
                        <div className="flex items-center space-x-1.5 pt-0.5">
                          {/* Add to Cart Button */}
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!user) {
                                toast.error("Please login to add items to cart");
                                return;
                              }
                              try {
                                await addToCart(product, 1);
                                toast.success("Added to cart!");
                              } catch (error: any) {
                                console.error("Add to cart error:", error);
                                toast.error(error?.message || "Failed to add to cart");
                              }
                            }}
                            className="flex-1 font-semibold text-xs py-1 rounded-lg transition-all duration-200 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm hover:shadow-md border border-gray-300 dark:border-gray-700"
                          >
                            Cart
                          </button>

                          {/* Buy Now Button */}
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!user) {
                                toast.error("Please login to buy products");
                                return;
                              }
                              try {
                                // Add to cart first
                                await addToCart(product, 1);
                                // Navigate to checkout
                                router.push(`/checkout?product=${product.id}`);
                              } catch (error: any) {
                                console.error("Buy now error:", error);
                                toast.error(error?.message || "Failed to proceed to checkout");
                              }
                            }}
                            className="flex-1 font-semibold text-xs py-1 rounded-lg transition-all duration-200 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm hover:shadow-md border border-gray-300 dark:border-gray-700"
                          >
                            Buy Now
                          </button>
                        </div>

                        {/* Comment Section */}
                        <CommentSection
                          productId={product.id || ""}
                          isExpanded={expandedComments === product.id}
                        />
                      </div>
                    </motion.div>
                  </React.Fragment>
                );
              })
              : null}
        </div>
      </div>

      {/* Desktop Grid Layout - Premium Next Level Style */}
      <div className="hidden md:block">
        <div
          className="container mx-auto px-6 pt-12 pb-24"
          style={{ maxWidth: "1200px", minWidth: "1000px" }}
        >
          <div
            className="grid grid-cols-4 gap-6"
            style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
          >
            {products.length === 0
              ? // Show skeleton while loading from Firebase
              Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden"
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800 animate-pulse"></div>
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))
              : products && products.length > 0
                ? products.map((product, index) => {
                  return (
                    <React.Fragment key={product.id}>
                      {/* Premium Product Card - Desktop Instagram Compact */}
                      <motion.div
                        key={product.id}
                        initial={
                          isHydrated ? { opacity: 0, y: 20 } : undefined
                        }
                        animate={
                          isHydrated ? { opacity: 1, y: 0 } : undefined
                        }
                        transition={
                          isHydrated ? { delay: index * 0.05 } : undefined
                        }
                        whileHover={isHydrated ? { scale: 1.01 } : undefined}
                        className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-[#FF6868]/30 transition-all duration-300 shadow-md hover:shadow-xl relative group"
                      >
                        {/* Product Image Area - Instagram Square */}
                        <div className="bg-gray-100 dark:bg-gray-800 aspect-square relative group overflow-hidden">
                          <Link
                            href={`/product/${product.id}`}
                            className="block w-full h-full"
                          >
                            <img
                              src={
                                product.images && product.images[0]
                                  ? product.images[0]
                                  : getProductPlaceholderBySize(300, 300, false)
                              }
                              alt={product.title || "Product"}
                              className="object-cover w-full h-full"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                console.log(
                                  "🖼️ Desktop Image load error for product:",
                                  product.id,
                                );
                                const target = e.target as HTMLImageElement;
                                target.src = getProductPlaceholderBySize(300, 300, false);
                              }}
                            />
                          </Link>
                        </div>

                        {/* Product Info Section - Instagram Compact */}
                        <div className="p-3 space-y-2">
                          {/* Action Buttons Row - Instagram Thumb Icons */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              {/* Like Button - Premium Style */}
                              <button
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (!user || !user.sub) {
                                    toast.error("Please login to like products");
                                    return;
                                  }
                                  if (!product.id || product.id.trim() === '') {
                                    console.error("Invalid product ID for like");
                                    return;
                                  }

                                  // Get current like state
                                  const currentLikes = product.likes || [];
                                  const isCurrentlyLiked = currentLikes.includes(user.sub);

                                  // INSTANT UPDATE - Optimistic update (update UI immediately)
                                  const newLikes = isCurrentlyLiked
                                    ? currentLikes.filter((id: string) => id !== user.sub)
                                    : [...currentLikes, user.sub];

                                  // Store pending likes to prevent listener from overwriting
                                  setPendingLikes(prev => {
                                    const newMap = new Map(prev);
                                    if (product.id) {
                                      newMap.set(product.id, newLikes);
                                    }
                                    return newMap;
                                  });

                                  // Update product in state IMMEDIATELY
                                  setProducts(prev => prev.map(p =>
                                    p.id === product.id
                                      ? {
                                        ...p,
                                        likes: newLikes,
                                        likesCount: newLikes.length
                                      }
                                      : p
                                  ));

                                  // Then update Firebase in background
                                  try {
                                    if (product.id) {
                                      await toggleProductLike(product.id, user.sub);
                                      await trackInteraction(product.id, "like");
                                    }

                                    // Clear pending likes after successful Firebase update (with delay to ensure listener gets new data)
                                    const timeoutId = setTimeout(() => {
                                      setPendingLikes(prev => {
                                        const newMap = new Map(prev);
                                        if (product.id) {
                                          newMap.delete(product.id);
                                        }
                                        return newMap;
                                      });
                                      timeoutRefs.current.delete(timeoutId);
                                    }, 1000);
                                    timeoutRefs.current.add(timeoutId);
                                  } catch (error: any) {
                                    console.error("Like error:", error);
                                    // Remove from pending on error
                                    setPendingLikes(prev => {
                                      const newMap = new Map(prev);
                                      if (product.id) {
                                        newMap.delete(product.id);
                                      }
                                      return newMap;
                                    });
                                    // Revert optimistic update on error
                                    setProducts(prev => prev.map(p =>
                                      p.id === product.id
                                        ? {
                                          ...p,
                                          likes: currentLikes,
                                          likesCount: currentLikes.length
                                        }
                                        : p
                                    ));
                                    toast.error(error?.message || "Failed to update like");
                                  }
                                }}
                                className="flex items-center space-x-2 hover:opacity-100 transition-all duration-300 group ripple-effect relative"
                              >
                                <div className={`relative p-2 rounded-xl transition-all duration-300 ${product.likes?.includes(user?.sub || "")
                                    ? "bg-[#FF6868]/20 group-hover:bg-[#FF6868]/30 shadow-premium-coral"
                                    : "bg-transparent group-hover:bg-[#FF6868]/10 dark:group-hover:bg-[#FF6868]/20"
                                  }`}>
                                  {product.likes?.includes(user?.sub || "") && (
                                    <div className="absolute inset-0 rounded-xl bg-[#FF6868]/20 animate-pulse blur-sm"></div>
                                  )}
                                  <svg
                                    className={`relative w-6 h-6 transition-all duration-300 ${product.likes?.includes(user?.sub || "")
                                        ? "text-[#FF6868] heartbeat"
                                        : "text-gray-600 dark:text-gray-400 group-hover:text-[#FF6868] group-hover:scale-110"
                                      }`}
                                    fill={
                                      product.likes?.includes(user?.sub || "")
                                        ? "#FF6868"
                                        : "none"
                                    }
                                    stroke={
                                      product.likes?.includes(user?.sub || "")
                                        ? "#FF6868"
                                        : "currentColor"
                                    }
                                    strokeWidth={2.5}
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                                    />
                                  </svg>
                                </div>
                                <span className={`text-sm font-bold transition-all duration-300 ${product.likes?.includes(user?.sub || "")
                                    ? "text-[#FF6868] shimmer-text"
                                    : "text-gray-700 dark:text-gray-300"
                                  }`}>
                                  {product.likes?.length || product.likesCount || 0}
                                </span>
                              </button>

                              {/* Comment Button - Premium Style */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (!product.id || product.id.trim() === '') {
                                    console.error("Invalid product ID for comment");
                                    return;
                                  }
                                  handleComment(product.id);
                                }}
                                className="flex items-center space-x-2 hover:opacity-100 transition-all duration-300 group ripple-effect relative"
                              >
                                <div className="p-2 rounded-xl bg-transparent group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 transition-all duration-300">
                                  <svg
                                    className="w-6 h-6 text-gray-600 dark:text-gray-400 transition-all duration-300 group-hover:scale-110 group-hover:text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.084 3.528-.24L12 20.25z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375"
                                    />
                                  </svg>
                                </div>
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors duration-300">
                                  {product.comments || 0}
                                </span>
                              </button>

                              {/* Share Button - Premium Style */}
                              <button
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (!product.id || product.id.trim() === '') {
                                    console.error("Invalid product ID for share");
                                    return;
                                  }
                                  const shareUrl = `${window.location.origin}/product/${product.id}`;
                                  const shareText = `${product.title}\n\nPrice: $${product.price}\nSeller: ${product.sellerRef?.name || product.sellerName || "Seller"}\n\nCheck it out!`;

                                  try {
                                    await trackInteraction(product.id, "share");
                                    if (navigator.share) {
                                      await navigator.share({
                                        title: product.title,
                                        text: shareText,
                                        url: shareUrl,
                                      });
                                    } else {
                                      await navigator.clipboard.writeText(
                                        `${shareText}\n\n${shareUrl}`,
                                      );
                                      toast.success("Link copied to clipboard!");
                                    }
                                  } catch (error: any) {
                                    if (error?.name !== 'AbortError') {
                                      console.error("Share error:", error);
                                    }
                                  }
                                }}
                                className="flex items-center space-x-2 hover:opacity-100 transition-all duration-300 group ripple-effect relative"
                              >
                                <div className="p-2 rounded-xl bg-transparent group-hover:bg-green-500/10 dark:group-hover:bg-green-500/20 transition-all duration-300">
                                  <svg
                                    className="w-6 h-6 text-gray-600 dark:text-gray-400 transition-all duration-300 group-hover:scale-110 group-hover:text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186z"
                                    />
                                  </svg>
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* Product Name */}
                          <Link
                            href={`/product/${product.id}`}
                            className="block"
                          >
                            <h3 className="text-gray-900 dark:text-white font-semibold text-sm mb-1 line-clamp-2">
                              {product.title || "Product"}
                            </h3>
                          </Link>

                          {/* Price */}
                          <p className="text-gray-900 dark:text-white font-bold text-lg">
                            ${product.price?.toFixed(2) || "0.00"}
                          </p>

                          {/* Seller Name */}
                          <p className="text-gray-600 dark:text-gray-400 text-xs">
                            {product.sellerRef?.name || product.sellerName || "Seller"}
                          </p>

                          {/* Follow Seller Button - Premium Coral Color */}
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!user) {
                                toast.error("Please login to follow sellers");
                                return;
                              }
                              const sellerId = product.sellerRef?.id || product.sellerId || "";
                              const sellerName = product.sellerRef?.name || product.sellerName || "Seller";

                              if (!sellerId || sellerId.trim() === '') {
                                console.error("Invalid seller ID for follow");
                                toast.error("Invalid seller information");
                                return;
                              }

                              handleFollow(sellerId, sellerName);
                            }}
                            className={`w-full font-semibold text-xs py-1 rounded-lg transition-all duration-200 ${followingUsers.has(product.sellerRef?.id || product.sellerId || "")
                                ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm hover:shadow-md border border-gray-300 dark:border-gray-700"
                              }`}
                          >
                            {followingUsers.has(product.sellerRef?.id || product.sellerId || "")
                              ? "Following"
                              : "Follow Seller"}
                          </button>

                          {/* Buy Now & Add to Cart Buttons - Premium Style */}
                          <div className="flex items-center space-x-1.5 pt-0.5">
                            {/* Add to Cart Button */}
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!user) {
                                  toast.error("Please login to add items to cart");
                                  return;
                                }
                                try {
                                  await addToCart(product, 1);
                                  toast.success("Added to cart!");
                                } catch (error: any) {
                                  console.error("Add to cart error:", error);
                                  toast.error(error?.message || "Failed to add to cart");
                                }
                              }}
                              className="flex-1 font-semibold text-xs py-1 rounded-lg transition-all duration-200 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm hover:shadow-md border border-gray-300 dark:border-gray-700"
                            >
                              <div className="flex items-center justify-center space-x-1 cart-button-content">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                  />
                                </svg>
                                <span>Cart</span>
                              </div>
                            </button>

                            {/* Buy Now Button */}
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!user) {
                                  toast.error("Please login to buy products");
                                  return;
                                }
                                try {
                                  // Add to cart first
                                  await addToCart(product, 1);
                                  // Navigate to checkout
                                  router.push(`/checkout?product=${product.id}`);
                                } catch (error: any) {
                                  console.error("Buy now error:", error);
                                  toast.error(error?.message || "Failed to proceed to checkout");
                                }
                              }}
                              className="flex-1 font-semibold text-xs py-1 rounded-lg transition-all duration-200 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm hover:shadow-md border border-gray-300 dark:border-gray-700"
                            >
                              Buy Now
                            </button>
                          </div>

                          {/* Comment Section */}
                          <CommentSection
                            productId={product.id || ""}
                            isExpanded={expandedComments === product.id}
                          />
                        </div>
                      </motion.div>
                    </React.Fragment>
                  );
                })
                : null}
          </div>
        </div>
      </div>

    </div>
  );
}

