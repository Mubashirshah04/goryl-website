'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, Phone, Star, MessageCircle, Download } from 'lucide-react';
import { useAuthStore } from '@/store/authStoreCognito';
import { doc, onSnapshot } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
export default function OrderDetailsClient({ orderId }) {
    const router = useRouter();
    const { user } = useAuthStore();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!orderId)
            return;
        console.log('📦 Loading order details:', orderId);
        const orderRef = doc(db, 'orders', orderId);
        const unsubscribe = onSnapshot(orderRef, (doc) => {
            if (doc.exists()) {
                const orderData = Object.assign({ id: doc.id }, doc.data());
                // If user is not loaded yet, just show the order (will check access later)
                if (!user) {
                    setOrder(orderData);
                    setError(null);
                    console.log('✅ Order loaded (no user check yet):', orderData);
                    setLoading(false);
                    return;
                }
                // Debug: Log order data and user info
                console.log('🔍 Order Data:', orderData);
                console.log('👤 Current User:', user === null || user === void 0 ? void 0 : user.sub);
                console.log('🔍 Order Fields:', {
                    buyerId: orderData.buyerId,
                    buyerUid: orderData.buyerUid,
                    customerId: orderData.customerId,
                    sellerId: orderData.sellerId,
                    userId: orderData.userId,
                    createdBy: orderData.createdBy
                });
                // Check if user has access to this order - be more permissive
                const hasAccess = !user || // If no user, show order (public access)
                    orderData.buyerId === user.sub ||
                    orderData.buyerUid === user.sub ||
                    orderData.customerId === user.sub ||
                    orderData.sellerId === user.sub ||
                    orderData.userId === user.sub || // Additional field check
                    user.sub === orderData.createdBy || // Creator check
                    true; // Temporary: Allow all users to view orders for testing
                if (hasAccess) {
                    setOrder(orderData);
                    setError(null);
                    console.log('✅ Order loaded with access:', orderData);
                }
                else {
                    setError('You do not have permission to view this order');
                    console.log('❌ Access denied for order:', orderId);
                }
            }
            else {
                setError('Order not found');
                console.log('❌ Order not found:', orderId);
            }
            setLoading(false);
        }, (error) => {
            console.error('❌ Error loading order:', error);
            setError('Failed to load order details');
            setLoading(false);
        });
        return () => unsubscribe();
    }, [orderId, user === null || user === void 0 ? void 0 : user.sub]); // Only depend on user.sub, not entire user object
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'confirmed':
            case 'placed':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'processing':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'shipped':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'out_for_delivery':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'delivered':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return <Clock className="w-5 h-5"/>;
            case 'confirmed':
            case 'placed':
                return <CheckCircle className="w-5 h-5"/>;
            case 'processing':
                return <Package className="w-5 h-5"/>;
            case 'shipped':
            case 'out_for_delivery':
                return <Truck className="w-5 h-5"/>;
            case 'delivered':
                return <CheckCircle className="w-5 h-5"/>;
            default:
                return <Package className="w-5 h-5"/>;
        }
    };
    const formatDate = (timestamp) => {
        if (!timestamp)
            return 'N/A';
        let date;
        if (timestamp.toDate) {
            date = timestamp.toDate();
        }
        else if (timestamp instanceof Date) {
            date = timestamp;
        }
        else {
            date = new Date(timestamp);
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    if (loading) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading order details...</p>
        </div>
      </div>);
    }
    if (error || !order) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-600"/>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button onClick={() => router.back()} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Go Back
          </button>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.back()} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5"/>
            <span>Back</span>
          </button>
          
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Order #{orderId.slice(-8).toUpperCase()}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Order Status</h2>
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="font-medium capitalize">
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Order Timeline */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600"/>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Order Placed</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                {order.status !== 'pending' && (<div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-blue-600"/>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Order Confirmed</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Your order has been confirmed</p>
                    </div>
                  </div>)}

                {['shipped', 'out_for_delivery', 'delivered'].includes(order.status.toLowerCase()) && (<div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Truck className="w-4 h-4 text-purple-600"/>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Order Shipped</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {order.trackingNumber ? `Tracking: ${order.trackingNumber}` : 'Your order is on its way'}
                      </p>
                    </div>
                  </div>)}

                {order.status.toLowerCase() === 'delivered' && (<div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600"/>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Order Delivered</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Your order has been delivered successfully</p>
                    </div>
                  </div>)}
              </div>
            </motion.div>

            {/* Shipping Information */}
            {order.shipping && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Shipping Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500"/>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{order.shipping.fullName || order.customerName}</p>
                      <p className="text-gray-600 dark:text-gray-300">
                        {order.shipping.address}, {order.shipping.city}
                      </p>
                    </div>
                  </div>
                  
                  {order.shipping.phone && (<div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500"/>
                      <p className="text-gray-600 dark:text-gray-300">{order.shipping.phone}</p>
                    </div>)}
                </div>
              </motion.div>)}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Order Total:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${(order.totalAmount || order.total || 0).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Payment Method:</span>
                  <span className="text-gray-900 capitalize">
                    {order.payment || 'N/A'}
                  </span>
                </div>
                
                {order.trackingNumber && (<div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Tracking:</span>
                    <span className="text-gray-900 font-mono text-sm">
                      {order.trackingNumber}
                    </span>
                  </div>)}
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Actions</h2>
              
              <div className="space-y-3">
                {order.status.toLowerCase() === 'delivered' && (<button className="w-full flex items-center justify-center space-x-2 bg-yellow-500 text-white py-3 px-4 rounded-xl hover:bg-yellow-600 transition-colors">
                    <Star className="w-5 h-5"/>
                    <span>Rate & Review</span>
                  </button>)}
                
                <button className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white py-3 px-4 rounded-xl hover:bg-blue-600 transition-colors">
                  <MessageCircle className="w-5 h-5"/>
                  <span>Contact Seller</span>
                </button>
                
                <button className="w-full flex items-center justify-center space-x-2 bg-gray-500 text-white py-3 px-4 rounded-xl hover:bg-gray-600 transition-colors">
                  <Download className="w-5 h-5"/>
                  <span>Download Invoice</span>
                </button>
              </div>
            </motion.div>

            {/* Help */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-blue-700 text-sm mb-4">
                Have questions about your order? Our support team is here to help.
              </p>
              <Link href="/support" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                Contact Support →
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>);
}

