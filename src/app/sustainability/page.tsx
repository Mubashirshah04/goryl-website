'use client';

import { motion } from 'framer-motion';
import { Leaf, Recycle, Users, Globe, Heart, Target } from 'lucide-react';

export default function Sustainability() {
  const initiatives = [
    {
      icon: <Leaf className="w-8 h-8" />,
      title: 'Carbon Neutral Operations',
      description: 'We are committed to achieving carbon neutrality by 2025 through renewable energy and carbon offset programs.',
      progress: 75
    },
    {
      icon: <Recycle className="w-8 h-8" />,
      title: 'Sustainable Packaging',
      description: '100% of our packaging is recyclable or biodegradable, reducing our environmental footprint.',
      progress: 100
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Fair Labor Practices',
      description: 'We ensure fair wages and safe working conditions across our global supply chain.',
      progress: 90
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'Local Sourcing',
      description: 'We prioritize local suppliers to reduce transportation emissions and support local economies.',
      progress: 60
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <div className="flex justify-center mb-6">
              <Leaf className="w-16 h-16" />
            </div>
            <h1 className="text-5xl font-bold mb-6">Sustainability</h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Building a better future through responsible business practices and environmental stewardship.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Mission Statement */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Commitment</h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              At Zaillisy, we believe that business success and environmental responsibility go hand in hand. 
              We are committed to reducing our environmental impact, supporting our communities, and creating 
              a sustainable future for generations to come.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Initiatives */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sustainability Initiatives</h2>
            <p className="text-gray-600 dark:text-gray-300">Our ongoing efforts to create positive environmental and social impact</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {initiatives.map((initiative, index) => (
              <motion.div
                key={initiative.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-green-600">{initiative.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{initiative.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{initiative.description}</p>
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{initiative.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${initiative.progress}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Impact Stats */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Impact</h2>
            <p className="text-gray-600 dark:text-gray-300">Measurable results of our sustainability efforts</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '45%', label: 'Carbon Reduction', icon: <Leaf className="w-8 h-8" /> },
              { value: '100%', label: 'Renewable Energy', icon: <Globe className="w-8 h-8" /> },
              { value: '10K+', label: 'Trees Planted', icon: <Heart className="w-8 h-8" /> },
              { value: '50+', label: 'Local Partners', icon: <Users className="w-8 h-8" /> }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-green-600 mb-4 flex justify-center">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Goals */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">2025 Sustainability Goals</h2>
            <div className="space-y-6">
              {[
                'Achieve carbon neutrality across all operations',
                'Implement 100% sustainable packaging solutions',
                'Support 100 local communities through partnerships',
                'Reduce water usage by 30%',
                'Achieve zero waste to landfill'
              ].map((goal, index) => (
                <motion.div
                  key={goal}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm"
                >
                  <Target className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{goal}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-16 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }}>
            <h2 className="text-3xl font-bold mb-4">Join Us in Building a Sustainable Future</h2>
            <p className="text-green-100 mb-8">
              Together, we can create positive change for our planet and communities.
            </p>
            <button className="bg-white text-green-600 px-8 py-3 rounded-lg hover:bg-green-50 transition-colors font-semibold">
              Learn More About Our Impact
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
