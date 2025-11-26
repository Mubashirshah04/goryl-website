'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStoreCognito';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
export default function TrackOrderClient({ orderId }) {
    const router = useRouter();
    const { user } = useAuthStore();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!orderId)
            return;
        console.log('📦 Tracking order:', orderId);
        const orderRef = doc(db, 'orders', orderId);
        const unsubscribe = onSnapshot(orderRef, (doc) => {
            if (doc.exists()) {
                const orderData = Object.assign({ id: doc.id }, doc.data());
                setOrder(orderData);
                setError(null);
                console.log('✅ Order tracking loaded:', orderData);
            }
            else {
                setError('Order not found');
                console.log('❌ Order not found:', orderId);
            }
            setLoading(false);
        }, (error) => {
            console.error('❌ Error loading order tracking:', error);
            setError('Failed to load order tracking');
            setLoading(false);
        });
        return () => unsubscribe();
    }, [orderId]);
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'text-yellow-600';
            case 'confirmed':
            case 'placed':
                return 'text-blue-600';
            case 'processing':
                return 'text-purple-600';
            case 'shipped':
                return 'text-indigo-600';
            case 'out_for_delivery':
                return 'text-orange-600';
            case 'delivered':
                return 'text-green-600';
            case 'cancelled':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };
    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return <Clock className="w-6 h-6"/>;
            case 'confirmed':
            case 'placed':
                return <CheckCircle className="w-6 h-6"/>;
            case 'processing':
                return <Package className="w-6 h-6"/>;
            case 'shipped':
            case 'out_for_delivery':
                return <Truck className="w-6 h-6"/>;
            case 'delivered':
                return <CheckCircle className="w-6 h-6"/>;
            default:
                return <Package className="w-6 h-6"/>;
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
          <p className="text-gray-600 dark:text-gray-300">Loading order tracking...</p>
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
              Track Order #{orderId.slice(-8).toUpperCase()}
            </h1>
            {order.trackingNumber && (<p className="text-gray-600 font-mono">
                Tracking: {order.trackingNumber}
              </p>)}
          </div>
        </div>

        {/* Current Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 capitalize">
              {order.status.replace('_', ' ')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Last updated: {formatDate(order.updatedAt || order.createdAt)}
            </p>
          </div>
        </motion.div>

        {/* Tracking Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Timeline</h3>
          
          <div className="space-y-6">
            {/* Order Placed */}
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600"/>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">Order Placed</h4>
                <p className="text-gray-600 text-sm">Your order has been received and is being processed</p>
                <p className="text-gray-500 text-xs mt-1">{formatDate(order.createdAt)}</p>
              </div>
            </div>

            {/* Order Confirmed */}
            {order.status !== 'pending' && (<div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-blue-600"/>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Order Confirmed</h4>
                  <p className="text-gray-600 text-sm">Your order has been confirmed and is being prepared</p>
                </div>
              </div>)}

            {/* Order Processing */}
            {['processing', 'shipped', 'out_for_delivery', 'delivered'].includes(order.status.toLowerCase()) && (<div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-purple-600"/>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Order Processing</h4>
                  <p className="text-gray-600 text-sm">Your order is being prepared for shipment</p>
                </div>
              </div>)}

            {/* Order Shipped */}
            {['shipped', 'out_for_delivery', 'delivered'].includes(order.status.toLowerCase()) && (<div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-indigo-600"/>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Order Shipped</h4>
                  <p className="text-gray-600 text-sm">Your order is on its way to you</p>
                  {order.trackingNumber && (<p className="text-gray-500 text-xs mt-1 font-mono">
                      Tracking: {order.trackingNumber}
                    </p>)}
                </div>
              </div>)}

            {/* Out for Delivery */}
            {['out_for_delivery', 'delivered'].includes(order.status.toLowerCase()) && (<div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-orange-600"/>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Out for Delivery</h4>
                  <p className="text-gray-600 text-sm">Your order is out for delivery and will arrive soon</p>
                </div>
              </div>)}

            {/* Order Delivered */}
            {order.status.toLowerCase() === 'delivered' && (<div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600"/>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Order Delivered</h4>
                  <p className="text-gray-600 text-sm">Your order has been delivered successfully</p>
                </div>
              </div>)}

            {/* Order Cancelled */}
            {order.status.toLowerCase() === 'cancelled' && (<div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-red-600"/>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Order Cancelled</h4>
                  <p className="text-gray-600 text-sm">Your order has been cancelled</p>
                </div>
              </div>)}
          </div>
        </motion.div>

        {/* Shipping Information */}
        {order.shipping && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Shipping Information</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-500"/>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{order.shipping.fullName}</p>
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
    </div>);
}
