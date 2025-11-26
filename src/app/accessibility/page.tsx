'use client';

import { motion } from 'framer-motion';
import { Accessibility as AccessibilityIcon, Eye, Ear, Hand, Brain, CheckCircle } from 'lucide-react';

export default function Accessibility() {
  const features = [
    {
      icon: <Eye className="w-8 h-8" />,
      title: 'Visual Accessibility',
      description: 'High contrast options, resizable text, and screen reader compatibility.',
      features: ['Screen reader support', 'High contrast mode', 'Resizable text', 'Alt text for images']
    },
    {
      icon: <Ear className="w-8 h-8" />,
      title: 'Auditory Accessibility',
      description: 'Captions, transcripts, and audio alternatives for multimedia content.',
      features: ['Video captions', 'Audio transcripts', 'Volume controls', 'Audio descriptions']
    },
    {
      icon: <Hand className="w-8 h-8" />,
      title: 'Motor Accessibility',
      description: 'Keyboard navigation, voice control, and assistive technology support.',
      features: ['Keyboard navigation', 'Voice control', 'Large click targets', 'Customizable timing']
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'Cognitive Accessibility',
      description: 'Clear navigation, consistent design, and simplified language options.',
      features: ['Clear navigation', 'Consistent design', 'Simple language', 'Focus indicators']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <div className="flex justify-center mb-6">
              <AccessibilityIcon className="w-16 h-16" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Accessibility</h1>
            <p className="text-xl max-w-3xl mx-auto">
              We are committed to making our website accessible to everyone, regardless of ability or disability.
            </p>
            <p className="text-sm mt-4 opacity-90">Last updated: December 15, 2024</p>
          </motion.div>
        </div>
      </div>

      {/* Commitment */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Commitment</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              At Zaillisy, we believe that digital accessibility is a fundamental right, not a privilege. 
              We are committed to ensuring that our website is accessible to people with disabilities 
              and provides an inclusive experience for all users.
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              We strive to meet or exceed the Web Content Accessibility Guidelines (WCAG) 2.1 AA standards 
              and continuously work to improve the accessibility of our platform.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Accessibility Features */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Accessibility Features</h2>
            <p className="text-gray-600 dark:text-gray-300">Discover the accessibility features we've implemented to support all users</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-purple-600">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How to Use */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">How to Use Accessibility Features</h2>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Keyboard Navigation</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Navigate our website using only your keyboard. Use Tab to move between elements, 
                  Enter to activate buttons, and arrow keys to navigate menus.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Tab:</strong> Move forward through elements
                  </div>
                  <div>
                    <strong>Shift + Tab:</strong> Move backward through elements
                  </div>
                  <div>
                    <strong>Enter/Space:</strong> Activate buttons and links
                  </div>
                  <div>
                    <strong>Arrow Keys:</strong> Navigate menus and dropdowns
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Screen Reader Support</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Our website is compatible with popular screen readers including JAWS, NVDA, and VoiceOver. 
                  All images have descriptive alt text, and our navigation is properly structured.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• All images include descriptive alt text</li>
                  <li>• Proper heading structure for easy navigation</li>
                  <li>• Form labels and error messages are announced</li>
                  <li>• Skip links for main content navigation</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Visual Accessibility</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We provide options to customize the visual appearance of our website to meet your needs.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• High contrast mode available</li>
                  <li>• Text can be resized up to 200%</li>
                  <li>• Clear focus indicators on all interactive elements</li>
                  <li>• Consistent color usage with sufficient contrast ratios</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Feedback */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">We Value Your Feedback</h2>
            <p className="text-gray-600 mb-8 text-center">
              We are continuously working to improve the accessibility of our website. 
              If you encounter any accessibility barriers or have suggestions for improvement, 
              please let us know.
            </p>
            
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Contact Our Accessibility Team</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Email</h4>
                  <a href="mailto:accessibility@goryl.com" className="text-purple-600 hover:text-purple-700">
                    accessibility@goryl.com
                  </a>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Phone</h4>
                  <a href="tel:+1-555-123-4567" className="text-purple-600 hover:text-purple-700">
                    +1 (555) 123-4567
                  </a>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                We typically respond to accessibility feedback within 2 business days.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Standards */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Accessibility Standards</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Our website is designed and developed to meet or exceed the following accessibility standards:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">WCAG 2.1 AA</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Web Content Accessibility Guidelines</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Section 508</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Federal accessibility requirements</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">ADA Compliance</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Americans with Disabilities Act</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
