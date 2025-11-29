'use client';
import React, { useState, useEffect } from 'react';
// ✅ AWS DYNAMODB - Firestore removed
// ✅ AWS - Using AWS services
import { useAuthStore } from '@/store/authStoreCognito';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import { toggleProductLike } from '@/lib/productService';
import { getOptimizedProducts as getProducts } from '@/lib/optimizedProductService';
// Stories feature removed
function CommentModal({ isOpen, onClose, productId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuthStore();
    useEffect(() => {
        let interval;
        const load = async () => {
            if (!isOpen || !productId) return;
            try {
                const { getComments } = await import('@/lib/awsCommentService');
                const commentsData = await getComments(productId);
                setComments(commentsData.map(c => ({
                    id: c.id,
                    authorName: c.userName,
                    authorPhoto: c.userPhoto || '',
                    text: c.comment,
                    createdAt: c.createdAt,
                })));
            } catch (e) {
                console.warn('Failed to load comments:', e);
            }
        };
        load();
        interval = setInterval(load, 2000);
        return () => interval && clearInterval(interval);
    }, [isOpen, productId]);
    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user || loading)
            return;
        setLoading(true);
        try {
            const { addComment } = await import('@/lib/awsCommentService');
            await addComment({
                productId,
                userId: user.sub,
                userName: user.displayName || 'Anonymous',
                userPhoto: user.photoURL || '',
                comment: newComment.trim(),
            });
            setNewComment('');
            toast.success('Comment posted!');
        }
        catch (error) {
            toast.error('Failed to post comment');
        }
        finally {
            setLoading(false);
        }
    };
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-lg w-full max-w-md max-h-96 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Comments</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.map((comment) => (<div key={comment.id} className="flex space-x-3">
              <img src={comment.authorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.authorName}`} alt={comment.authorName} width="32" height="32" className="rounded-full flex-shrink-0"/>
              <div className="flex-1">
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="font-medium text-sm">{comment.authorName}</p>
                  <p className="text-gray-800 dark:text-gray-200">{comment.text}</p>
                </div>
              </div>
            </div>))}
        </div>
        
        <form onSubmit={handleSubmitComment} className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"/>
            <button type="submit" disabled={loading || !newComment.trim()} className="bg-purple-600 text-white px-4 py-2 rounded-full disabled:opacity-50">
              Post
            </button>
          </div>
        </form>
      </motion.div>
    </div>);
}
// Temporarily redirect to new home design
import HomeNew from './home-new';

export default function HomePage() {
  return <HomeNew />;
}

function OldHomePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentModalOpen, setCommentModalOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [isHydrated, setIsHydrated] = useState(false);
    const { user, userData, loading: authLoading } = useAuthStore();
    // Temporarily disable social recommendations to fix products loading
    const recommendations = [];
    const trending = [];
    const recommendationsLoading = false;
    const trackInteraction = async (productId, type) => { };
    const { addToCart, getCartItemCount } = useCartStore();
    const { addToWishlist, removeFromWishlist, isInWishlist, wishlist } = useWishlistStore();
    useEffect(() => {
        setIsHydrated(true);
    }, []);
    useEffect(() => {
        // Initialize cart and wishlist if user is logged in
        if (user && user.sub) {
            useCartStore.getState().initializeCart(user.sub);
            useWishlistStore.getState().initializeWishlist(user.sub);
        }
    }, [user]);
    useEffect(() => {
        // Load products efficiently with caching
        let isSubscribed = true;
        const loadProducts = async () => {
            try {
                console.log('🔍 Loading products from AWS...');
                const awsProducts = await getProducts(
                    {}, // No filters
                    'updatedAt', // Sort by most recently updated
                    'desc',
                    20 // Limit to 20 products per page
                );

                if (!isSubscribed) return;

                // Process products
                const productsToShow = awsProducts.map(product => ({
                    ...product,
                    comments: product.commentsCount || 0,
                    sellerName: product.sellerName || '',
                    sellerRef: {
                        id: product.sellerId || '',
                        name: product.sellerName || '',
                        photoURL: product.sellerPhoto || ''
                    },
                    likes: product.likes || [],
                    views: product.views || 0,
                    likeCount: product.likeCount || 0,
                    viewCount: product.viewCount || 0,
                    shareCount: product.shareCount || 0
                }));

                console.log('📱 Products loaded:', productsToShow.length);
                setProducts(productsToShow);
                setLoading(false);

                // Set up periodic refresh
                const refreshInterval = setInterval(async () => {
                    if (!isSubscribed) return;
                    try {
                        const newProducts = await getProducts(
                            {},
                            'updatedAt',
                            'desc',
                            20
                        );
                        
                        // Only update if there are changes
                        if (JSON.stringify(newProducts) !== JSON.stringify(productsToShow)) {
                            setProducts(newProducts.map(product => ({
                                ...product,
                                comments: product.commentsCount || 0,
                                sellerName: product.sellerName || '',
                                sellerRef: {
                                    id: product.sellerId || '',
                                    name: product.sellerName || '',
                                    photoURL: product.sellerPhoto || ''
                                },
                                likes: product.likes || [],
                                views: product.views || 0,
                                likeCount: product.likeCount || 0,
                                viewCount: product.viewCount || 0,
                                shareCount: product.shareCount || 0
                            })));
                        }
                    } catch (error) {
                        console.error('Error refreshing products:', error);
                    }
                }, 30000); // 30-second refresh interval

                return () => clearInterval(refreshInterval);
            } catch (error) {
                console.error('Error loading products:', error);
                if (isSubscribed) {
                    setLoading(false);
                    setProducts([]);
                }
            }
        };

        // Only load when ready
        if (!authLoading) {
            console.log('✅ Starting product load');
            loadProducts();
        }

        // Cleanup
        return () => {
            isSubscribed = false;
        };
    }, [authLoading]);
    // Recommendations disabled temporarily
    // useEffect(() => {
    //   if (recommendations.length > 0) {
    //     setProducts(filteredProducts);
    //     setLoading(false);
    //   }
    // }, [recommendations]);
    // Timeout to prevent infinite loading
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (loading && !authLoading) {
                console.log('Loading timeout reached, setting loading to false');
                setLoading(false);
            }
        }, 10000); // 10 second timeout
        return () => clearTimeout(timeout);
    }, [loading, authLoading]);
    // Handle like functionality
    const handleLike = async (productId) => {
        if (!user) {
            toast.error('Please login to like products');
            return;
        }
        try {
            await toggleProductLike(productId, user.sub);
            // Track for social algorithm
            await trackInteraction(productId, 'like');
            toast.success('Like updated!');
        }
        catch (error) {
            console.error('Firebase update failed:', error);
            toast.error('Failed to update like');
        }
    };
    // Handle save/wishlist functionality
    const handleSave = async (product) => {
        if (!user) {
            toast.error('Please login to save products');
            return;
        }
        const isSaved = isInWishlist(product.id);
        try {
            if (isSaved) {
                await removeFromWishlist(product.id);
                toast.success('Removed from wishlist');
            }
            else {
                await addToWishlist(product);
                // Track for social algorithm
                await trackInteraction(product.id, 'save');
                toast.success('Added to wishlist!');
            }
        }
        catch (error) {
            toast.error('Failed to update wishlist');
        }
    };
    // Handle add to cart
    const handleAddToCart = async (product) => {
        if (!user) {
            toast.error('Please login to add items to cart');
            return;
        }
        try {
            await addToCart(product, 1);
            toast.success('Added to cart!');
        }
        catch (error) {
            toast.error('Failed to add to cart');
        }
    };
    // Handle share functionality
    const handleShare = async (productId, productTitle) => {
        const url = `${window.location.origin}/product/${productId}`;
        // Track for social algorithm
        await trackInteraction(productId, 'share');
        if (navigator.share) {
            try {
                await navigator.share({
                    title: productTitle,
                    url: url
                });
            }
            catch (error) {
                // User cancelled sharing
            }
        }
        else {
            await navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
        }
    };
    // Handle comment modal
    const handleComment = (productId) => {
        setSelectedProductId(productId);
        setCommentModalOpen(true);
    };
    // Handle product view tracking
    const handleProductView = async (product) => {
        if (product.id) {
            await trackInteraction(product.id, 'view');
        }
    };
    if (loading) {
        return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-sm mx-auto md:max-w-none md:container md:mx-auto md:px-4 pt-4">
          <div className="space-y-6 md:grid md:grid-cols-4 md:gap-6 md:space-y-0">
            {[...Array(8)].map((_, i) => (<div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </div>))}
          </div>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Trending Section */}
      {trending.length > 0 && (<div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">🔥 Trending Now</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Updated in real-time</span>
            </div>
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {trending.slice(0, 5).map((product) => {
                var _a;
                return (<motion.div key={product.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-shrink-0 w-32">
                  <Link href={`/product/${product.id}`}>
                    <div className="relative">
                      <img src={((_a = product.images) === null || _a === void 0 ? void 0 : _a[0]) || '/placeholder-product.jpg'} alt={product.title} width="128" height="128" className="w-32 h-32 object-cover rounded-lg"/>
                      <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-end">
                        <div className="p-2 text-white">
                          <p className="text-xs font-medium truncate">{product.title}</p>
                          <p className="text-xs">${product.price}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>);
            })}
            </div>
          </div>
        </div>)}

      {/* Mobile Feed Layout - Exact match to image design */}
      <div className="md:hidden">
        <div className="max-w-xs mx-auto space-y-4 pt-4">
          {products.map((product, index) => {
            var _a, _b, _c, _d, _e, _f;
            return (<motion.div key={product.id} initial={isHydrated ? { opacity: 0, y: 50 } : undefined} animate={isHydrated ? { opacity: 1, y: 0 } : undefined} transition={isHydrated ? { delay: index * 0.1 } : undefined} whileHover={isHydrated ? { scale: 1.02 } : undefined} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mx-2">
              {/* Product Image - Dark rounded background like in image */}
              <Link href={`/product/${product.id}`} className="block relative">
                <div className="bg-gray-900 dark:bg-gray-700 rounded-xl m-3 mb-0 aspect-square overflow-hidden">
                  <img src={product.images[0] || '/placeholder-product.jpg'} alt={product.title} className="object-cover w-full h-full" onError={(e) => {
                    const target = e.target;
                    target.src = '/placeholder-product.jpg';
                }}/>
                  {/* Pagination dots like in image */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full opacity-60"></div>
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              </Link>

              {/* Product Title and Price - Compact styling */}
              <div className="px-4 pt-3">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {product.title}
                </h2>
                <p className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  ${product.price}
                </p>
              </div>

              {/* Seller Profile Section - Compact layout */}
              <div className="px-4 pb-3">
                <div className="flex items-center mb-3">
                  <Link href={`/profile/${((_a = product.sellerRef) === null || _a === void 0 ? void 0 : _a.id) || 'user'}`} prefetch={false} className="hover:opacity-80">
                    <img src={((_b = product.sellerRef) === null || _b === void 0 ? void 0 : _b.photoURL) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(((_c = product.sellerRef) === null || _c === void 0 ? void 0 : _c.name) || product.sellerName || 'user')}`} alt={((_d = product.sellerRef) === null || _d === void 0 ? void 0 : _d.name) || product.sellerName} width="40" height="40" className="rounded-full mr-3 cursor-pointer hover:opacity-80"/>
                  </Link>
                  <div className="flex-1">
                    <Link href={`/profile/${((_e = product.sellerRef) === null || _e === void 0 ? void 0 : _e.id) || 'user'}`} className="hover:opacity-80">
                      <h3 className="font-semibold text-base text-gray-900 dark:text-white">
                        {((_f = product.sellerRef) === null || _f === void 0 ? void 0 : _f.name) || product.sellerName}
                      </h3>
                    </Link>
                    <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                      1.5K followers
                    </p>
                  </div>
                </div>

                {/* Blue Buy Now Button - Compact */}
                <Link href={`/product/${product.id}`} className="block">
                  <motion.button whileHover={isHydrated ? { scale: 1.02 } : undefined} whileTap={isHydrated ? { scale: 0.98 } : undefined} className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors text-base">
                    Buy Now
                  </motion.button>
                </Link>
              </div>
            </motion.div>);
        })}
        </div>
      </div>

      {/* Desktop Grid Layout - Same design as mobile */}
      <div className="hidden md:block">
        <div className="container mx-auto px-4 pt-8 max-w-7xl">
          <div className="grid grid-cols-4 gap-6" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {products.map((product, index) => {
            var _a, _b, _c, _d, _e, _f;
            return (<motion.div key={product.id} initial={isHydrated ? { opacity: 0, y: 20 } : undefined} animate={isHydrated ? { opacity: 1, y: 0 } : undefined} transition={isHydrated ? { delay: index * 0.05 } : undefined} whileHover={isHydrated ? { scale: 1.02 } : undefined} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                {/* Product Image - Dark rounded background like mobile */}
                <Link href={`/product/${product.id}`} className="block relative">
                  <div className="bg-gray-900 dark:bg-gray-700 rounded-xl m-3 mb-0 aspect-square overflow-hidden">
                    <img src={product.images[0] || '/placeholder-product.jpg'} alt={product.title} className="object-cover w-full h-full" onError={(e) => {
                    const target = e.target;
                    target.src = '/placeholder-product.jpg';
                }}/>
                    {/* Pagination dots like mobile */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-white rounded-full opacity-60"></div>
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  </div>
                </Link>

                {/* Product Title and Price - Same as mobile */}
                <div className="px-3 pt-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
                    {product.title}
                  </h2>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    ${product.price}
                  </p>
                </div>

                {/* Seller Profile Section - Same as mobile */}
                <div className="px-3 pb-3">
                  <div className="flex items-center mb-2">
                    <Link href={`/profile/${((_a = product.sellerRef) === null || _a === void 0 ? void 0 : _a.id) || 'user'}`} prefetch={false} className="hover:opacity-80">
                      <img src={((_b = product.sellerRef) === null || _b === void 0 ? void 0 : _b.photoURL) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(((_c = product.sellerRef) === null || _c === void 0 ? void 0 : _c.name) || product.sellerName || 'user')}`} alt={((_d = product.sellerRef) === null || _d === void 0 ? void 0 : _d.name) || product.sellerName} width="32" height="32" className="rounded-full mr-2 cursor-pointer hover:opacity-80"/>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${((_e = product.sellerRef) === null || _e === void 0 ? void 0 : _e.id) || 'user'}`} className="hover:opacity-80">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {((_f = product.sellerRef) === null || _f === void 0 ? void 0 : _f.name) || product.sellerName}
                        </h3>
                      </Link>
                      <p className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">
                        1.5K followers
                      </p>
                    </div>
                  </div>

                  {/* Blue Buy Now Button - Same as mobile */}
                  <Link href={`/product/${product.id}`} className="block">
                    <motion.button whileHover={isHydrated ? { scale: 1.02 } : undefined} whileTap={isHydrated ? { scale: 0.98 } : undefined} className="w-full bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      Buy Now
                    </motion.button>
                  </Link>
                </div>
              </motion.div>);
        })}
          </div>
        </div>
      </div>

      {/* Loading and Empty States */}
      {(() => {
            if (loading && products.length === 0) {
                return (<div className="flex justify-center items-center min-h-[60vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Loading amazing products...</p>
              </div>
            </div>);
            }
            if (!loading && products.length === 0) {
                return (<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-6xl mb-4">🛍️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No products yet</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Be the first to share a product!</p>
            <Link href="/become-seller" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
              Start Selling
            </Link>
          </div>);
            }
            return null;
        })()}
    </div>);
}


