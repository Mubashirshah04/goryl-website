'use client';

import { motion } from 'framer-motion';
import { CreditCard, Shield, Lock, CheckCircle, Zap, Globe, Smartphone } from 'lucide-react';

export default function PaymentMethods() {
  const paymentMethods = [
    {
      name: 'Credit Cards',
      description: 'Visa, MasterCard, American Express, Discover',
      icon: <CreditCard className="w-8 h-8" />,
      color: 'bg-blue-500',
      features: ['Secure processing', 'Instant confirmation', 'Widely accepted']
    },
    {
      name: 'PayPal',
      description: 'Fast and secure online payments',
      icon: <Globe className="w-8 h-8" />,
      color: 'bg-blue-600',
      features: ['Buyer protection', 'No fees', 'Easy checkout']
    },
    {
      name: 'Digital Wallets',
      description: 'Apple Pay, Google Pay, Samsung Pay',
      icon: <Smartphone className="w-8 h-8" />,
      color: 'bg-green-500',
      features: ['Contactless payment', 'Quick checkout', 'Enhanced security']
    },
    {
      name: 'Bank Transfer',
      description: 'Direct bank-to-bank transfers',
      icon: <Zap className="w-8 h-8" />,
      color: 'bg-purple-500',
      features: ['No fees', 'Secure', 'Business accounts only']
    }
  ];

  const securityFeatures = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'SSL Encryption',
      description: 'All transactions are encrypted with 256-bit SSL'
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'PCI Compliance',
      description: 'We meet the highest security standards for payment processing'
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'Fraud Protection',
      description: 'Advanced fraud detection systems protect your transactions'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Methods</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Secure, convenient payment options to make your shopping experience seamless</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Accepted Payment Methods</h2>
          <p className="text-gray-600 dark:text-gray-300">Choose from a variety of secure payment options</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {paymentMethods.map((method, index) => (
            <motion.div
              key={method.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
            >
              <div className={`${method.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-6`}>
                {method.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{method.name}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{method.description}</p>
              <ul className="space-y-2">
                {method.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Security & Protection</h2>
            <p className="text-gray-600 dark:text-gray-300">Your security is our top priority</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {securityFeatures.map((feature, index) => (
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
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Payment FAQ</h2>
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Is it safe to pay online?</h3>
                <p className="text-gray-600 text-sm">Yes, all transactions are encrypted with industry-standard SSL encryption and we never store your credit card information.</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Do you accept international payments?</h3>
                <p className="text-gray-600 text-sm">Yes, we accept payments from customers worldwide using major credit cards and PayPal.</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Can I save my payment information?</h3>
                <p className="text-gray-600 text-sm">For security reasons, we don't store your payment information. You'll need to enter it for each transaction.</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.8 }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Payment Processing</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-green-500 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Select Payment Method</h3>
                  <p className="text-gray-600 text-sm">Choose your preferred payment option at checkout</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-green-500 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Enter Payment Details</h3>
                  <p className="text-gray-600 text-sm">Securely enter your payment information</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-green-500 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Instant Confirmation</h3>
                  <p className="text-gray-600 text-sm">Receive immediate confirmation of your payment</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-green-500 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Order Processing</h3>
                  <p className="text-gray-600 text-sm">Your order is processed and shipped quickly</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.0 }}>
            <h2 className="text-3xl font-bold mb-4">Questions About Payments?</h2>
            <p className="text-gray-300 mb-8">Our support team is here to help with any payment-related questions</p>
            <button className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors">Contact Support</button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
