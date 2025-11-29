'use client';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Star, MoreHorizontal, MessageCircle, Share2, Camera, Edit3, ShoppingCart, Package, TrendingUp, Users, Phone, Mail, MapPin, Globe, Instagram, Facebook, Twitter, BarChart3, } from 'lucide-react';
import { useUserProductsStore } from '@/store/userProductsStore';
import { useUserReviewsStore } from '@/store/userReviewsStore';
import dynamic from 'next/dynamic';
const PublicContentTabs = dynamic(() => import('@/components/profiles/PublicContentTabs'), {
    loading: () => <div className="w-full h-48 bg-gray-200 animate-pulse rounded-lg"></div>,
    ssr: false
});
export default function BrandProfile({ profile, isOwnProfile, isFollowing, onFollow, onShare, onMessage, onBack, isLoggedIn = true, }) {
    var _a, _b, _c;
    const { products, loading: productsLoading, fetchUserProductsRealtime } = useUserProductsStore();
    const { reviews, loading: reviewsLoading, fetchUserReviewsRealtime } = useUserReviewsStore();
    const [bannerUrl, setBannerUrl] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    // Use refs to track subscriptions and prevent reloading
    const subscriptionsRef = useRef({
        products: null,
        reviews: null
    });
    // Fetch products and reviews for this brand only once when component mounts
    useEffect(() => {
        // Only set up subscriptions if they haven't been set up yet
        if (profile.id && !subscriptionsRef.current.products && !subscriptionsRef.current.reviews) {
            // Set up subscriptions
            subscriptionsRef.current.products = fetchUserProductsRealtime(profile.id);
            subscriptionsRef.current.reviews = fetchUserReviewsRealtime(profile.id);
            // Set image URLs - only set if they exist to avoid 404 errors
            if (profile.coverPhoto) {
                setBannerUrl(profile.coverPhoto);
            }
            else {
                // Don't set a default banner that doesn't exist
                setBannerUrl('');
            }
            // Try different avatar fields
            const avatarUrl = profile.customPhotoURL || profile.photoURL || profile.profilePic || profile.avatar;
            if (avatarUrl) {
                setLogoUrl(avatarUrl);
            }
            else {
                // Don't set a default logo that doesn't exist
                setLogoUrl('');
            }
        }
        // Cleanup function
        return () => {
            if (subscriptionsRef.current.products) {
                subscriptionsRef.current.products();
            }
            if (subscriptionsRef.current.reviews) {
                subscriptionsRef.current.reviews();
            }
        };
    }, []); // Empty dependency array ensures this only runs once
    // Calculate real analytics from data
    const calculateAnalytics = () => {
        if (reviews.length === 0)
            return { averageRating: 0, totalReviews: 0 };
        const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        return {
            averageRating: total / reviews.length,
            totalReviews: reviews.length
        };
    };
    const analytics = calculateAnalytics();
    const totalProducts = (products === null || products === void 0 ? void 0 : products.length) || 0;
    const totalSales = profile.totalSales || 0;
    // Ensure consistent followers/following count
    const followersCount = ((_a = profile.followers) === null || _a === void 0 ? void 0 : _a.length) || 0;
    const followingCount = ((_b = profile.following) === null || _b === void 0 ? void 0 : _b.length) || 0;
    // Handle more options menu
    const handleMoreOptions = () => {
        if (isOwnProfile) {
            const options = ['Edit Profile', 'Settings', 'Share Profile', 'Logout'];
            // Build the prompt message properly
            let message = 'Options:\n';
            options.forEach((opt, i) => {
                message += `${i + 1}. ${opt}\n`;
            });
            message += `\nEnter number (1-${options.length}):`;
            const choice = await new Promise((resolve) => {
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                modal.innerHTML = `
                    <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Select Option</h3>
                        <p class="text-gray-600 mb-4">${message}</p>
                        <input type="number" id="choice" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter number">
                        <div class="flex space-x-3 mt-4">
                            <button id="cancel" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                            <button id="confirm" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Submit</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                
                modal.querySelector('#cancel')?.addEventListener('click', () => {
                    document.body.removeChild(modal);
                    resolve(null);
                });
                modal.querySelector('#confirm')?.addEventListener('click', () => {
                    const choiceValue = modal.querySelector('#choice')?.value;
                    document.body.removeChild(modal);
                    resolve(choiceValue || null);
                });
            });
            const index = parseInt(choice || '0') - 1;
            if (index >= 0 && index < options.length) {
                const selectedOption = options[index];
                switch (selectedOption) {
                    case 'Edit Profile':
                        window.location.href = '/profile/edit';
                        break;
                    case 'Settings':
                        window.location.href = '/settings';
                        break;
                    case 'Share Profile':
                        if (navigator.share) {
                            navigator.share({
                                title: `${profile.name}'s Profile`,
                                url: window.location.href
                            });
                        }
                        else {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success('Profile link copied to clipboard!');
                        }
                        break;
                    case 'Logout':
                        const confirmed = await new Promise((resolve) => {
                            const modal = document.createElement('div');
                            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                            modal.innerHTML = `
                                <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Logout</h3>
                                    <p class="text-gray-600 mb-6">Are you sure you want to logout?</p>
                                    <div class="flex space-x-3">
                                        <button id="cancel" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                                        <button id="confirm" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Logout</button>
                                    </div>
                                </div>
                            `;
                            document.body.appendChild(modal);
                            
                            modal.querySelector('#cancel')?.addEventListener('click', () => {
                                document.body.removeChild(modal);
                                resolve(false);
                            });
                            modal.querySelector('#confirm')?.addEventListener('click', () => {
                                document.body.removeChild(modal);
                                resolve(true);
                            });
                        });
                        
                        if (confirmed) {
                            // Handle logout
                            window.location.href = '/login';
                        }
                        break;
                }
            }
        }
        else {
            const options = ['Share Profile', 'Report Brand', 'Block Brand'];
            // Build the prompt message properly
            let message = 'Options:\n';
            options.forEach((opt, i) => {
                message += `${i + 1}. ${opt}\n`;
            });
            message += `\nEnter number (1-${options.length}):`;
            const choice = await new Promise((resolve) => {
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                modal.innerHTML = `
                    <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Select Option</h3>
                        <p class="text-gray-600 mb-4">${message}</p>
                        <input type="number" id="choice" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter number">
                        <div class="flex space-x-3 mt-4">
                            <button id="cancel" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                            <button id="confirm" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Submit</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                
                modal.querySelector('#cancel')?.addEventListener('click', () => {
                    document.body.removeChild(modal);
                    resolve(null);
                });
                modal.querySelector('#confirm')?.addEventListener('click', () => {
                    const choiceValue = modal.querySelector('#choice')?.value;
                    document.body.removeChild(modal);
                    resolve(choiceValue || null);
                });
            });
            const index = parseInt(choice || '0') - 1;
            if (index >= 0 && index < options.length) {
                const selectedOption = options[index];
                switch (selectedOption) {
                    case 'Share Profile':
                        if (navigator.share) {
                            navigator.share({
                                title: `${profile.name}'s Profile`,
                                url: window.location.href
                            });
                        }
                        else {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success('Profile link copied to clipboard!');
                        }
                        break;
                    case 'Report Brand':
                        toast.info('Report feature coming soon!');
                        break;
                    case 'Block Brand':
                        toast.info('Block feature coming soon!');
                        break;
                }
            }
        }
    };
    // Format follower count
    const formatFollowerCount = (count) => {
        if (!count || typeof count !== 'number')
            return '0';
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        }
        else if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    };
    return (<div className="min-h-screen bg-gray-900 text-white">
      {/* Banner */}
      <div className="relative h-40 w-full bg-gradient-to-r from-gray-800 to-gray-700">
        {bannerUrl ? (<img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" onError={(e) => {
                const target = e.target;
                // Don't set a fallback that doesn't exist, just hide the image
                target.style.display = 'none';
            }}/>) : (
        // Show gradient background when no banner
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700"></div>)}
        {isOwnProfile && (<button onClick={() => window.location.href = '/profile/edit'} className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition">
            <Camera className="w-5 h-5 text-white"/>
          </button>)}
      </div>

      {/* Profile Header - Moved below banner */}
      <div className="px-4 mt-4">
        <div className="flex items-start justify-between">
          {/* Left: Logo + Info */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="relative w-24 h-24 rounded-full border-4 border-gray-900 overflow-hidden bg-gray-200">
                {logoUrl ? (<img src={logoUrl} alt="Brand Logo" className="w-full h-full object-cover" onError={(e) => {
                const target = e.target;
                // Don't set a fallback that doesn't exist, just hide the image
                target.style.display = 'none';
            }}/>) : (
        // Show empty div when no logo
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full"/>)}
              </div>
              {isOwnProfile && (<button onClick={() => window.location.href = '/profile/edit'} className="absolute bottom-0 right-0 p-1.5 bg-blue-500 rounded-full border-2 border-gray-900 hover:bg-blue-600 transition">
                  <Camera className="w-4 h-4 text-white"/>
                </button>)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold">{profile.name || 'Brand'}</h1>
                {profile.verified && (<svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>)}
              </div>
              {profile.verified && (<p className="text-blue-400 text-sm font-medium">Verified</p>)}
              {profile.username && (<p className="text-gray-400 text-sm">@{profile.username}</p>)}
              <div className="flex space-x-4 mt-1">
                <p className="text-gray-400 text-sm">
                  {formatFollowerCount(followersCount)} followers
                </p>
                <p className="text-gray-400 text-sm">
                  {formatFollowerCount(followingCount)} following
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex space-x-3">
            {!isOwnProfile ? (<>
                <button onClick={onFollow} className={`px-4 py-2 rounded-lg font-medium ${isFollowing
                ? 'bg-gray-700 text-gray-200'
                : 'bg-blue-600 text-white'}`}>
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button onClick={onMessage} className="p-2 bg-gray-800 rounded-full">
                  <MessageCircle className="w-5 h-5"/>
                </button>
                <button onClick={onShare} className="p-2 bg-gray-800 rounded-full">
                  <Share2 className="w-5 h-5"/>
                </button>
                <button onClick={handleMoreOptions} className="p-2 bg-gray-800 rounded-full">
                  <MoreHorizontal className="w-5 h-5"/>
                </button>
              </>) : (<>
                <Link href="/profile/edit" className="px-4 py-2 rounded-lg font-medium bg-gray-800 text-white flex items-center space-x-2">
                  <Edit3 className="w-4 h-4"/>
                  <span>Edit Profile</span>
                </Link>
                <button onClick={handleMoreOptions} className="p-2 bg-gray-800 rounded-full">
                  <MoreHorizontal className="w-5 h-5"/>
                </button>
              </>)}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons for Brand */}
      <div className="px-4 mt-6">
        <div className="grid grid-cols-4 gap-2">
          <Link href={`/shop/${profile.id}`} className="flex flex-col items-center justify-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
            <ShoppingCart className="w-5 h-5 text-blue-400 mb-1"/>
            <span className="text-xs text-center">Shop</span>
          </Link>
          <Link href={`/shop/${profile.id}`} className="flex flex-col items-center justify-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
            <Package className="w-5 h-5 text-green-400 mb-1"/>
            <span className="text-xs text-center">Products</span>
          </Link>
          <Link href={`/shop/${profile.id}`} className="flex flex-col items-center justify-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
            <TrendingUp className="w-5 h-5 text-purple-400 mb-1"/>
            <span className="text-xs text-center">Analytics</span>
          </Link>
          {isOwnProfile ? (<Link href="/seller/dashboard" className="flex flex-col items-center justify-center p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition">
              <BarChart3 className="w-5 h-5 text-white mb-1"/>
              <span className="text-xs text-center text-white font-medium">Dashboard</span>
            </Link>) : (<Link href={`/shop/${profile.id}`} className="flex flex-col items-center justify-center p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
              <Users className="w-5 h-5 text-yellow-400 mb-1"/>
              <span className="text-xs text-center">Followers</span>
            </Link>)}
        </div>
      </div>

      {/* Contact Information */}
      {(profile.phone || profile.email || profile.location || profile.website || profile.socialLinks) && (<div className="px-4 mt-6">
          <h2 className="text-lg font-semibold mb-3">Contact Information</h2>
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            {profile.phone && (<div className="flex items-center">
                <Phone className="w-5 h-5 text-gray-400 mr-3"/>
                <span className="text-gray-300">{profile.phone}</span>
              </div>)}
            {profile.email && (<div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-400 mr-3"/>
                <span className="text-gray-300">{profile.email}</span>
              </div>)}
            {profile.location && (<div className="flex items-center">
                <MapPin className="w-5 h-5 text-gray-400 mr-3"/>
                <span className="text-gray-300">{profile.location}</span>
              </div>)}
            {profile.website && (<div className="flex items-center">
                <Globe className="w-5 h-5 text-gray-400 mr-3"/>
                <span className="text-blue-400">{profile.website}</span>
              </div>)}
            {profile.socialLinks && (<div className="flex space-x-4 pt-2">
                {profile.socialLinks.instagram && (<a href={profile.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                    <Instagram className="w-5 h-5 text-pink-500"/>
                  </a>)}
                {profile.socialLinks.facebook && (<a href={profile.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                    <Facebook className="w-5 h-5 text-blue-600"/>
                  </a>)}
                {profile.socialLinks.twitter && (<a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                    <Twitter className="w-5 h-5 text-blue-400"/>
                  </a>)}
              </div>)}
          </div>
        </div>)}

      {/* Reviews Section - Rating and Stats */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-2">Based on Reviews</h2>
        <div className="flex items-center space-x-2">
          <span className="text-3xl font-bold">{analytics.averageRating.toFixed(1) || 0}</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (<Star key={i} className={`w-5 h-5 ${i < Math.round(analytics.averageRating || 0)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-600'}`}/>))}
          </div>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          {((_c = analytics.totalReviews) === null || _c === void 0 ? void 0 : _c.toLocaleString()) || 0} customer reviews
        </p>
      </div>

      {/* Business Stats */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-semibold mb-3">Business Stats</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-white">{totalProducts}</div>
            <div className="text-sm text-gray-400 dark:text-gray-500">Products</div>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-white">{analytics.totalReviews}</div>
            <div className="text-sm text-gray-400 dark:text-gray-500">Reviews</div>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-white">{analytics.averageRating.toFixed(1)}</div>
            <div className="text-sm text-gray-400 dark:text-gray-500">Rating</div>
          </div>
        </div>
      </div>

      {/* Most Loved Products */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-semibold mb-3">Most Loved Products</h2>
        {productsLoading ? (<p className="text-gray-400 dark:text-gray-500">Loading products...</p>) : products.length > 0 ? (<div className="grid grid-cols-2 gap-4">
            {products.slice(0, 4).map((product) => (<div key={product.id} className="bg-gray-800 p-3 rounded-lg flex flex-col items-center">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-700">
                  <img src={product.images[0] || '/product-placeholder.jpg'} alt={product.title} className="w-full h-full object-cover" onError={(e) => {
                    const target = e.target;
                    target.src = '/product-placeholder.jpg';
                }}/>
                </div>
                <p className="mt-2 text-sm font-medium truncate w-full text-center">{product.title}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">${product.price}</p>
              </div>))}
          </div>) : (<p className="text-gray-400 dark:text-gray-500">No products available</p>)}
      </div>

      {/* Customer Reviews */}
      <div className="px-4 mt-8">
        <h2 className="text-lg font-semibold mb-3">Customer Reviews</h2>
        {reviewsLoading ? (<p className="text-gray-400 dark:text-gray-500">Loading reviews...</p>) : reviews.length > 0 ? (<div className="space-y-4">
            {reviews.slice(0, 3).map((review) => (<div key={review.id} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2 bg-gray-700">
                    <img src={review.userPhoto || '/default-avatar.png'} alt={review.userName} className="w-full h-full object-cover" onError={(e) => {
                    const target = e.target;
                    target.src = '/default-avatar.png';
                }}/>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{review.userName}</p>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (<Star key={i} className={`w-4 h-4 ${i < review.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-600'}`}/>))}
                    </div>
                  </div>
                </div>
                <p className="text-sm">{review.comment}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {review.createdAt instanceof Date
                    ? review.createdAt.toLocaleDateString()
                    : new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>))}
          </div>) : (<p className="text-gray-400 dark:text-gray-500">No reviews available</p>)}
      </div>

      {/* Public Content Tabs */}
      <div className="mt-8">
        <PublicContentTabs profile={profile} isOwnProfile={isOwnProfile} isLoggedIn={isLoggedIn}/>
      </div>

      {/* Description Section - Moved to the bottom */}
      <div className="px-4 mt-8 mb-12">
        <h2 className="text-lg font-semibold mb-3">About</h2>
        <p className="text-gray-300">
          {profile.bio || 'Brand description'}
        </p>
      </div>
    </div>);
}
