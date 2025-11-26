'use client';
import React, { useState, useEffect } from 'react';
// ✅ AWS DYNAMODB - Firestore removed
// ✅ AWS - Using AWS services
import { useAuthStore } from '@/store/authStoreCognito';
import { Package, Clock, CheckCircle, XCircle, Truck, Edit, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { updateOrderStatus } from '@/lib/orderManagementService';
import { toast } from 'sonner';
const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', title: 'Pending' },
    confirmed: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100', title: 'Confirmed' },
    processing: { icon: Package, color: 'text-purple-600', bg: 'bg-purple-100', title: 'Processing' },
    shipped: { icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-100', title: 'Shipped' },
    out_for_delivery: { icon: Truck, color: 'text-orange-600', bg: 'bg-orange-100', title: 'Out for Delivery' },
    delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', title: 'Delivered' },
    cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', title: 'Cancelled' }
};
export default function SellerOrdersPage() {
    const { user } = useAuthStore();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [editingStatus, setEditingStatus] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    useEffect(() => {
        if (!user) {
            console.log('❌ No user found for seller orders');
            setLoading(false);
            return;
        }
        console.log('🔍 Loading seller orders for user:', user.sub);
        // Query orders where current user is the seller
        const q = query(collection(db, 'orders'), where('sellerId', '==', user.sub), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log('📦 Seller orders found:', snapshot.docs.length);
            const ordersData = snapshot.docs.map(doc => {
                var _a, _b;
                const data = doc.data();
                return Object.assign(Object.assign({ id: doc.id }, data), { createdAt: ((_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) ? data.createdAt.toDate() : new Date(data.createdAt), updatedAt: ((_b = data.updatedAt) === null || _b === void 0 ? void 0 : _b.toDate) ? data.updatedAt.toDate() : new Date(data.updatedAt) });
            });
            console.log('📋 Seller orders loaded successfully:', ordersData.length);
            setOrders(ordersData);
            setLoading(false);
        }, (error) => {
            console.error('❌ Error loading seller orders:', error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user === null || user === void 0 ? void 0 : user.sub]);
    const filteredOrders = activeTab === 'all'
        ? orders
        : orders.filter(order => order.status === activeTab);
    // Handle status change
    const handleStatusChange = async (orderId, newStatusValue) => {
        try {
            console.log(`🔄 Changing order ${orderId} status to: ${newStatusValue}`);
            const result = await updateOrderStatus(orderId, newStatusValue, `Status updated by seller to ${newStatusValue}`, 'Seller Dashboard');
            if (result.success) {
                toast.success(`✅ Order status updated to ${newStatusValue}`);
                setEditingStatus(null);
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
    const startEditing = (orderId, currentStatus) => {
        setEditingStatus(orderId);
        setNewStatus(currentStatus);
    };
    const cancelEditing = () => {
        setEditingStatus(null);
        setNewStatus('');
    };
    if (loading) {
        return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Seller Orders Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and update your order statuses</p>
        </div>

        {/* Status Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-1 border-b-2 font-medium text-sm capitalize whitespace-nowrap ${activeTab === tab
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'}`}>
                  {tab}
                  <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full px-2 py-1">
                    {tab === 'all' ? orders.length : orders.filter(o => o.status === tab).length}
                  </span>
                </button>))}
            </nav>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (<div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {activeTab === 'all' ? 'No orders yet' : `No ${activeTab} orders`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {activeTab === 'all'
                ? 'Orders will appear here when customers purchase your products!'
                : `You don't have any ${activeTab} orders at the moment.`}
            </p>
          </div>) : (<div className="space-y-6">
            {filteredOrders.map((order, index) => {
                var _a, _b, _c, _d, _e, _f, _g;
                const StatusIcon = statusConfig[order.status].icon;
                const isEditing = editingStatus === order.id;
                return (<motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Order #{order.id.slice(-8).toUpperCase()}
                        </h3>
                        
                        {/* Status Management */}
                        <div className="flex items-center space-x-2">
                          {isEditing ? (<div className="flex items-center space-x-2">
                              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500">
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="out_for_delivery">Out for Delivery</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              <button onClick={() => handleStatusChange(order.id, newStatus)} className="p-1 text-green-600 hover:text-green-700 dark:text-green-400">
                                <Save className="w-4 h-4"/>
                              </button>
                              <button onClick={cancelEditing} className="p-1 text-gray-600 hover:text-gray-700 dark:text-gray-400">
                                <XCircle className="w-4 h-4"/>
                              </button>
                            </div>) : (<div className="flex items-center space-x-2">
                              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig[order.status].bg} ${statusConfig[order.status].color}`}>
                                <StatusIcon className="w-4 h-4"/>
                                <span className="capitalize">{order.status.replace('_', ' ')}</span>
                              </div>
                              <button onClick={() => startEditing(order.id, order.status)} className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400" title="Edit Status">
                                <Edit className="w-4 h-4"/>
                              </button>
                            </div>)}
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        ${(order.totalAmount || order.total || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.paymentMethod === 'card' ? 'Card' :
                        order.paymentMethod === 'cod' ? 'COD' :
                            ((_a = order.payment) === null || _a === void 0 ? void 0 : _a.method) === 'online' ? 'Card' : 'COD'}
                      </p>
                      {order.trackingNumber && (<p className="text-xs text-purple-600 dark:text-purple-400 font-mono">
                          #{order.trackingNumber}
                        </p>)}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Customer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Name: <span className="text-gray-900 dark:text-white">{(_b = order.shippingAddress) === null || _b === void 0 ? void 0 : _b.firstName} {(_c = order.shippingAddress) === null || _c === void 0 ? void 0 : _c.lastName}</span></p>
                        <p className="text-gray-600 dark:text-gray-400">Email: <span className="text-gray-900 dark:text-white">{order.userId}</span></p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Address: <span className="text-gray-900 dark:text-white">{(_d = order.shippingAddress) === null || _d === void 0 ? void 0 : _d.addressLine1}</span></p>
                        <p className="text-gray-600 dark:text-gray-400">City: <span className="text-gray-900 dark:text-white">{(_e = order.shippingAddress) === null || _e === void 0 ? void 0 : _e.city}, {(_f = order.shippingAddress) === null || _f === void 0 ? void 0 : _f.state}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Order Items</h4>
                    <div className="space-y-3">
                      {((_g = order.items) === null || _g === void 0 ? void 0 : _g.map((item, itemIndex) => {
                        var _a, _b, _c, _d, _e;
                        return (<div key={itemIndex} className="flex items-center space-x-4">
                          <img src={((_a = item.product) === null || _a === void 0 ? void 0 : _a.image) || item.image || '/placeholder-product.jpg'} alt={((_b = item.product) === null || _b === void 0 ? void 0 : _b.title) || item.title || 'Product'} className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600" onError={(e) => {
                                const target = e.target;
                                target.src = '/placeholder-product.jpg';
                            }}/>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {((_c = item.product) === null || _c === void 0 ? void 0 : _c.title) || item.title || 'Product'}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              Quantity: {item.quantity}
                            </p>
                            {((_d = item.product) === null || _d === void 0 ? void 0 : _d.price) && (<p className="text-gray-500 dark:text-gray-500 text-xs">
                                ${item.product.price.toFixed(2)} each
                              </p>)}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">
                              ${((((_e = item.product) === null || _e === void 0 ? void 0 : _e.price) || item.price || 0) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>);
                    })) || (<div className="text-gray-500 dark:text-gray-400 text-sm">Order details not available</div>)}
                    </div>
                  </div>

                  {/* Quick Status Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                      {order.status === 'pending' && (<button onClick={() => handleStatusChange(order.id, 'confirmed')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">
                          Confirm Order
                        </button>)}
                      {order.status === 'confirmed' && (<button onClick={() => handleStatusChange(order.id, 'processing')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors">
                          Start Processing
                        </button>)}
                      {order.status === 'processing' && (<button onClick={() => handleStatusChange(order.id, 'shipped')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors">
                          Mark as Shipped
                        </button>)}
                      {order.status === 'shipped' && (<button onClick={() => handleStatusChange(order.id, 'delivered')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors">
                          Mark as Delivered
                        </button>)}
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Last updated: {new Date(order.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </motion.div>);
            })}
          </div>)}
      </div>
    </div>);
}


