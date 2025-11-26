'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellOff, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStoreCognito';
import { 
  requestNotificationPermission, 
  getFCMToken, 
  setupMessageListener 
} from '@/lib/pushNotificationService';
import { motion } from 'framer-motion';

export default function NotificationSetup() {
  const { user } = useAuthStore();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      
      // Setup message listener
      setupMessageListener((payload) => {
        console.log('Message received:', payload);
      });
    }
  }, []);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await requestNotificationPermission();
      
      if (granted) {
        setPermission('granted');
        
        // Get and save FCM token
        const token = await getFCMToken();
        if (token) {
          setTokenSaved(true);
          setTimeout(() => setTokenSaved(false), 3000);
        }
      } else {
        setPermission('denied');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null; // Not supported
  }

  if (!user) {
    return null; // User not logged in
  }

  if (permission === 'granted') {
    return null; // Don't show anything when notifications are enabled
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 max-w-sm z-50"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {permission === 'denied' ? (
            <BellOff className="w-6 h-6 text-red-500" />
          ) : (
            <Bell className="w-6 h-6 text-purple-500" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Enable Notifications
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Get instant notifications for messages, orders, and updates (like YouTube, WhatsApp)
          </p>
          {permission === 'denied' ? (
            <p className="text-xs text-red-500 mb-3">
              Permission denied. Please enable notifications in browser settings.
            </p>
          ) : (
            <button
              onClick={handleRequestPermission}
              disabled={isLoading}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </button>
          )}
          {tokenSaved && (
            <p className="text-xs text-green-500 mt-2">✅ Token saved successfully!</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

