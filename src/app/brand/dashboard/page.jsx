'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, Users, Package, Play, TrendingUp, Eye, Heart, MessageCircle, Settings, Calendar, DollarSign, Star, Edit, Trash2, Camera, Plus, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStoreCognito';
import { useUserProfileStore } from '@/store/userProfileStore';
import { useUserProductsStore } from '@/store/userProductsStore';
import { useUserReelsStore } from '@/store/userReelsStore';
import { useUserReviewsStore } from '@/store/userReviewsStore';
import { toast } from 'sonner';
import { collection, query, where, orderBy, onSnapshot, addDoc } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { updateOrderStatus } from '@/lib/orderManagementService';
import { sendOrderStatusUpdateNotifications } from '@/lib/notificationService';
export default function BrandDashboard() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { profile, fetchProfile } = useUserProfileStore();
    const { products, fetchUserProducts } = useUserProductsStore();
    const { reels, fetchUserReels, fetchUserReelsRealtime, deleteReel } = useUserReelsStore();
    const { reviews, fetchUserReviews } = useUserReviewsStore();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [paymentCalculator, setPaymentCalculator] = useState({
        period: 'monthly', // 'daily', 'weekly', 'monthly', 'yearly'
        startDate: '',
        endDate: ''
    });
    const [paymentHolds, setPaymentHolds] = useState([]);
    const [withdrawRequests, setWithdrawRequests] = useState([]);
    // Check if user is authorized (brand/company/seller)
    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        const loadData = async () => {
            try {
                setLoading(true);
                await Promise.all([
                    fetchProfile(user.sub),
                    fetchUserProducts(user.sub),
                    fetchUserReels(user.sub),
                    fetchUserReviews(user.sub)
                ]);
            }
            catch (error) {
                console.error('Error loading dashboard data:', error);
                toast.error('Failed to load dashboard data');
            }
            finally {
                setLoading(false);
            }
        };
        loadData();
        // Load real orders for this seller
        const loadOrders = () => {
            const q = query(collection(db, 'orders'), where('sellerId', '==', user.sub), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const ordersData = snapshot.docs.map(doc => {
                    var _a;
                    return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { createdAt: ((_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate) ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt) }));
                });
                setOrders(ordersData);
                console.log('📦 Loaded real orders for seller:', ordersData.length);
            });
            return unsubscribe;
        };
        const unsubscribeOrders = loadOrders();
        // Load payment holds and withdraw requests
        const loadPaymentData = () => {
            // Load payment holds
            const holdsQuery = query(collection(db, 'paymentHolds'), where('sellerId', '==', user.sub), orderBy('createdAt', 'desc'));
            const unsubscribeHolds = onSnapshot(holdsQuery, (snapshot) => {
                const holdsData = snapshot.docs.map(doc => {
                    var _a;
                    return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { createdAt: ((_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate) ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt) }));
                });
                setPaymentHolds(holdsData);
            });
            // Load withdraw requests
            const withdrawQuery = query(collection(db, 'withdrawRequests'), where('sellerId', '==', user.sub), orderBy('createdAt', 'desc'));
            const unsubscribeWithdraw = onSnapshot(withdrawQuery, (snapshot) => {
                const withdrawData = snapshot.docs.map(doc => {
                    var _a;
                    return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { createdAt: ((_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate) ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt) }));
                });
                setWithdrawRequests(withdrawData);
            });
            return () => {
                unsubscribeHolds();
                unsubscribeWithdraw();
            };
        };
        const unsubscribePayments = loadPaymentData();
        return () => {
            if (unsubscribeOrders)
                unsubscribeOrders();
            if (unsubscribePayments)
                unsubscribePayments();
        };
    }, [user === null || user === void 0 ? void 0 : user.sub]);
    // Handle order status update
    const handleOrderStatusUpdate = async (orderId, newStatus) => {
        try {
            const result = await updateOrderStatus(orderId, newStatus, `Status updated by seller to ${newStatus}`, 'Seller Dashboard');
            if (result.success) {
                // Find the order to get complete data for notifications
                const order = orders.find(o => o.id === orderId);
                if (order) {
                    // Send notifications to buyer and seller
                    await sendOrderStatusUpdateNotifications(orderId, newStatus, order);
                }
                toast.success(`✅ Order status updated to ${newStatus}. Customer has been notified.`);
            }
            else {
                toast.error('❌ Failed to update order status');
            }
        }
        catch (error) {
            console.error('❌ Error updating status:', error);
            toast.error('❌ Failed to update order status');
        }
    };
    // Payment calculator functions
    const calculateEarnings = (period) => {
        const now = new Date();
        let startDate;
        switch (period) {
            case 'daily':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'weekly':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'yearly':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        const filteredOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= startDate && orderDate <= now;
        });
        const totalEarnings = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);
        const totalOrders = filteredOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalEarnings / totalOrders : 0;
        return {
            totalEarnings,
            totalOrders,
            avgOrderValue,
            period: period.charAt(0).toUpperCase() + period.slice(1)
        };
    };
    // Handle withdraw request
    const handleWithdrawRequest = async (amount) => {
        if (!user) {
            toast.error('❌ User not authenticated');
            return;
        }
        try {
            const availableAmount = orders.filter(order => order.status === 'delivered')
                .reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);
            const heldAmount = paymentHolds.reduce((sum, hold) => sum + (hold.amount || 0), 0);
            const actualAvailable = availableAmount - heldAmount;
            if (amount > actualAvailable) {
                toast.error(`❌ Insufficient funds. Available: $${actualAvailable.toFixed(2)}`);
                return;
            }
            // Add withdraw request to Firebase
            await addDoc(collection(db, 'withdrawRequests'), {
                sellerId: user.sub,
                sellerName: (profile === null || profile === void 0 ? void 0 : profile.name) || 'Unknown Seller',
                amount: amount,
                status: 'pending',
                createdAt: new Date(),
                requestedAt: new Date(),
                paymentMethod: 'bank_transfer', // Default method
                note: `Withdraw request for $${amount.toFixed(2)}`
            });
            toast.success(`✅ Withdraw request submitted for $${amount.toFixed(2)}`);
        }
        catch (error) {
            console.error('❌ Error submitting withdraw request:', error);
            toast.error('❌ Failed to submit withdraw request');
        }
    };
    const formatCount = (count) => {
        if (!count || typeof count !== 'number')
            return '0';
        if (count >= 1000000)
            return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000)
            return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };
    const getAnalytics = () => {
        const totalViews = (reels === null || reels === void 0 ? void 0 : reels.reduce((sum, reel) => sum + (reel.views || 0), 0)) || 0;
        const totalLikes = (reels === null || reels === void 0 ? void 0 : reels.reduce((sum, reel) => sum + (reel.likes || 0), 0)) || 0;
        const totalComments = (reels === null || reels === void 0 ? void 0 : reels.reduce((sum, reel) => sum + (reel.comments || 0), 0)) || 0;
        const avgRating = (reviews === null || reviews === void 0 ? void 0 : reviews.length) ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length : 0;
        // Calculate total revenue from real orders
        const totalRevenue = orders.filter(order => order.status === 'delivered')
            .reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);
        // Calculate total sales from orders
        const totalSales = orders.filter(order => order.status === 'delivered').length;
        // Calculate pending orders
        const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'confirmed').length;
        return {
            totalViews,
            totalLikes,
            totalComments,
            avgRating,
            totalProducts: (products === null || products === void 0 ? void 0 : products.length) || 0,
            totalReels: (reels === null || reels === void 0 ? void 0 : reels.length) || 0,
            totalReviews: (reviews === null || reviews === void 0 ? void 0 : reviews.length) || 0,
            followers: Array.isArray(profile === null || profile === void 0 ? void 0 : profile.followers) ? profile.followers.length : 0,
            following: Array.isArray(profile === null || profile === void 0 ? void 0 : profile.following) ? profile.following.length : 0,
            totalRevenue,
            totalSales,
            pendingOrders,
            totalOrders: orders.length,
            engagementRate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100) : 0
        };
    };
    const analytics = getAnalytics();
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>);
    }
    if (!profile) {
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Profile Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300">Unable to load your profile data.</p>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seller Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300">Welcome back, {profile.name}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/upload/reel" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Camera className="w-4 h-4 mr-2"/>
                Create Reel
              </Link>
              <Link href="/product/upload" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Plus className="w-4 h-4 mr-2"/>
                Add Product
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'reels', label: 'Reels', icon: Play },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'orders', label: 'Orders', icon: Package },
            { id: 'payments', label: 'Payments', icon: DollarSign },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
                <tab.icon className="w-4 h-4 mr-2"/>
                {tab.label}
              </button>))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (<div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600"/>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Followers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCount(analytics.followers)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="w-6 h-6 text-green-600"/>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Products</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalProducts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Play className="w-6 h-6 text-purple-600"/>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Reels</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalReels}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600"/>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.avgRating.toFixed(1)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-red-600"/>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">${formatCount(analytics.totalRevenue)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total Orders</p>
                    <p className="text-3xl font-bold">{analytics.totalOrders}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-200"/>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Completed Sales</p>
                    <p className="text-3xl font-bold">{analytics.totalSales}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-200"/>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100">Pending Orders</p>
                    <p className="text-3xl font-bold">{analytics.pendingOrders}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-200"/>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Reels */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Reels</h3>
                  <Link href="/brand/dashboard?tab=reels" className="text-blue-600 hover:text-blue-700 text-sm">
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  {(reels === null || reels === void 0 ? void 0 : reels.slice(0, 3).map((reel) => (<div key={reel.id} className="flex items-center space-x-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        {reel.thumbnailUrl ? (<img src={reel.thumbnailUrl} alt={reel.title} className="w-full h-full object-cover"/>) : (<div className="w-full h-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-gray-400 dark:text-gray-500"/>
                          </div>)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 truncate">{reel.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1"/>
                            {formatCount(reel.views)}
                          </span>
                          <span className="flex items-center">
                            <Heart className="w-3 h-3 mr-1"/>
                            {formatCount(reel.likes)}
                          </span>
                        </div>
                      </div>
                    </div>))) || (<p className="text-gray-500 text-center py-4">No reels yet</p>)}
                </div>
              </div>

              {/* Recent Products */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Products</h3>
                  <Link href="/brand/dashboard?tab=products" className="text-blue-600 hover:text-blue-700 text-sm">
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  {(products === null || products === void 0 ? void 0 : products.slice(0, 3).map((product) => {
                var _a;
                return (<div key={product.id} className="flex items-center space-x-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        {((_a = product.images) === null || _a === void 0 ? void 0 : _a[0]) ? (<img src={product.images[0]} alt={product.title} className="w-full h-full object-cover"/>) : (<div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400 dark:text-gray-500"/>
                          </div>)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 truncate">{product.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">${product.price}</p>
                      </div>
                    </div>);
            })) || (<p className="text-gray-500 text-center py-4">No products yet</p>)}
                </div>
              </div>
            </div>
          </div>)}

        {activeTab === 'reels' && (<div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Reels</h3>
              <Link href="/upload/reel" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 mr-2"/>
                Create New Reel
              </Link>
            </div>
            
            {reels && reels.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reels.map((reel) => (<div key={reel.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden mb-3">
                      {reel.thumbnailUrl ? (<img src={reel.thumbnailUrl} alt={reel.title} className="w-full h-full object-cover"/>) : (<video src={reel.videoUrl} className="w-full h-full object-cover" muted/>)}
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2 truncate">{reel.title}</h4>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1"/>
                        {formatCount(reel.views)}
                      </span>
                      <span className="flex items-center">
                        <Heart className="w-3 h-3 mr-1"/>
                        {formatCount(reel.likes)}
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="w-3 h-3 mr-1"/>
                        {formatCount(reel.comments)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors">
                        <Edit className="w-3 h-3 inline mr-1"/>
                        Edit
                      </button>
                      <button className="flex-1 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors">
                        <Trash2 className="w-3 h-3 inline mr-1"/>
                        Delete
                      </button>
                    </div>
                  </div>))}
              </div>) : (<div className="text-center py-12">
                <Play className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Reels Yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Create your first reel to get started!</p>
                <Link href="/upload/reel" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Camera className="w-4 h-4 mr-2"/>
                  Create Reel
                </Link>
              </div>)}
          </div>)}

        {activeTab === 'products' && (<div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Products</h3>
              <Link href="/product/upload" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Plus className="w-4 h-4 mr-2"/>
                Add New Product
              </Link>
            </div>
            
            {products && products.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                    var _a;
                    return (<div key={product.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-3">
                      {((_a = product.images) === null || _a === void 0 ? void 0 : _a[0]) ? (<img src={product.images[0]} alt={product.title} className="w-full h-full object-cover"/>) : (<div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400 dark:text-gray-500"/>
                        </div>)}
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2 truncate">{product.title}</h4>
                    <p className="text-lg font-bold text-green-600 mb-3">${product.price}</p>
                    <div className="flex items-center space-x-2">
                      <Link href={`/product/edit/${product.id}`} className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors text-center">
                        <Edit className="w-3 h-3 inline mr-1"/>
                        Edit
                      </Link>
                      <button className="flex-1 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors">
                        <Trash2 className="w-3 h-3 inline mr-1"/>
                        Delete
                      </button>
                    </div>
                  </div>);
                })}
              </div>) : (<div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Products Yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Add your first product to start selling!</p>
                <Link href="/product/upload" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Plus className="w-4 h-4 mr-2"/>
                  Add Product
                </Link>
              </div>)}
          </div>)}

        {activeTab === 'analytics' && (<div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{formatCount(analytics.totalViews)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Total Views</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{formatCount(analytics.totalLikes)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Total Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{formatCount(analytics.totalComments)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Total Comments</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Top Performing Reels</h4>
              <div className="space-y-3">
                {(reels === null || reels === void 0 ? void 0 : reels.sort((a, b) => (b.viewsCount || b.views || 0) - (a.viewsCount || a.views || 0)).slice(0, 5).map((reel, index) => (<div key={reel.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 cursor-pointer" onClick={() => window.open(`/videos?reel=${reel.id}`, '_blank')}>
                      <h5 className="font-medium text-gray-900 truncate hover:text-blue-600">{reel.title || 'Untitled Reel'}</h5>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatCount(reel.viewsCount || reel.views || 0)} views</span>
                        <span>{formatCount(reel.likesCount || reel.likes || 0)} likes</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/upload/reel?edit=${reel.id}`);
                }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Edit Reel">
                        <Edit className="w-4 h-4"/>
                      </button>
                      <button onClick={async (e) => {
                    e.stopPropagation();
                    const confirmed = await new Promise((resolve) => {
                        const modal = document.createElement('div');
                        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                        modal.innerHTML = `
                            <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">Delete Reel</h3>
                                <p class="text-gray-600 mb-6">Are you sure you want to delete this reel? This action cannot be undone.</p>
                                <div class="flex space-x-3">
                                    <button id="cancel" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                                    <button id="confirm" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
                                </div>
                            </div>
                        `;
                        document.body.appendChild(modal);
                        
                        modal.querySelector('#cancel')?.addEventListener('click', () => {
                            document.body.removeChild(modal);
                            resolve(false);
                        });
                        modal.querySelector('#confirm')?.addEventListener('click', () => {
                            document.body.removeChild(modal);
                            resolve(true);
                        });
                    });
                    
                    if (confirmed) {
                        try {
                            await deleteReel(reel.id);
                            toast.success('Reel deleted successfully!');
                        }
                        catch (error) {
                            toast.error('Failed to delete reel. Please try again.');
                        }
                    }
                }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Delete Reel">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>))) || (<p className="text-gray-500 text-center py-4">No reels data available</p>)}
              </div>
            </div>
          </div>)}

        {activeTab === 'orders' && (<div className="space-y-6">
            {/* Orders Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Orders Management</h3>
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Total Orders: {orders.length}
                  </div>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Completed: {orders.filter(order => order.status === 'delivered').length}
                  </div>
                  <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    Revenue: ${orders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Order Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Package className="w-5 h-5 text-yellow-600"/>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-600">Pending</p>
                      <p className="text-lg font-semibold text-yellow-800">
                        {orders.filter(order => order.status === 'pending').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="w-5 h-5 text-blue-600"/>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-600">Processing</p>
                      <p className="text-lg font-semibold text-blue-800">
                        {orders.filter(order => order.status === 'confirmed' || order.status === 'processing').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Package className="w-5 h-5 text-purple-600"/>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-purple-600">Shipped</p>
                      <p className="text-lg font-semibold text-purple-800">
                        {orders.filter(order => order.status === 'shipped' || order.status === 'out_for_delivery').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Package className="w-5 h-5 text-green-600"/>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-600">Delivered</p>
                      <p className="text-lg font-semibold text-green-800">
                        {orders.filter(order => order.status === 'delivered').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.length > 0 ? orders.slice(0, 10).map((order, index) => {
                var _a, _b, _c, _d, _e;
                const statusColors = {
                    pending: 'bg-yellow-100 text-yellow-800',
                    confirmed: 'bg-blue-100 text-blue-800',
                    processing: 'bg-blue-100 text-blue-800',
                    shipped: 'bg-purple-100 text-purple-800',
                    out_for_delivery: 'bg-purple-100 text-purple-800',
                    delivered: 'bg-green-100 text-green-800',
                    cancelled: 'bg-red-100 text-red-800'
                };
                return (<tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            #{order.id.slice(-8).toUpperCase()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {(_a = order.shippingAddress) === null || _a === void 0 ? void 0 : _a.firstName} {(_b = order.shippingAddress) === null || _b === void 0 ? void 0 : _b.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {((_c = order.items) === null || _c === void 0 ? void 0 : _c[0]) && (<>
                                  <img className="h-10 w-10 rounded-lg object-cover" src={((_d = order.items[0].product) === null || _d === void 0 ? void 0 : _d.image) || order.items[0].image || '/placeholder-product.jpg'} alt=""/>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {((_e = order.items[0].product) === null || _e === void 0 ? void 0 : _e.title) || order.items[0].title || 'Product'}
                                    </div>
                                    {order.items.length > 1 && (<div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">+{order.items.length - 1} more items</div>)}
                                  </div>
                                </>)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            ${(order.totalAmount || order.total || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select value={order.status} onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)} className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-0 ${statusColors[order.status]}`}>
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onClick={() => window.open(`/track/${order.id}`, '_blank')} className="text-blue-600 hover:text-blue-900 mr-3">
                              View
                            </button>
                            <button onClick={() => handleOrderStatusUpdate(order.id, order.status === 'pending' ? 'confirmed' : 'shipped')} className="text-green-600 hover:text-green-900">
                              Update
                            </button>
                          </td>
                        </tr>);
            }) : (<tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          No orders found. Orders will appear here when customers purchase your products!
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>)}

        {activeTab === 'payments' && (<div className="space-y-6">
            {/* Payment Calculator */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 Earnings Calculator</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {['daily', 'weekly', 'monthly', 'yearly'].map((period) => {
                const earnings = calculateEarnings(period);
                return (<div key={period} onClick={() => setPaymentCalculator(Object.assign(Object.assign({}, paymentCalculator), { period }))} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentCalculator.period === period
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'}`}>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 capitalize">{period}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">${earnings.totalEarnings.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{earnings.totalOrders} orders</p>
                        <p className="text-xs text-blue-600">Avg: ${earnings.avgOrderValue.toFixed(2)}</p>
                      </div>
                    </div>);
            })}
              </div>
            </div>

            {/* Payments Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payments & Earnings</h3>
                <div className="flex items-center space-x-4">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    <DollarSign className="w-4 h-4 mr-2 inline"/>
                    Withdraw Earnings
                  </button>
                </div>
              </div>

              {/* Payment Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-gradient-to-r from-green-400 to-green-600 p-6 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Total Earnings</p>
                      <p className="text-2xl font-bold">
                        ${orders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0).toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-200"/>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-6 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">This Month</p>
                      <p className="text-2xl font-bold">${calculateEarnings('monthly').totalEarnings.toFixed(2)}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-200"/>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-400 to-purple-600 p-6 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Pending Payments</p>
                      <p className="text-2xl font-bold">
                        ${orders.filter(order => order.status !== 'delivered' && order.status !== 'cancelled')
                .reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0).toFixed(2)}
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-purple-200"/>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-400 to-orange-600 p-6 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">Available to Withdraw</p>
                      <p className="text-2xl font-bold">
                        ${(() => {
                const deliveredAmount = orders.filter(order => order.status === 'delivered')
                    .reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);
                const heldAmount = paymentHolds.reduce((sum, hold) => sum + (hold.amount || 0), 0);
                return (deliveredAmount - heldAmount).toFixed(2);
            })()}
                      </p>
                    </div>
                    <Star className="w-8 h-8 text-orange-200"/>
                  </div>
                </div>
              </div>

              {/* Payment Holds & Withdraw Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Payment Holds */}
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-900 mb-3 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2"/>
                    Payment Holds by Admin
                  </h4>
                  {paymentHolds.length > 0 ? (<div className="space-y-2">
                      {paymentHolds.map((hold, index) => (<div key={hold.id || index} className="bg-white dark:bg-gray-800 p-3 rounded border border-red-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-red-900">${(hold.amount || 0).toFixed(2)}</p>
                              <p className="text-xs text-red-600">{hold.reason || 'Admin hold'}</p>
                            </div>
                            <span className="text-xs text-red-500">
                              {new Date(hold.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>))}
                      <div className="text-sm text-red-700 font-medium">
                        Total Held: ${paymentHolds.reduce((sum, hold) => sum + (hold.amount || 0), 0).toFixed(2)}
                      </div>
                    </div>) : (<p className="text-red-600 text-sm">No payment holds</p>)}
                </div>

                {/* Withdraw Requests */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2"/>
                    Withdraw Requests
                  </h4>
                  <div className="space-y-3">
                    {/* Withdraw Request Form */}
                    <div className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <input type="number" placeholder="Amount to withdraw" className="flex-1 px-3 py-2 border border-blue-300 rounded text-sm" onKeyPress={(e) => {
                if (e.key === 'Enter') {
                    const amount = parseFloat(e.target.value);
                    if (amount > 0) {
                        handleWithdrawRequest(amount);
                        e.target.value = '';
                    }
                }
            }}/>
                        <button onClick={() => {
                const input = document.querySelector('input[placeholder="Amount to withdraw"]');
                const amount = parseFloat(input.value);
                if (amount > 0) {
                    handleWithdrawRequest(amount);
                    input.value = '';
                }
            }} className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
                          Request
                        </button>
                      </div>
                    </div>

                    {/* Recent Withdraw Requests */}
                    {withdrawRequests.length > 0 ? (<div className="space-y-2">
                        {withdrawRequests.slice(0, 3).map((request, index) => (<div key={request.id || index} className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-blue-900">${(request.amount || 0).toFixed(2)}</p>
                                <p className="text-xs text-blue-600">{request.status || 'pending'}</p>
                              </div>
                              <span className="text-xs text-blue-500">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>))}
                      </div>) : (<p className="text-blue-600 text-sm">No withdraw requests</p>)}
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Payment Methods</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center">
                        <div className="w-10 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                        <div className="ml-3">
                          <p className="text-sm font-medium">**** **** **** 4242</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Primary</p>
                        </div>
                      </div>
                      <button className="text-blue-600 text-sm">Edit</button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center">
                        <div className="w-10 h-6 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">BANK</div>
                        <div className="ml-3">
                          <p className="text-sm font-medium">Bank Account ****1234</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Secondary</p>
                        </div>
                      </div>
                      <button className="text-blue-600 text-sm">Edit</button>
                    </div>
                  </div>
                  
                  <button className="w-full mt-3 p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors">
                    + Add Payment Method
                  </button>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Payout Schedule</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Frequency</span>
                      <span className="text-sm font-medium">Weekly</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Next Payout</span>
                      <span className="text-sm font-medium">Friday, Oct 11</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Minimum Payout</span>
                      <span className="text-sm font-medium">$50.00</span>
                    </div>
                  </div>
                  
                  <button className="w-full mt-3 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Update Schedule
                  </button>
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Recent Transactions</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.length > 0 ? orders.slice(0, 15).map((order, index) => {
                const getTransactionType = (order) => {
                    if (order.status === 'cancelled')
                        return 'Refund';
                    if (order.status === 'delivered')
                        return 'Sale';
                    return 'Pending Sale';
                };
                const getTransactionStatus = (order) => {
                    if (order.status === 'delivered')
                        return 'completed';
                    if (order.status === 'cancelled')
                        return 'failed';
                    return 'pending';
                };
                const type = getTransactionType(order);
                const status = getTransactionStatus(order);
                const statusColors = {
                    completed: 'bg-green-100 text-green-800',
                    pending: 'bg-yellow-100 text-yellow-800',
                    failed: 'bg-red-100 text-red-800'
                };
                return (<tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              TXN{order.id.slice(-8).toUpperCase()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {type === 'Refund' ? '-' : '+'}${(order.totalAmount || order.total || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status]}`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                          </tr>);
            }) : (<tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            No transactions found. Transactions will appear here when customers place orders!
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>)}

        {activeTab === 'settings' && (<div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Settings</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Profile Settings</h4>
                <Link href="/profile/edit" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Edit className="w-4 h-4 mr-2"/>
                  Edit Profile
                </Link>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Business Information</h4>
                <p className="text-gray-600 mb-3">Update your business details and verification status</p>
                <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  <Settings className="w-4 h-4 mr-2"/>
                  Business Settings
                </button>
              </div>
            </div>
          </div>)}
      </div>
    </div>);
}

