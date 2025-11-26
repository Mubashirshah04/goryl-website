'use client';
import React, { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { Header } from './header';
import { Footer } from './Footer';
import BottomNav from './bottom-navigation';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/authStoreCognito';
export function Layout({ children, showFooter = true, showHeader = true, immersive = false }) {
    const pathname = usePathname();
    const isReelsPage = pathname === '/reels' || pathname === '/videos';
    const { initialize, unsubscribeUserListener } = useAuthStore();
    const { theme } = useTheme();
    // Initialize authentication on app start
    useEffect(() => {
        initialize();
        return () => {
            if (unsubscribeUserListener) {
                unsubscribeUserListener();
            }
        };
    }, [initialize, unsubscribeUserListener]);
    return (<div className="theme-surface min-h-screen flex flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {showHeader && !isReelsPage && <Header />}
      <main className={`flex-1 ${isReelsPage ? 'pb-16' : 'pb-16 sm:pb-16'}`}>
        {children}
      </main>
      {showFooter && !isReelsPage && <Footer />}
      <BottomNav />
      <Toaster position="top-right" richColors closeButton theme={theme === 'dark' ? 'dark' : 'light'}/>
    </div>);
}
