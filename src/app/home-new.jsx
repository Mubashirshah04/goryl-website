'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Check, Star, MoreVertical, Flag, Share, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import { useCustomSession } from '@/hooks/useCustomSession';
import { useCartStore } from '@/store/cartStore';
import { getOptimizedProducts } from '@/lib/optimizedProductService';
import { getValidImageUrl } from '@/lib/imageValidator';
import { getUserProfile } from '@/lib/awsUserService';
import CommentDialog from '@/components/CommentDialog';
import { getPersonalizedFeed, trackProductInteraction, updateUserPreferences } from '@/lib/youtubeAlgorithm';

// ✅ YouTube-style skeleton loader
const ProductSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-200 dark:bg-gray-700"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="flex gap-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-8"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-8"></div>
      </div>
    </div>
  </div>
);

export default function HomeNew() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [likedProducts, setLikedProducts] = useState(new Set());
  const [savedProducts, setSavedProducts] = useState(new Set());
  const [showSkeletons, setShowSkeletons] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingRef = useRef(false);
  const observerRef = useRef(null);
  
  const { session: authUser } = useCustomSession();
  const { addToCart } = useCartStore();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // ✅ INSTANT LOAD - Show cached products immediately (no delay)
  useEffect(() => {
    const cachedProducts = sessionStorage.getItem('homepage_products_cache');
    if (cachedProducts) {
      try {
        const products = JSON.parse(cachedProducts);
        setProducts(products);
        setShowSkeletons(false);
        console.log('⚡ Loaded cached products instantly:', products.length);
        return; // Don't show skeletons if cache exists
      } catch (e) {
        console.error('Cache parse error:', e);
      }
    }
    // Only show skeletons if no cache
    setShowSkeletons(true);
  }, []);

  // Fetch user's liked and saved products (background)
  useEffect(() => {
    if (!authUser?.userId) return;

    const fetchLikedAndSaved = async () => {
      try {
        // Fetch liked products
        const likedRes = await fetch(`/api/user/liked-saved?userId=${authUser.userId}&type=liked`);
        if (likedRes.ok) {
          const likedData = await likedRes.json();
          const likedIds = new Set(likedData.items?.map(item => item.productId) || []);
          setLikedProducts(likedIds);
          console.log('❤️ Loaded liked products:', likedIds.size);
        }

        // Fetch saved products
        const savedRes = await fetch(`/api/user/liked-saved?userId=${authUser.userId}&type=saved`);
        if (savedRes.ok) {
          const savedData = await savedRes.json();
          const savedIds = new Set(savedData.items?.map(item => item.productId) || []);
          setSavedProducts(savedIds);
          console.log('📌 Loaded saved products:', savedIds.size);
        }
      } catch (error) {
        console.error('Error fetching liked/saved products:', error);
      }
    };

    fetchLikedAndSaved();
  }, [authUser?.userId]);

  // ✅ REAL-TIME AWS LOAD + YOUTUBE ALGORITHM - Load once, don't reshuffle
  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    const loadProducts = async () => {
      try {
        const allProducts = await getOptimizedProducts();
        console.log('📦 Loaded products from AWS:', allProducts.length);
        
        // ✅ Apply YouTube algorithm for personalization
        const userHasInteractions = likedProducts.size > 0 || savedProducts.size > 0;
        const personalizedProducts = getPersonalizedFeed(allProducts, 12, userHasInteractions);
        
        console.log('🎯 Personalized feed:', personalizedProducts.length);
        setProducts(personalizedProducts);
        setShowSkeletons(false);
        
        // ✅ Cache for instant next load
        sessionStorage.setItem('homepage_products_cache', JSON.stringify(personalizedProducts));
      } catch (error) {
        console.error('Error loading products:', error);
        setShowSkeletons(false);
      }
    };

    loadProducts();

    // ✅ Only refresh if user has interactions (engagement-based)
    // Don't reshuffle products if user hasn't interacted
    const interval = setInterval(() => {
      if (likedProducts.size > 0 || savedProducts.size > 0) {
        console.log('🔄 Refreshing feed based on user interactions...');
        loadProducts();
      }
    }, 30000); // Refresh every 30 seconds only if user engaged

    return () => clearInterval(interval);
  }, []);

  // ✅ INFINITE SCROLL - Load more products when scrolling down
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && products.length > 0) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  // ✅ Load more products for infinite scroll
  const loadMoreProducts = async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const data = await getOptimizedProducts();
      if (data.length > 0) {
        setProducts(prev => {
          // Only add products that aren't already in the list
          const existingIds = new Set(prev.map(p => p.id));
          const newUniqueProducts = data.filter(p => !existingIds.has(p.id));
          
          if (newUniqueProducts.length === 0) {
            setHasMore(false);
            return prev;
          }
          
          const combined = [...prev, ...newUniqueProducts];
          sessionStorage.setItem('homepage_products_cache', JSON.stringify(combined));
          return combined;
        });
        console.log('📦 Loaded more products:', data.length);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLike = async (productId) => {
    if (!authUser) {
      console.warn('❌ Like: No user logged in', { authUser });
      toast.error('Please login to like products');
      return;
    }
    try {
      // ✅ Track interaction for YouTube algorithm
      trackProductInteraction(productId, 'like');
      
      // ✅ Update preferences based on product
      const product = products.find(p => p.id === productId);
      if (product) {
        updateUserPreferences(product, 'like');
      }
      
      console.log('❤️ Like: Starting like action for user:', authUser.userId, 'product:', productId);
      const payload = {
        userId: authUser.userId,
        productId: productId,
        itemType: 'product'
      };
      console.log('📤 Like: Sending payload:', payload);
      
      const response = await fetch('/api/products/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log('📥 Like: Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Like: Success response:', data);
        
        // Update local state
        const newLikedProducts = new Set(likedProducts);
        if (data.liked) {
          newLikedProducts.add(productId);
          toast.success('❤️ Liked!');
        } else {
          newLikedProducts.delete(productId);
          toast.success('🤍 Unliked');
        }
        setLikedProducts(newLikedProducts);
        
        // Refresh products to show updated like count
        console.log('🔄 Like: Refreshing products...');
        const updatedProducts = await getOptimizedProducts();
        setProducts(updatedProducts);
      } else {
        const errorData = await response.json();
        console.error('❌ Like: API error:', errorData);
        toast.error(errorData.error || 'Failed to update like');
      }
    } catch (error) {
      console.error('❌ Like: Exception occurred:', error);
      toast.error('Failed to update like');
    }
  };

  const handleComment = (productId) => {
    if (!authUser) {
      console.warn('❌ Comment: No user logged in', { authUser });
      toast.error('Please login to comment');
      return;
    }
    // Open comment modal
    console.log('💬 Comment: Opening comment dialog for product:', productId);
    setSelectedProductId(productId);
    setCommentModalOpen(true);
  };

  const handleShare = (productId, title) => {
    const url = `${window.location.origin}/product/${productId}`;
    if (navigator.share) {
      navigator.share({ title, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  const handleFollow = async (sellerId, sellerName) => {
    if (!authUser) {
      console.warn('❌ Follow: No user logged in', { authUser });
      toast.error('Please login to follow');
      return;
    }
    try {
      console.log('👥 Follow: Starting follow action', { userId: authUser.userId, targetUserId: sellerId });
      const response = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser.userId,
          targetUserId: sellerId
        })
      });
      
      const data = await response.json();
      console.log('👥 Follow response:', { status: response.status, data });
      
      if (response.ok) {
        toast.success(`Following ${sellerName}!`);
      } else {
        console.error('❌ Follow error:', data.error);
        toast.error(data.error || 'Failed to follow');
      }
    } catch (error) {
      console.error('Error following:', error);
      toast.error('Failed to follow');
    }
  };

  const handleSave = async (productId) => {
    if (!authUser) {
      console.warn('❌ Save: No user logged in');
      toast.error('Please login to save products');
      return;
    }
    try {
      // ✅ Track interaction for YouTube algorithm
      trackProductInteraction(productId, 'save');
      
      // ✅ Update preferences based on product
      const product = products.find(p => p.id === productId);
      if (product) {
        updateUserPreferences(product, 'save');
      }
      
      console.log('📌 Save: Starting save action for product:', productId);
      const response = await fetch('/api/products/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authUser.userId,
          productId: productId,
          itemType: 'product'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Save: Success response:', data);
        
        // Update local state
        const newSavedProducts = new Set(savedProducts);
        if (data.saved) {
          newSavedProducts.add(productId);
          toast.success('📌 Saved!');
        } else {
          newSavedProducts.delete(productId);
          toast.success('Removed from saved');
        }
        setSavedProducts(newSavedProducts);
      } else {
        const errorData = await response.json();
        console.error('❌ Save: API error:', errorData);
        toast.error(errorData.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('❌ Save: Exception occurred:', error);
      toast.error('Failed to save product');
    }
  };

  const handleAddToCart = (product) => {
    if (!authUser) {
      console.warn('❌ Cart: No user logged in', { authUser });
      toast.error('Please login');
      return;
    }
    
    // ✅ Track interaction for YouTube algorithm
    trackProductInteraction(product.id, 'add_to_cart');
    updateUserPreferences(product, 'add_to_cart');
    
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      images: [product.images?.[0]],
      stock: product.stock,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
    });
    toast.success('Added to cart!');
  };

  // ✅ Show skeletons while loading, not a loading screen
  if (showSkeletons && products.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={isHydrated ? { opacity: 0, y: 20 } : undefined}
              animate={isHydrated ? { opacity: 1, y: 0 } : undefined}
              transition={isHydrated ? { delay: index * 0.05 } : undefined}
            >
              <ProductCard
                product={product}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
                onFollow={handleFollow}
                onAddToCart={handleAddToCart}
                likedProducts={likedProducts}
                savedProducts={savedProducts}
                onSave={handleSave}
              />
            </motion.div>
          ))}
        </div>

        {/* Infinite Scroll Observer */}
        <div ref={observerRef} className="py-8 flex justify-center">
          {isLoadingMore && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Loading more...</span>
            </div>
          )}
          {!hasMore && products.length > 0 && (
            <p className="text-gray-500 dark:text-gray-400">No more products</p>
          )}
        </div>

        {products.length === 0 && !showSkeletons && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <p className="text-gray-600 dark:text-gray-400">No products available</p>
          </div>
        )}
      </div>

      {/* Comment Dialog Modal */}
      <CommentDialog
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        productId={selectedProductId}
      />
    </div>
  );
}

