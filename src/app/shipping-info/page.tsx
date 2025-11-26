'use client';

import { motion } from 'framer-motion';
import { Truck, Clock, Globe, Package, MapPin, Shield, Zap } from 'lucide-react';

export default function ShippingInfo() {
  const shippingOptions = [
    {
      name: 'Standard Shipping',
      time: '3-5 business days',
      price: 'Free on orders over $50',
      icon: <Truck className="w-8 h-8" />,
      color: 'bg-blue-500'
    },
    {
      name: 'Express Shipping',
      time: '1-2 business days',
      price: '$9.99',
      icon: <Zap className="w-8 h-8" />,
      color: 'bg-green-500'
    },
    {
      name: 'Overnight Shipping',
      time: 'Next business day',
      price: '$19.99',
      icon: <Clock className="w-8 h-8" />,
      color: 'bg-purple-500'
    },
    {
      name: 'International Shipping',
      time: '7-14 business days',
      price: 'Varies by location',
      icon: <Globe className="w-8 h-8" />,
      color: 'bg-orange-500'
    }
  ];

  const shippingFeatures = [
    {
      icon: <Package className="w-6 h-6" />,
      title: 'Free Returns',
      description: 'Easy returns within 30 days'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Package Protection',
      description: 'Full coverage for lost or damaged items'
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Real-time Tracking',
      description: 'Track your package every step of the way'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping Information</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Fast, reliable shipping to get your orders to you quickly and safely</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Shipping Options</h2>
          <p className="text-gray-600 dark:text-gray-300">Choose the shipping method that works best for you</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shippingOptions.map((option, index) => (
            <motion.div
              key={option.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className={`${option.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4`}>
                {option.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{option.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{option.time}</p>
              <p className="text-blue-600 font-medium">{option.price}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Shipping?</h2>
            <p className="text-gray-600 dark:text-gray-300">We make shipping simple and reliable</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {shippingFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="text-center"
              >
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Shipping Destinations</h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">🇺🇸 United States</h3>
                <p className="text-gray-600 text-sm">All 50 states with standard and express options</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">🇨🇦 Canada</h3>
                <p className="text-gray-600 text-sm">Standard shipping available to all provinces</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">🌍 International</h3>
                <p className="text-gray-600 text-sm">Shipping to over 50 countries worldwide</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.8 }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Shipping Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Order Placed</h3>
                  <p className="text-gray-600 text-sm">We process your order within 24 hours</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Order Shipped</h3>
                  <p className="text-gray-600 text-sm">You'll receive tracking information via email</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">In Transit</h3>
                  <p className="text-gray-600 text-sm">Track your package in real-time</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Delivered</h3>
                  <p className="text-gray-600 text-sm">Your package arrives safely at your door</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.0 }}>
            <h2 className="text-3xl font-bold mb-4">Questions About Shipping?</h2>
            <p className="text-gray-300 mb-8">Our customer support team is here to help with any shipping questions</p>
            <button className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors">Contact Support</button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
