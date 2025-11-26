'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ShoppingCart, Package, Truck, CreditCard, Users, Trash2, Filter, Search, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStoreCognito';
import { toast } from 'sonner';
import { subscribeToUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notificationService';
import Link from 'next/link';
export default function NotificationsPage() {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    // Load real notifications from Firebase
    useEffect(() => {
        if (!(user === null || user === void 0 ? void 0 : user.sub))
            return;
        console.log('📱 Loading notifications for user:', user.sub);
        setLoading(true);
        const unsubscribe = subscribeToUserNotifications(user.sub, (newNotifications) => {
            // Transform Firebase notifications to match our interface
            const transformedNotifications = newNotifications.map(notification => ({
                id: notification.id,
                type: getNotificationType(notification.type),
                title: notification.title,
                message: notification.message,
                timestamp: notification.createdAt,
                read: notification.read,
                actionUrl: getActionUrl(notification),
                priority: getPriorityFromType(notification.type)
            }));
            setNotifications(transformedNotifications);
            setLoading(false);
            console.log('📱 Notifications loaded:', transformedNotifications.length);
        });
        return () => {
            if (unsubscribe)
                unsubscribe();
        };
    }, [user === null || user === void 0 ? void 0 : user.sub]);
    const getNotificationType = (firebaseType) => {
        if (firebaseType.includes('order'))
            return 'order';
        if (firebaseType.includes('payment'))
            return 'payment';
        if (firebaseType.includes('ship'))
            return 'shipping';
        if (firebaseType.includes('product'))
            return 'product';
        if (firebaseType.includes('social'))
            return 'social';
        return 'system';
    };
    const getActionUrl = (notification) => {
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
    const getPriorityFromType = (type) => {
        if (type.includes('cancelled') || type.includes('failed'))
            return 'high';
        if (type.includes('delivered') || type.includes('confirmed'))
            return 'medium';
        return 'low';
    };
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'order':
                return <ShoppingCart className="w-6 h-6 text-blue-400"/>;
            case 'product':
                return <Package className="w-6 h-6 text-purple-400"/>;
            case 'social':
                return <Users className="w-6 h-6 text-green-400"/>;
            case 'system':
                return <Settings className="w-6 h-6 text-gray-400 dark:text-gray-500"/>;
            case 'payment':
                return <CreditCard className="w-6 h-6 text-green-400"/>;
            case 'shipping':
                return <Truck className="w-6 h-6 text-orange-400"/>;
            default:
                return <Bell className="w-6 h-6 text-purple-400"/>;
        }
    };
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'border-red-500/30 bg-red-500/10';
            case 'medium':
                return 'border-yellow-500/30 bg-yellow-500/10';
            case 'low':
                return 'border-blue-500/30 bg-blue-500/10';
            default:
                return 'border-white/20 bg-white/5';
        }
    };
    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
        if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        }
        else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours}h ago`;
        }
        else {
            const days = Math.floor(diffInMinutes / 1440);
            return `${days}d ago`;
        }
    };
    const markAsRead = async (notificationId) => {
        try {
            await markNotificationAsRead(notificationId);
            setNotifications(prev => prev.map(notification => notification.id === notificationId
                ? Object.assign(Object.assign({}, notification), { read: true }) : notification));
        }
        catch (error) {
            console.error('Error marking notification as read:', error);
            toast.error('Failed to mark notification as read');
        }
    };
    const markAllAsRead = async () => {
        if (!(user === null || user === void 0 ? void 0 : user.sub))
            return;
        try {
            await markAllNotificationsAsRead(user.sub);
            setNotifications(prev => prev.map(notification => (Object.assign(Object.assign({}, notification), { read: true }))));
            toast.success('All notifications marked as read');
        }
        catch (error) {
            console.error('Error marking all notifications as read:', error);
            toast.error('Failed to mark all notifications as read');
        }
    };
    const deleteNotification = (notificationId) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        toast.success('Notification deleted');
    };
    const filteredNotifications = notifications
        .filter(notification => {
        if (filter === 'unread')
            return !notification.read;
        if (filter === 'orders')
            return notification.type === 'order';
        if (filter === 'social')
            return notification.type === 'social';
        if (filter === 'system')
            return notification.type === 'system';
        return true;
    })
        .filter(notification => notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase()));
    const unreadCount = notifications.filter(n => !n.read).length;
    if (!user) {
        return (<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md mx-auto px-4">
          <div className="w-40 h-40 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-xl border border-white/20">
            <Bell className="w-24 h-24 text-purple-300"/>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Sign in to view notifications
          </h1>
          <p className="text-purple-200 text-xl mb-8 leading-relaxed">
            Stay updated with your orders, products, and social activities!
          </p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-8 py-4 rounded-2xl hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-300 shadow-2xl font-bold text-lg">
            <Link href="/auth-login">Sign In</Link>
          </motion.button>
        </motion.div>
      </div>);
    }
    if (loading) {
        return (<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="animate-pulse space-y-6">
            <div className="h-12 bg-white/10 rounded-2xl w-1/4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (<div key={i} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      <div className="h-3 bg-white/5 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>))}
            </div>
          </motion.div>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Premium Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-3xl flex items-center justify-center shadow-2xl ring-4 ring-purple-500/20 relative">
                <Bell className="text-white" size={32}/>
                {unreadCount > 0 && (<div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>)}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Premium Notifications
                </h1>
                <p className="text-purple-200 text-xl font-semibold">
                  {unreadCount} unread • {notifications.length} total
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && (<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={markAllAsRead} className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-6 py-3 rounded-2xl hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-300 shadow-2xl font-bold text-lg">
                Mark All Read
              </motion.button>)}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300" size={20}/>
              <input type="text" placeholder="Search notifications..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm"/>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="text-purple-300" size={20}/>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm">
                <option value="all">All Notifications</option>
                <option value="unread">Unread Only</option>
                <option value="orders">Orders</option>
                <option value="social">Social</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center py-16">
            <div className="w-40 h-40 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-xl border border-white/20">
              <Bell className="w-24 h-24 text-purple-300"/>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              {searchQuery ? 'No notifications found' : 'All caught up!'}
            </h2>
            <p className="text-purple-200 text-xl mb-8 leading-relaxed">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'You\'re all up to date with your notifications.'}
            </p>
          </motion.div>) : (<div className="space-y-4">
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => (<motion.div key={notification.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, delay: index * 0.1 }} className={`bg-white/10 backdrop-blur-xl border rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 group ${notification.read
                    ? 'border-white/20'
                    : `border-purple-500/30 ${getPriorityColor(notification.priority)}`}`}>
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-2xl border ${notification.read
                    ? 'bg-white/10 border-white/20'
                    : 'bg-purple-500/20 border-purple-500/30'}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-bold text-lg ${notification.read ? 'text-white' : 'text-purple-200'}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-purple-300 text-sm">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                          {!notification.read && (<div className="w-3 h-3 bg-purple-500 rounded-full"></div>)}
                        </div>
                      </div>
                      
                      <p className="text-purple-200 text-lg leading-relaxed mb-4">
                        {notification.message}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center space-x-3">
                        {notification.actionUrl && (<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => {
                        markAsRead(notification.id);
                        // Navigate to action URL
                    }} className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-4 py-2 rounded-2xl font-bold hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-300 shadow-lg">
                            <Link href={notification.actionUrl}>View Details</Link>
                          </motion.button>)}
                        
                        {!notification.read && (<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => markAsRead(notification.id)} className="bg-white/10 text-purple-200 hover:text-white hover:bg-white/20 px-4 py-2 rounded-2xl transition-all duration-300 border border-white/20">
                            Mark Read
                          </motion.button>)}
                        
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => deleteNotification(notification.id)} className="bg-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/30 px-4 py-2 rounded-2xl transition-all duration-300 border border-red-500/30">
                          <Trash2 className="w-4 h-4"/>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>))}
            </AnimatePresence>
          </div>)}
      </div>
    </div>);
}

