'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Package, ShoppingCart, Truck, Star, MessageCircle } from 'lucide-react';
import { useSession } from '@/hooks/useCustomSession';
import { subscribeToUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notificationService';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
// ✅ AWS DYNAMODB - Firestore removed, using AWS services

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data?: any;
}

export default function NotificationBell() {
  const { data: session } = useSession();
  const user = session?.user;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatNotifications, setChatNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Fix hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Subscribe to order notifications
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔔 Setting up notification subscription for user:', user.id);

    const unsubscribe = subscribeToUserNotifications(user.id, (newNotifications) => {
      setNotifications(newNotifications);
      setLoading(false);
      console.log('🔔 Notifications updated:', newNotifications.length);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.id]);

  // Subscribe to chat notifications - AWS stub
  useEffect(() => {
    if (!user?.id) return;

    console.log('💬 Chat notifications: AWS implementation pending');

    // TODO: Implement AWS DynamoDB chat notifications
    setChatNotifications([]);

    return () => { };
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length + chatNotifications.length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read && user?.id) {
      await markNotificationAsRead(notification.id, user.id);
    }
    setShowDropdown(false);
  };

  const handleMarkAllAsRead = async () => {
    if (user?.id) {
      await markAllNotificationsAsRead(user.id);
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
      case 'chat':
        return <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'order_placed':
        return <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'order_confirmed':
        return <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'order_shipped':
        return <Truck className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'order_delivered':
        return <Package className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'order_cancelled':
        return <X className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.data?.orderId) {
      return `/orders/${notification.data.orderId}`;
    }
    if (notification.data?.productId) {
      return `/product/${notification.data.productId}`;
    }
    // Default based on user role
    const userRole = (user as any)?.role;
    if (userRole === 'seller' || userRole === 'brand' || userRole === 'company') {
      return '/seller/dashboard?tab=orders';
    }
    return '/orders';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted || !user) return null;

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />

            {/* Dropdown Content */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 && chatNotifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">We'll notify you when something happens</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {/* Chat Notifications */}
                    {chatNotifications.map((chat: any) => {
                      const otherUserId = chat.participants?.find((p: string) => p !== user?.id);
                      const otherUserName = chat.participantNames?.[otherUserId] || 'User';

                      return (
                        <Link
                          key={`chat-${chat.id}`}
                          href={`/chat/${otherUserId}`}
                          onClick={() => setShowDropdown(false)}
                        >
                          <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    New message from {otherUserName}
                                  </p>
                                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full flex-shrink-0"></div>
                                </div>

                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {chat.lastMessage || 'New message'}
                                </p>

                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                  {formatTimeAgo(chat.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}

                    {/* Order Notifications */}
                    {notifications.slice(0, 10).map((notification) => (
                      <Link
                        key={notification.id}
                        href={getNotificationLink(notification)}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div
                          className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400' : ''
                            }`}
                        >
                          <div className="flex items-start space-x-3">
                            {/* Icon */}
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full flex-shrink-0"></div>
                                )}
                              </div>

                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {notification.message}
                              </p>

                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                  {formatTimeAgo(notification.createdAt)}
                                </p>

                                {notification.data?.orderNumber && (
                                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                                    #{notification.data.orderNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <Link
                    href="/notifications"
                    onClick={() => setShowDropdown(false)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  >
                    View all notifications
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

