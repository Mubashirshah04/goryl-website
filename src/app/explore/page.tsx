'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStoreCognito';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Heart, 
  MessageCircle, 
  Play,
  Search,
  ShoppingBag,
  Video,
  Package
} from 'lucide-react';
import { toggleProductLike, Product as FirebaseProduct } from '@/lib/productService';
import { getPersonalizedFeed, trackProductInteraction, updateUserPreferences } from '@/lib/youtubeAlgorithm';
// Removed Firebase imports - now using AWS DynamoDB for both products and reels

interface Product extends FirebaseProduct {
  sellerRef?: {
    id: string;
    name: string;
    photoURL?: string;
  };
  comments?: number;
  type: 'product';
}

type ExploreItem = Product;

export default function ExplorePage() {
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Persistent state management - DISABLED to force fresh AWS data
  useEffect(() => {
    // Clear old sessionStorage to prevent loading Firebase data
    sessionStorage.removeItem('explore_items');
    console.log('🔄 Cleared old sessionStorage - forcing fresh AWS load');
  }, []);

  // Save state to sessionStorage (only AWS data with version marker)
  useEffect(() => {
    if (items.length > 0) {
      // Only save if items are from AWS (have proper structure)
      const hasValidItems = items.every(item => item.type === 'product');
      if (hasValidItems) {
        sessionStorage.setItem('explore_items', JSON.stringify({
          version: 'aws-v1',
          data: items,
          timestamp: Date.now()
        }));
      }
    }
  }, [items]);
  
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();

  useEffect(() => {
    // Initialize cart and wishlist if user is logged in
    if (user) {
      useCartStore.getState().initializeCart(user.sub);
      useWishlistStore.getState().initializeWishlist(user.sub);
    }
  }, [user]);

  useEffect(() => {
    // ✅ REAL-TIME AWS LOAD + YOUTUBE ALGORITHM - Load once, refresh on engagement
    console.log('🔄 Explore: Loading active products with YouTube algorithm');
    
    setLoading(true);
    let isFirstLoad = true;
    
    // Use AWS DynamoDB for products instead of Firebase
    const fetchProducts = async () => {
      try {
        // ✅ Use optimizedProductService for active products
        const { getOptimizedProducts } = await import('@/lib/optimizedProductService');
        const allProducts = await getOptimizedProducts();
    
        console.log('🛍️ Explore: Received AWS products:', allProducts.length);
      
        if (allProducts.length === 0) {
          console.log('🛍️ Explore: No products found');
          if (isFirstLoad) setLoading(false);
          return;
        }
      
        // ✅ Apply YouTube algorithm for personalization
        const personalizedProducts = getPersonalizedFeed(allProducts as any, 12, false);
        
        const productsWithType = personalizedProducts.map((p: any) => ({ 
          ...p, 
          type: 'product' as const
        }));
        
        // Cache AWS data with version marker
        sessionStorage.setItem('explore_items', JSON.stringify({ 
          version: 'aws-v1',
          data: productsWithType,
          timestamp: Date.now()
        }));

        // Set products and stop loading
        setItems(productsWithType as any);
        if (isFirstLoad) {
          setLoading(false);
          isFirstLoad = false;
        }
      } catch (error) {
        console.error('Error fetching products from AWS:', error);
        if (isFirstLoad) setLoading(false);
      }
    };
    
    // Fetch products immediately
    fetchProducts();
    
    // ✅ Real-time refresh every 15 seconds (like YouTube)
    // Shows new products gradually as they're added
    const productsPollInterval = setInterval(fetchProducts, 15000);
    
    return () => {
      clearInterval(productsPollInterval);
    };
  }, []);

  const handleLike = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to like products');
      return;
    }

    try {
      // ✅ Track interaction for YouTube algorithm
      trackProductInteraction(product.id!, 'like');
      updateUserPreferences(product as any, 'like');
      
      await toggleProductLike(product.id!, user.sub);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSave = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to save products');
      return;
    }

    const isSaved = isInWishlist(product.id!);
    
    try {
      // ✅ Track interaction for YouTube algorithm
      trackProductInteraction(product.id!, 'save');
      updateUserPreferences(product as any, 'save');
      
      if (isSaved) {
        await removeFromWishlist(product.id!);
        toast.success('Removed from saved');
      } else {
        await addToWishlist(product);
        toast.success('Saved!');
      }
    } catch (error) {
      toast.error('Failed to update saved items');
    }
  };


  // Generate suggestions based on search query
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const uniqueSuggestions = new Set<string>();
      
      // Extract keywords from items
      items.forEach(item => {
        if (item.title?.toLowerCase().includes(query)) {
          uniqueSuggestions.add(item.title);
        }
        if (item.description?.toLowerCase().includes(query)) {
          // Extract first few words from description
          const words = item.description.split(' ').slice(0, 3).join(' ');
          if (words) uniqueSuggestions.add(words);
        }
      });
      
      // Convert to array and limit to 5 suggestions
      setSuggestions(Array.from(uniqueSuggestions).slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, items]);

  const filteredItems = items.filter(item => {
      return item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             item.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/20">
        <div className="max-w-[975px] mx-auto px-5 pt-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 rounded-2xl w-full mb-8"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-square glass rounded-3xl bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/20">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#FF6868]/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/10 to-[#A29BFE]/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="max-w-[975px] mx-auto px-5 pt-8">
        {/* Premium Search Bar */}
        <div className="mb-8">
          <div className="relative group">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF6868]/10 to-purple-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10 transition-all duration-300 group-hover:text-[#FF6868] group-hover:scale-110" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length > 0 && setShowSuggestions(true)}
              className="relative w-full pl-14 pr-5 py-3.5 glass rounded-2xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF6868]/50 text-sm placeholder-gray-400 transition-all duration-300 hover:shadow-premium group-hover:border-[#FF6868]/30"
            />
            
            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl border border-white/20 shadow-lg z-50 overflow-hidden">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-5 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm text-gray-900 dark:text-gray-100 flex items-center space-x-2"
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instagram-Style Grid - Products */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">When content is available, you'll see it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 md:gap-7">
            {filteredItems.map((item, index) => {
                const product = item as Product;
              const itemId = product.id || `product-${index}`;
              const href = `/product/${product.id}`;
              const thumbnail = product.images?.[0] || '';
              const title = product.title || 'Product';
              const likes = Array.isArray(product.likes) ? product.likes.length : 0;
              const comments = product.comments || 0;
              
              return (
                <div
                  key={itemId}
                  className="relative aspect-square glass overflow-hidden rounded-3xl group cursor-pointer hover-lift transition-all duration-300 border border-white/20 dark:border-white/10"
                  onMouseEnter={() => setHoveredItem(itemId)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={(e) => {
                    e.preventDefault();
                      window.location.href = href;
                  }}
                >
                  {/* Image Thumbnail */}
                    <img
                      src={thumbnail || 'https://via.placeholder.com/400x400/f3f4f6/9ca3af?text=No+Image'}
                      alt={title}
                      className="w-full h-full object-cover"
                    />

                  {/* Product Indicator - Top Right */}
                    <div className="absolute top-3 right-3">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" fill="white" stroke="black" strokeWidth="1"/>
                        {/* Cart Body */}
                        <rect x="6" y="8" width="12" height="8" rx="1" fill="black"/>
                        {/* Cart Handle */}
                        <path d="M8 8V6c0-1 1-2 2-2h4c1 0 2 1 2 2v2" stroke="black" strokeWidth="1" fill="none"/>
                        {/* Cart Wheels */}
                        <circle cx="9" cy="18" r="1.5" fill="black"/>
                        <circle cx="15" cy="18" r="1.5" fill="black"/>
                        {/* Cart Items */}
                        <circle cx="10" cy="12" r="1" fill="white"/>
                        <circle cx="14" cy="12" r="1" fill="white"/>
                      </svg>
                    </div>

                  {/* Hover Overlay - Instagram Style */}
                  <div 
                    className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
                      hoveredItem === itemId ? 'opacity-100' : 'opacity-0'
                    } flex items-center justify-center`}
                  >
                    <div className="flex items-center space-x-6 text-white font-semibold">
                      {/* Likes */}
                      <div className="flex items-center space-x-2">
                        <Heart className="w-7 h-7" fill="white" />
                        <span className="text-base">{likes}</span>
                      </div>

                      {/* Comments */}
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="w-7 h-7" fill="white" />
                        <span className="text-base">{comments}</span>
                      </div>

                      {/* Price */}
                        <div className="flex items-center space-x-2">
                          <ShoppingBag className="w-6 h-6" />
                        <span className="text-base">${product.price}</span>
                        </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
