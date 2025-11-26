'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStoreCognito';
import { useRouter } from 'next/navigation';
import { Package, TrendingUp, DollarSign, Users, ShoppingCart, Plus, Edit, Eye, Trash2, BarChart3, Settings, ArrowRight, Star, Heart, CreditCard, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { getNormalUserStats, getNormalUserOrders, getPersonalSellerStats, getPersonalSellerProducts, getPersonalSellerOrders, getBrandStats, getCompanyStats, getUserWallet, getWalletTransactions } from '@/lib/userDashboardService';
export default function UserDashboardPage() {
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const { user } = useAuthStore();
    const router = useRouter();
    useEffect(() => {
        if (!user) {
            router.push('/auth-login');
            return;
        }
        loadUserDashboard();
    }, [user, router]);
    const loadUserDashboard = async () => {
        setLoading(true);
        try {
            const userId = (user === null || user === void 0 ? void 0 : user.sub) || (user === null || user === void 0 ? void 0 : user.id);
            if (!userId) {
                toast.error('User ID not found');
                return;
            }
            // Determine user type and load appropriate data
            const userType = getUserType(user);
            if (userType === 'normal') {
                const [userStats, userOrders, userWallet, userTransactions] = await Promise.all([
                    getNormalUserStats(userId),
                    getNormalUserOrders(userId),
                    getUserWallet(userId),
                    getWalletTransactions(userId)
                ]);
                setStats(userStats);
                setOrders(userOrders);
                setWallet(userWallet);
                setTransactions(userTransactions);
            }
            else if (userType === 'personal') {
                const [sellerStats, sellerProducts, sellerOrders, userWallet, userTransactions] = await Promise.all([
                    getPersonalSellerStats(userId),
                    getPersonalSellerProducts(userId),
                    getPersonalSellerOrders(userId),
                    getUserWallet(userId),
                    getWalletTransactions(userId)
                ]);
                setStats(sellerStats);
                setProducts(sellerProducts);
                setOrders(sellerOrders);
                setWallet(userWallet);
                setTransactions(userTransactions);
            }
            else if (userType === 'brand') {
                const [brandStats, userWallet, userTransactions] = await Promise.all([
                    getBrandStats(userId),
                    getUserWallet(userId),
                    getWalletTransactions(userId)
                ]);
                setStats(brandStats);
                setWallet(userWallet);
                setTransactions(userTransactions);
            }
            else if (userType === 'company') {
                const [companyStats, userWallet, userTransactions] = await Promise.all([
                    getCompanyStats(userId),
                    getUserWallet(userId),
                    getWalletTransactions(userId)
                ]);
                setStats(companyStats);
                setWallet(userWallet);
                setTransactions(userTransactions);
            }
        }
        catch (error) {
            console.error('Error loading user dashboard:', error);
            toast.error('Failed to load dashboard data');
        }
        finally {
            setLoading(false);
        }
    };
    const getUserType = (user) => {
        if (user.role === 'admin')
            return 'normal';
        if (user.sellerType === 'personal')
            return 'personal';
        if (user.sellerType === 'brand')
            return 'brand';
        if (user.sellerType === 'company')
            return 'company';
        return 'normal';
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
            case 'delivered':
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'processing':
            case 'shipped':
                return 'bg-blue-100 text-blue-800';
            case 'inactive':
            case 'cancelled':
            case 'failed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };
    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    };
    const getDashboardTitle = () => {
        const userType = getUserType(user);
        switch (userType) {
            case 'personal': return 'Personal Seller Dashboard';
            case 'brand': return 'Seller Dashboard';
            case 'company': return 'Seller Dashboard';
            default: return 'User Dashboard';
        }
    };
    const getDashboardTabs = () => {
        const userType = getUserType(user);
        const baseTabs = [
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'wallet', label: 'Wallet', icon: CreditCard }
        ];
        if (userType === 'personal') {
            return [
                ...baseTabs,
                { id: 'products', label: 'Products', icon: Package },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ];
        }
        if (userType === 'brand' || userType === 'company') {
            return [
                ...baseTabs,
                { id: 'products', label: 'Products', icon: Package },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ];
        }
        return [
            ...baseTabs,
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
        ];
    };
    if (loading) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>);
    }
    if (!stats) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">No dashboard data available</p>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getDashboardTitle()}</h1>
              <p className="text-gray-600 dark:text-gray-300">Welcome back, {user === null || user === void 0 ? void 0 : user.displayName}</p>
            </div>
            <div className="flex space-x-3">
              {getUserType(user) === 'personal' && (<Link href="/product/upload">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2"/>
                    Add Product
                  </button>
                </Link>)}
              <Link href="/profile/edit">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
                  <Settings className="w-4 h-4 mr-2"/>
                  Settings
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {getDashboardTabs().map((tab) => {
            const Icon = tab.icon;
            return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  <Icon className="w-4 h-4 mr-2"/>
                  {tab.label}
                </button>);
        })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (<div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {getUserType(user) === 'normal' && (<>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ShoppingCart className="h-8 w-8 text-blue-600"/>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Orders</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalOrders}</p>
                        <p className="text-sm text-blue-600">+{stats.monthlyGrowth}% this month</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DollarSign className="h-8 w-8 text-green-600"/>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Spent</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.totalSpent)}</p>
                        <p className="text-sm text-green-600">Lifetime spending</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Heart className="h-8 w-8 text-red-600"/>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Saved Products</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.savedProducts}</p>
                        <p className="text-sm text-red-600">Wishlist items</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Star className="h-8 w-8 text-yellow-600"/>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Reviews</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalReviews}</p>
                        <p className="text-sm text-yellow-600">Your reviews</p>
                      </div>
                    </div>
                  </div>
                </>)}

              {getUserType(user) === 'personal' && (<>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DollarSign className="h-8 w-8 text-green-600"/>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Sales</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.totalSales)}</p>
                        <p className="text-sm text-green-600">+{stats.monthlyGrowth}% this month</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ShoppingCart className="h-8 w-8 text-blue-600"/>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Orders</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalOrders}</p>
                        <p className="text-sm text-blue-600">{stats.pendingOrders} pending</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Package className="h-8 w-8 text-purple-600"/>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Products</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalProducts}</p>
                        <p className="text-sm text-purple-600">Active listings</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Users className="h-8 w-8 text-orange-600"/>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Customers</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalCustomers}</p>
                        <p className="text-sm text-orange-600">Unique buyers</p>
                      </div>
                    </div>
                  </div>
                </>)}

              {(getUserType(user) === 'brand' || getUserType(user) === 'company') && (<>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DollarSign className="h-8 w-8 text-green-600"/>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</p>
                        <p className="text-sm text-green-600">+{stats.monthlyGrowth}% this month</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Crown className="h-8 w-8 text-purple-600"/>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Brands</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalBrands}</p>
                        <p className="text-sm text-purple-600">{stats.brandFollowers} followers</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Star className="h-8 w-8 text-yellow-600"/>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Rating</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.averageRating.toFixed(1)}</p>
                        <p className="text-sm text-yellow-600">Average rating</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Package className="h-8 w-8 text-blue-600"/>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Products</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalProducts}</p>
                        <p className="text-sm text-blue-600">Active listings</p>
                      </div>
                    </div>
                  </div>
                </>)}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                      {getUserType(user) === 'normal' ? (<>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                        </>) : (<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>)}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.slice(0, 5).map((order) => (<tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{order.id}</td>
                        {getUserType(user) === 'normal' ? (<>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{order.productName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{order.sellerName}</td>
                          </>) : (<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{order.buyerName}</td>)}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(order.total)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-gray-200">
                <Link href="/orders" className="text-purple-600 hover:text-purple-500 text-sm font-medium">
                  View all orders <ArrowRight className="w-4 h-4 inline ml-1"/>
                </Link>
              </div>
            </div>
          </div>)}

        {activeTab === 'orders' && (<div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">All Orders</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    {getUserType(user) === 'normal' ? (<>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                      </>) : (<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>)}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (<tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{order.id}</td>
                      {getUserType(user) === 'normal' ? (<>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{order.productName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{order.sellerName}</td>
                        </>) : (<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{order.buyerName}</td>)}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(order.total)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link href={`/orders/${order.id}`} className="text-purple-600 hover:text-purple-900">
                          View Details
                        </Link>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>)}

        {activeTab === 'products' && getUserType(user) !== 'normal' && (<div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Products</h3>
              {getUserType(user) === 'personal' && (<Link href="/product/upload">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2"/>
                    Add Product
                  </button>
                </Link>)}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => {
                var _a;
                return (<tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img className="h-10 w-10 rounded-lg object-cover" src={((_a = product.media[0]) === null || _a === void 0 ? void 0 : _a.url) || '/placeholder-product.jpg'} alt={product.title}/>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{product.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Added {formatDate(product.createdAt)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{product.sales}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{product.views}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link href={`/product/${product.id}`}>
                            <button className="text-purple-600 hover:text-purple-900">
                              <Eye className="w-4 h-4"/>
                            </button>
                          </Link>
                          <Link href={`/product/edit/${product.id}`}>
                            <button className="text-blue-600 hover:text-blue-900">
                              <Edit className="w-4 h-4"/>
                            </button>
                          </Link>
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </td>
                    </tr>);
            })}
                </tbody>
              </table>
            </div>
          </div>)}

        {activeTab === 'wallet' && (<div className="space-y-6">
            {/* Wallet Balance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Wallet Balance</h3>
              <div className="text-3xl font-bold text-green-600">
                {wallet ? formatCurrency(wallet.balance) : '$0.00'}
              </div>
              <p className="text-gray-600 mt-2">Available balance</p>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.slice(0, 10).map((transaction) => (<tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${transaction.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(transaction.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{transaction.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(transaction.createdAt)}</td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>)}

        {activeTab === 'analytics' && (<div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics Overview</h3>
              <p className="text-gray-600 dark:text-gray-300">Detailed analytics features coming soon...</p>
            </div>
          </div>)}
      </div>
    </div>);
}

