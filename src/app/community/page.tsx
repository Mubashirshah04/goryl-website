'use client';

import { motion } from 'framer-motion';
import { Users, Heart, MessageCircle, Star, Award, Globe } from 'lucide-react';

export default function Community() {
  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'User Forums',
      description: 'Connect with fellow shoppers and sellers in our vibrant community forums.'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Reviews & Ratings',
      description: 'Share your experiences and help others make informed purchasing decisions.'
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: 'Live Chat Support',
      description: 'Get real-time help from our community moderators and support team.'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Rewards Program',
      description: 'Earn points and rewards for your contributions to the community.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <div className="flex justify-center mb-6">
              <Users className="w-16 h-16" />
            </div>
            <h1 className="text-5xl font-bold mb-6">Our Community</h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Join millions of users worldwide in our vibrant community of shoppers, sellers, and creators.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Community Features */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Community Features</h2>
            <p className="text-gray-600 dark:text-gray-300">Discover ways to connect, share, and grow with our community</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors"
              >
                <div className="text-purple-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Community Stats */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Community Impact</h2>
            <p className="text-gray-600 dark:text-gray-300">Our community in numbers</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10M+', label: 'Active Users', icon: <Users className="w-8 h-8" /> },
              { value: '50+', label: 'Countries', icon: <Globe className="w-8 h-8" /> },
              { value: '1M+', label: 'Reviews', icon: <Star className="w-8 h-8" /> },
              { value: '100K+', label: 'Community Posts', icon: <MessageCircle className="w-8 h-8" /> }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-purple-600 mb-4 flex justify-center">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Join Community */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Our Community</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Connect with like-minded individuals, share your experiences, and be part of something special.
            </p>
            <button className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold">
              Get Started Today
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
