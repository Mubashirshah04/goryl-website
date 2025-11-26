'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Camera, MoreHorizontal, Smile, Phone, Star, ShoppingCart, MessageCircle, Share2, Package, TrendingUp, BarChart3 } from 'lucide-react';
import { useUserProductsStore } from '@/store/userProductsStore';
import { useUserReviewsStore } from '@/store/userReviewsStore';
import { useUserOrders } from '@/hooks/useUserOrders';
import ProfileImage from '@/components/ProfileImage';
export default function SellerProfile({ profile, isOwnProfile, isFollowing, onFollow, onShare, onMessage, onBack, isLoggedIn = true }) {
    var _a;
    const [activeTab, setActiveTab] = useState('products');
    const { products, loading: productsLoading } = useUserProductsStore();
    const { reviews, loading: reviewsLoading } = useUserReviewsStore();
    const { orders, loading: ordersLoading } = useUserOrders(profile.id, 5);
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
    return (<div className="min-h-screen bg-gray-900">
      {/* Top Navigation */}
      <div className="flex items-center justify-end p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          {isOwnProfile && (<Link href="/profile/edit" className="p-2">
              <Camera className="w-6 h-6 text-white"/>
            </Link>)}
          <button className="p-2">
            <MoreHorizontal className="w-6 h-6 text-white"/>
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
            <h1 className="text-2xl font-bold text-white">
              {profile.name || 'User'}
            </h1>
            {profile.verified && (<div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>)}
          </div>
          {profile.username && (<p className="text-gray-400 text-sm">@{profile.username}</p>)}
          <p className="text-gray-400 text-sm">Personal Shopping Assistant</p>
        </div>

        {/* Followers */}
        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm">{cleanFollowerCount()} followers</p>
        </div>

        {/* Conversational Bubble */}
        <div className="bg-gray-800 rounded-2xl p-4 mb-8 mx-4">
          <p className="text-center text-gray-200 text-sm">
            {profile.bio || "Looking for a sustainable handbag or cozy worn sneakers? I've got some ideas for you."}
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex justify-center space-x-8 mb-8">
          <button className="flex flex-col items-center space-y-1">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
              <Smile className="w-6 h-6 text-gray-300"/>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">Mood</span>
          </button>
          
          <button className="flex flex-col items-center space-y-1">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
              <Phone className="w-6 h-6 text-gray-300"/>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">Call</span>
          </button>
          
          {!isOwnProfile ? (<button onClick={onFollow} className="flex flex-col items-center space-y-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isFollowing ? 'bg-gray-700' : 'bg-purple-900'}`}>
                <Star className={`w-6 h-6 ${isFollowing ? 'text-gray-300' : 'text-purple-400'}`}/>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">{isFollowing ? 'Following' : 'Follow'}</span>
            </button>) : (<Link href="/profile/edit" className="flex flex-col items-center space-y-1">
              <div className="w-12 h-12 bg-purple-900 rounded-full flex items-center justify-center">
                <Camera className="w-6 h-6 text-purple-400"/>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">Edit</span>
            </Link>)}
          
          <button className="flex flex-col items-center space-y-1">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-gray-300"/>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">Orders</span>
          </button>
        </div>

        {/* About Section */}
        <div className="px-4">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-foreground">About</h2>
          </div>
          <p className="text-foreground text-sm leading-relaxed">
            {profile.about || profile.bio || ""}
          </p>
        </div>

        {/* Seller Stats */}
        <div className="mt-6 px-4">
          <div className="grid grid-cols-3 gap-4 bg-gray-800 rounded-lg p-4">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{(products === null || products === void 0 ? void 0 : products.length) || 0}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">Products</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{((_a = profile.totalSales) === null || _a === void 0 ? void 0 : _a.toLocaleString()) || 0}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">Sales</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{((reviews === null || reviews === void 0 ? void 0 : reviews.length) ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length : 0).toFixed(1)}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">Rating</div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons for Seller */}
        {isOwnProfile && (<div className="px-4 mt-6">
            <div className="grid grid-cols-4 gap-2">
              <Link href={`/shop/${profile.id}`} className="flex flex-col items-center justify-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
                <ShoppingCart className="w-5 h-5 text-blue-400 mb-1"/>
                <span className="text-xs text-center text-white">Shop</span>
              </Link>
              <Link href="/product/upload" className="flex flex-col items-center justify-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
                <Package className="w-5 h-5 text-green-400 mb-1"/>
                <span className="text-xs text-center text-white">Add Product</span>
              </Link>
              <Link href={`/shop/${profile.id}`} className="flex flex-col items-center justify-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
                <TrendingUp className="w-5 h-5 text-purple-400 mb-1"/>
                <span className="text-xs text-center text-white">Analytics</span>
              </Link>
              <Link href="/seller/dashboard" className="flex flex-col items-center justify-center p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition">
                <BarChart3 className="w-5 h-5 text-white mb-1"/>
                <span className="text-xs text-center text-white font-medium">Dashboard</span>
              </Link>
            </div>
          </div>)}

        {/* Additional Action Buttons for Non-Own Profile */}
        {!isOwnProfile && (<div className="flex justify-center space-x-4 mt-8">
            <button onClick={onMessage} className="flex items-center space-x-2 px-6 py-3 bg-purple-700 text-white rounded-lg font-medium">
              <MessageCircle className="w-5 h-5"/>
              <span>Message</span>
            </button>
            <button onClick={onShare} className="flex items-center space-x-2 px-6 py-3 border border-gray-600 text-gray-200 rounded-lg font-medium">
              <Share2 className="w-5 h-5"/>
              <span>Share</span>
            </button>
          </div>)}

        {/* Tabs for Content */}
        <div className="border-t border-gray-700 mt-8 pt-6">
          <nav className="flex space-x-8 mb-6">
            <button onClick={() => setActiveTab('products')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'products'
            ? 'border-purple-500 text-purple-400'
            : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
              Products ({products.length})
            </button>
            <button onClick={() => setActiveTab('orders')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'orders'
            ? 'border-purple-500 text-purple-400'
            : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
              Orders
            </button>
            <button onClick={() => setActiveTab('followers')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'followers'
            ? 'border-purple-500 text-purple-400'
            : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
              Followers
            </button>
          </nav>
        </div>
      </div>
    </div>);
}
