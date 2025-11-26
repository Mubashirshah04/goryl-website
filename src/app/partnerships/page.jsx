'use client';
import { motion } from 'framer-motion';
import { Handshake, Users, Globe, Award, Star } from 'lucide-react';
export default function Partnerships() {
    const partnershipTypes = [
        {
            icon: <Handshake className="w-8 h-8"/>,
            title: 'Brand Partnerships',
            description: 'Collaborate with leading brands to create exclusive products and experiences.'
        },
        {
            icon: <Users className="w-8 h-8"/>,
            title: 'Influencer Collaborations',
            description: 'Partner with content creators and influencers to reach new audiences.'
        },
        {
            icon: <Globe className="w-8 h-8"/>,
            title: 'Global Expansion',
            description: 'Join us in expanding our reach to new markets and regions worldwide.'
        },
        {
            icon: <Award className="w-8 h-8"/>,
            title: 'Technology Integration',
            description: 'Integrate your technology solutions with our platform for mutual growth.'
        }
    ];
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <div className="flex justify-center mb-6">
              <Handshake className="w-16 h-16"/>
            </div>
            <h1 className="text-5xl font-bold mb-6">Partnerships</h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Join forces with Zaillisy to create innovative solutions and drive mutual success.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Partnership Types */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Partnership Opportunities</h2>
            <p className="text-gray-600 dark:text-gray-300">Discover ways to collaborate and grow together</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {partnershipTypes.map((type, index) => (<motion.div key={type.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                <div className="text-purple-600 mb-4">{type.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{type.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{type.description}</p>
              </motion.div>))}
          </div>
        </div>
      </div>

      {/* Why Partner */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Partner With Us</h2>
            <p className="text-gray-600 dark:text-gray-300">Benefits of collaborating with Zaillisy</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
            'Access to 10M+ active users worldwide',
            'Advanced technology and analytics',
            'Global reach across 50+ countries',
            'Dedicated partnership support team'
        ].map((benefit, index) => (<motion.div key={benefit} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }} className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm">
                <Star className="w-6 h-6 text-purple-600 flex-shrink-0"/>
                <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
              </motion.div>))}
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Partner?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Let's discuss how we can work together to achieve mutual success.
            </p>
            <button className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold">
              Contact Partnership Team
            </button>
          </motion.div>
        </div>
      </div>
    </div>);
}
