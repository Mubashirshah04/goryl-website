'use client';

import { motion } from 'framer-motion';
import { Shield, Eye, Download, Trash2, Edit, Lock } from 'lucide-react';

export default function GDPR() {
  const rights = [
    {
      icon: <Eye className="w-6 h-6" />,
      title: 'Right to Access',
      description: 'You have the right to request access to your personal data and information about how we process it.'
    },
    {
      icon: <Edit className="w-6 h-6" />,
      title: 'Right to Rectification',
      description: 'You can request correction of inaccurate or incomplete personal data we hold about you.'
    },
    {
      icon: <Trash2 className="w-6 h-6" />,
      title: 'Right to Erasure',
      description: 'You can request deletion of your personal data in certain circumstances (right to be forgotten).'
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Right to Portability',
      description: 'You can request a copy of your personal data in a structured, machine-readable format.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <div className="flex justify-center mb-6">
              <Shield className="w-16 h-16" />
            </div>
            <h1 className="text-4xl font-bold mb-4">GDPR Compliance</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Your data protection rights and our commitment to GDPR compliance.
            </p>
            <p className="text-sm mt-4 opacity-90">Last updated: December 15, 2024</p>
          </motion.div>
        </div>
      </div>

      {/* Overview */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">What is GDPR?</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              The General Data Protection Regulation (GDPR) is a comprehensive data protection law that gives you control over your personal data. 
              It applies to all organizations operating within the EU and those that offer goods or services to individuals in the EU.
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              At Zaillisy, we are committed to protecting your privacy and ensuring compliance with GDPR requirements. 
              This page explains your rights and how we handle your personal data.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Your Rights */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Data Protection Rights</h2>
            <p className="text-gray-600 dark:text-gray-300">Under GDPR, you have several important rights regarding your personal data</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {rights.map((right, index) => (
              <motion.div
                key={right.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-blue-600">{right.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{right.title}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{right.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How to Exercise Your Rights */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">How to Exercise Your Rights</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              To exercise any of your GDPR rights, you can contact us using the information below. 
              We will respond to your request within 30 days.
            </p>
            
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h3>
                <div className="space-y-2 text-gray-600">
                  <p><strong>Email:</strong> privacy@goryl.com</p>
                  <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                  <p><strong>Address:</strong> Zaillisy Data Protection Officer, 123 Commerce Street, Suite 100, New York, NY 10001</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">What to Include in Your Request</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Your full name and contact information</li>
                  <li>• The specific right you want to exercise</li>
                  <li>• Any relevant account information (if applicable)</li>
                  <li>• The reason for your request (optional but helpful)</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Data Processing */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">How We Process Your Data</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              We process your personal data for the following purposes and legal bases:
            </p>
            
            <div className="space-y-6">
              {[
                {
                  purpose: 'Providing our services',
                  legalBasis: 'Contract performance',
                  description: 'To fulfill orders, process payments, and provide customer support'
                },
                {
                  purpose: 'Marketing communications',
                  legalBasis: 'Consent or legitimate interest',
                  description: 'To send you relevant offers and updates (with your consent)'
                },
                {
                  purpose: 'Analytics and improvement',
                  legalBasis: 'Legitimate interest',
                  description: 'To improve our services and user experience'
                },
                {
                  purpose: 'Legal compliance',
                  legalBasis: 'Legal obligation',
                  description: 'To comply with applicable laws and regulations'
                }
              ].map((item, index) => (
                <div key={item.purpose} className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.purpose}</h3>
                  <p className="text-sm text-blue-600 mb-2"><strong>Legal Basis:</strong> {item.legalBasis}</p>
                  <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Contact */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Questions About GDPR?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Our data protection team is here to help with any questions about your rights or our data practices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:privacy@goryl.com"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Contact Privacy Team
              </a>
              <a
                href="/privacy"
                className="bg-transparent border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Privacy Policy
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
