'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, ShoppingCart, User, LogOut, Bell, Shield } from 'lucide-react';
import { useSession, signOut } from '@/hooks/useCustomSession';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import NotificationBell from '@/components/notifications/NotificationBell';
import CartDropdown from '@/components/cart/CartDropdown';

// Admin emails from environment variable
const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  // ✅ NextAuth session
  const { data: session, status } = useSession();
  const user = session?.user;
  const loading = status === 'loading';
  
  const { getCartItemCount, initializeCart } = useCartStore();

  // Fix hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user?.id && typeof window !== 'undefined') {
      initializeCart(user.id);
    }
  }, [user?.id]);

  // Fetch username and profile pic for header
  useEffect(() => {
    if (user?.id) {
      // First, try to get username from session user object
      if (user.username) {
        setUsername(user.username);
      } else if (user.name) {
        // Fallback to name
        setUsername(user.name.toLowerCase().replace(/\s+/g, ''));
      }
      
      // Set profile pic from user object if available
      if (user.image) {
        setProfilePic(user.image);
      }
      
      // Load from cache
      const cachedProfile = localStorage.getItem(`profile_${user.id}`);
      if (cachedProfile) {
        try {
          const profileData = JSON.parse(cachedProfile);
          if (profileData.username) {
            setUsername(profileData.username);
          }
          // Set profile picture from cache
          const pic = profileData.customPhotoURL || profileData.photoURL || profileData.profilePic || profileData.avatar;
          if (pic) {
            setProfilePic(pic);
          }
        } catch (error) {
          console.warn('Failed to parse cached profile:', error);
        }
      }
      
      // Fetch fresh profile data in background
      fetch(`/api/user/profile?id=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.username) {
            setUsername(data.username);
          }
          // Update profile picture
          const pic = data.customPhotoURL || data.photoURL || data.profilePic || data.avatar;
          if (pic) {
            setProfilePic(pic);
          }
        })
        .catch(err => console.warn('Failed to fetch profile:', err));
    } else {
      setUsername(null);
      setProfilePic(null);
    }
  }, [user?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    console.log('🔓 Logout button clicked!');
    
    try {
      setUserMenuOpen(false);
      toast.success('Logging out...');
      
      console.log('🚪 Calling signOut...');
      await signOut(); // No parameters needed
      
      console.log('✅ Logged out successfully');
    } catch (error: any) {
      console.error('❌ Error logging out:', error);
      toast.error('Failed to log out: ' + (error?.message || 'Unknown error'));
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 backdrop-blur-md bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Zaillisy
            </span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </form>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Notifications - Client-only to prevent hydration mismatch */}
            {isMounted && user && (
              <div className="relative">
                <NotificationBell />
              </div>
            )}

            {/* Cart with Dropdown - Client-only to prevent hydration mismatch */}
            {isMounted && user && (
              <div className="relative">
                <CartDropdown />
              </div>
            )}

            {/* Cart Link (fallback) */}
            {isMounted && !user && (
              <Link
                href="/cart"
                className="relative p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ShoppingCart size={24} />
              </Link>
            )}

            {/* User Menu - Client-only to prevent hydration mismatch */}
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            ) : isMounted && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {profilePic || user.image ? (
                    <img
                      src={profilePic || user.image}
                      alt={user.name || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <User size={18} className="text-white" />
                    </div>
                  )}
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      {/* Admin Panel Link - Only visible to admins */}
                      {isAdminEmail(user?.email) && (
                        <Link
                          href="/admin"
                          prefetch={true}
                          className="flex items-center space-x-3 px-4 py-3 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg border-b border-gray-200 dark:border-gray-700"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Shield className="w-5 h-5" />
                          <span className="font-medium">Admin Panel</span>
                        </Link>
                      )}
                      
                      {/* Profile Link */}
                      <Link
                        href={username ? `/profile/${username}` : '/profile'}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User size={16} className="inline mr-2" />
                        Profile
                      </Link>
                      
                      {/* Logout Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <LogOut size={16} className="inline mr-2" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : isMounted ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth-login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth-signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
