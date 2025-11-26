'use client';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStoreCognito';
import { getProducts, deleteProduct } from '@/lib/productService';
import { listOrdersBySeller, updateOrderStatus } from '@/lib/firestore';
import { motion } from 'framer-motion';
import { Plus, Package, ShoppingCart, DollarSign, TrendingUp, Edit, Trash2, Upload, Settings, BarChart3, Star } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
export default function SellerDashboard() {
    const { user } = useAuthStore();
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalViews: 0,
        averageRating: 0,
        pendingOrders: 0
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    useEffect(() => {
        if (!user)
            return;
        loadDashboardData();
    }, [user]);
    const loadDashboardData = async () => {
        if (!user)
            return;
        setLoading(true);
        try {
            // Load products
            const userProducts = await getProducts({ sellerId: user.sub });
            setProducts(userProducts);
            // Load orders
            const userOrders = await listOrdersBySeller(user.sub);
            setOrders(userOrders);
            // Calculate stats
            const totalRevenue = userOrders.reduce((sum, order) => sum + order.total, 0);
            const totalViews = userProducts.reduce((sum, product) => sum + (product.views || 0), 0);
            const totalRating = userProducts.reduce((sum, product) => sum + (product.rating || 0), 0);
            const averageRating = userProducts.length > 0 ? totalRating / userProducts.length : 0;
            const pendingOrders = userOrders.filter(order => order.status === 'pending').length;
            setStats({
                totalProducts: userProducts.length,
                totalOrders: userOrders.length,
                totalRevenue,
                totalViews,
                averageRating,
                pendingOrders
            });
        }
        catch (error) {
            console.error('Error loading dashboard data:', error);
            toast.error('Failed to load dashboard data');
        }
        finally {
            setLoading(false);
        }
    };
    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            toast.success('Order status updated');
            loadDashboardData(); // Refresh data
        }
        catch (error) {
            console.error('Error updating order status:', error);
            toast.error('Failed to update order status');
        }
    };
    const handleDeleteProduct = async (productId) => {
        const confirmed = await new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Delete Product</h3>
                    <p class="text-gray-600 mb-6">Are you sure you want to delete this product?</p>
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
        
        if (!confirmed) return;
        try {
            await deleteProduct(productId, user.sub);
            toast.success('Product deleted successfully');
            loadDashboardData(); // Refresh data
        }
        catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        }
    };
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };
    const formatDate = (date) => {
        if (!date)
            return 'N/A';
        const dateObj = date.toDate ? date.toDate() : new Date(date);
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    if (!user) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">You need to be logged in to access the seller dashboard.</p>
          <Link href="/auth-login" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
            Sign In
          </Link>
        </div>
      </div>);
    }
    if (loading) {
        return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (<div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>))}
            </div>
          </div>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Seller Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your products, orders, and business analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalProducts}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-8 h-8 text-blue-600"/>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
                {stats.pendingOrders > 0 && (<p className="text-sm text-orange-600">{stats.pendingOrders} pending</p>)}
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingCart className="w-8 h-8 text-green-600"/>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-8 h-8 text-purple-600"/>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <div className="flex items-center space-x-1">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.averageRating.toFixed(1)}</p>
                  <Star className="w-5 h-5 text-yellow-400 fill-current"/>
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="w-8 h-8 text-yellow-600"/>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp }
        ].map((tab) => {
            const Icon = tab.icon;
            return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    <Icon className="w-4 h-4"/>
                    <span>{tab.label}</span>
                  </button>);
        })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'overview' && (<div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Orders</h3>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (<div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Order #{order.id.slice(-8)}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(order.total)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>))}
                  </div>
                </div>

                {/* Top Products */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Products</h3>
                  <div className="space-y-3">
                    {products
                .sort((a, b) => (b.views || 0) - (a.views || 0))
                .slice(0, 5)
                .map((product) => (<div key={product.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <img src={product.images[0] || '/placeholder-product.jpg'} alt={product.title} className="object-cover w-full h-full"/>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 truncate">{product.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{product.views || 0} views</p>
                          </div>
                          <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(product.price)}</p>
                        </div>))}
                  </div>
                </div>
              </div>
            </div>)}

          {activeTab === 'products' && (<div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Products</h3>
                <button onClick={() => setShowAddProduct(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
                  <Plus className="w-4 h-4"/>
                  <span>Add Product</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                var _a;
                return (<motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-50 rounded-lg overflow-hidden">
                    <div className="relative aspect-square">
                      <img src={product.images[0] || '/placeholder-product.jpg'} alt={product.title} className="object-cover w-full h-full"/>
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <button onClick={() => setEditingProduct(product)} className="p-1 bg-white/90 rounded-full hover:bg-white transition-colors">
                          <Edit className="w-4 h-4 text-gray-600"/>
                        </button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="p-1 bg-white/90 rounded-full hover:bg-white transition-colors">
                          <Trash2 className="w-4 h-4 text-red-600"/>
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{product.title}</h4>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>{product.category}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${product.status === 'active' ? 'bg-green-100 text-green-800' :
                        product.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'}`}>
                          {product.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(product.price)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Stock: {product.stock}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                        <span>{product.views || 0} views</span>
                        <span>{((_a = product.likes) === null || _a === void 0 ? void 0 : _a.length) || 0} likes</span>
                      </div>
                    </div>
                  </motion.div>);
            })}
              </div>
            </div>)}

          {activeTab === 'orders' && (<div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Management</h3>
              <div className="space-y-4">
                {orders.map((order) => {
                var _a, _b;
                return (<div key={order.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">Order #{order.id.slice(-8)}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(order.total)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Customer: {order.buyerName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Address: {(_a = order.shippingAddress) === null || _a === void 0 ? void 0 : _a.address}, {(_b = order.shippingAddress) === null || _b === void 0 ? void 0 : _b.city}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {order.status === 'pending' && (<button onClick={() => handleStatusUpdate(order.id, 'confirmed')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                            Confirm
                          </button>)}
                        {order.status === 'confirmed' && (<button onClick={() => handleStatusUpdate(order.id, 'shipped')} className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700">
                            Ship
                          </button>)}
                        {order.status === 'shipped' && (<button onClick={() => handleStatusUpdate(order.id, 'delivered')} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                            Mark Delivered
                          </button>)}
                      </div>
                      <Link href={`/orders/${order.id}`} className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                        View Details
                      </Link>
                    </div>
                  </div>);
            })}
              </div>
            </div>)}

          {activeTab === 'analytics' && (<div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Performance Overview</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Total Views</span>
                      <span className="font-semibold">{stats.totalViews}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Average Rating</span>
                      <span className="font-semibold">{stats.averageRating.toFixed(1)} ⭐</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Conversion Rate</span>
                      <span className="font-semibold">
                        {stats.totalViews > 0 ? ((stats.totalOrders / stats.totalViews) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
                  <div className="space-y-3">
                    <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
                      <Upload className="w-4 h-4"/>
                      <span>Upload New Product</span>
                    </button>
                    <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                      <Settings className="w-4 h-4"/>
                      <span>Store Settings</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </div>);
}

