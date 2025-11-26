'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star, ShoppingBag } from 'lucide-react';
import { useUserProductsStore } from '@/store/userProductsStore';
import { useUserReviewsStore } from '@/store/userReviewsStore';
export default function PublicContentTabs({ profile, isOwnProfile, isLoggedIn }) {
    const router = useRouter();
    // Only show tabs for verified users (brand, company, personal)
    const isVerifiedUser = profile && ['brand', 'company', 'personal'].includes(profile.role);
    // Don't render anything for normal users
    if (!isVerifiedUser) {
        return null;
    }
    const [activeTab, setActiveTab] = useState('products');
    const { products, loading: productsLoading, fetchUserProductsRealtime } = useUserProductsStore();
    const { reviews, loading: reviewsLoading, fetchUserReviewsRealtime } = useUserReviewsStore();
    const [reels, setReels] = useState([]);
    useEffect(() => {
        if (profile === null || profile === void 0 ? void 0 : profile.id) {
            const unsubProducts = fetchUserProductsRealtime(profile.id);
            const unsubReviews = fetchUserReviewsRealtime(profile.id);
            return () => {
                unsubProducts();
                unsubReviews();
            };
        }
    }, [profile === null || profile === void 0 ? void 0 : profile.id]);
    const formatCount = (count) => {
        if (!count || typeof count !== 'number')
            return '0';
        if (count >= 1000000)
            return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000)
            return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };
    const renderTabContent = () => {
        if (!profile)
            return null;
        const isVerifiedUser = ['brand', 'company', 'personal'].includes(profile.role);
        switch (activeTab) {
            case 'reels':
                if (!isVerifiedUser)
                    return null;
                return (<div className="flex flex-col items-center justify-center h-64 w-full">
            {reels.length === 0 ? (<div className="flex flex-col items-center justify-center gap-4">
                <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">No Reels Yet</p>
                {isVerifiedUser && isOwnProfile && (<button onClick={() => router.push('/upload/reel')} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Create Reel
                  </button>)}
              </div>) : (<div className="grid grid-cols-3 gap-1 w-full">
                {reels.map((reel) => (<div key={reel.id} className="aspect-[9/16] bg-gray-200 rounded-lg">
                    {/* Reel thumbnail */}
                  </div>))}
              </div>)}
          </div>);
            case 'products':
                return (<div className="w-full">
            {productsLoading ? (<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (<div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-lg"></div>))}
              </div>) : products.length > 0 ? (<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => {
                            var _a;
                            return (<div key={product.id} className="cursor-pointer group" onClick={() => router.push(`/product/${product.id}`)}>
                    <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-2">
                      <img src={((_a = product.images) === null || _a === void 0 ? void 0 : _a[0]) || '/placeholder.png'} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/>
                    </div>
                    <h3 className="text-sm font-medium truncate">{product.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">${product.price}</p>
                    {product.rating && (<div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400"/>
                        <span>{product.rating.toFixed(1)}</span>
                      </div>)}
                  </div>);
                        })}
              </div>) : (<div className="flex flex-col items-center justify-center h-64">
                <ShoppingBag className="w-12 h-12 text-gray-400 mb-2"/>
                <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">No products yet</p>
                {isOwnProfile && isVerifiedUser && (<button onClick={() => router.push('/product/upload')} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Add Product
                  </button>)}
              </div>)}
          </div>);
            case 'reviews':
                return (<div className="w-full">
            {reviewsLoading ? (<div className="space-y-4">
                {[...Array(3)].map((_, i) => (<div key={i} className="bg-gray-200 animate-pulse h-24 rounded-lg"></div>))}
              </div>) : reviews.length > 0 ? (<div className="space-y-4">
                {reviews.map((review) => (<div key={review.id} className="border-b pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (<Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}/>))}
                      </div>
                      <span className="text-sm font-medium">{review.userName}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>
                  </div>))}
              </div>) : (<div className="flex flex-col items-center justify-center h-64">
                <Star className="w-12 h-12 text-gray-400 mb-2"/>
                <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">No reviews yet</p>
              </div>)}
          </div>);
            case 'about':
                return (<div className="w-full space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Bio</h3>
              <p className="text-gray-600 dark:text-gray-300">{profile.bio || 'No bio available'}</p>
            </div>
            {profile.location && (<div>
                <h3 className="font-semibold mb-2">Location</h3>
                <p className="text-gray-600 dark:text-gray-300">{profile.location}</p>
              </div>)}
            <div>
              <h3 className="font-semibold mb-2">Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold">{formatCount(Array.isArray(profile.followers) ? profile.followers.length : profile.followers)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Followers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCount(Array.isArray(profile.following) ? profile.following.length : profile.following)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Following</p>
                </div>
              </div>
            </div>
          </div>);
            default:
                return null;
        }
    };
    const tabs = [
        ...(isVerifiedUser ? [{ id: 'reels', label: 'Reels' }] : []),
        { id: 'products', label: 'Products' },
        { id: 'reviews', label: 'Reviews' },
        { id: 'about', label: 'About' },
    ];
    return (<div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {renderTabContent()}
      </div>
    </div>);
}
