'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, ShoppingCart, Heart, Star, ChevronDown, Grid, List, Package, TrendingUp, Users, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { useUserProductsStore } from '@/store/userProductsStore';
import { useUserProfileStore } from '@/store/userProfileStore';
export default function ShopPageClient({ shopId }) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const { profile, loading: profileLoading, fetchProfile } = useUserProfileStore();
    const { products, loading: productsLoading, fetchUserProducts } = useUserProductsStore();
    const [viewMode, setViewMode] = useState('grid');
    const [sortBy, setSortBy] = useState('newest');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
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
            result = result.filter(product => product.title.toLowerCase().includes(query) ||
                product.description.toLowerCase().includes(query) ||
                product.category.toLowerCase().includes(query));
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
                result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
        }
        setFilteredProducts(result);
    }, [products, searchQuery, sortBy]);
    if (profileLoading) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>);
    }
    if (!profile) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Shop Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300">The shop you're looking for doesn't exist or is unavailable.</p>
          <Link href="/" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Back to Home
          </Link>
        </div>
      </div>);
    }
    const hasShop = ['brand', 'company', 'personal_seller', 'seller'].includes(profile.role);
    if (!hasShop) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Shop Not Available</h1>
          <p className="text-gray-600 dark:text-gray-300">This user doesn't have a shop.</p>
          <Link href="/" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Back to Home
          </Link>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden">
                <Image src={profile.customPhotoURL || profile.photoURL || profile.profilePic || profile.avatar || '/placeholder.jpg'} alt={profile.name} fill className="object-cover" onError={(e) => {
            const target = e.target;
            target.src = '/placeholder.jpg';
        }}/>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current"/>
                    <span className="text-sm text-gray-600 ml-1">
                      {((_a = profile.rating) === null || _a === void 0 ? void 0 : _a.toFixed(1)) || '0.0'} ({((_b = profile.reviews) === null || _b === void 0 ? void 0 : _b.toLocaleString()) || 0} reviews)
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-1"/>
                    {((_d = (_c = profile.followers) === null || _c === void 0 ? void 0 : _c.length) === null || _d === void 0 ? void 0 : _d.toLocaleString()) || 0} followers
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                Follow
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
                <MessageIcon className="w-4 h-4 mr-2"/>
                Message
              </button>
            </div>
          </div>
          
          {profile.bio && (<p className="mt-4 text-gray-600 max-w-3xl">
              {profile.bio}
            </p>)}
          
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            {profile.location && (<div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1"/>
                {profile.location}
              </div>)}
            {profile.phone && (<div className="flex items-center">
                <Phone className="w-4 h-4 mr-1"/>
                {profile.phone}
              </div>)}
            {profile.email && (<div className="flex items-center">
                <Mail className="w-4 h-4 mr-1"/>
                {profile.email}
              </div>)}
            {profile.website && (<div className="flex items-center">
                <Globe className="w-4 h-4 mr-1"/>
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Website
                </a>
              </div>)}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Shop Stats</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-gray-400 mr-2"/>
                    <span className="text-gray-600 dark:text-gray-300">Products</span>
                  </div>
                  <span className="font-medium">{products.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="w-5 h-5 text-gray-400 mr-2"/>
                    <span className="text-gray-600 dark:text-gray-300">Total Sales</span>
                  </div>
                  <span className="font-medium">{((_e = profile.totalSales) === null || _e === void 0 ? void 0 : _e.toLocaleString()) || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-gray-400 mr-2"/>
                    <span className="text-gray-600 dark:text-gray-300">Rating</span>
                  </div>
                  <span className="font-medium">{((_f = profile.rating) === null || _f === void 0 ? void 0 : _f.toFixed(1)) || '0.0'}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-400 mr-2"/>
                    <span className="text-gray-600 dark:text-gray-300">Followers</span>
                  </div>
                  <span className="font-medium">{((_h = (_g = profile.followers) === null || _g === void 0 ? void 0 : _g.length) === null || _h === void 0 ? void 0 : _h.toLocaleString()) || 0}</span>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-md font-semibold text-gray-900 mb-3">Categories</h3>
                <div className="space-y-2">
                  {Array.from(new Set(products.map(p => p.category))).map((category, index) => (<div key={index} className="flex items-center justify-between py-1">
                      <span className="text-gray-600 dark:text-gray-300">{category}</span>
                      <span className="text-sm text-gray-400 dark:text-gray-500">
                        {products.filter(p => p.category === category).length}
                      </span>
                    </div>))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:w-3/4">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
                  <input type="text" placeholder="Search products..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
                </div>
                
                <div className="flex space-x-2">
                  <div className="relative">
                    <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="newest">Newest</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Top Rated</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none"/>
                  </div>
                  
                  <div className="flex border border-gray-300 rounded-lg">
                    <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}>
                      <Grid className="w-5 h-5"/>
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}>
                      <List className="w-5 h-5"/>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {productsLoading ? (<div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>) : filteredProducts.length === 0 ? (<div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  {searchQuery ? 'Try adjusting your search terms' : 'This shop currently has no products'}
                </p>
              </div>) : (<div className={viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'}>
                {filteredProducts.map((product) => (<div key={product.id} className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition ${viewMode === 'list' ? 'flex' : ''}`}>
                    <div className={`relative ${viewMode === 'list' ? 'w-48 h-48' : 'h-48'}`}>
                      <Image src={product.images[0] || '/placeholder.jpg'} alt={product.title} fill className="object-cover" onError={(e) => {
                    const target = e.target;
                    target.src = '/placeholder.jpg';
                }}/>
                      {product.discount && (<div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                          {product.discount}% OFF
                        </div>)}
                      <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
                        <Heart className="w-4 h-4 text-gray-600"/>
                      </button>
                    </div>
                    
                    <div className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <h3 className="font-medium text-gray-900 mb-1">{product.title}</h3>
                      <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                      
                      <div className="flex items-center mb-2">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current"/>
                          <span className="text-sm text-gray-600 ml-1">4.5</span>
                        </div>
                        <span className="text-sm text-gray-400 mx-2">•</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">12 sold</span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div>
                          {product.discount ? (<div className="flex items-center">
                              <span className="text-lg font-bold text-gray-900 dark:text-white">${(product.price * (1 - product.discount / 100)).toFixed(2)}</span>
                              <span className="text-sm text-gray-500 line-through ml-2">${product.price}</span>
                            </div>) : (<span className="text-lg font-bold text-gray-900 dark:text-white">${product.price}</span>)}
                        </div>
                        
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
                          <ShoppingCart className="w-4 h-4 mr-1"/>
                          Add
                        </button>
                      </div>
                    </div>
                  </div>))}
              </div>)}
          </div>
        </div>
      </div>
    </div>);
}
function MessageIcon({ className }) {
    return (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
    </svg>);
}
