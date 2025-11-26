'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, Mail, Phone, FileText, Image, Users, TrendingUp, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function Press() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Press' },
    { id: 'releases', name: 'Press Releases' },
    { id: 'news', name: 'News Coverage' },
    { id: 'awards', name: 'Awards & Recognition' },
    { id: 'partnerships', name: 'Partnerships' }
  ];

  const pressReleases = [
    {
      id: 1,
      title: 'Zaillisy Reaches 10 Million Active Users Milestone',
      category: 'releases',
      date: 'December 15, 2024',
      summary: 'Zaillisy celebrates reaching 10 million active users worldwide, marking a significant milestone in our mission to democratize e-commerce.',
      content: 'Zaillisy, the leading social commerce platform, today announced that it has reached 10 million active users worldwide. This milestone represents a 150% growth in user base over the past year and solidifies Zaillisy\'s position as a key player in the global e-commerce landscape.',
      tags: ['Milestone', 'Growth', 'Users']
    },
    {
      id: 2,
      title: 'Zaillisy Launches New AI-Powered Product Recommendations',
      category: 'releases',
      date: 'November 28, 2024',
      summary: 'New artificial intelligence features enhance shopping experience with personalized product recommendations.',
      content: 'Zaillisy has launched a new AI-powered recommendation engine that provides personalized product suggestions to users based on their browsing history, preferences, and social interactions. This technology is expected to increase user engagement by 40% and improve conversion rates.',
      tags: ['AI', 'Technology', 'Innovation']
    },
    {
      id: 3,
      title: 'Zaillisy Named "Best E-commerce Platform 2024" by TechReview',
      category: 'awards',
      date: 'November 10, 2024',
      summary: 'Industry recognition for excellence in e-commerce innovation and user experience.',
      content: 'TechReview, the leading technology publication, has named Zaillisy as the "Best E-commerce Platform 2024" in their annual awards ceremony. The recognition highlights Zaillisy\'s innovative approach to social commerce and commitment to user experience.',
      tags: ['Award', 'Recognition', 'Excellence']
    },
    {
      id: 4,
      title: 'Zaillisy Partners with Major Fashion Brands for Exclusive Collection',
      category: 'partnerships',
      date: 'October 22, 2024',
      summary: 'Strategic partnership brings exclusive fashion collections to Zaillisy platform.',
      content: 'Zaillisy has announced a strategic partnership with leading fashion brands to launch exclusive collections available only on the Zaillisy platform. This partnership will bring unique, limited-edition items to our community of fashion enthusiasts.',
      tags: ['Partnership', 'Fashion', 'Exclusive']
    },
    {
      id: 5,
      title: 'Zaillisy Expands to 50 Countries with Local Payment Solutions',
      category: 'releases',
      date: 'September 15, 2024',
      summary: 'Global expansion includes localized payment methods and regional partnerships.',
      content: 'Zaillisy has successfully expanded its operations to 50 countries, introducing localized payment solutions and regional partnerships. This expansion makes Zaillisy accessible to millions of new users worldwide.',
      tags: ['Expansion', 'Global', 'Payments']
    }
  ];

  const filteredPress = pressReleases.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  );

  const stats = [
    { icon: <Users className="w-6 h-6" />, label: 'Active Users', value: '10M+' },
    { icon: <Globe className="w-6 h-6" />, label: 'Countries', value: '50+' },
    { icon: <TrendingUp className="w-6 h-6" />, label: 'Growth Rate', value: '150%' },
    { icon: <FileText className="w-6 h-6" />, label: 'Press Mentions', value: '500+' }
  ];

  const mediaKit = [
    { name: 'Company Logo Pack', type: 'Logos', size: '2.5 MB', icon: <Image className="w-5 h-5" /> },
    { name: 'Brand Guidelines', type: 'PDF', size: '1.8 MB', icon: <FileText className="w-5 h-5" /> },
    { name: 'Product Screenshots', type: 'Images', size: '15.2 MB', icon: <Image className="w-5 h-5" /> },
    { name: 'Executive Bios', type: 'PDF', size: '0.8 MB', icon: <FileText className="w-5 h-5" /> }
  ];

  const handleDownload = (itemName: string) => {
    toast.success(`Downloading ${itemName}...`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <h1 className="text-5xl font-bold mb-6">Press & Media</h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Stay updated with the latest news, press releases, and media resources from Zaillisy.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-white/80 mb-2 flex justify-center">{stat.icon}</div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Media Kit Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Media Kit</h2>
            <p className="text-gray-600 dark:text-gray-300">Download official Zaillisy assets and resources for media use</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mediaKit.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-purple-600">{item.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{item.type} • {item.size}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(item.name)}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Press Releases Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Press Releases & News</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Latest updates and announcements from Zaillisy</p>

            {/* Filter Categories */}
            <div className="flex gap-2 overflow-x-auto mb-8">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Press Release Cards */}
          <div className="space-y-6">
            {filteredPress.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {categories.find(cat => cat.id === item.category)?.name}
                      </span>
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <Calendar className="w-4 h-4" />
                        {item.date}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{item.summary}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <button className="text-purple-600 hover:text-purple-700 transition-colors">
                    <FileText className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Media Contact</h2>
            <p className="text-gray-600 dark:text-gray-300">Get in touch with our press team for interviews, quotes, and media inquiries</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="bg-gray-50 rounded-lg p-8 text-center"
            >
              <Mail className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Email Us</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">For press inquiries and media requests</p>
              <a
                href="mailto:press@goryl.com"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                press@goryl.com
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="bg-gray-50 rounded-lg p-8 text-center"
            >
              <Phone className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Call Us</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">For urgent media inquiries</p>
              <a
                href="tel:+1-555-123-4567"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                +1 (555) 123-4567
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="text-center mt-12"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Press Office Hours</h3>
            <p className="text-gray-600 dark:text-gray-300">Monday - Friday: 9:00 AM - 6:00 PM EST</p>
            <p className="text-gray-600 dark:text-gray-300">For after-hours emergencies, please email press@goryl.com</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
