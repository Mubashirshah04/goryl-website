'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { debounce } from '@/utils/debounce';
import { useSession } from '@/hooks/useCustomSession';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, Shield, FileText, BarChart3, Activity, Zap, AlertTriangle, Clock, Star, Download, ChevronRight, Flag } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { subscribeToAdminStats, subscribeToAuditLogs } from '@/lib/awsAdminService';
export default function AdminOverviewPage() {
    const { data: session, status } = useSession();
    const user = session?.user;
    const authLoading = status === 'loading';
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingReportsCount, setPendingReportsCount] = useState(0);
    const quickActions = [
        {
            id: 'users',
            title: 'User Management',
            description: 'Manage users and permissions',
            icon: Users,
            href: '/admin/users',
            color: 'from-blue-500 to-cyan-500',
            count: 12
        },
        {
            id: 'applications',
            title: 'Applications',
            description: 'Review seller applications',
            icon: Shield,
            href: '/admin/applications',
            color: 'from-yellow-500 to-orange-500',
            count: 5
        },
        {
            id: 'products',
            title: 'Product Management',
            description: 'Manage product listings',
            icon: Package,
            href: '/admin/products',
            color: 'from-green-500 to-emerald-500',
            count: 8
        },
        {
            id: 'orders',
            title: 'Orders & Payments',
            description: 'Track orders and payments',
            icon: ShoppingCart,
            href: '/admin/orders',
            color: 'from-purple-500 to-fuchsia-500',
            count: 23
        },
        {
            id: 'payouts',
            title: 'Payouts Management',
            description: 'Manage seller payouts and escrow',
            icon: DollarSign,
            href: '/admin/payouts',
            color: 'from-emerald-500 to-teal-500',
            count: 8
        },
        {
            id: 'analytics',
            title: 'Analytics',
            description: 'Advanced analytics and insights',
            icon: BarChart3,
            href: '/admin/analytics',
            color: 'from-indigo-500 to-purple-500'
        },
        {
            id: 'reports',
            title: 'Reports',
            description: 'Review and manage content reports',
            icon: Flag,
            href: '/admin/reports',
            color: 'from-red-500 to-pink-500',
            count: pendingReportsCount
        }
    ];
    const aiInsights = [
        {
            id: '1',
            type: 'success',
            title: 'Top Performing Category',
            description: 'Electronics category shows 34% growth this week',
            icon: TrendingUp,
            action: 'View Details'
        },
        {
            id: '2',
            type: 'warning',
            title: 'High Refund Rate',
            description: 'Fashion category has 12% refund rate - above threshold',
            icon: AlertTriangle,
            action: 'Investigate'
        },
        {
            id: '3',
            type: 'info',
            title: 'Peak Activity Time',
            description: 'Most user activity occurs between 7-9 PM',
            icon: Clock,
            action: 'View Analytics'
        }
    ];
    // Check authentication and admin role - PERMANENT FIX with delay
    useEffect(() => {
        // Wait for auth to fully load
        if (authLoading) {
            console.log('⏳ Waiting for auth to load...');
            return;
        }
        
        // Add small delay to ensure hydration is complete
        const checkTimeout = setTimeout(() => {
            // Redirect to login if no user
            if (!user) {
                console.log('❌ No user found, redirecting to login');
                router.replace('/admin/login');
                return;
            }
            
            // Check admin email - hardcoded for reliability
            const ADMIN_EMAILS = ['mobiletesting736@gmail.com'];
            const userEmail = user.email || '';
            const isAdmin = ADMIN_EMAILS.includes(userEmail);
            
            console.log('🔍 Admin check:', { userEmail, isAdmin, ADMIN_EMAILS, user });
            
            // Redirect non-admin users silently
            if (!isAdmin) {
                console.log('❌ Not admin, redirecting to home');
                router.replace('/');
                return;
            }
            
            console.log('✅ Admin verified, staying on admin page');
        }, 100); // Small delay to let hydration complete
        
        return () => clearTimeout(checkTimeout);
    }, [user, authLoading, router]);
    useEffect(() => {
        // Only subscribe to data if user is authenticated and is admin
        if (authLoading || !user) return;
        
        // Verify admin status using email - hardcoded for reliability
        const ADMIN_EMAILS = ['mobiletesting736@gmail.com'];
        const userEmail = user.email || '';
        const isAdmin = ADMIN_EMAILS.includes(userEmail);
        
        if (!isAdmin) return;
        
        // Subscribe to real-time admin stats from AWS
        const unsubscribeStats = subscribeToAdminStats((newStats) => {
            setStats(newStats);
            setLoading(false);
        });
        
        // Subscribe to recent audit logs from AWS
        const unsubscribeAudit = subscribeToAuditLogs({}, (logs) => {
            setRecentActivity(logs.slice(0, 10)); // Get last 10 activities
        });

        // TODO: Add AWS-based reports count subscription
        // For now, set to 0
        setPendingReportsCount(0);

        return () => {
            unsubscribeStats();
            unsubscribeAudit();
        };
    }, [user, authLoading]);
    // Memoized formatters to prevent recreation on each render
    const formatCurrency = useCallback((amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }, []);

    const formatDate = useCallback((date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }, []);

    const getStatusColor = useCallback((status) => {
        switch (status) {
            case 'approved':
            case 'delivered':
            case 'active':
                return 'text-green-600';
            case 'pending':
                return 'text-yellow-600';
            case 'rejected':
            case 'banned':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    }, []);

    const getActionIcon = useCallback((action) => {
        switch (action) {
            case 'UPDATE_USER_ROLE':
            case 'UPDATE_KYC_STATUS':
                return '👤';
            case 'UPDATE_PRODUCT_STATUS':
            case 'FEATURE_PRODUCT':
                return '📦';
            case 'UPDATE_ORDER_STATUS':
                return '🛒';
            case 'BAN_USER':
            case 'UNBAN_USER':
                return '🚫';
            default:
                return '📝';
        }
    }, []);

    // Memoized quickActions with pending reports count
    const memoizedQuickActions = useMemo(() => {
        return quickActions.map(action => 
            action.id === 'reports' 
                ? { ...action, count: pendingReportsCount }
                : action
        );
    }, [pendingReportsCount]);

    // Debounced search handler
    const debouncedSearch = useCallback(
        debounce((query) => {
            setSearchQuery(query);
        }, 300),
        []
    );

    const handleSearch = useCallback((query) => {
        debouncedSearch(query);
    }, [debouncedSearch]);

    // Export Report Function
    const exportReport = useCallback(() => {
        if (!stats) {
            toast.error('Data not loaded yet');
            return;
        }

        try {
            // Create comprehensive report data
            const reportData = {
                exportedAt: new Date().toISOString(),
                platformStats: {
                    totalUsers: stats.totalUsers || 0,
                    totalProducts: stats.totalProducts || 0,
                    totalOrders: stats.totalOrders || 0,
                    totalRevenue: stats.totalRevenue || 0,
                    pendingApplications: stats.pendingApplications || 0,
                    pendingProducts: stats.pendingProducts || 0,
                    monthlyGrowth: stats.monthlyGrowth || 0
                },
                revenueAnalytics: stats.revenueAnalytics || {},
                userRoles: stats.userRoles || {},
                orderStatus: stats.orderStatus || {},
                productStatus: stats.productStatus || {},
                recentActivity: recentActivity.slice(0, 50) // Last 50 activities
            };

            // Convert to CSV format
            const csvRows = [
                ['Admin Dashboard Report', ''],
                ['Exported At', reportData.exportedAt],
                [''],
                ['Platform Statistics', ''],
                ['Total Users', reportData.platformStats.totalUsers],
                ['Total Products', reportData.platformStats.totalProducts],
                ['Total Orders', reportData.platformStats.totalOrders],
                ['Total Revenue', formatCurrency(reportData.platformStats.totalRevenue)],
                ['Pending Applications', reportData.platformStats.pendingApplications],
                ['Pending Products', reportData.platformStats.pendingProducts],
                ['Monthly Growth (%)', reportData.platformStats.monthlyGrowth],
                [''],
                ['Revenue Analytics', ''],
                ['Today', formatCurrency(reportData.revenueAnalytics.today || 0)],
                ['Last 7 Days', formatCurrency(reportData.revenueAnalytics.week7d || 0)],
                ['Last 30 Days', formatCurrency(reportData.revenueAnalytics.month30d || 0)],
                [''],
                ['User Roles Distribution', ''],
                ['Normal Users', reportData.userRoles.normal || 0],
                ['Personal Sellers', reportData.userRoles.personal || 0],
                ['Brand Accounts', reportData.userRoles.brand || 0],
                ['Company Accounts', reportData.userRoles.company || 0],
                ['Admin Users', reportData.userRoles.admin || 0],
                [''],
                ['Order Status', ''],
                ['Pending', reportData.orderStatus.pending || 0],
                ['Paid', reportData.orderStatus.paid || 0],
                ['Shipped', reportData.orderStatus.shipped || 0],
                ['Delivered', reportData.orderStatus.delivered || 0],
                ['Refunded', reportData.orderStatus.refunded || 0],
                [''],
                ['Product Status', ''],
                ['Approved', reportData.productStatus.approved || 0],
                ['Pending', reportData.productStatus.pending || 0],
                ['Rejected', reportData.productStatus.rejected || 0],
                [''],
                ['Recent Activity', 'Action', 'Timestamp', 'Actor'],
                ...reportData.recentActivity.map(activity => [
                    activity.action || 'N/A',
                    activity.timestamp ? formatDate(activity.timestamp.toDate()) : 'N/A',
                    activity.actorName || 'System'
                ])
            ];

            // Create CSV content
            const csvContent = csvRows.map(row => 
                row.map(cell => {
                    // Escape commas and quotes in CSV
                    if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
                        return `"${cell.replace(/"/g, '""')}"`;
                    }
                    return cell;
                }).join(',')
            ).join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `admin-report-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Report exported successfully!');
        } catch (error) {
            console.error('Error exporting report:', error);
            toast.error('Failed to export report');
        }
    }, [stats, recentActivity, formatCurrency, formatDate]);

    // Show loading while auth is being checked or data is loading
    if (authLoading || loading || !user) {
        return (<AdminLayout title="Overview" subtitle="Loading dashboard...">
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl ring-4 ring-purple-500/20">
              <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-white"></div>
            </div>
            <p className="text-purple-200 text-xl font-semibold">
              {authLoading ? 'Checking authentication...' : 'Loading premium admin dashboard...'}
            </p>
          </motion.div>
        </div>
      </AdminLayout>);
    }
    // Final admin check using email verification - hardcoded for reliability
    const ADMIN_EMAILS = ['mobiletesting736@gmail.com'];
    const userEmail = user?.email || '';
    const isAdmin = ADMIN_EMAILS.includes(userEmail);
    
    if (!isAdmin) {
        return (<AdminLayout title="Access Denied" subtitle="Admin privileges required">
        <div className="text-center text-red-600">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4"/>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p>You need admin privileges to access this page.</p>
        </div>
      </AdminLayout>);
    }
    if (!stats) {
        return (<AdminLayout title="Overview" subtitle="Error loading data">
        <div className="text-center text-red-600">
          Failed to load dashboard data
        </div>
      </AdminLayout>);
    }
    return (<AdminLayout title="Admin Dashboard" subtitle="Real-time platform analytics and management" searchPlaceholder="Search users, products, orders..." onSearch={handleSearch} actions={<motion.button 
          onClick={exportReport}
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }} 
          className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl font-bold hover:from-cyan-600 hover:via-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg shadow-cyan-500/30 flex items-center space-x-2"
        >
          <Download className="w-4 h-4"/>
          <span>Export Report</span>
        </motion.button>}>
      <div className="space-y-8">
        {/* Welcome Section - Enhanced */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-cyan-600/30 via-blue-500/30 to-indigo-500/30 backdrop-blur-2xl border border-cyan-400/30 rounded-3xl p-6 lg:p-10 shadow-2xl hover:shadow-cyan-500/30 transition-all duration-500"
        >
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10 animate-pulse"></div>
          
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent mb-3"
              >
                Welcome back, Admin! 👋
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-cyan-100 text-base lg:text-xl font-medium"
              >
                Here's what's happening with your platform today ✨
              </motion.p>
            </div>
            <div className="flex lg:hidden items-center justify-between">
              <div className="text-left">
                <p className="text-cyan-200 text-sm">Current Time</p>
                <p className="text-white font-bold">{new Date().toLocaleTimeString()}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white"/>
              </div>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-cyan-200 text-sm">Current Time</p>
                <p className="text-white font-bold">{new Date().toLocaleTimeString()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white"/>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Total Users */}
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: 0.1, type: "spring", stiffness: 100 }} 
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-2xl border border-blue-400/30 rounded-3xl p-5 lg:p-7 shadow-2xl hover:shadow-blue-500/40 transition-all duration-500 group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-cyan-400/0 group-hover:from-blue-400/10 group-hover:to-cyan-400/10 transition-all duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cyan-200">Total Users</p>
                  <p className="text-2xl lg:text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
                  <div className="flex flex-wrap items-center mt-2 gap-2 lg:gap-4 text-xs lg:text-sm">
                    <span className="text-blue-400">Normal: {stats.userRoles.normal}</span>
                    <span className="text-green-400">Personal: {stats.userRoles.personal}</span>
                    <span className="text-indigo-400">Brand: {stats.userRoles.brand}</span>
                    <span className="text-orange-400">Company: {stats.userRoles.company}</span>
                  </div>
                </div>
                <div className="p-3 lg:p-4 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-2xl border border-blue-400/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 flex-shrink-0 shadow-lg">
                  <Users className="w-7 h-7 lg:w-9 lg:h-9 text-blue-300 group-hover:text-blue-200 transition-colors"/>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Total Products */}
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }} 
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative overflow-hidden bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-2xl border border-indigo-400/30 rounded-3xl p-5 lg:p-7 shadow-2xl hover:shadow-indigo-500/40 transition-all duration-500 group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/0 to-purple-400/0 group-hover:from-indigo-400/10 group-hover:to-purple-400/10 transition-all duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cyan-200">Total Products</p>
                  <p className="text-2xl lg:text-3xl font-bold text-white">{stats.totalProducts.toLocaleString()}</p>
                  <div className="flex flex-wrap items-center mt-2 gap-2 lg:gap-4 text-xs lg:text-sm">
                    <span className="text-green-400">Active: {stats.productStatus.approved}</span>
                  </div>
                </div>
                <div className="p-3 lg:p-4 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-2xl border border-indigo-400/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 flex-shrink-0 shadow-lg">
                  <Package className="w-7 h-7 lg:w-9 lg:h-9 text-indigo-300 group-hover:text-indigo-200 transition-colors"/>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Total Orders */}
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: 0.3, type: "spring", stiffness: 100 }} 
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative overflow-hidden bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-2xl border border-green-400/30 rounded-3xl p-5 lg:p-7 shadow-2xl hover:shadow-green-500/40 transition-all duration-500 group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 to-emerald-400/0 group-hover:from-green-400/10 group-hover:to-emerald-400/10 transition-all duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cyan-200">Total Orders</p>
                  <p className="text-2xl lg:text-3xl font-bold text-white">{stats.totalOrders.toLocaleString()}</p>
                  <div className="flex flex-wrap items-center mt-2 gap-2 lg:gap-4 text-xs lg:text-sm">
                    <span className="text-green-400">Delivered: {stats.orderStatus.delivered}</span>
                    <span className="text-yellow-400">Pending: {stats.orderStatus.pending}</span>
                    <span className="text-red-400">Refunded: {stats.orderStatus.refunded}</span>
                  </div>
                </div>
                <div className="p-3 lg:p-4 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-2xl border border-green-400/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 flex-shrink-0 shadow-lg">
                  <ShoppingCart className="w-7 h-7 lg:w-9 lg:h-9 text-green-300 group-hover:text-green-200 transition-colors"/>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Total Revenue */}
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: 0.4, type: "spring", stiffness: 100 }} 
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-2xl border border-amber-400/30 rounded-3xl p-5 lg:p-7 shadow-2xl hover:shadow-amber-500/40 transition-all duration-500 group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/0 to-blue-400/0 group-hover:from-cyan-400/10 group-hover:to-blue-400/10 transition-all duration-500"></div>
            <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-cyan-200">Total Revenue</p>
                <p className="text-2xl lg:text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
                <div className="flex flex-wrap items-center mt-2 gap-2 lg:gap-4 text-xs lg:text-sm">
                  <span className="text-green-400">Today: {formatCurrency(stats.revenueAnalytics.today)}</span>
                  <span className="text-blue-400">7d: {formatCurrency(stats.revenueAnalytics.week7d)}</span>
                  <span className="text-indigo-400">30d: {formatCurrency(stats.revenueAnalytics.month30d)}</span>
                </div>
              </div>
              <div className="p-3 lg:p-4 bg-gradient-to-br from-amber-500/30 to-orange-500/30 rounded-2xl border border-amber-400/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 flex-shrink-0 shadow-lg">
                <DollarSign className="w-7 h-7 lg:w-9 lg:h-9 text-amber-300 group-hover:text-amber-200 transition-colors"/>
              </div>
            </div>
            </div>
          </motion.div>
        </div>

        {/* AI Insights */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 lg:p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6 space-y-2 sm:space-y-0">
            <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center space-x-2 lg:space-x-3">
              <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-400"/>
              <span>AI Insights</span>
            </h2>
            <span className="text-purple-200 text-sm">Powered by AI</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiInsights.map((insight, index) => (<motion.div key={insight.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + index * 0.1 }} className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer hover:scale-105 ${insight.type === 'success'
                ? 'bg-green-500/20 border-green-500/30 hover:bg-green-500/30'
                : insight.type === 'warning'
                    ? 'bg-yellow-500/20 border-yellow-500/30 hover:bg-yellow-500/30'
                    : 'bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30'}`}>
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-xl ${insight.type === 'success'
                ? 'bg-green-500/30'
                : insight.type === 'warning'
                    ? 'bg-yellow-500/30'
                    : 'bg-blue-500/30'}`}>
                    <insight.icon className={`w-5 h-5 ${insight.type === 'success'
                ? 'text-green-400'
                : insight.type === 'warning'
                    ? 'text-yellow-400'
                    : 'text-blue-400'}`}/>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg">{insight.title}</h3>
                    <p className="text-purple-200 text-sm mt-1">{insight.description}</p>
                    {insight.action && (<button className="text-purple-300 hover:text-white text-sm font-medium mt-2 transition-colors">
                        {insight.action} →
                      </button>)}
                  </div>
                </div>
              </motion.div>))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 lg:p-6 shadow-2xl">
          <h2 className="text-xl lg:text-2xl font-bold text-white mb-4 lg:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {memoizedQuickActions.map((action, index) => (<motion.div key={action.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + index * 0.1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Link href={action.href} prefetch={true} className={`group p-4 lg:p-6 rounded-2xl border transition-all duration-300 block ${action.color.includes('blue')
                ? 'bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30'
                : action.color.includes('yellow')
                    ? 'bg-yellow-500/20 border-yellow-500/30 hover:bg-yellow-500/30'
                    : action.color.includes('green')
                        ? 'bg-green-500/20 border-green-500/30 hover:bg-green-500/30'
                        : action.color.includes('purple')
                            ? 'bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30'
                            : action.color.includes('pink')
                                ? 'bg-pink-500/20 border-pink-500/30 hover:bg-pink-500/30'
                                : 'bg-indigo-500/20 border-indigo-500/30 hover:bg-indigo-500/30'}`}>
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                  <div className={`p-2 lg:p-3 rounded-2xl ${action.color.includes('blue')
                ? 'bg-blue-500/30'
                : action.color.includes('yellow')
                    ? 'bg-yellow-500/30'
                    : action.color.includes('green')
                        ? 'bg-green-500/30'
                        : action.color.includes('purple')
                            ? 'bg-purple-500/30'
                            : action.color.includes('pink')
                                ? 'bg-pink-500/30'
                                : 'bg-indigo-500/30'}`}>
                    <action.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white"/>
                  </div>
                  {action.count && (<span className="bg-white/20 text-white px-2 py-1 rounded-full text-xs lg:text-sm font-bold">
                      {action.count}
                    </span>)}
                </div>
                <h3 className="font-bold text-white text-base lg:text-lg mb-2">{action.title}</h3>
                <p className="text-purple-200 text-xs lg:text-sm mb-3 lg:mb-4">{action.description}</p>
                <div className="flex items-center text-purple-300 group-hover:text-white transition-colors">
                  <span className="text-sm font-medium">Manage</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"/>
                </div>
              </Link></motion.div>))}
          </div>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart Placeholder */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Sales Analytics</h3>
              <div className="flex space-x-2">
                {['7d', '30d', '90d'].map((timeframe) => (<button key={timeframe} onClick={() => setSelectedTimeframe(timeframe)} className={`px-3 py-1 rounded-xl text-sm font-medium transition-all duration-300 ${selectedTimeframe === timeframe
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-purple-200 hover:bg-white/20'}`}>
                    {timeframe}
                  </button>))}
              </div>
            </div>
            <div className="h-64 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-xl border border-white/20">
                  <TrendingUp className="w-10 h-10 text-purple-300"/>
                </div>
                <p className="text-purple-200 text-lg">Chart will be implemented with Chart.js or Recharts</p>
                <p className="text-sm text-purple-300 mt-2">Real-time sales data visualization</p>
              </div>
            </div>
          </motion.div>

          {/* User Activity Chart Placeholder */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">User Activity</h3>
              <div className="flex items-center space-x-2 text-purple-200">
                <Activity className="w-5 h-5"/>
                <span className="text-sm">Live</span>
              </div>
            </div>
            <div className="h-64 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-xl border border-white/20">
                  <Users className="w-10 h-10 text-blue-300"/>
                </div>
                <p className="text-purple-200 text-lg">Chart will be implemented with Chart.js or Recharts</p>
                <p className="text-sm text-purple-300 mt-2">Daily user activity trends</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Stats & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <h3 className="text-2xl font-bold text-white mb-6">Applications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-yellow-500/20 rounded-2xl border border-yellow-500/30">
                <div className="flex items-center">
                  <Shield className="w-6 h-6 text-yellow-400 mr-3"/>
                  <span className="text-lg font-bold text-white">Pending Applications</span>
                </div>
                <span className="text-2xl font-bold text-yellow-400">{stats.pendingApplications}</span>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity Feed */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 lg:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-6">Recent Activity</h3>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentActivity.length > 0 ? (recentActivity.map((activity, index) => (<motion.div key={activity.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.3 + index * 0.1 }} className="flex items-start space-x-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <div className="text-2xl">{getActionIcon(activity.action)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold text-white">
                        {activity.actorName} {activity.action.replace(/_/g, ' ').toLowerCase()}
                      </p>
                      <p className="text-sm text-purple-200">
                        {activity.targetType}: {activity.targetId}
                      </p>
                      <p className="text-xs text-purple-300 mt-2">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </motion.div>))) : (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-xl border border-white/20">
                    <FileText className="w-10 h-10 text-purple-300"/>
                  </div>
                  <p className="text-purple-200 text-lg">No recent activity</p>
                </motion.div>)}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>);
}
