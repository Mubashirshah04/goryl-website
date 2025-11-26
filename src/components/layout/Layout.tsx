'use client';

import React, { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { Header } from './header-working';
import { Footer } from './Footer';
import BottomNav from './bottom-navigation';
import { Toaster } from 'sonner';
// import { useAuthStore } from '@/store/authStoreCognito'; // DISABLED - Using localStorage session
import NotificationSetup from '@/components/NotificationSetup';

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
  showHeader?: boolean;
  immersive?: boolean;
}

export function Layout({ children, showFooter = true, showHeader = true, immersive = false }: LayoutProps) {
  const pathname = usePathname();
  const isReelsPage = pathname === '/reels' || pathname === '/videos';
  const isChatPage = pathname?.startsWith('/chat/');
  const isUploadReelPage = pathname === '/upload/reel';
  // const { initialize, unsubscribeUserListener } = useAuthStore(); // DISABLED
  const { theme } = useTheme();

  // DISABLED: Old Cognito auth initialization - now using localStorage session
  // useEffect(() => {
  //   const initAuth = async () => {
  //     try {
  //       await initialize();
  //     } catch (error) {
  //       console.error('Auth initialization error:', error);
  //     }
  //   };
  //   initAuth();
  //   return () => {
  //     if (unsubscribeUserListener) {
  //       unsubscribeUserListener();
  //     }
  //   };
  // }, []);

  // Register service worker and initialize push notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // AWS Migration: Service Worker for push notifications temporarily disabled
      // pending AWS Pinpoint/SNS implementation
      console.log('⚠️ Service Worker registration skipped (AWS Migration)');

      /*
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
          
          // Initialize push notifications
          const initPushNotifications = async () => {
            try {
              const { initializeMessaging, getFCMToken, setupMessageListener } = await import('@/lib/pushNotificationService');
              
              await initializeMessaging();
              
              // Setup message listener
              setupMessageListener((payload) => {
                console.log('📱 Push notification received:', payload);
              });
              
              // Get token if permission already granted
              if ('Notification' in window && Notification.permission === 'granted') {
                await getFCMToken();
              }
            } catch (error) {
              console.error('Error initializing push notifications:', error);
            }
          };
          
          initPushNotifications();
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
      */
    }
  }, []);

  return (
    <div className="theme-surface min-h-screen flex flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100" suppressHydrationWarning>
      {showHeader && !isReelsPage && !isChatPage && !isUploadReelPage && <Header />}
      <main className={`flex-1 ${isReelsPage || isChatPage || isUploadReelPage ? 'pb-0' : 'pb-16 sm:pb-16'}`} suppressHydrationWarning>
        {children}
      </main>
      {showFooter && !isReelsPage && !isChatPage && !isUploadReelPage && <Footer />}
      {!isChatPage && !isUploadReelPage && <BottomNav />}
      <NotificationSetup />
      <Toaster
        position="top-right"
        richColors
        closeButton
        theme={theme === 'dark' ? 'dark' : 'light'}
      />
    </div>
  );
}