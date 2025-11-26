'use client';
import { motion } from 'framer-motion';
import { Cookie, Settings, Info, CheckCircle } from 'lucide-react';
export default function Cookies() {
    const cookieTypes = [
        {
            name: 'Essential Cookies',
            description: 'These cookies are necessary for the website to function properly.',
            examples: ['Authentication', 'Shopping cart', 'Security features'],
            duration: 'Session',
            necessary: true
        },
        {
            name: 'Analytics Cookies',
            description: 'These cookies help us understand how visitors interact with our website.',
            examples: ['Page views', 'User behavior', 'Performance metrics'],
            duration: '2 years',
            necessary: false
        },
        {
            name: 'Marketing Cookies',
            description: 'These cookies are used to deliver relevant advertisements.',
            examples: ['Ad targeting', 'Social media integration', 'Retargeting'],
            duration: '1 year',
            necessary: false
        },
        {
            name: 'Preference Cookies',
            description: 'These cookies remember your preferences and settings.',
            examples: ['Language settings', 'Theme preferences', 'Location settings'],
            duration: '1 year',
            necessary: false
        }
    ];
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <div className="flex justify-center mb-6">
              <Cookie className="w-16 h-16"/>
            </div>
            <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Learn how we use cookies and similar technologies to enhance your browsing experience.
            </p>
            <p className="text-sm mt-4 opacity-90">Last updated: December 15, 2024</p>
          </motion.div>
        </div>
      </div>

      {/* What are Cookies */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">What Are Cookies?</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences, analyzing how you use our site, and personalizing content.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Info className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0"/>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Important Note</h3>
                  <p className="text-blue-800 text-sm">
                    By continuing to use our website, you consent to our use of cookies as described in this policy. You can manage your cookie preferences at any time through your browser settings or our cookie consent tool.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Types of Cookies */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Types of Cookies We Use</h2>
            <p className="text-gray-600 dark:text-gray-300">We use different types of cookies for various purposes</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {cookieTypes.map((type, index) => (<motion.div key={type.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{type.name}</h3>
                  {type.necessary && (<span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Necessary
                    </span>)}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{type.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Examples:</h4>
                  <ul className="space-y-1">
                    {type.examples.map((example) => (<li key={example} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500"/>
                        {example}
                      </li>))}
                  </ul>
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  <strong>Duration:</strong> {type.duration}
                </div>
              </motion.div>))}
          </div>
        </div>
      </div>

      {/* Cookie Management */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Managing Your Cookie Preferences</h2>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Browser Settings</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  You can control and manage cookies through your browser settings. Most browsers allow you to:
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>• View and delete existing cookies</li>
                  <li>• Block cookies from specific websites</li>
                  <li>• Block all cookies</li>
                  <li>• Set preferences for different types of cookies</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Our Cookie Consent Tool</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We provide a cookie consent tool that allows you to customize your cookie preferences. You can access this tool by clicking the cookie settings button in the footer of our website.
                </p>
                <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                  <Settings className="w-4 h-4"/>
                  Manage Cookie Settings
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Third-Party Cookies */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Third-Party Cookies</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We may use third-party services that also place cookies on your device. These services help us provide better functionality and analytics.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Analytics Services</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Google Analytics, Mixpanel</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Advertising Services</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Google Ads, Facebook Pixel</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Social Media</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Facebook, Twitter, Instagram</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Payment Processors</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Stripe, PayPal</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Updates and Contact */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Questions About Cookies?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              If you have any questions about our use of cookies or this cookie policy, please don't hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:privacy@goryl.com" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                Contact Privacy Team
              </a>
              <a href="/privacy" className="bg-transparent border border-purple-600 text-purple-600 px-6 py-3 rounded-lg hover:bg-purple-50 transition-colors">
                Privacy Policy
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>);
}
