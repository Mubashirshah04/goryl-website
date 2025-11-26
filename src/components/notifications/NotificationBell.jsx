'use client';
import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Package, ShoppingCart, Truck } from 'lucide-react';
import { useAuthStore } from '@/store/authStoreCognito';
import { subscribeToUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notificationService';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
export default function NotificationBell() {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!(user === null || user === void 0 ? void 0 : user.sub))
            return;
        console.log('🔔 Setting up notification subscription for user:', user.sub);
        const unsubscribe = subscribeToUserNotifications(user.sub, (newNotifications) => {
            setNotifications(newNotifications);
            setLoading(false);
            console.log('🔔 Notifications updated:', newNotifications.length);
        });
        return () => {
            if (unsubscribe)
                unsubscribe();
        };
    }, [user === null || user === void 0 ? void 0 : user.sub]);
    const unreadCount = notifications.filter(n => !n.read).length;
    const handleNotificationClick = async (notification) => {
        if (!notification.read) {
            await markNotificationAsRead(notification.id);
        }
        setShowDropdown(false);
    };
    const handleMarkAllAsRead = async () => {
        if (user === null || user === void 0 ? void 0 : user.sub) {
            await markAllNotificationsAsRead(user.sub);
            // Update local state
            setNotifications(prev => prev.map(n => (Object.assign(Object.assign({}, n), { read: true }))));
        }
    };
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'order_placed':
                return <ShoppingCart className="w-5 h-5 text-green-600"/>;
            case 'order_confirmed':
                return <Check className="w-5 h-5 text-blue-600"/>;
            case 'order_shipped':
                return <Truck className="w-5 h-5 text-purple-600"/>;
            case 'order_delivered':
                return <Package className="w-5 h-5 text-green-600"/>;
            case 'order_cancelled':
                return <X className="w-5 h-5 text-red-600"/>;
            default:
                return <Bell className="w-5 h-5 text-gray-600"/>;
        }
    };
    const getNotificationLink = (notification) => {
        var _a, _b;
        if ((_a = notification.data) === null || _a === void 0 ? void 0 : _a.orderId) {
            return `/orders/${notification.data.orderId}`;
        }
        if ((_b = notification.data) === null || _b === void 0 ? void 0 : _b.productId) {
            return `/product/${notification.data.productId}`;
        }
        // Default based on user role
        const userRole = user === null || user === void 0 ? void 0 : user.role;
        if (userRole === 'seller' || userRole === 'brand' || userRole === 'company') {
            return '/seller/dashboard?tab=orders';
        }
        return '/orders';
    };
    const formatTimeAgo = (date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diffInSeconds < 60)
            return 'Just now';
        if (diffInSeconds < 3600)
            return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400)
            return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800)
            return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };
    if (!user)
        return null;
    return (<div className="relative">
      {/* Notification Bell Button */}
      <button onClick={() => setShowDropdown(!showDropdown)} className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-colors">
        <Bell className="w-6 h-6"/>
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (<motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>)}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {showDropdown && (<>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}/>
            
            {/* Dropdown Content */}
            <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2 }} className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (<button onClick={handleMarkAllAsRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                      Mark all read
                    </button>)}
                </div>
                {unreadCount > 0 && (<p className="text-xs text-gray-500 mt-1">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>)}
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {loading ? (<div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                  </div>) : notifications.length === 0 ? (<div className="p-6 text-center">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">No notifications yet</p>
                    <p className="text-xs text-gray-400 mt-1">We'll notify you when something happens</p>
                  </div>) : (<div className="divide-y divide-gray-100">
                    {notifications.slice(0, 10).map((notification) => {
                    var _a;
                    return (<Link key={notification.id} href={getNotificationLink(notification)} onClick={() => handleNotificationClick(notification)}>
                        <div className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                          <div className="flex items-start space-x-3">
                            {/* Icon */}
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {notification.title}
                                </p>
                                {!notification.read && (<div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>)}
                              </div>
                              
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                  {formatTimeAgo(notification.createdAt)}
                                </p>
                                
                                {((_a = notification.data) === null || _a === void 0 ? void 0 : _a.orderNumber) && (<span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    #{notification.data.orderNumber}
                                  </span>)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>);
                })}
                  </div>)}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (<div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <Link href="/notifications" onClick={() => setShowDropdown(false)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View all notifications
                  </Link>
                </div>)}
            </motion.div>
          </>)}
      </AnimatePresence>
    </div>);
}

