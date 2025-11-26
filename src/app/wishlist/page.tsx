'use client';

import React, { useState, useEffect } from 'react';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  Share2, 
  Star, 
  Eye,
  ArrowRight,
  Search,
  Filter,
  Grid3X3,
  List,
  Bookmark
} from 'lucide-react';
import { useAuthStore } from '@/store/authStoreCognito';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { toast } from 'sonner';

export default function WishlistPage() {
  const { user } = useAuthStore();
  const { addToCart } = useCartStore();
  const { wishlist, removeFromWishlist, loading: wishlistLoading } = useWishlistStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating' | 'date'>('date');

  useEffect(() => {
    // Initialize cart and wishlist if user is logged in
    if (user && user.sub) {
      useCartStore.getState().initializeCart(user.sub);
      useWishlistStore.getState().initializeWishlist(user.sub);
    }
  }, [user]);

  const handleAddToCart = async (product: any) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      await addToCart(product, 1);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    if (!user) {
      toast.error('Please login to manage wishlist');
      return;
    }

    try {
      await removeFromWishlist(productId);
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleShare = async (product: any) => {
    const url = `${window.location.origin}/product/${product.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: url
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  // Filter and sort wishlist items
  const filteredAndSortedItems = wishlist
    .filter(item => 
      item.product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.product.title.localeCompare(b.product.title);
        case 'price':
          return a.product.price - b.product.price;
        case 'rating':
          return b.product.rating - a.product.rating;
        case 'date':
        default:
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      }
    });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please login to view your wishlist</h1>
          <Link href="/auth-login" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (wishlistLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 space-y-3">
                  <div className="h-48 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {filteredAndSortedItems.length} item{filteredAndSortedItems.length !== 1 ? 's' : ''} in your wishlist
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search your wishlist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="date">Recently Added</option>
              <option value="name">Name A-Z</option>
              <option value="price">Price: Low to High</option>
              <option value="rating">Highest Rated</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Wishlist Items */}
        {filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No items found' : 'Your wishlist is empty'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Start adding products you love to your wishlist'
              }
            </p>
            {!searchQuery && (
              <Link href="/" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {filteredAndSortedItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
              >
                {/* Product Image */}
                <div className={viewMode === 'list' ? 'w-48 h-48' : 'aspect-square'}>
                  <Link href={`/product/${item.product.id}`}>
                    <img
                      src={item.product.images[0] || '/placeholder-product.jpg'}
                      alt={item.product.title}
                      width={viewMode === 'list' ? 192 : 400}
                      height={viewMode === 'list' ? 192 : 400}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </Link>
                </div>

                {/* Product Info */}
                <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <Link href={`/product/${item.product.id}`}>
                    <h3 className="font-semibold text-gray-900 mb-2 hover:text-purple-600 transition-colors">
                      {item.product.title}
                    </h3>
                  </Link>
                  
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {item.product.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xl font-bold text-purple-600">
                        ${item.product.price.toFixed(2)}
                      </span>
                      {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          ${item.product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center">
                      {renderStars(item.product.rating)}
                      <span className="text-sm text-gray-600 ml-1">({item.product.rating})</span>
                    </div>
                  </div>

                  {/* Seller Info */}
                  <div className="flex items-center space-x-2 mb-3">
                    <img
                      src={item.product.seller?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.product.seller?.name}`}
                      alt={item.product.seller?.name || 'Seller'}
                      width="20"
                      height="20"
                      className="rounded-full"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{item.product.seller?.name}</span>
                    {item.product.seller?.isVerified && (
                      <span className="text-blue-500 text-xs">✓</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleAddToCart(item.product)}
                      className="flex items-center space-x-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleShare(item.product)}
                        className="p-2 rounded-full text-gray-400 hover:text-green-500 hover:bg-green-50 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleRemoveFromWishlist(item.product.id!)}
                        className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Added Date */}
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    Added {new Date(item.addedAt).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {filteredAndSortedItems.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                <ShoppingCart className="w-4 h-4" />
                <span>Add All to Cart</span>
              </button>
              <button className="flex items-center space-x-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                <Share2 className="w-4 h-4" />
                <span>Share Wishlist</span>
              </button>
              <button className="flex items-center space-x-2 bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors">
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

