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

// Shuffle array function (Fisher-Yates algorithm)
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function ExplorePage() {
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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
    // CLEAR OLD FIREBASE CACHE - Force fresh AWS data
    console.log('🔄 Explore: Clearing old cache and loading fresh AWS data');
    localStorage.removeItem('cached_products');
    sessionStorage.removeItem('explore_items');
    
    setLoading(true);
    setItems([]); // Start with empty to force fresh load
    
    // Use AWS DynamoDB for products instead of Firebase
    const fetchProducts = async () => {
      try {
        // ✅ Use hybridProductService which handles client/server automatically
        const { getProducts } = await import('@/lib/hybridProductService');
        const awsProducts = await getProducts(
          { status: 'active' }, // Only active products
          'createdAt',
          'desc',
          8 // Limit for fast loading
    );
    
        console.log('🛍️ Explore: Received AWS products:', awsProducts.length);
      
        if (awsProducts.length === 0) {
        console.log('🛍️ Explore: No products found');
        return;
      }
      
        const productsWithType = awsProducts.map(p => ({ 
          ...p, 
          type: 'product' as const,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date()
      }));
        // Cache AWS data with version marker
        localStorage.setItem('cached_products', JSON.stringify({ 
          version: 'aws-v1',
          data: awsProducts,
          timestamp: Date.now()
        }));

        // Set products
        setItems(productsWithType);
      } catch (error) {
        console.error('Error fetching products from AWS:', error);
      }
    };
    
    // Fetch products immediately
    fetchProducts();
    
    // Poll every 1.5 seconds for REAL-TIME feel (like YouTube/TikTok)
    const productsPollInterval = setInterval(fetchProducts, 1500);
    
    return () => {
      clearInterval(productsPollInterval);
    };
  }, [searchQuery]);

  const handleLike = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to like products');
      return;
    }

    try {
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
              className="relative w-full pl-14 pr-5 py-3.5 glass rounded-2xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#FF6868]/50 text-sm placeholder-gray-400 transition-all duration-300 hover:shadow-premium group-hover:border-[#FF6868]/30"
            />
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
