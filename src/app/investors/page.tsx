'use client';

import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users, Globe, FileText, Calendar, Mail, Phone } from 'lucide-react';

export default function Investors() {
  const financialMetrics = [
    { label: 'Revenue Growth', value: '150%', change: '+45%', positive: true },
    { label: 'Active Users', value: '10M+', change: '+2M', positive: true },
    { label: 'Market Cap', value: '$2.5B', change: '+15%', positive: true },
    { label: 'Countries', value: '50+', change: '+10', positive: true }
  ];

  const reports = [
    { title: 'Q4 2024 Earnings Report', date: 'February 15, 2025', type: 'PDF', size: '2.1 MB' },
    { title: 'Q3 2024 Earnings Report', date: 'November 10, 2024', type: 'PDF', size: '1.8 MB' },
    { title: 'Q2 2024 Earnings Report', date: 'August 5, 2024', type: 'PDF', size: '1.9 MB' },
    { title: 'Q1 2024 Earnings Report', date: 'May 12, 2024', type: 'PDF', size: '2.0 MB' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <h1 className="text-5xl font-bold mb-6">Investor Relations</h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Building the future of e-commerce through innovation, growth, and sustainable value creation.
            </p>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              {financialMetrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className="text-sm text-white/80">{metric.label}</div>
                  <div className={`text-xs ${metric.positive ? 'text-green-300' : 'text-red-300'}`}>
                    {metric.change}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Company Overview */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Company Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Our Mission</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Zaillisy is revolutionizing e-commerce by creating a social-first shopping experience that connects buyers and sellers worldwide. We're building the most trusted and innovative platform for social commerce.
                </p>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Growth Strategy</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Our strategy focuses on expanding into new markets, enhancing our technology platform, and building strong partnerships with brands and creators to drive sustainable long-term growth.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Market Opportunity</h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  The global e-commerce market is projected to reach $58.74 trillion by 2028, with social commerce growing at a CAGR of 31.4%. Zaillisy is well-positioned to capture this significant opportunity.
                </p>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Competitive Advantages</h3>
                <ul className="text-gray-600 space-y-2">
                  <li>• Advanced AI-powered recommendations</li>
                  <li>• Global reach across 50+ countries</li>
                  <li>• Strong brand partnerships</li>
                  <li>• Innovative social commerce features</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Financial Reports */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Financial Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reports.map((report, index) => (
                <motion.div
                  key={report.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{report.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {report.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {report.type} • {report.size}
                        </div>
                      </div>
                    </div>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                      Download
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Investor Contact</h2>
            <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
              Our investor relations team is available to answer your questions and provide additional information about Zaillisy's business and financial performance.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Mail className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Email Us</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">For investor inquiries and requests</p>
                <a
                  href="mailto:investors@goryl.com"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  investors@goryl.com
                </a>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Phone className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Call Us</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">For urgent investor matters</p>
                <a
                  href="tel:+1-555-123-4567"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  +1 (555) 123-4567
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
