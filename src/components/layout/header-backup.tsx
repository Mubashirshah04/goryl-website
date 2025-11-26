'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { Search, ShoppingCart, Bell, User, Menu, X, MessageCircle, LogOut, Gamepad2 } from 'lucide-react';
import { useSession, signOut as nextAuthSignOut } from '@/hooks/useCustomSession';
import { useCartStore } from '@/store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import NotificationBell from '@/components/notifications/NotificationBell';
import CartDropdown from '@/components/cart/CartDropdown';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [messengerOpen, setMessengerOpen] = useState(false);
  const pathname = usePathname();
  const params = useParams();
  
  // ✅ NextAuth session
  const { data: session, status } = useSession();
  const user = session?.user;
  const loading = status === 'loading';
  
  const { getCartItemCount, initializeCart } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    initializeCart();
  }, [initializeCart]);
    }
  }, [displayUser?.sub, pathname, params?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Instant navigation with prefetch
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };


  const handleLogout = async () => {
    try {
      await signOut();
      setUserMenuOpen(false);
      router.push('/');
      router.refresh();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  // Removed unused account switcher functions

  return (
    <>
      <style jsx>{`
        @keyframes float3D {
          0%, 100% {
            transform: translateY(0px) rotateX(0deg) rotateY(0deg);
          }
          50% {
            transform: translateY(-3px) rotateX(5deg) rotateY(2deg);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(168, 85, 247, 0.5);
          }
        }
        @keyframes rotate3D {
          0% {
            transform: perspective(1000px) rotateY(0deg);
          }
          100% {
            transform: perspective(1000px) rotateY(360deg);
          }
        }
      `}</style>
      <header
        className="sticky top-0 z-50 glass-strong border-b border-white/20 dark:border-white/10"
        style={{
          transform: 'translateZ(0)',
          willChange: 'transform'
        }}
        suppressHydrationWarning
      >
        {/* Premium Glowing Top Border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF6868]/80 to-transparent" suppressHydrationWarning></div>

        {/* Premium Animated Gradient Background */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 104, 104, 0.15) 0%, rgba(162, 155, 254, 0.15) 50%, rgba(255, 104, 104, 0.15) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer-gradient 8s ease-in-out infinite'
          }}
          suppressHydrationWarning
        />

        <div className="container mx-auto px-4 relative" suppressHydrationWarning>
          <div className="flex items-center justify-between h-16" suppressHydrationWarning>
            {/* Premium 3D Logo - Left */}
            <Link
              href="/"
              className="flex items-center space-x-2 flex-shrink-0 group"
              prefetch={true}
              style={{
                transform: 'perspective(1000px)',
                transformStyle: 'preserve-3d'
              }}
            >
              <div
                className="relative w-10 h-10 bg-gradient-to-br from-[#FF6868] via-[#A29BFE] to-[#FF6868] rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                style={{
                  boxShadow: '0 10px 30px rgba(255, 104, 104, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                  transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
                  animation: 'float3D 3s ease-in-out infinite'
                }}
              >
                <span className="text-white font-bold text-xl relative z-10">Z</span>
                {/* 3D Depth Effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent"></div>
                {/* Glow Effect */}
                <div
                  className="absolute -inset-1 rounded-xl bg-gradient-to-br from-[#FF6868] to-[#A29BFE] blur-lg opacity-50 -z-10"
                  style={{
                    animation: 'glow 2s ease-in-out infinite'
                  }}
                />
              </div>
              <span
                className="text-2xl font-bold bg-gradient-to-r from-[#FF6868] via-[#A29BFE] to-[#FF6868] bg-clip-text text-transparent hidden sm:block transition-all duration-500 group-hover:scale-105"
                style={{
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s linear infinite'
                }}
              >
                Zaillisy
              </span>
            </Link>

            {/* Premium 3D Search Bar - Center */}
            <div className="flex-1 max-w-xl mx-2 sm:mx-4 md:mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative group">
                  <div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  <Search
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 group-hover:text-purple-500 group-hover:scale-110 z-10"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products, sellers, categories..."
                    className="relative w-full pl-12 sm:pl-14 pr-4 py-3 text-sm sm:text-base border-2 border-gray-200/50 dark:border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-[#FF6868]/50 focus:border-[#FF6868]/50 hover:border-[#FF6868]/30 dark:hover:border-[#FF6868]/30 transition-all duration-300 text-gray-900 dark:text-gray-100 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl placeholder-gray-400 backdrop-blur-sm placeholder:text-gray-400 hover:shadow-lg focus:shadow-xl"
                    style={{
                      boxShadow: searchQuery ? '0 10px 30px rgba(255, 104, 104, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
                      transform: 'translateZ(0)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) translateZ(0)';
                      e.currentTarget.style.boxShadow = '0 15px 40px rgba(255, 104, 104, 0.3)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) translateZ(0)';
                      e.currentTarget.style.boxShadow = searchQuery ? '0 10px 30px rgba(255, 104, 104, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.05)';
                    }}
                  />
                  {/* 3D Inner Glow */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
                </div>
              </form>
            </div>

            {/* Premium 3D Right Side Icons */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* Game Link */}
              <Link
                href="/game"
                className="relative group"
                title="Play & Earn"
                style={{
                  transform: 'perspective(1000px)',
                  transformStyle: 'preserve-3d'
                }}
              >
                <div
                  className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 group-hover:scale-110 group-hover:-translate-y-1 group-hover:rotate-3"
                  style={{
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400 group-hover:text-purple-500 transition-colors relative z-10" />
                  {/* 3D Depth */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent"></div>
                </div>
              </Link>

              {/* Cart Dropdown */}
              <div className="relative">
                <CartDropdown />
              </div>

              {/* Premium 3D Messenger Button */}
              {displayUser ? (
                <button
                  onClick={() => setMessengerOpen(true)}
                  className="relative group"
                  title="Messages"
                  style={{
                    transform: 'perspective(1000px)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <div
                    className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 group-hover:scale-110 group-hover:-translate-y-1 group-hover:rotate-3"
                    style={{
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.2)',
                    }}
                  >
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300 group-hover:text-[#FF6868] transition-colors relative z-10" />
                    {/* 3D Depth */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent"></div>
                    {/* Indicator */}
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900 rounded-full animate-pulse"></span>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => toast.info('Please login to access messages')}
                  className="relative group"
                  title="Messages (Login Required)"
                  style={{
                    transform: 'perspective(1000px)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <div
                    className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-gray-200/30 dark:border-white/5 group-hover:scale-105"
                    style={{
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                  </div>
                </button>
              )}

              {/* Notifications */}
              {displayUser && (
                <div className="relative" style={{ transform: 'perspective(1000px)', transformStyle: 'preserve-3d' }}>
                  <NotificationBell />
                </div>
              )}

              {/* Premium 3D User Profile - INSTANT SHOW */}
              {displayUser ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="relative group"
                    style={{
                      transform: 'perspective(1000px)',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <div
                      className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1 group-hover:rotate-3"
                      style={{
                        boxShadow: '0 8px 24px rgba(168, 85, 247, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                        border: '3px solid rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      <img
                        src={currentUserProfilePicture || userData?.photoURL || userData?.profilePic || userData?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayUser.name || displayUser.email || 'user')}`}
                        alt={displayUser.name || displayUser.email || 'User'}
                        width="48"
                        height="48"
                        className="rounded-full w-full h-full object-cover relative z-10"
                        loading="eager"
                        decoding="async"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayUser.name || displayUser.email || 'user')}`;
                        }}
                      />
                      {/* 3D Glow Ring */}
                      <div
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400/50 to-pink-400/50 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                      />
                      {/* Animated Border Glow */}
                      {userMenuOpen && (
                        <div
                          className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-pulse"
                          style={{
                            animation: 'glow 2s ease-in-out infinite',
                            filter: 'blur(4px)'
                          }}
                        />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-white/10 py-2 z-50"
                      >
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {displayUser.name || userData?.name || displayUser.email?.split('@')[0] || 'User'}
                            </p>
                            {displayUser?.sub === profile?.id && profile?.verified && (
                              <div className="flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full flex-shrink-0">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          {displayUser?.sub === profile?.id && profile?.verified && (
                            <p className="text-xs text-blue-500 font-semibold mt-0.5">✓ Verified</p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                            {displayUser.email}
                          </p>
                        </div>

                        <Link
                          href={profile?.username ? `/profile/${profile.username}` : userData?.username ? `/profile/${userData.username}` : `/profile/${displayUser.sub}`}
                          prefetch={true}
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          href="/orders"
                          prefetch={true}
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Orders</span>
                        </Link>
                        {(userData?.role === 'seller' || userData?.role === 'personal_seller' || userData?.role === 'brand') && (
                          <Link
                            href="/seller/dashboard"
                            prefetch={true}
                            className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <span>💼</span>
                            <span>Seller Dashboard</span>
                          </Link>
                        )}


                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Link
                    href="/auth-login"
                    prefetch={true}
                    className="relative group px-3 sm:px-5 py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all duration-300 overflow-hidden"
                    style={{
                      transform: 'perspective(1000px)',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <span className="relative z-10">Login</span>
                    <div
                      className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-xl group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-all duration-300 group-hover:scale-105"
                      style={{
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </Link>
                  <Link
                    href="/register"
                    prefetch={true}
                    className="relative group px-4 sm:px-6 py-2.5 text-sm sm:text-base text-white font-semibold rounded-xl transition-all duration-500 overflow-hidden"
                    style={{
                      transform: 'perspective(1000px)',
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <span className="relative z-10">Sign Up</span>
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-[#FF6868] via-[#A29BFE] to-[#FF6868] rounded-xl group-hover:from-[#FF5757] group-hover:via-[#A29BFE] group-hover:to-[#FF5757] transition-all duration-300 group-hover:scale-110"
                      style={{
                        backgroundSize: '200% 100%',
                        boxShadow: '0 8px 24px rgba(255, 104, 104, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                        animation: 'shimmer 3s linear infinite'
                      }}
                    />
                    {/* 3D Glow Effect */}
                    <div
                      className="absolute -inset-1 bg-gradient-to-r from-[#FF6868] to-[#A29BFE] rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500 -z-10"
                    />
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              {/* Mobile Menu Button removed as per request */}
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-gray-200 dark:border-white/10 py-4"
              >
                <nav className="space-y-2">
                  <Link
                    href="/"
                    prefetch={true}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="text-lg">🏠</span>
                    <span className="font-medium">Home</span>
                  </Link>
                  <Link
                    href="/explore"
                    prefetch={true}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="text-lg">🔍</span>
                    <span className="font-medium">Explore</span>
                  </Link>
                  <Link
                    href="/categories"
                    prefetch={true}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="text-lg">📱</span>
                    <span className="font-medium">Categories</span>
                  </Link>
                  <Link
                    href="/become-seller"
                    prefetch={true}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="text-lg">💼</span>
                    <span className="font-medium">Sell</span>
                  </Link>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Messenger Modal */}
        <Messenger isOpen={messengerOpen} onClose={() => setMessengerOpen(false)} />
      </header>
    </>
  );
}