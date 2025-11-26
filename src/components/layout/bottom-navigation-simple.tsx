'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Video, ShoppingBag, User } from 'lucide-react';
import { useSession } from '@/hooks/useCustomSession';
import React from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/videos', icon: Video, label: 'Videos' },
    { href: '/shop', icon: ShoppingBag, label: 'Shop' },
    { 
      href: user ? '/profile' : '/auth-login', 
      icon: User, 
      label: 'Profile' 
    },
  ];

  // Hide on certain pages
  const hideOnPages = ['/auth-login', '/register', '/videos'];
  if (hideOnPages.some(page => pathname?.startsWith(page))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-purple-600'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
