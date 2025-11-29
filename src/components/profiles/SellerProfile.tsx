'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, MoreHorizontal, Smile, Phone, Star, ShoppingCart, MessageCircle, Share2, Package, TrendingUp, BarChart3 } from 'lucide-react';
import { useUserProductsStore } from '@/store/userProductsStore';
import { useUserReviewsStore } from '@/store/userReviewsStore';
import { useUserOrders } from '@/hooks/useUserOrders';
import ProfileImage from '@/components/ProfileImage';

export default function SellerProfile({ profile, isOwnProfile, isFollowing, onFollow, onShare, onMessage, onBack, isLoggedIn = true }: any) {
    var _a;
    const [activeTab, setActiveTab] = useState('products');
    const [likedProducts, setLikedProducts] = useState<any[]>([]);
    const [savedProducts, setSavedProducts] = useState<any[]>([]);
    const [likedLoaded, setLikedLoaded] = useState(false);
    const [savedLoaded, setSavedLoaded] = useState(false);
    const { products, loading: productsLoading } = useUserProductsStore();
    const { reviews, loading: reviewsLoading } = useUserReviewsStore();
    const { orders, loading: ordersLoading } = useUserOrders(profile.id, 5);
    const [likedSavedLoading, setLikedSavedLoading] = useState(false);

    // Fetch liked and saved products when tab changes - only load once
    useEffect(() => {
        if (activeTab === 'liked' && !likedLoaded && isOwnProfile && isLoggedIn) {
            const fetchLikedSaved = async () => {
                setLikedSavedLoading(true);
                try {
                    const response = await fetch(`/api/user/liked-saved?userId=${profile.id}&type=liked`);
                    if (response.ok) {
                        const data = await response.json();
                        const items = data.items || [];
                        
                        // Fetch full product details for each item
                        const productsWithDetails = await Promise.all(
                            items.map(async (item: any) => {
                                try {
                                    const productResponse = await fetch(`/api/products/${item.productId}`);
                                    if (productResponse.ok) {
                                        const responseData = await productResponse.json();
                                        const productData = responseData.data || responseData;
                                        return { ...item, product: productData };
                                    }
                                } catch (err) {
                                    console.error(`Error fetching product ${item.productId}:`, err);
                                }
                                return item;
                            })
                        );
                        
                        setLikedProducts(productsWithDetails);
                        setLikedLoaded(true);
                    }
                } catch (error) {
                    console.error('Error fetching liked products:', error);
                } finally {
                    setLikedSavedLoading(false);
                }
            };
            fetchLikedSaved();
        }
    }, [activeTab, isOwnProfile, isLoggedIn, profile.id, likedLoaded]);

    useEffect(() => {
        if (activeTab === 'saved' && !savedLoaded && isOwnProfile && isLoggedIn) {
            const fetchLikedSaved = async () => {
                setLikedSavedLoading(true);
                try {
                    const response = await fetch(`/api/user/liked-saved?userId=${profile.id}&type=saved`);
                    if (response.ok) {
                        const data = await response.json();
                        const items = data.items || [];
                        
                        // Fetch full product details for each item
                        const productsWithDetails = await Promise.all(
                            items.map(async (item: any) => {
                                try {
                                    const productResponse = await fetch(`/api/products/${item.productId}`);
                                    if (productResponse.ok) {
                                        const responseData = await productResponse.json();
                                        const productData = responseData.data || responseData;
                                        return { ...item, product: productData };
                                    }
                                } catch (err) {
                                    console.error(`Error fetching product ${item.productId}:`, err);
                                }
                                return item;
                            })
                        );
                        
                        setSavedProducts(productsWithDetails);
                        setSavedLoaded(true);
                    }
                } catch (error) {
                    console.error('Error fetching saved products:', error);
                } finally {
                    setLikedSavedLoading(false);
                }
            };
            fetchLikedSaved();
        }
    }, [activeTab, isOwnProfile, isLoggedIn, profile.id, savedLoaded]);

    // Clean follower count to remove any strange text
    const cleanFollowerCount = () => {
        const followers = profile.followers;
        if (typeof followers === 'number')
            return followers;
        if (typeof followers === 'string') {
            // Remove the strange text and parse as number
            const cleaned = followers.replace(/dkjArdF4Q9P4Wx2Nl7nfnt6O5Rn1aNnliXy7QFYKFDwjPfrvDXJkTbm1/g, '').trim();
            const parsed = parseInt(cleaned, 10);
            return isNaN(parsed) ? 0 : parsed;
        }
        if (Array.isArray(followers))
            return followers.length;
        return 0;
    };
    return (<div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Top Navigation */}
      <div className="flex items-center justify-end p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center space-x-4">
          {isOwnProfile && (<Link href="/profile/edit" className="p-2">
              <Camera className="w-6 h-6 text-gray-900 dark:text-white"/>
            </Link>)}
          <button className="p-2">
            <MoreHorizontal className="w-6 h-6 text-gray-900 dark:text-white"/>
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-4 py-6">
        {/* Profile Picture */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <ProfileImage user={profile} size={120} className="rounded-full object-cover"/>
          </div>
        </div>

        {/* Name and Verification */}
        <div className="text-center mb-2">
          <div className="flex items-center justify-center space-x-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.name || 'User'}
            </h1>
            {profile.verified && (<div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>)}
          </div>
          {profile.username && (<p className="text-gray-600 dark:text-gray-400 text-sm">@{profile.username}</p>)}
          <p className="text-gray-600 dark:text-gray-400 text-sm">Personal Shopping Assistant</p>
        </div>

        {/* Followers and Following */}
        <div className="text-center mb-6 flex justify-center space-x-6">
          <button className="hover:text-purple-600 dark:hover:text-purple-400 transition">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              <span className="font-bold text-gray-900 dark:text-white">{cleanFollowerCount()}</span> followers
            </p>
          </button>
          <button className="hover:text-purple-600 dark:hover:text-purple-400 transition">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              <span className="font-bold text-gray-900 dark:text-white">{profile.following?.length || 0}</span> following
            </p>
          </button>
        </div>

        {/* Short Bio Bubble */}
        {profile.bio && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 mb-8 mx-4">
            <p className="text-center text-gray-900 dark:text-gray-200 text-sm">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex justify-center space-x-8 mb-8">
          <button className="flex flex-col items-center space-y-1">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Smile className="w-6 h-6 text-gray-600 dark:text-gray-300"/>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Mood</span>
          </button>
          
          <button className="flex flex-col items-center space-y-1">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Phone className="w-6 h-6 text-gray-600 dark:text-gray-300"/>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Call</span>
          </button>
          
          {!isOwnProfile ? (<button onClick={onFollow} className="flex flex-col items-center space-y-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isFollowing ? 'bg-gray-300 dark:bg-gray-700' : 'bg-purple-600 dark:bg-purple-900'}`}>
                <Star className={`w-6 h-6 ${isFollowing ? 'text-gray-600 dark:text-gray-300' : 'text-white dark:text-purple-400'}`}/>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{isFollowing ? 'Following' : 'Follow'}</span>
            </button>) : (<Link href="/profile/edit" className="flex flex-col items-center space-y-1">
              <div className="w-12 h-12 bg-purple-600 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Camera className="w-6 h-6 text-white dark:text-purple-400"/>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Edit</span>
            </Link>)}
          
          <button className="flex flex-col items-center space-y-1">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-gray-600 dark:text-gray-300"/>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Orders</span>
          </button>
        </div>

        {/* About Section */}
        {(profile.about || profile.bio) && (
          <div className="px-4 mb-8">
            <div className="mb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">About</h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {profile.about || profile.bio}
            </p>
          </div>
        )}

        {/* Seller Stats */}
        <div className="mt-6 px-4">
          <div className="grid grid-cols-3 gap-4 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">{(products === null || products === void 0 ? void 0 : products.length) || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Products</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">{((_a = profile.totalSales) === null || _a === void 0 ? void 0 : _a.toLocaleString()) || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Sales</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">{((reviews === null || reviews === void 0 ? void 0 : reviews.length) ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length : 0).toFixed(1)}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Rating</div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons for Seller */}
        {isOwnProfile && (<div className="px-4 mt-6">
            <div className="grid grid-cols-4 gap-2">
              <Link href={`/shop/${profile.id}`} className="flex flex-col items-center justify-center p-3 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition">
                <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-1"/>
                <span className="text-xs text-center text-gray-900 dark:text-white">Shop</span>
              </Link>
              <Link href="/product/upload" className="flex flex-col items-center justify-center p-3 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition">
                <Package className="w-5 h-5 text-green-600 dark:text-green-400 mb-1"/>
                <span className="text-xs text-center text-gray-900 dark:text-white">Add Product</span>
              </Link>
              <Link href={`/shop/${profile.id}`} className="flex flex-col items-center justify-center p-3 bg-gray-200 dark:bg-gray-800 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-1"/>
                <span className="text-xs text-center text-gray-900 dark:text-white">Analytics</span>
              </Link>
              <Link href="/seller/dashboard" className="flex flex-col items-center justify-center p-3 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-700 dark:to-blue-700 rounded-lg hover:from-purple-700 hover:to-blue-700 dark:hover:from-purple-800 dark:hover:to-blue-800 transition">
                <BarChart3 className="w-5 h-5 text-white mb-1"/>
                <span className="text-xs text-center text-white font-medium">Dashboard</span>
              </Link>
            </div>
          </div>)}

        {/* Additional Action Buttons for Non-Own Profile */}
        {!isOwnProfile && (<div className="flex justify-center space-x-4 mt-8">
            <button onClick={onMessage} className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">
              <MessageCircle className="w-5 h-5"/>
              <span>Message</span>
            </button>
            <button onClick={onShare} className="flex items-center space-x-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <Share2 className="w-5 h-5"/>
              <span>Share</span>
            </button>
          </div>)}

        {/* Tabs for Content */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-6">
          <nav className="flex space-x-8 mb-6 overflow-x-auto">
            <button onClick={() => setActiveTab('products')} className={`py-2 px-1 border-b-2 font-medium text-sm transition whitespace-nowrap ${activeTab === 'products'
            ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400'
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
              Products ({products.length})
            </button>
            <button onClick={() => setActiveTab('orders')} className={`py-2 px-1 border-b-2 font-medium text-sm transition whitespace-nowrap ${activeTab === 'orders'
            ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400'
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
              Orders
            </button>
            <button onClick={() => setActiveTab('liked')} className={`py-2 px-1 border-b-2 font-medium text-sm transition whitespace-nowrap ${activeTab === 'liked'
            ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400'
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
              Liked ({likedProducts.length})
            </button>
            <button onClick={() => setActiveTab('saved')} className={`py-2 px-1 border-b-2 font-medium text-sm transition whitespace-nowrap ${activeTab === 'saved'
            ? 'border-purple-600 text-purple-600 dark:border-purple-500 dark:text-purple-400'
            : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>
              Saved ({savedProducts.length})
            </button>
          </nav>
          
          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'products' && (
              <div className="text-center py-8">
                {products.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">No products yet</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product: any) => (
                      <div key={product.id} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 cursor-pointer hover:shadow-lg transition">
                        <p className="text-gray-900 dark:text-white font-medium">{product.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'orders' && (
              <div className="text-center py-8">
                {orders.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">No orders yet</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order: any) => (
                      <div key={order.id} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-left cursor-pointer hover:shadow-lg transition">
                        <p className="text-gray-900 dark:text-white font-medium">Order #{order.id}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'liked' && (
              <div className="py-8">
                {likedSavedLoading ? (
                  <p className="text-center text-gray-600 dark:text-gray-400">Loading liked products...</p>
                ) : likedProducts.length === 0 ? (
                  <p className="text-center text-gray-600 dark:text-gray-400">No liked products yet</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {likedProducts.map((item: any) => {
                      const product = item.product || {};
                      const images = product.images || [];
                      const rating = product.rating || 0;
                      const price = product.price || 0;
                      const title = product.title || product.name || 'Product';
                      
                      return (
                        <Link key={item.productId} href={`/product/${item.productId}`}>
                          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
                            {/* Product Image */}
                            <div className="relative w-full h-40 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              {images.length > 0 ? (
                                <img src={images[0]} alt={title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                              )}
                            </div>
                            
                            {/* Product Info */}
                            <div className="p-3">
                              <p className="text-gray-900 dark:text-white font-medium text-sm truncate">{title}</p>
                              
                              {/* Price */}
                              <p className="text-purple-600 dark:text-purple-400 font-bold text-sm mt-1">
                                Rs {price.toLocaleString()}
                              </p>
                              
                              {/* Rating */}
                              <div className="flex items-center mt-2">
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {rating.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'saved' && (
              <div className="py-8">
                {likedSavedLoading ? (
                  <p className="text-center text-gray-600 dark:text-gray-400">Loading saved products...</p>
                ) : savedProducts.length === 0 ? (
                  <p className="text-center text-gray-600 dark:text-gray-400">No saved products yet</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedProducts.map((item: any) => {
                      const product = item.product || {};
                      const images = product.images || [];
                      const rating = product.rating || 0;
                      const price = product.price || 0;
                      const title = product.title || product.name || 'Product';
                      
                      return (
                        <Link key={item.productId} href={`/product/${item.productId}`}>
                          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition border border-gray-200 dark:border-gray-700">
                            {/* Product Image */}
                            <div className="relative w-full h-40 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              {images.length > 0 ? (
                                <img src={images[0]} alt={title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                              )}
                            </div>
                            
                            {/* Product Info */}
                            <div className="p-3">
                              <p className="text-gray-900 dark:text-white font-medium text-sm truncate">{title}</p>
                              
                              {/* Price */}
                              <p className="text-purple-600 dark:text-purple-400 font-bold text-sm mt-1">
                                Rs {price.toLocaleString()}
                              </p>
                              
                              {/* Rating */}
                              <div className="flex items-center mt-2">
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {rating.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>);
}
