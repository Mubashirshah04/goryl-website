'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, Truck, CheckCircle, Clock, MapPin, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [trackingInfo, setTrackingInfo] = useState<any>(null);

  const trackingSteps = [
    { status: 'Order Placed', completed: true, date: '2024-01-15', time: '10:30 AM' },
    { status: 'Processing', completed: true, date: '2024-01-15', time: '2:45 PM' },
    { status: 'Shipped', completed: true, date: '2024-01-16', time: '9:15 AM' },
    { status: 'In Transit', completed: true, date: '2024-01-17', time: '3:20 PM' },
    { status: 'Out for Delivery', completed: false, date: '2024-01-18', time: '8:00 AM' },
    { status: 'Delivered', completed: false, date: '2024-01-18', time: '2:00 PM' }
  ];

  const handleTrackOrder = () => {
    if (orderNumber && email) {
      // Simulate tracking lookup
      setTrackingInfo({
        orderNumber: orderNumber,
        status: 'In Transit',
        estimatedDelivery: 'January 18, 2024',
        carrier: 'FedEx',
        trackingNumber: '1234567890123',
        currentLocation: 'Distribution Center, Los Angeles, CA'
      });
      toast.success('Order found!');
    } else {
      toast.error('Please fill in all fields');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Track Your Order</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Stay updated on your order status with real-time tracking information</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Enter Order Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Order Number *</label>
              <input
                type="text"
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your order number"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address *</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your email address"
              />
            </div>
          </div>
          <button
            onClick={handleTrackOrder}
            className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            Track Order
          </button>
        </motion.div>

        {trackingInfo && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Order Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Order Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Order Number:</span>
                    <span className="font-medium">{trackingInfo.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Status:</span>
                    <span className="font-medium text-blue-600">{trackingInfo.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Estimated Delivery:</span>
                    <span className="font-medium">{trackingInfo.estimatedDelivery}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Shipping Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Carrier:</span>
                    <span className="font-medium">{trackingInfo.carrier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Tracking Number:</span>
                    <span className="font-medium">{trackingInfo.trackingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Current Location:</span>
                    <span className="font-medium">{trackingInfo.currentLocation}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Tracking Timeline</h2>
          <div className="space-y-6">
            {trackingSteps.map((step, index) => (
              <div key={step.status} className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.completed ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.status}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {step.date} at {step.time}
                  </p>
                </div>
                {index < trackingSteps.length - 1 && (
                  <div className={`w-0.5 h-8 ml-4 ${step.completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Help?</h2>
            <p className="text-gray-600 dark:text-gray-300">Contact our support team for assistance with your order</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Phone className="w-8 h-8" />, title: 'Call Us', description: 'Speak with our support team', action: '1-800-GORYL', color: 'bg-blue-500' },
              { icon: <Mail className="w-8 h-8" />, title: 'Email Support', description: 'Send us a detailed message', action: 'support@goryl.com', color: 'bg-green-500' },
              { icon: <Package className="w-8 h-8" />, title: 'Live Chat', description: 'Get instant help online', action: 'Start Chat', color: 'bg-purple-500' }
            ].map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                className="text-center"
              >
                <div className={`${method.color} w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-4`}>
                  {method.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{method.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{method.description}</p>
                <p className="text-blue-600 font-medium">{method.action}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
