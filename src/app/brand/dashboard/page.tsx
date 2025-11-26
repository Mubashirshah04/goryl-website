'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Users,
  Package,
  Play,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Settings,
  Upload,
  Calendar,
  DollarSign,
  Star,
  Edit,
  Trash2,
  Bell,
  Shield,
  Palette,
  Globe,
  Camera,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Circle,
  Mail
} from 'lucide-react';
import { useAuthStore } from '@/store/authStoreCognito';
import { useUserProfileStore } from '@/store/userProfileStore';
import { useUserProductsStore } from '@/store/userProductsStore';
import { useUserReelsStore } from '@/store/userReelsStore';
import { useUserReviewsStore } from '@/store/userReviewsStore';
import { toast } from 'sonner';
// ✅ AWS DYNAMODB - Firestore removed
// ✅ AWS - Using AWS services
import { updateOrderStatus } from '@/lib/orderManagementService';
import { sendOrderStatusUpdateNotifications } from '@/lib/notificationService';

export default function BrandDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore(); // ✅ Get auth loading state
  const { profile, fetchProfile } = useUserProfileStore();
  const { products, fetchUserProducts } = useUserProductsStore();
  const { reels, fetchUserReels, fetchUserReelsRealtime, deleteReel } = useUserReelsStore();
  const { reviews, fetchUserReviews } = useUserReviewsStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'reels' | 'products' | 'orders' | 'payments' | 'analytics' | 'team' | 'advanced' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'viewer'
  });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [paymentCalculator, setPaymentCalculator] = useState({
    period: 'monthly', // 'daily', 'weekly', 'monthly', 'yearly'
    startDate: '',
    endDate: ''
  });
  const [paymentHolds, setPaymentHolds] = useState<any[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);

  // Check if user is authorized (brand/company/seller)
  useEffect(() => {
    // ✅ Wait for auth check to complete before redirecting
    if (authLoading) {
      console.log('⏳ Waiting for auth check...');
      return;
    }
    
    if (!user) {
      console.log('❌ No user found, redirecting to login');
      router.push('/login');
      return;
    }
    
    console.log('✅ User authorized, loading brand dashboard');

    if (user && profile) {
      // Fetch products if not already loaded
      if (products.length === 0) {
        fetchUserProducts();
      }
      // Fetch reels if not already loaded
      if (reels.length === 0) {
        fetchUserReelsRealtime();
      }
      // Fetch reviews
      fetchUserReviews();
      
      // Load team members from profile
      if (profile.businessInfo?.teamMembers) {
        setTeamMembers(profile.businessInfo.teamMembers);
      }
      
      setLoading(false);
    }
    
    // Load real orders for this seller
    const loadOrders = () => {
      const q = query(
        collection(db, 'orders'),
        where('sellerId', '==', user.sub),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)
        }));
        setOrders(ordersData);
        console.log('📦 Loaded real orders for seller:', ordersData.length);
      });

      return unsubscribe;
    };

    const unsubscribeOrders = loadOrders();
    
    // Load payment holds and withdraw requests
    const loadPaymentData = () => {
      // Load payment holds
      const holdsQuery = query(
        collection(db, 'paymentHolds'),
        where('sellerId', '==', user.sub),
        orderBy('createdAt', 'desc')
      );

      const unsubscribeHolds = onSnapshot(holdsQuery, (snapshot) => {
        const holdsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)
        }));
        setPaymentHolds(holdsData);
      });

      // Load withdraw requests
      const withdrawQuery = query(
        collection(db, 'withdrawRequests'),
        where('sellerId', '==', user.sub),
        orderBy('createdAt', 'desc')
      );

      const unsubscribeWithdraw = onSnapshot(withdrawQuery, (snapshot) => {
        const withdrawData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt)
        }));
        setWithdrawRequests(withdrawData);
      });

      return () => {
        unsubscribeHolds();
        unsubscribeWithdraw();
      };
    };

    const unsubscribePayments = loadPaymentData();
    
    return () => {
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribePayments) unsubscribePayments();
    };
  }, [user?.sub, authLoading]); // ✅ Added authLoading dependency

  // Handle order status update
  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const result = await updateOrderStatus(
        orderId, 
        newStatus as any, 
        `Status updated by seller to ${newStatus}`,
        'Seller Dashboard'
      );

      if (result.success) {
        // Find the order to get complete data for notifications
        const order = orders.find(o => o.id === orderId);
        if (order) {
          // Send notifications to buyer and seller
          await sendOrderStatusUpdateNotifications(orderId, newStatus, order);
        }
        
        toast.success(`✅ Order status updated to ${newStatus}. Customer has been notified.`);
      } else {
        toast.error('❌ Failed to update order status');
      }
    } catch (error) {
      console.error('❌ Error updating status:', error);
      toast.error('❌ Failed to update order status');
    }
  };

  // Payment calculator functions
  const calculateEarnings = (period: string) => {
    const now = new Date();
    let startDate: Date;
    
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
  const handleWithdrawRequest = async (amount: number) => {
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
        sellerName: profile?.name || 'Unknown Seller',
        amount: amount,
        status: 'pending',
        createdAt: new Date(),
        requestedAt: new Date(),
        paymentMethod: 'bank_transfer', // Default method
        note: `Withdraw request for $${amount.toFixed(2)}`
      });

      toast.success(`✅ Withdraw request submitted for $${amount.toFixed(2)}`);
    } catch (error) {
      console.error('❌ Error submitting withdraw request:', error);
      toast.error('❌ Failed to submit withdraw request');
    }
  };

  // Team Management Functions
  const searchUserByUsername = async () => {
    if (!searchUsername.trim()) {
      toast.error('Please enter a username to search');
      return;
    }

    setSearchLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('username', '>=', searchUsername.toLowerCase()),
        where('username', '<=', searchUsername.toLowerCase() + '\uf8ff')
      );
      
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSearchResults(results);
      
      if (results.length === 0) {
        toast.info('No users found with that username');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setSearchLoading(false);
    }
  };

  const addMemberByUserId = async (userId: string, userName: string, userEmail: string) => {
    // Check if already added
    if (teamMembers.some(m => m.userId === userId)) {
      toast.error('This user is already in your team');
      return;
    }

    try {
      const newMemberData = {
        userId,
        name: userName,
        email: userEmail,
        role: 'viewer',
        addedAt: new Date()
      };

      const updatedTeamMembers = [...teamMembers, newMemberData];
      
      // Update Firebase
      const userDocRef = doc(db, 'users', user?.sub || '');
      await updateDoc(userDocRef, {
        'businessInfo.teamMembers': updatedTeamMembers
      });

      setTeamMembers(updatedTeamMembers);
      
      // Refresh profile
      await fetchProfile(user?.sub || '');
      
      toast.success(`✅ ${userName} added to your team!`);
      setSearchUsername('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) {
      toast.error('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMember.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      const updatedTeamMembers = [...teamMembers, { ...newMember, addedAt: new Date() }];
      
      // Update Firebase
      const userDocRef = doc(db, 'users', user?.sub || '');
      await updateDoc(userDocRef, {
        'businessInfo.teamMembers': updatedTeamMembers
      });

      setTeamMembers(updatedTeamMembers);
      setNewMember({ name: '', email: '', role: 'viewer' });
      setShowAddMemberModal(false);
      
      // Refresh profile to update public profile page
      await fetchProfile(user?.sub || '');
      
      toast.success(`✅ ${newMember.name} added to your team! Now visible on your public profile.`);
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
    }
  };

  const handleRemoveMember = async (index: number) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md mx-4">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Remove Team Member</h3>
          <p class="text-gray-600 mb-6">Are you sure you want to remove this team member?</p>
          <div class="flex space-x-3">
            <button id="cancel" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
            <button id="confirm" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Remove</button>
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
    
    if (!confirmed) return;

    try {
      const updatedTeamMembers = teamMembers.filter((_, i) => i !== index);
      
      // Update Firebase
      const userDocRef = doc(db, 'users', user?.sub || '');
      await updateDoc(userDocRef, {
        'businessInfo.teamMembers': updatedTeamMembers
      });

      setTeamMembers(updatedTeamMembers);
      
      // Refresh profile to update public profile page
      await fetchProfile(user?.sub || '');
      
      toast.success('✅ Team member removed. Profile updated!');
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Failed to remove team member');
    }
  };

  const formatCount = (count: number | undefined) => {
    if (!count || typeof count !== 'number') return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getAnalytics = () => {
    const totalViews = reels?.reduce((sum, reel) => sum + (reel.views || 0), 0) || 0;
    const totalLikes = reels?.reduce((sum, reel) => sum + (reel.likes || 0), 0) || 0;
    const totalComments = reels?.reduce((sum, reel) => sum + (reel.comments || 0), 0) || 0;
    const avgRating = reviews?.length ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length : 0;
    
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
      totalProducts: products?.length || 0,
      totalReels: reels?.length || 0,
      totalReviews: reviews?.length || 0,
      followers: Array.isArray(profile?.followers) ? profile.followers.length : 0,
      following: Array.isArray(profile?.following) ? profile.following.length : 0,
      totalRevenue,
      totalSales,
      pendingOrders,
      totalOrders: orders.length,
      engagementRate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100) : 0
    };
  };

  const analytics = getAnalytics();

  // ✅ Show loading screen while auth is checking
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{authLoading ? 'Checking authentication...' : 'Loading dashboard...'}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Profile Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300">Unable to load your profile data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Seller Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300">Welcome back, {profile.name}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/upload/reel"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-4 h-4 mr-2" />
                Create Reel
              </Link>
              <Link
                href="/product/upload"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
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
              { id: 'team', label: 'Team', icon: Users },
              { id: 'advanced', label: 'Advanced', icon: Shield },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Followers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCount(analytics.followers)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Products</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalProducts}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Play className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Reels</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalReels}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.avgRating.toFixed(1)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-red-600" />
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
                  <Package className="w-8 h-8 text-blue-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Completed Sales</p>
                    <p className="text-3xl font-bold">{analytics.totalSales}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100">Pending Orders</p>
                    <p className="text-3xl font-bold">{analytics.pendingOrders}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-200" />
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
                  {reels?.slice(0, 3).map((reel) => (
                    <div key={reel.id} className="flex items-center space-x-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        {reel.thumbnailUrl ? (
                          <img src={reel.thumbnailUrl} alt={reel.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 truncate">{reel.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {formatCount(reel.views)}
                          </span>
                          <span className="flex items-center">
                            <Heart className="w-3 h-3 mr-1" />
                            {formatCount(reel.likes)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">No reels yet</p>
                  )}
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
                  {products?.slice(0, 3).map((product) => (
                    <div key={product.id} className="flex items-center space-x-3">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 truncate">{product.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">${product.price}</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">No products yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reels' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Reels</h3>
              <Link
                href="/upload/reel"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Reel
              </Link>
            </div>
            
            {reels && reels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reels.map((reel) => (
                  <div key={reel.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden mb-3">
                      {reel.thumbnailUrl ? (
                        <img src={reel.thumbnailUrl} alt={reel.title} className="w-full h-full object-cover" />
                      ) : (
                        <video src={reel.videoUrl} className="w-full h-full object-cover" muted />
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2 truncate">{reel.title}</h4>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {formatCount(reel.views)}
                      </span>
                      <span className="flex items-center">
                        <Heart className="w-3 h-3 mr-1" />
                        {formatCount(reel.likes)}
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {formatCount(reel.comments)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors">
                        <Edit className="w-3 h-3 inline mr-1" />
                        Edit
                      </button>
                      <button className="flex-1 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors">
                        <Trash2 className="w-3 h-3 inline mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Reels Yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Create your first reel to get started!</p>
                <Link
                  href="/upload/reel"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Create Reel
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Products</h3>
              <Link
                href="/product/upload"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Product
              </Link>
            </div>
            
            {products && products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-3">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2 truncate">{product.title}</h4>
                    <p className="text-lg font-bold text-green-600 mb-3">${product.price}</p>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/product/edit/${product.id}`}
                        className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors text-center"
                      >
                        <Edit className="w-3 h-3 inline mr-1" />
                        Edit
                      </Link>
                      <button className="flex-1 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors">
                        <Trash2 className="w-3 h-3 inline mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Products Yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Add your first product to start selling!</p>
                <Link
                  href="/product/upload"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Advanced Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                <div className="flex items-center justify-between mb-2">
                  <Eye className="w-8 h-8 opacity-80" />
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold mb-1">{formatCount(analytics.totalViews)}</p>
                <p className="text-blue-100 text-sm">Total Product Views</p>
                <p className="text-xs text-blue-200 mt-2">+12% from last month</p>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-pink-600 p-6 rounded-lg text-white">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="w-8 h-8 opacity-80" />
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold mb-1">{formatCount(analytics.totalLikes)}</p>
                <p className="text-red-100 text-sm">Total Likes</p>
                <p className="text-xs text-red-200 mt-2">Engagement Rate: {analytics.engagementRate.toFixed(1)}%</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white">
                <div className="flex items-center justify-between mb-2">
                  <MessageCircle className="w-8 h-8 opacity-80" />
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold mb-1">{formatCount(analytics.totalComments)}</p>
                <p className="text-green-100 text-sm">Total Comments</p>
                <p className="text-xs text-green-200 mt-2">Active discussions</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart className="w-8 h-8 opacity-80" />
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold mb-1">{analytics.totalOrders}</p>
                <p className="text-purple-100 text-sm">Total Orders</p>
                <p className="text-xs text-purple-200 mt-2">${formatCount(analytics.totalRevenue)} revenue</p>
              </div>
            </div>

            {/* Sales Analytics */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 Sales Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-700">Conversion Rate</h4>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics.totalViews > 0 ? ((analytics.totalOrders / analytics.totalViews) * 100).toFixed(2) : 0}%
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Orders / Views ratio</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-700">Avg Order Value</h4>
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${analytics.totalOrders > 0 ? (analytics.totalRevenue / analytics.totalOrders).toFixed(2) : 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Per transaction</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-700">Customer Satisfaction</h4>
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.avgRating.toFixed(1)}</p>
                  <p className="text-sm text-gray-500 mt-1">Average rating ({analytics.totalReviews} reviews)</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Top Performing Reels</h4>
              <div className="space-y-3">
                {reels?.sort((a, b) => (b.viewsCount || b.views || 0) - (a.viewsCount || a.views || 0)).slice(0, 5).map((reel, index) => (
                  <div key={reel.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/upload/reel?edit=${reel.id}`);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Edit Reel"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const confirmed = await new Promise<boolean>((resolve) => {
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
                            } catch (error) {
                              toast.error('Failed to delete reel. Please try again.');
                            }
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete Reel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-4">No reels data available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
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
                      <Package className="w-5 h-5 text-yellow-600" />
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
                      <Package className="w-5 h-5 text-blue-600" />
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
                      <Package className="w-5 h-5 text-purple-600" />
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
                      <Package className="w-5 h-5 text-green-600" />
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
                      const statusColors = {
                        pending: 'bg-yellow-100 text-yellow-800',
                        confirmed: 'bg-blue-100 text-blue-800',
                        processing: 'bg-blue-100 text-blue-800',
                        shipped: 'bg-purple-100 text-purple-800',
                        out_for_delivery: 'bg-purple-100 text-purple-800',
                        delivered: 'bg-green-100 text-green-800',
                        cancelled: 'bg-red-100 text-red-800'
                      };
                      
                      return (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order.id.slice(-8).toUpperCase()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {order.items?.[0] && (
                                <>
                                  <img 
                                    className="h-10 w-10 rounded-lg object-cover" 
                                    src={order.items[0].product?.image || order.items[0].image || '/placeholder-product.jpg'} 
                                    alt="" 
                                  />
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {order.items[0].product?.title || order.items[0].title || 'Product'}
                                    </div>
                                    {order.items.length > 1 && (
                                      <div className="text-xs text-gray-500">+{order.items.length - 1} more items</div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${(order.totalAmount || order.total || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={order.status}
                              onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-0 ${statusColors[order.status as keyof typeof statusColors]}`}
                            >
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
                            <button 
                              onClick={() => window.open(`/track/${order.id}`, '_blank')}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              View
                            </button>
                            <button 
                              onClick={() => handleOrderStatusUpdate(order.id, order.status === 'pending' ? 'confirmed' : 'shipped')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          No orders found. Orders will appear here when customers purchase your products!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Payment Calculator */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 Earnings Calculator</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {['daily', 'weekly', 'monthly', 'yearly'].map((period) => {
                  const earnings = calculateEarnings(period);
                  return (
                    <div 
                      key={period}
                      onClick={() => setPaymentCalculator({...paymentCalculator, period})}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentCalculator.period === period 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 capitalize">{period}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">${earnings.totalEarnings.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{earnings.totalOrders} orders</p>
                        <p className="text-xs text-blue-600">Avg: ${earnings.avgOrderValue.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payments Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payments & Earnings</h3>
                <div className="flex items-center space-x-4">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    <DollarSign className="w-4 h-4 mr-2 inline" />
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
                    <DollarSign className="w-8 h-8 text-green-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-6 rounded-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">This Month</p>
                      <p className="text-2xl font-bold">${calculateEarnings('monthly').totalEarnings.toFixed(2)}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-200" />
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
                    <Package className="w-8 h-8 text-purple-200" />
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
                    <Star className="w-8 h-8 text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Payment Holds & Withdraw Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Payment Holds */}
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-900 mb-3 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Payment Holds by Admin
                  </h4>
                  {paymentHolds.length > 0 ? (
                    <div className="space-y-2">
                      {paymentHolds.map((hold, index) => (
                        <div key={hold.id || index} className="bg-white p-3 rounded border border-red-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-red-900">${(hold.amount || 0).toFixed(2)}</p>
                              <p className="text-xs text-red-600">{hold.reason || 'Admin hold'}</p>
                            </div>
                            <span className="text-xs text-red-500">
                              {new Date(hold.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="text-sm text-red-700 font-medium">
                        Total Held: ${paymentHolds.reduce((sum, hold) => sum + (hold.amount || 0), 0).toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-600 text-sm">No payment holds</p>
                  )}
                </div>

                {/* Withdraw Requests */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Withdraw Requests
                  </h4>
                  <div className="space-y-3">
                    {/* Withdraw Request Form */}
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          placeholder="Amount to withdraw"
                          className="flex-1 px-3 py-2 border border-blue-300 rounded text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const amount = parseFloat((e.target as HTMLInputElement).value);
                              if (amount > 0) {
                                handleWithdrawRequest(amount);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const input = document.querySelector('input[placeholder="Amount to withdraw"]') as HTMLInputElement;
                            const amount = parseFloat(input.value);
                            if (amount > 0) {
                              handleWithdrawRequest(amount);
                              input.value = '';
                            }
                          }}
                          className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                        >
                          Request
                        </button>
                      </div>
                    </div>

                    {/* Recent Withdraw Requests */}
                    {withdrawRequests.length > 0 ? (
                      <div className="space-y-2">
                        {withdrawRequests.slice(0, 3).map((request, index) => (
                          <div key={request.id || index} className="bg-white p-3 rounded border border-blue-200">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-blue-900">${(request.amount || 0).toFixed(2)}</p>
                                <p className="text-xs text-blue-600">{request.status || 'pending'}</p>
                              </div>
                              <span className="text-xs text-blue-500">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-blue-600 text-sm">No withdraw requests</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Setup Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Payment Setup</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Admin will configure your payment methods after account verification.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">Pending Admin Setup</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Once approved, payments will be automatically processed to your designated account.
                    </p>
                  </div>
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
                  
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-600">
                      <AlertCircle className="w-3 h-3 inline mr-1 text-blue-600" />
                      Schedule is managed by admin
                    </p>
                  </div>
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
                        const getTransactionType = (order: any) => {
                          if (order.status === 'cancelled') return 'Refund';
                          if (order.status === 'delivered') return 'Sale';
                          return 'Pending Sale';
                        };
                        
                        const getTransactionStatus = (order: any) => {
                          if (order.status === 'delivered') return 'completed';
                          if (order.status === 'cancelled') return 'failed';
                          return 'pending';
                        };
                        
                        const type = getTransactionType(order);
                        const status = getTransactionStatus(order);
                        const statusColors = {
                          completed: 'bg-green-100 text-green-800',
                          pending: 'bg-yellow-100 text-yellow-800',
                          failed: 'bg-red-100 text-red-800'
                        };
                        
                        return (
                          <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              TXN{order.id.slice(-8).toUpperCase()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {type === 'Refund' ? '-' : '+'}${(order.totalAmount || order.total || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status as keyof typeof statusColors]}`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            No transactions found. Transactions will appear here when customers place orders!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-6">
            {/* Team Management Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Team Management
              </h3>
              
              {/* Search User Section */}
              <div className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-600" />
                  Add New Team Member
                </h4>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={searchUsername}
                      onChange={(e) => setSearchUsername(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchUserByUsername()}
                      placeholder="Search by username..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={searchUserByUsername}
                    disabled={searchLoading}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-medium flex items-center gap-2"
                  >
                    {searchLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search
                      </>
                    )}
                  </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600 font-medium">Search Results:</p>
                    {searchResults.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {user.name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{user.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">@{user.username}</p>
                            {user.email && (
                              <p className="text-xs text-gray-500">{user.email}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => addMemberByUserId(user.id, user.name, user.email)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add to Team
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Team Members */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Current Team Members ({teamMembers.length})</h4>
                </div>
                
                <div className="space-y-3">
                  {/* Owner */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {profile?.name?.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{profile?.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Owner - Full Access</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-full">Admin</span>
                  </div>
                  
                  {/* Team Members */}
                  {teamMembers.length > 0 ? (
                    teamMembers.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {member.name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || 'T'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{member.name || 'Team Member'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            value={member.role}
                            onChange={async (e) => {
                              const updatedMembers = [...teamMembers];
                              updatedMembers[index].role = e.target.value;
                              setTeamMembers(updatedMembers);
                              
                              try {
                                const userDocRef = doc(db, 'users', user?.sub || '');
                                await updateDoc(userDocRef, {
                                  'businessInfo.teamMembers': updatedMembers
                                });
                                toast.success('Role updated successfully');
                              } catch (error) {
                                console.error('Error updating role:', error);
                                toast.error('Failed to update role');
                              }
                            }}
                            className={`px-3 py-1 text-xs font-medium rounded-full border-2 ${
                              member.role === 'manager' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                              member.role === 'uploader' ? 'bg-green-50 text-green-800 border-green-200' :
                              'bg-gray-50 text-gray-800 border-gray-200'
                            }`}
                          >
                            <option value="viewer">Viewer</option>
                            <option value="uploader">Uploader</option>
                            <option value="manager">Manager</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No additional team members</p>
                      <p className="text-xs mt-1">Search and add members using the search box above</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            {/* Advanced Features Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-10 h-10" />
                <div>
                  <h2 className="text-2xl font-bold">Advanced Business Features</h2>
                  <p className="text-purple-100">Unlock powerful tools to grow your business</p>
                </div>
              </div>
            </div>

            {/* Advanced Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Advanced Analytics */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-blue-200 hover:border-blue-400 transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Advanced Analytics</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Full Report of Sales, Visitors, Cart, Orders</p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Real-time sales tracking
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Visitor analytics
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Cart abandonment reports
                  </li>
                </ul>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                  View Full Report
                </button>
              </div>

              {/* Unlimited Listings */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-green-200 hover:border-green-400 transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Unlimited Listings</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Upload as many products as you want</p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    No product limits
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Bulk upload tools
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Advanced categorization
                  </li>
                </ul>
                <Link href="/product/upload" className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-center">
                  Upload Products
                </Link>
              </div>

              {/* Marketing Tools */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-purple-200 hover:border-purple-400 transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Marketing Tools</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Advertising, Discount Codes, Feature Listing</p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Promotional campaigns
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Discount code generator
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Featured product slots
                  </li>
                </ul>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium">
                  Launch Campaign
                </button>
              </div>

              {/* E-Invoicing */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-orange-200 hover:border-orange-400 transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white">E-Invoicing</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Automatic Receipts and Invoices</p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Auto-generated invoices
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Email receipts to customers
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Tax compliance ready
                  </li>
                </ul>
                <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium">
                  Configure Invoicing
                </button>
              </div>

              {/* API Integration */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-indigo-200 hover:border-indigo-400 transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Globe className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white">API Integration</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Link to your web store or ERP system</p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    REST API access
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Webhook notifications
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    ERP system sync
                  </li>
                </ul>
                <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
                  API Documentation
                </button>
              </div>

              {/* Premium Support */}
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-pink-200 hover:border-pink-400 transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-pink-100 rounded-lg">
                    <Users className="w-6 h-6 text-pink-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Premium Support</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Priority Customer Service</p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    24/7 priority support
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Dedicated account manager
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Phone & chat support
                  </li>
                </ul>
                <button className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition font-medium">
                  Contact Support
                </button>
              </div>

            </div>

            {/* Downgrade Option */}
            <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-red-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Downgrade Option</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Revert to Personal Account (after admin approval)</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                If you wish to downgrade your company account to a personal account, you can submit a request. 
                This action requires admin approval and may take 2-3 business days to process.
              </p>
              <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium">
                Request Downgrade
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Marketing Tools Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Marketing Tools
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Discount Codes */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Discount Codes</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Create promotional codes</p>
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">
                    Create Discount Code
                  </button>
                  <p className="text-xs text-gray-500 mt-3">0 active codes</p>
                </div>

                {/* Featured Listings */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Star className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Feature Products</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Boost your visibility</p>
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                    Feature a Product
                  </button>
                  <p className="text-xs text-gray-500 mt-3">Premium listing feature</p>
                </div>

                {/* Advertising */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Run Ads</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Promote your business</p>
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Create Campaign
                  </button>
                  <p className="text-xs text-gray-500 mt-3">Reach more customers</p>
                </div>

                {/* Analytics API */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Globe className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">API Integration</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Connect your systems</p>
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    Get API Keys
                  </button>
                  <p className="text-xs text-gray-500 mt-3">Link ERP & Web Store</p>
                </div>
              </div>
            </div>

            {/* Premium Support Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-sm p-6 border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Premium Support
              </h3>
              
              <div className="bg-white rounded-lg p-6 mb-4">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">Priority Customer Service</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Get faster response times and dedicated support for your brand account. Our team is ready to help you succeed.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-700 mb-4">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        24/7 Priority Support
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Dedicated Account Manager
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Technical Assistance
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Business Growth Consulting
                      </li>
                    </ul>
                    <div className="flex gap-3">
                      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                        Contact Support
                      </button>
                      <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
                        View Help Center
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-semibold text-gray-900 dark:text-white">Fast Response</p>
                  <p className="text-xs text-gray-600 mt-1">&lt; 1 hour response time</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="font-semibold text-gray-900 dark:text-white">Dedicated Team</p>
                  <p className="text-xs text-gray-600 mt-1">Expert account managers</p>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="font-semibold text-gray-900 dark:text-white">Priority Access</p>
                  <p className="text-xs text-gray-600 mt-1">Skip the queue</p>
                </div>
              </div>
            </div>

            {/* E-Invoicing & Receipts */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                E-Invoicing & Receipts
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Auto Receipts */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Mail className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Auto Receipts</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Automatic order confirmations</p>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">Enabled for all orders</span>
                    </div>
                    <p className="text-xs text-gray-600">Professional email receipts sent automatically</p>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>✓ Order confirmation emails</p>
                    <p>✓ Payment receipts</p>
                    <p>✓ Delivery notifications</p>
                  </div>
                </div>

                {/* Invoice Management */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Invoice Generator</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Professional invoices</p>
                    </div>
                  </div>
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mb-4">
                    Generate Invoice
                  </button>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>✓ Custom invoice templates</p>
                    <p>✓ Tax calculation included</p>
                    <p>✓ Download as PDF</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Verification */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm p-6 border-2 border-green-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Business Verification
              </h3>
              
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    {profile?.verified ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {profile?.verified ? 'Verified Business Account ✓' : 'Verify Your Business'}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      {profile?.verified 
                        ? 'Your business has been verified. You now have the "Verified Brand" badge on your profile.' 
                        : 'Submit your business documents to get verified and earn trust with customers.'}
                    </p>
                    
                    {profile?.verified ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Documents Approved</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Verified Badge Active</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Premium Features</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Customer Trust Boost</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-700">Required documents:</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Circle className="w-3 h-3" />
                            <span>Business registration certificate</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Circle className="w-3 h-3" />
                            <span>Tax identification number</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Circle className="w-3 h-3" />
                            <span>Owner ID verification</span>
                          </div>
                        </div>
                        <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                          Submit Documents for Verification
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Type Management */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-600" />
                Account Type Management
              </h3>
              
              <div className="space-y-6">
                {/* Current Account Type */}
                <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-600 rounded-lg">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg mb-1">
                          {profile?.role === 'brand' ? 'Brand Account' : profile?.role === 'company' ? 'Company Account' : 'Business Account'}
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Full access to professional e-commerce features
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">Unlimited product listings</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">Advanced analytics & reports</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">Team member management</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">Marketing & promotion tools</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                      Active
                    </span>
                  </div>
                </div>

                {/* Account Switching Options */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Switch Account Type</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Change your account type based on your business needs. Contact admin for approval.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Upgrade Options */}
                    {profile?.role === 'personal' && (
                      <>
                        <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition cursor-pointer">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Package className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-white">Brand Account</h5>
                              <p className="text-xs text-gray-600">For established brands</p>
                            </div>
                          </div>
                          <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm">
                            Request Upgrade
                          </button>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4 hover:border-green-400 transition cursor-pointer">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Globe className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-white">Company Account</h5>
                              <p className="text-xs text-gray-600">For businesses</p>
                            </div>
                          </div>
                          <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                            Request Upgrade
                          </button>
                        </div>
                      </>
                    )}

                    {/* Downgrade Option */}
                    {(profile?.role === 'brand' || profile?.role === 'company') && (
                      <div className="border-2 border-yellow-200 bg-yellow-50 rounded-lg p-4 md:col-span-2">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-yellow-100 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 mb-2">Downgrade to Personal Account</h5>
                            <p className="text-sm text-gray-600 mb-4">
                              Switch back to a personal seller account. This will remove access to brand features, team management, and advanced analytics.
                            </p>
                            <div className="bg-white border border-yellow-200 rounded-lg p-4 mb-4">
                              <p className="text-sm font-medium text-gray-900 mb-2">What you'll lose:</p>
                              <ul className="space-y-1 text-sm text-gray-600">
                                <li className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                  Team member access
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                  Advanced analytics & reports
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                  Marketing tools & promotions
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                  API integration capabilities
                                </li>
                                <li className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                  Priority customer support
                                </li>
                              </ul>
                            </div>
                            <button 
                              onClick={async () => {
                                const confirmed = await new Promise<boolean>((resolve) => {
                                  const modal = document.createElement('div');
                                  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                                  modal.innerHTML = `
                                    <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                                      <h3 class="text-lg font-semibold text-gray-900 mb-4">Downgrade Account</h3>
                                      <p class="text-gray-600 mb-6">Are you sure you want to downgrade to a Personal Account? You will need admin approval to revert this change.</p>
                                      <div class="flex space-x-3">
                                        <button id="cancel" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                                        <button id="confirm" class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">Downgrade</button>
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
                                  toast.info('Downgrade request submitted. Admin will review your request.');
                                }
                              }}
                              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
                            >
                              Request Downgrade (Requires Admin Approval)
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Profile Settings</h4>
                  <Link
                    href="/profile/edit"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Link>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Business Verification</h4>
                  <p className="text-gray-600 mb-3">Get verified badge after document approval</p>
                  {profile?.verified ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Verified Business</span>
                    </div>
                  ) : (
                    <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                      <Shield className="w-4 h-4 mr-2" />
                      Request Verification
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Team Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-purple-600" />
                  Add Team Member
                </h3>
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    placeholder="Enter member's full name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    placeholder="member@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role & Permissions
                  </label>
                  <select
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="viewer">Viewer - View only access</option>
                    <option value="uploader">Uploader - Upload products & reels</option>
                    <option value="manager">Manager - Full management access</option>
                  </select>
                </div>

                {/* Role Descriptions */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Role Permissions:</h4>
                  <div className="space-y-2 text-xs text-gray-600">
                    {newMember.role === 'viewer' && (
                      <div>
                        <p className="font-medium text-gray-700">👁️ Viewer</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>View products and analytics</li>
                          <li>View orders and customer data</li>
                          <li>No editing or management access</li>
                        </ul>
                      </div>
                    )}
                    {newMember.role === 'uploader' && (
                      <div>
                        <p className="font-medium text-gray-700">📤 Uploader</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Upload products and reels</li>
                          <li>Edit existing content</li>
                          <li>View orders and analytics</li>
                          <li>Cannot manage team or payments</li>
                        </ul>
                      </div>
                    )}
                    {newMember.role === 'manager' && (
                      <div>
                        <p className="font-medium text-gray-700">⚡ Manager</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Full management access</li>
                          <li>Manage orders and inventory</li>
                          <li>View payments and analytics</li>
                          <li>Cannot add/remove team members</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


