'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Heart, 
  Star, 
  ChevronDown,
  Grid,
  List,
  Package,
  TrendingUp,
  Users,
  MapPin,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import { useUserProductsStore } from '@/store/userProductsStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import { UserProduct } from '@/store/userProductsStore';

export default function ShopPageClient({ shopId }: { shopId: string }) {
  const { profile, loading: profileLoading, fetchProfile } = useUserProfileStore();
  const { products, loading: productsLoading, fetchUserProducts } = useUserProductsStore();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'rating'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<UserProduct[]>([]);
  
  // Fetch seller profile and products - FIXED: Never include store functions in dependencies
  useEffect(() => {
    if (shopId) {
      fetchProfile(shopId);
      fetchUserProducts(shopId);
    }
  }, [shopId]); // CRITICAL: Only depend on shopId to prevent infinite loops
  
  // Filter and sort products
  useEffect(() => {
    let result = [...products];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product => 
        product.title.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        break;
      case 'newest':
      default:
        result.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }
    
    setFilteredProducts(result);
  }, [products, searchQuery, sortBy]);
  
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Shop Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300">The shop you're looking for doesn't exist or is unavailable.</p>
          <Link 
            href="/" 
            className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
  
  const hasShop = ['brand', 'company', 'personal_seller', 'seller'].includes(profile.role);
  
  if (!hasShop) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Shop Not Available</h1>
          <p className="text-gray-600 dark:text-gray-300">This user doesn't have a shop.</p>
          <Link 
            href="/" 
            className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Banner */}
      <div className="relative h-64 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg">{profile.name}</h1>
            <p className="text-lg md:text-xl opacity-90 drop-shadow-md">
              {profile.role === 'brand' ? 'Official Brand Store' : profile.role === 'company' ? 'Company Store' : 'Seller Shop'}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Card - Overlapping Hero */}
      <div className="bg-white dark:bg-gray-800 shadow-lg -mt-16 relative z-10 mx-4 md:mx-8 lg:mx-auto lg:max-w-7xl rounded-2xl">
        <div className="px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <Image
                  src={profile.customPhotoURL || profile.photoURL || profile.profilePic || profile.avatar || '/placeholder.jpg'}
                  alt={profile.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder.jpg';
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
                  {profile.verified && (
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {profile.verified && (
                  <p className="text-blue-600 text-sm font-semibold">✓ Verified Shop</p>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 dark:text-gray-300 ml-1 font-medium">
                      {profile.rating?.toFixed(1) || '0.0'}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                      ({profile.reviews?.toLocaleString() || 0})
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Users className="w-4 h-4 mr-1" />
                    <span className="font-medium">{profile.followers?.length?.toLocaleString() || 0}</span>
                    <span className="ml-1 text-gray-500 dark:text-gray-400">followers</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Link
                href={`/profile/${profile.id}`}
                className="px-6 py-2.5 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition font-medium"
              >
                View Profile
              </Link>
              <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center shadow-md">
                <MessageIcon className="w-4 h-4 mr-2" />
                Message
              </button>
            </div>
          </div>
          
          {profile.bio && (
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-base max-w-4xl">
              {profile.bio}
            </p>
          )}
          
          {/* Contact Info Pills */}
          <div className="mt-4 flex flex-wrap gap-3">
            {profile.location && (
              <div className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                {profile.location}
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300">
                <Phone className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                {profile.phone}
              </div>
            )}
            {profile.email && (
              <div className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300">
                <Mail className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                {profile.email}
              </div>
            )}
            {profile.website && (
              <a 
                href={profile.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
              >
                <Globe className="w-4 h-4 mr-2" />
                Visit Website
              </a>
            )}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-8 border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Shop Performance
              </h2>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Products</span>
                    <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">{products.length}</span>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-green-700 dark:text-green-300 font-medium">Avg Rating</span>
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  </div>
                  <span className="text-2xl font-bold text-green-900 dark:text-green-100">{profile.rating?.toFixed(1) || '0.0'}</span>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">Followers</span>
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-2xl font-bold text-purple-900 dark:text-purple-100">{profile.followers?.length?.toLocaleString() || 0}</span>
                </div>
              </div>
              
              {products.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">Categories</h3>
                  <div className="space-y-2">
                    {Array.from(new Set(products.map(p => p.category))).map((category, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{category}</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                          {products.filter(p => p.category === category).length}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:w-3/4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <div className="relative">
                    <select
                      className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                    >
                      <option value="newest">Newest</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Top Rated</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 pointer-events-none" />
                  </div>
                  
                  <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {productsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products found</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'Try adjusting your search terms' : 'This shop currently has no products'}
                </p>
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-4'
              }>
                {filteredProducts.map((product) => (
                  <Link
                    href={`/product/${product.id}`}
                    key={product.id} 
                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group border border-gray-100 dark:border-gray-700 ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}
                  >
                    <div className={`relative ${viewMode === 'list' ? 'w-48 h-48' : 'h-56'} overflow-hidden`}>
                      <Image
                        src={product.images[0] || '/placeholder.jpg'}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.jpg';
                        }}
                      />
                      {product.discount && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                          {product.discount}% OFF
                        </div>
                      )}
                      <button 
                        onClick={(e) => e.preventDefault()}
                        className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all"
                      >
                        <Heart className="w-4 h-4 text-red-500" />
                      </button>
                      
                      {/* Quick View Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                          <button 
                            onClick={(e) => e.preventDefault()}
                            className="w-full bg-white text-gray-900 font-semibold py-2.5 rounded-lg hover:bg-gray-100 transition-all transform translate-y-4 group-hover:translate-y-0"
                          >
                            Quick View
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`p-5 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{product.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide font-medium">{product.category}</p>
                      
                      <div className="flex items-center mb-2">
                        {product.rating && product.rating > 0 ? (
                          <>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600 dark:text-gray-300 ml-1">{product.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-sm text-gray-400 dark:text-gray-500 mx-2">•</span>
                          </>
                        ) : null}
                        <span className="text-sm text-gray-600 dark:text-gray-300">{product.stock || 0} in stock</span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div>
                          {product.discount ? (
                            <div className="flex flex-col">
                              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">${(product.price * (1 - product.discount / 100)).toFixed(2)}</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500 line-through">${product.price}</span>
                            </div>
                          ) : (
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">${product.price}</span>
                          )}
                        </div>
                        
                        <button 
                          onClick={(e) => e.preventDefault()}
                          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 font-semibold shadow-md hover:shadow-lg"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