function ProductCard({ product, onLike, onComment, onShare, onFollow, onAddToCart, likedProducts, savedProducts, onSave }) {
  const [sellerProfile, setSellerProfile] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [soldCount, setSoldCount] = useState(null);
  const { session: authUser } = useCustomSession();
  
  // Update local state when likedProducts/savedProducts changes
  useEffect(() => {
    setIsLiked(likedProducts?.has(product.id) || false);
    setIsSaved(savedProducts?.has(product.id) || false);
  }, [likedProducts, savedProducts, product.id]);

  // Fetch real sold count from orders
  useEffect(() => {
    const fetchSoldCount = async () => {
      try {
        const response = await fetch(`/api/products/${product.id}/sold-count`);
        if (response.ok) {
          const data = await response.json();
          setSoldCount(data.sold);
        }
      } catch (error) {
        console.error('Error fetching sold count:', error);
      }
    };
    fetchSoldCount();
  }, [product.id]);
  
  const likedByCount = product.likeCount || 0;
  const hasDiscount = product.discount && product.discount > 0;
  const isVerified = product.verified;
  const originalPrice = hasDiscount ? Math.round(product.price / (1 - product.discount / 100)) : product.price;

  // Fetch seller profile to get their picture
  useEffect(() => {
    setImageError(false); // Reset error state when product changes
    if (product.sellerId) {
      getUserProfile(product.sellerId)
        .then(profile => {
          if (profile) {
            console.log('✅ Seller profile loaded:', {
              sellerId: product.sellerId,
              customPhotoURL: profile.customPhotoURL,
              photoURL: profile.photoURL,
              profilePic: profile.profilePic,
              avatar: profile.avatar
            });
            setSellerProfile(profile);
          }
        })
        .catch(err => console.error('❌ Could not fetch seller profile:', err));
    }
  }, [product.sellerId]);

  // Get seller avatar from profile or product
  const sellerAvatar = sellerProfile?.customPhotoURL || 
                       sellerProfile?.photoURL || 
                       sellerProfile?.profilePic ||
                       sellerProfile?.avatar ||
                       product.sellerAvatar;
  
  const hasValidAvatar = sellerAvatar && !imageError && sellerAvatar.trim() !== '';
  
  console.log('🖼️ Seller Avatar:', {
    sellerId: product.sellerId,
    sellerAvatar,
    hasProfile: !!sellerProfile,
    hasValidAvatar,
    sellerName: product.sellerName
  });

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-0 pt-4 pb-3 border-b border-gray-200 flex items-center justify-between">
        {/* Left Side - Profile (Aligned to Left) */}
        <div className="flex items-center gap-2 min-w-0 pl-3">
          {/* Seller Avatar */}
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
            {hasValidAvatar ? (
              <img 
                src={sellerAvatar} 
                alt={product.sellerName}
                className="w-full h-full object-cover"
                onError={() => {
                  console.warn('❌ Avatar image failed to load:', sellerAvatar);
                  setImageError(true);
                }}
                onLoad={() => {
                  console.log('✅ Avatar image loaded successfully');
                }}
              />
            ) : (
              <span className="text-white font-bold">{product.sellerName?.[0]?.toUpperCase() || 'S'}</span>
            )}
          </div>
          {/* Seller Info */}
          <div className="flex flex-col gap-0 min-w-0">
            <span className="font-semibold text-gray-900 text-sm truncate">
              @{product.sellerName || 'seller'}
            </span>
            <div className="flex items-center gap-1">
              {isVerified && (
                <Check className="w-3 h-3 text-blue-500 fill-blue-500 flex-shrink-0" />
              )}
            </div>
            {/* Star Rating */}
            <div className="flex items-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  strokeWidth={3}
                  className={`${
                    star <= Math.round(product.rating || 0)
                      ? 'fill-yellow-500 text-yellow-500 drop-shadow-md'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Side - Follow Button */}
        <button 
          onClick={() => onFollow(product.sellerId, product.sellerName)}
          className="bg-blue-600 text-white px-3 py-0.5 rounded-full text-xs font-semibold hover:bg-blue-700 whitespace-nowrap flex-shrink-0 transition-colors ml-auto mr-3"
        >
          FOLLOW
        </button>
      </div>

      {/* Image */}
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {(() => {
            const validImage = getValidImageUrl(product.images?.[0]);
            return validImage ? (
              <img
                src={validImage}
                alt={product.title}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <span className="text-gray-500 text-sm">No image</span>
              </div>
            );
          })()}
          {hasDiscount && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg hover:shadow-xl transition-shadow">
              {product.discount}% OFF
            </div>
          )}
          
        </div>
      </Link>

      {/* Content */}
      <div className="px-4 py-3">
        {/* Title and Price */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link href={`/product/${product.id}`} className="flex-1">
            <h3 className="font-bold text-sm text-gray-900 line-clamp-2">
              {product.title}
            </h3>
          </Link>
          {/* Price */}
          <div className="flex items-baseline gap-1 whitespace-nowrap">
            <span className="text-lg font-bold text-blue-600">Rs {product.price}</span>
            {hasDiscount && (
              <span className="text-xs text-red-500 font-semibold">{product.discount}% OFF</span>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-gray-600 line-clamp-1 mb-2">
            {product.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center gap-4 mb-3 pb-3 border-b border-gray-200">
          <div className="flex gap-4">
            <button 
              onClick={() => {
                setIsLiked(!isLiked);
                onLike(product.id);
              }} 
              className={`transition-colors ${isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500' : ''}`} />
            </button>
            <button onClick={() => onComment(product.id)} className="text-gray-600 hover:text-blue-500 transition-colors">
              <MessageCircle className="w-6 h-6" />
            </button>
            <button onClick={() => onShare(product.id, product.title)} className="text-gray-600 hover:text-green-500 transition-colors">
              <Share2 className="w-6 h-6" />
            </button>
            <button 
              onClick={() => onSave(product.id)}
              className={`transition-colors ${isSaved ? 'text-blue-500' : 'text-gray-600 hover:text-blue-500'}`}
            >
              <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-blue-500' : ''}`} />
            </button>
          </div>
          
          {/* Sold Count Badge */}
          {soldCount !== null && (
            <div className="text-blue-500 px-2.5 py-1 rounded-full text-xs font-semibold">
              {soldCount} sold
            </div>
          )}
          
          {/* 3-Dot Menu */}
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <MoreVertical className="w-6 h-6" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => {
                    toast.info('Report submitted for review');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700 rounded-t-lg"
                >
                  <Flag size={16} />
                  Report Product
                </button>
                <button
                  onClick={() => {
                    onShare(product.id, product.title);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700"
                >
                  <Share size={16} />
                  Share
                </button>
                <button
                  onClick={() => {
                    toast.info('Added to wishlist');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm text-gray-700 rounded-b-lg"
                >
                  <Heart size={16} />
                  Save for Later
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Link href={`/product/${product.id}`} className="flex-1">
            <button className="w-full bg-blue-600 text-white font-bold py-1.5 px-3 rounded-full text-sm hover:bg-blue-700">
              BUY NOW
            </button>
          </Link>
          <button
            onClick={() => onAddToCart(product)}
            className="flex-1 border-2 border-blue-600 text-blue-600 font-bold py-1.5 px-3 rounded-full text-sm hover:bg-blue-50"
          >
            ADD TO CART
          </button>
        </div>
      </div>
    </div>
  );
}
