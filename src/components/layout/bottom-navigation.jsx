'use client';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Home, Search, Video, User, Grid3X3, Plus, X, Package, Camera } from 'lucide-react';
import { useAuthStore } from '@/store/authStoreCognito';
import { useUserProfileStore } from '@/store/userProfileStore';
import { useEffect, useState } from 'react';
export default function BottomNav() {
    const pathname = usePathname();
    const params = useParams();
    const { user } = useAuthStore();
    const { profile, fetchProfile } = useUserProfileStore();
    const [isSeller, setIsSeller] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    // Check if user is a seller - FIXED: Never include fetchProfile in dependencies
    useEffect(() => {
        if (user === null || user === void 0 ? void 0 : user.sub) {
            // Don't fetch current user profile if we're on someone else's profile page
            const isViewingOtherProfile = pathname.startsWith('/profile/') && (params === null || params === void 0 ? void 0 : params.id) && params.id !== user.sub;
            if (!isViewingOtherProfile) {
                fetchProfile(user.sub);
            }
        }
    }, [user === null || user === void 0 ? void 0 : user.sub]); // CRITICAL: Only depend on user?.sub to prevent infinite loops
    useEffect(() => {
        if (profile) {
            const sellerRoles = ['seller', 'brand', 'company'];
            setIsSeller(sellerRoles.includes(profile.role));
        }
    }, [profile]);
    // Get profile link - use username if available, otherwise use UID
    const getProfileLink = () => {
        if (!user?.sub) {
            return '/auth-login';
        }
        // If profile has username, use it; otherwise use UID
        if (profile?.username) {
            return `/profile/${profile.username}`;
        }
        // Fallback to UID if username not loaded yet
        return `/profile/${user.sub}`;
    };

    const nav = [
        { href: '/', icon: Home, label: 'Home' },
        { href: '/explore', icon: Search, label: 'Explore' },
        { href: '/videos', icon: Video, label: 'Reels' },
        { href: '/categories', icon: Grid3X3, label: 'Categories' },
        { href: getProfileLink(), icon: User, label: 'Profile' },
    ];
    // Add upload button for sellers
    const sellerNav = [
        { href: '/', icon: Home, label: 'Home' },
        { href: '/explore', icon: Search, label: 'Explore' },
        { href: '/videos', icon: Video, label: 'Reels' },
        { href: '#', icon: Plus, label: 'Upload', isUpload: true },
        { href: '/categories', icon: Grid3X3, label: 'Categories' },
        { href: getProfileLink(), icon: User, label: 'Profile' },
    ];
    const handleUploadClick = (item) => {
        if (item.isUpload) {
            setShowUploadModal(true);
        }
    };
    const handleUploadOption = (type) => {
        setShowUploadModal(false);
        if (type === 'reel') {
            // Navigate to upload reel page for TikTok-style recording
            window.location.href = '/upload/reel';
        }
        else {
            // Navigate to product upload page
            window.location.href = '/product/upload';
        }
    };
    return (<>
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200/50 dark:border-white/10 shadow-2xl flex justify-around items-center h-16 sm:h-16 px-2 sm:px-4 z-40 block">
        {(isSeller ? sellerNav : nav).map(({ href, icon: Icon, label, isUpload }) => {
            const isActive = pathname === href ||
                (href?.includes('/profile') && pathname.startsWith('/profile')) ||
                (href === '/auth-login' && pathname.startsWith('/auth-login')) ||
                (href === '/videos' && (pathname.startsWith('/videos') || pathname.startsWith('/reels'))) ||
                (href === '/reels' && (pathname.startsWith('/reels') || pathname.startsWith('/videos'))) ||
                (href === '/upload' && pathname.startsWith('/upload')) ||
                (href === '/product/upload' && pathname.startsWith('/product/upload'));
            if (isUpload) {
                return (<button key={href} onClick={() => handleUploadClick({ href, icon: Icon, label, isUpload })} className={`flex flex-col items-center justify-center flex-1 py-2 transition-all duration-300 group relative ${isActive ? 'text-purple-600' : 'text-gray-500 hover:text-purple-600'}`}>
                <div className={`relative p-2.5 rounded-full transition-all duration-300 ${isActive
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg scale-110 ring-2 ring-purple-200'
                        : 'group-hover:bg-purple-50 group-hover:scale-105 group-hover:shadow-md'}`}>
                  <Icon size={26} className={`w-6 h-6 sm:w-7 sm:h-7 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-purple-600'} transition-colors`}/>
                  {isActive && (<div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>)}
                </div>
                <span className="text-xs mt-1 font-medium hidden md:block">
                  {label}
                </span>
              </button>);
            }
            return (<Link key={href} href={href} className={`flex flex-col items-center justify-center flex-1 py-2 transition-all duration-300 group relative ${isActive ? 'text-purple-600' : 'text-gray-500 hover:text-purple-600'}`}>
              <div className={`relative p-2.5 rounded-full transition-all duration-300 ${isActive
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg scale-110 ring-2 ring-purple-200'
                    : 'group-hover:bg-purple-50 group-hover:scale-105 group-hover:shadow-md'}`}>
                <Icon size={26} className={`w-6 h-6 sm:w-7 sm:h-7 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-purple-600'} transition-colors`}/>
                {isActive && (<div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>)}
              </div>
              <span className="text-xs mt-1 font-medium hidden md:block">
                {label}
              </span>
            </Link>);
        })}
      </nav>

      {/* Upload Options Modal */}
      {showUploadModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl w-full max-w-sm">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500"/>
              </button>
            </div>

            {/* Upload Options */}
            <div className="p-4 space-y-3">
              <button onClick={() => handleUploadOption('reel')} className="w-full flex items-center space-x-4 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Camera className="w-6 h-6 text-purple-600"/>
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Upload Reel</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Share a video reel</p>
                </div>
              </button>

              <button onClick={() => handleUploadOption('product')} className="w-full flex items-center space-x-4 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600"/>
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Upload Product</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Add a new product</p>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <div className="p-4 border-t border-gray-200">
              <button onClick={() => setShowUploadModal(false)} className="w-full py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>)}
    </>);
}

