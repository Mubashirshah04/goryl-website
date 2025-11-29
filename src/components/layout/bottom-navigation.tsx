'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Home, Search, Video, ShoppingBag, User, Grid3X3, Plus, X, Package, Camera, Users, MessageCircle } from 'lucide-react';
import { useSession } from '@/hooks/useCustomSession';
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@/hooks/useNavigation';

interface NavItem {
  href: string;
  icon: any;
  label: string;
  isUpload?: boolean;
}

export default function BottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const { navigate } = useNavigation();
  
  // ✅ NextAuth session
  const { data: session } = useSession();
  const user = session?.user;
  
  const [isSeller, setIsSeller] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [username, setUsername] = useState<string | null>(null);

  // Add CSS keyframes for bounce animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes bounceInUp {
        0% {
          opacity: 0;
          transform: translateY(30px) scale(0.3);
        }
        50% {
          opacity: 1;
          transform: translateY(-10px) scale(1.05);
        }
        70% {
          transform: translateY(5px) scale(0.95);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Set hydrated state after component mounts
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Close upload options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUploadOptions) {
        const target = event.target as Element;
        // Don't close if clicking on upload options container OR upload button
        if (!target.closest('.upload-options-container') && !target.closest('[data-upload-button]')) {
          setShowUploadOptions(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUploadOptions]);

  // INSTANT PROFILE LOADING - Load from cache first and get username
  useEffect(() => {
    const userId = user?.id;
    if (userId) {
      // Load profile from cache instantly
      const cachedProfile = localStorage.getItem(`profile_${userId}`);
      if (cachedProfile) {
        try {
          const profileData = JSON.parse(cachedProfile);
          if (profileData.username) {
            setUsername(profileData.username);
          }
          // console.log('🚀 Bottom nav: Loaded profile from cache instantly');
        } catch (error) {
          console.warn('Failed to parse cached profile:', error);
        }
      }
      
      // Also fetch fresh username from API
      fetch(`/api/user/profile?id=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.username) {
            setUsername(data.username);
          }
        })
        .catch(err => console.warn('Failed to fetch username:', err));
    } else {
      // User logged out - reset seller status and username
      setIsSeller(false);
      setUsername(null);
    }
  }, [user?.id]);

  useEffect(() => {
    // CRITICAL FIX: Only show upload button for seller roles
    const userId = user?.id;
    if (!userId) {
      setIsSeller(false);
      return;
    }

    // Fetch user profile to check role
    const checkSellerStatus = async () => {
      try {
        const cachedProfile = localStorage.getItem(`profile_${userId}`);
        if (cachedProfile) {
          const profileData = JSON.parse(cachedProfile);
          const sellerRoles = ['personal_seller', 'brand', 'company', 'seller'];
          setIsSeller(sellerRoles.includes(profileData.role));
        } else {
          // Fetch from API
          const res = await fetch(`/api/user/profile?id=${userId}`);
          const data = await res.json();
          if (data.role) {
            const sellerRoles = ['personal_seller', 'brand', 'company', 'seller'];
            setIsSeller(sellerRoles.includes(data.role));
          }
        }
      } catch (error) {
        console.warn('Failed to check seller status:', error);
        setIsSeller(false);
      }
    };

    checkSellerStatus();
  }, [user?.id]);


  // Memoize nav items to prevent re-renders
  const currentNav = React.useMemo(() => {
    // Helper to get profile link
    const getProfileLink = () => {
      if (!user?.id) {
        return '/auth-login';
      }

      // Use username if available, otherwise use user ID
      if (username) {
        return `/profile/${username}`;
      }
      return '/profile';
    };

    const profileLink = getProfileLink();

    // Define navigation items for regular users (without upload) - Premium Style
    const navItems: NavItem[] = [
      { href: '/', icon: Home, label: 'Home' },
      { href: '/explore', icon: Search, label: 'Search' },
      { href: '/categories', icon: Grid3X3, label: 'Categories' },
      { href: profileLink, icon: User, label: 'Profile' },
    ];

    // Add upload button for sellers and brands - Premium Style
    const sellerNavItems: NavItem[] = [
      { href: '/', icon: Home, label: 'Home' },
      { href: '/explore', icon: Search, label: 'Search' },
      { href: '#', icon: Plus, label: 'Add', isUpload: true },
      { href: '/categories', icon: Grid3X3, label: 'Categories' },
      { href: profileLink, icon: User, label: 'Profile' },
    ];

    return isSeller ? sellerNavItems : navItems;
  }, [isSeller, user?.id, username]);

  // Update active index based on pathname
  useEffect(() => {
    const index = currentNav.findIndex(({ href, isUpload }) => {
      if (isUpload) return false;
      return pathname === href ||
        (href.startsWith('/profile') && pathname.startsWith('/profile')) ||
        (href === '/explore' && pathname.startsWith('/explore')) ||
        (href === '/categories' && pathname.startsWith('/categories'));
    });
    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [pathname, currentNav]);

  const handleUploadClick = (item: NavItem) => {
    if (item.isUpload) {
      // Direct navigation to product upload page
      navigate('/product/upload');
    }
  };

  const handleUploadOption = (type: 'product') => {
    setShowUploadOptions(false);
    // Use navigation hook for client-side navigation (no page reload)
    navigate('/product/upload');
  };

  // Debug logging
  // console.log('isSeller:', isSeller, 'profile:', profile?.role);

  // Removed curved path - using simple white bar

  return (
    <>
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes buttonFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
        }
      `}</style>

      {/* Premium Navigation Bar - Next Level Style */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 glass-strong border-t border-white/20 dark:border-white/10 shadow-premium-lg backdrop-blur-2xl" suppressHydrationWarning>
        {/* Premium Glow Effect */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF6868]/80 to-transparent" suppressHydrationWarning></div>

        {/* Navigation Items - Premium horizontal layout */}
        <div className="relative h-full flex items-center justify-around px-2" suppressHydrationWarning>
          {currentNav.map(({ href, icon: Icon, label, isUpload }, index) => {
            const actualHref = href;
            const isActive = !isUpload && index === activeIndex;

            if (isUpload) {
              return (
                <div key={href} className="relative flex flex-col items-center justify-center flex-1">
                  <button
                    onClick={() => handleUploadClick({ href, icon: Icon, label, isUpload })}
                    data-upload-button="true"
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${showUploadOptions
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 scale-110 shadow-xl'
                      : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:shadow-2xl hover:scale-105'
                      }`}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
                    <Icon
                      size={24}
                      className="text-white relative z-10"
                      style={{
                        transform: showUploadOptions ? 'rotate(45deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                  </button>

                  {/* Upload Options Popup */}
                  {showUploadOptions && (
                    <div className="upload-options-container absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 glass-strong rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 p-4 z-50"
                      style={{
                        animation: 'bounceInUp 0.6s ease-out both'
                      }}
                    >
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleUploadOption('product')}
                          className="flex flex-col items-center space-y-2 p-4 rounded-2xl hover:bg-gradient-to-br hover:from-green-500/10 hover:to-emerald-500/10 transition-all duration-300 hover-lift group"
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-xs font-bold text-green-600">Product</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={href}
                href={actualHref}
                prefetch={true}
                onClick={() => setActiveIndex(index)}
                className="flex flex-col items-center justify-center flex-1 transition-all duration-300 group relative"
              >
                <div className="flex flex-col items-center justify-center relative">
                  {isActive && (
                    <div className="absolute -inset-2 bg-gradient-to-br from-[#FF6868]/20 to-[#A29BFE]/20 rounded-2xl blur-sm animate-pulse"></div>
                  )}
                  <div className={`relative p-3 rounded-2xl transition-all duration-300 ${isActive
                    ? 'bg-gradient-to-br from-[#FF6868]/10 to-[#A29BFE]/10 scale-110'
                    : 'hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-700 group-hover:scale-105'
                    }`}>
                    <Icon
                      size={26}
                      className={`transition-all duration-300 ${isActive
                        ? 'text-[#FF6868] heartbeat'
                        : 'text-gray-600 dark:text-gray-400 group-hover:text-[#FF6868]'
                        }`}
                    />
                  </div>
                  <span className={`text-[10px] mt-1 font-bold transition-colors ${isActive
                    ? 'text-[#FF6868] gradient-text-purple'
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-[#FF6868]'
                    }`}>
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

    </>
  );
}
