'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Package, CreditCard, CheckCircle, AlertCircle, Truck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ReturnsRefunds() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');

  const returnSteps = [
    {
      icon: <Package className="w-8 h-8" />,
      title: 'Initiate Return',
      description: 'Log into your account and select the items you want to return',
      color: 'bg-blue-500'
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: 'Ship Back',
      description: 'Print the return label and drop off your package',
      color: 'bg-green-500'
    },
    {
      icon: <RefreshCw className="w-8 h-8" />,
      title: 'We Process',
      description: 'We inspect your return and process your refund',
      color: 'bg-purple-500'
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: 'Get Refund',
      description: 'Receive your refund within 3-5 business days',
      color: 'bg-orange-500'
    }
  ];

  const returnPolicy = [
    {
      title: '30-Day Return Window',
      description: 'You have 30 days from the delivery date to return most items',
      icon: <Clock className="w-6 h-6" />
    },
    {
      title: 'Original Condition',
      description: 'Items must be unused and in their original packaging',
      icon: <CheckCircle className="w-6 h-6" />
    },
    {
      title: 'Free Return Shipping',
      description: 'Free returns for damaged or defective items',
      icon: <Truck className="w-6 h-6" />
    },
    {
      title: 'Quick Refunds',
      description: 'Refunds processed within 3-5 business days',
      icon: <CreditCard className="w-6 h-6" />
    }
  ];

  const handleTrackReturn = () => {
    if (orderNumber && email) {
      toast.success('Return status checked!');
    } else {
      toast.error('Please fill in all fields');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Returns & Refunds</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">We want you to love your purchase. If you're not completely satisfied, we're here to help with easy returns and quick refunds.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Track Your Return</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="space-y-6">
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
                <button
                  onClick={handleTrackReturn}
                  className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Track Return Status
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Return Policy Highlights</h2>
            <div className="space-y-4">
              {returnPolicy.map((policy, index) => (
                <motion.div
                  key={policy.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-start gap-4"
                >
                  <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                    {policy.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{policy.title}</h3>
                    <p className="text-gray-600 text-sm">{policy.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How Returns Work</h2>
            <p className="text-gray-600 dark:text-gray-300">Simple 4-step process to return your items</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {returnSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                className="text-center"
              >
                <div className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-4`}>
                  {step.icon}
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
                {index < returnSteps.length - 1 && (
                  <div className="hidden lg:block mt-4">
                    <ArrowRight className="w-6 h-6 text-gray-400 mx-auto" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">What Can Be Returned</h2>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">✅ Most Items</h3>
                    <p className="text-green-700 text-sm">Clothing, electronics, home goods, and more within 30 days</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">✅ Damaged Items</h3>
                    <p className="text-green-700 text-sm">Items that arrive damaged or defective</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">✅ Wrong Items</h3>
                    <p className="text-green-700 text-sm">Items that don't match your order</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.0 }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">What Cannot Be Returned</h2>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">❌ Used Items</h3>
                    <p className="text-red-700 text-sm">Items that have been worn, used, or damaged by customer</p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">❌ Personal Items</h3>
                    <p className="text-red-700 text-sm">Hygiene products, underwear, and personal care items</p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">❌ Custom Items</h3>
                    <p className="text-red-700 text-sm">Personalized or custom-made products</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.2 }}>
            <h2 className="text-3xl font-bold mb-4">Need Help with Your Return?</h2>
            <p className="text-gray-300 mb-8">Our customer support team is here to help you with any questions about returns or refunds</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <button className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors">Contact Support</button>
              <button className="bg-gray-700 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors">Live Chat</button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
