'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Truck, Clock, ArrowRight, Home, ShoppingBag } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStoreCognito';
import Link from 'next/link';
export default function OrderSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuthStore();
    const [orderNumber, setOrderNumber] = useState('');
    const [customerName, setCustomerName] = useState('');
    useEffect(() => {
        const orderId = searchParams.get('order');
        const name = searchParams.get('name') || (user === null || user === void 0 ? void 0 : user.displayName) || 'Valued Customer';
        if (orderId) {
            setOrderNumber(orderId.slice(-8).toUpperCase());
        }
        setCustomerName(name);
    }, [searchParams, user]);
    return (<div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-500 to-emerald-500"></div>
          </div>
          
          {/* Success Icon */}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="relative z-10 mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl ring-8 ring-green-100">
              <CheckCircle className="w-12 h-12 text-white"/>
            </div>
          </motion.div>

          {/* Success Message */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="relative z-10 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Order Placed Successfully! 🎉
            </h1>
            
            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              Thank you <span className="font-semibold text-green-600">{customerName}</span>! 
              Your order has been confirmed and is being processed.
            </p>

            {orderNumber && (<div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-6 mb-8 border border-green-200">
                <p className="text-sm text-green-700 font-medium mb-2">Order Number</p>
                <p className="text-3xl font-bold text-green-800 tracking-wide">#{orderNumber}</p>
              </div>)}
          </motion.div>

          {/* Order Timeline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="relative z-10 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">What happens next?</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center p-4 bg-green-50 rounded-2xl border border-green-100">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6 text-white"/>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Order Confirmed</h4>
                <p className="text-sm text-gray-600 text-center">We've received your order and it's being processed</p>
              </div>

              <div className="flex flex-col items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3">
                  <Package className="w-6 h-6 text-white"/>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Preparing</h4>
                <p className="text-sm text-gray-600 text-center">Your items are being carefully prepared for shipping</p>
              </div>

              <div className="flex flex-col items-center p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-3">
                  <Truck className="w-6 h-6 text-white"/>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">On the Way</h4>
                <p className="text-sm text-gray-600 text-center">Your order will be shipped and tracked</p>
              </div>
            </div>
          </motion.div>

          {/* Email Notification Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="relative z-10 mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center justify-center">
                📧 Email Confirmation Sent
              </h4>
              <p className="text-blue-700 text-sm">
                We've sent order confirmation and tracking details to your email. 
                You'll also receive updates as your order progresses.
              </p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/orders" className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              <ShoppingBag className="w-5 h-5"/>
              <span>Track Your Order</span>
              <ArrowRight className="w-5 h-5"/>
            </Link>

            <Link href="/" className="flex items-center justify-center space-x-2 bg-white text-gray-700 px-8 py-4 rounded-2xl font-semibold border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
              <Home className="w-5 h-5"/>
              <span>Continue Shopping</span>
            </Link>
          </motion.div>

          {/* Additional Info */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="relative z-10 mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Need help? Contact our support team or check your order status in your account.
            </p>
          </motion.div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-green-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-emerald-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-5 w-12 h-12 bg-teal-200 rounded-full opacity-20 animate-pulse delay-500"></div>
      </motion.div>
    </div>);
}
