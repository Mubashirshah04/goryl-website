'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { Search, ShoppingCart, User, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStoreCognito';
import { useCartStore } from '@/store/cartStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import { useGlobalProfileStore } from '@/store/globalProfileStore';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from '@/lib/firebaseAuth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import Messenger from '@/components/Messenger';
import NotificationBell from '@/components/notifications/NotificationBell';
import CartDropdown from '@/components/cart/CartDropdown';
export function Header() {
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [messengerOpen, setMessengerOpen] = useState(false);
    const pathname = usePathname();
    const params = useParams();
    const { user, loading } = useAuthStore();
    const { getCartItemCount, initializeCart } = useCartStore();
    const { profile, fetchProfile, subscribeToProfile } = useUserProfileStore();
    const { profilePicture } = useGlobalProfileStore();
    const router = useRouter();
    // Initialize cart when user loads
    useEffect(() => {
        if (user === null || user === void 0 ? void 0 : user.sub) {
            initializeCart(user.sub);
        }
    }, [user === null || user === void 0 ? void 0 : user.sub]);
    // Subscribe to user profile changes for real-time updates - FIXED: Don't interfere with profile navigation
    useEffect(() => {
        let unsubscribe;
        if (user === null || user === void 0 ? void 0 : user.sub) {
            // Don't fetch current user profile if we're viewing someone else's profile page
            const isViewingOtherProfile = pathname.startsWith('/profile/') && (params === null || params === void 0 ? void 0 : params.id) && params.id !== user.sub;
            if (!isViewingOtherProfile) {
                // Use real-time subscription instead of one-time fetch (but it's disabled anyway)
                unsubscribe = subscribeToProfile(user.sub);
            }
        }
        // Cleanup subscription on unmount or when user changes
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user === null || user === void 0 ? void 0 : user.sub, pathname, params === null || params === void 0 ? void 0 : params.id]);
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };
    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUserMenuOpen(false);
            toast.success('Logged out successfully');
            router.push('/');
        }
        catch (error) {
            toast.error('Failed to logout');
        }
    };
    return (<header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100 hidden sm:block">Zaillisy</span>
          </Link>

          {/* Search Bar - Center */}
          <div className="flex-1 max-w-xl mx-2 sm:mx-4 md:mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5"/>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products, sellers, categories..." className="w-full pl-8 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent hover:border-gray-400 dark:hover:border-white/20 transition-colors text-gray-900 dark:text-gray-100 bg-white dark:bg-white/5 placeholder-gray-400"/>
              </div>
            </form>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* Cart Dropdown */}
            <CartDropdown />

            {/* Messenger */}
            {user ? (<button onClick={() => setMessengerOpen(true)} className="relative text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 border border-transparent hover:border-gray-300 dark:hover:border-white/20" title="Messages">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6"/>
                {/* Temporary indicator to make icon more visible */}
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
              </button>) : (<button onClick={() => toast.info('Please login to access messages')} className="relative text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 border border-transparent hover:border-gray-300 dark:hover:border-white/20" title="Messages (Login Required)">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6"/>
              </button>)}

            {/* Notifications */}
            {user && <NotificationBell />}

            {/* User Profile */}
            {loading ? (<div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-full animate-pulse"></div>) : user ? (<div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 transition-colors">
                  <img src={profilePicture || (profile === null || profile === void 0 ? void 0 : profile.customPhotoURL) || (profile === null || profile === void 0 ? void 0 : profile.photoURL) || (profile === null || profile === void 0 ? void 0 : profile.profilePic) || (profile === null || profile === void 0 ? void 0 : profile.avatar) || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.displayName || 'user')}`} alt={user.displayName || 'User'} width="28" height="28" className="rounded-full sm:w-8 sm:h-8"/>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-white/10 py-2 z-50">
                      <Link href={user?.sub ? (profile?.username ? `/profile/${profile.username}` : `/profile/${user.sub}`) : '/auth-login'} prefetch={false} className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => setUserMenuOpen(false)}>
                        <User className="w-4 h-4"/>
                        <span>Profile</span>
                      </Link>
                      <Link href="/orders" className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => setUserMenuOpen(false)}>
                        <ShoppingCart className="w-4 h-4"/>
                        <span>Orders</span>
                      </Link>
                      {(user === null || user === void 0 ? void 0 : user.role) === 'seller' && (<Link href="/seller/dashboard" className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => setUserMenuOpen(false)}>
                          <span>💼</span>
                          <span>Seller Dashboard</span>
                        </Link>)}
                      <hr className="my-2 border-gray-200 dark:border-white/10"/>
                      <button onClick={handleLogout} className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 w-full text-left">
                        <span>Logout</span>
                      </button>
                    </motion.div>)}
                </AnimatePresence>
              </div>) : (<div className="flex items-center space-x-1 sm:space-x-2">
                <Link href="/auth-login" className="px-2 sm:px-4 py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:text-purple-600 font-medium">
                  Login
                </Link>
                <Link href="/auth-signup" className="px-2 sm:px-4 py-2 text-sm sm:text-base bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                  Sign Up
                </Link>
              </div>)}

            {/* Mobile Menu Button */}
            {/* Mobile Menu Button removed as per request */}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden border-t border-gray-200 dark:border-white/10 py-4">
              <nav className="space-y-2">
                <Link href="/" className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-lg">🏠</span>
                  <span className="font-medium">Home</span>
                </Link>
                <Link href="/explore" className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-lg">🔍</span>
                  <span className="font-medium">Explore</span>
                </Link>
                <Link href="/videos" className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-lg">🎬</span>
                  <span className="font-medium">Reels</span>
                </Link>
                <Link href="/categories" className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-lg">📱</span>
                  <span className="font-medium">Categories</span>
                </Link>
                <Link href="/become-seller" className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-lg">💼</span>
                  <span className="font-medium">Sell</span>
                </Link>
              </nav>
            </motion.div>)}
        </AnimatePresence>
      </div>

      {/* Messenger Modal */}
      <Messenger isOpen={messengerOpen} onClose={() => setMessengerOpen(false)}/>
    </header>);
}

