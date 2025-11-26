'use client';
import { motion } from 'framer-motion';
import { Shield, FileText, Mail } from 'lucide-react';
export default function Terms() {
    const sections = [
        {
            id: 'acceptance',
            title: 'Acceptance of Terms',
            content: `By accessing and using Zaillisy's website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`
        },
        {
            id: 'services',
            title: 'Description of Service',
            content: `Zaillisy provides an e-commerce platform that allows users to buy and sell products online. Our services include product listings, payment processing, shipping coordination, and customer support. We reserve the right to modify or discontinue any part of our service at any time.`
        },
        {
            id: 'accounts',
            title: 'User Accounts',
            content: `To access certain features of our service, you must create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You must be at least 18 years old to create an account.`
        },
        {
            id: 'conduct',
            title: 'User Conduct',
            content: `You agree not to use our service to: (a) violate any laws or regulations; (b) infringe on the rights of others; (c) post false or misleading information; (d) engage in fraudulent activities; (e) distribute malware or harmful code; (f) attempt to gain unauthorized access to our systems.`
        },
        {
            id: 'intellectual-property',
            title: 'Intellectual Property',
            content: `All content on Zaillisy, including text, graphics, logos, images, and software, is the property of Zaillisy or its licensors and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written consent.`
        },
        {
            id: 'privacy',
            title: 'Privacy Policy',
            content: `Your privacy is important to us. Please review our Privacy Policy, which also governs your use of our service, to understand our practices regarding the collection and use of your personal information.`
        },
        {
            id: 'payments',
            title: 'Payment Terms',
            content: `All payments must be made through our approved payment methods. Prices are subject to change without notice. We reserve the right to refuse or cancel orders at our discretion. Refunds are processed according to our refund policy.`
        },
        {
            id: 'shipping',
            title: 'Shipping and Delivery',
            content: `Shipping times and costs vary by location and shipping method. We are not responsible for delays caused by shipping carriers or circumstances beyond our control. Risk of loss and title for items pass to you upon delivery.`
        },
        {
            id: 'returns',
            title: 'Returns and Refunds',
            content: `We accept returns within 30 days of delivery for most items. Items must be unused and in original packaging. Return shipping costs may apply. Refunds are processed within 3-5 business days of receiving returned items.`
        },
        {
            id: 'disclaimers',
            title: 'Disclaimers',
            content: `Our service is provided "as is" without warranties of any kind. We disclaim all warranties, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.`
        },
        {
            id: 'limitation',
            title: 'Limitation of Liability',
            content: `In no event shall Zaillisy be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of our service.`
        },
        {
            id: 'indemnification',
            title: 'Indemnification',
            content: `You agree to indemnify and hold harmless Zaillisy and its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of our service or violation of these terms.`
        },
        {
            id: 'termination',
            title: 'Termination',
            content: `We may terminate or suspend your account and access to our service immediately, without prior notice, for any reason, including breach of these terms. Upon termination, your right to use our service will cease immediately.`
        },
        {
            id: 'governing-law',
            title: 'Governing Law',
            content: `These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Zaillisy operates, without regard to its conflict of law provisions.`
        },
        {
            id: 'changes',
            title: 'Changes to Terms',
            content: `We reserve the right to modify these terms at any time. We will notify users of any material changes by posting the new terms on our website. Your continued use of our service after such changes constitutes acceptance of the new terms.`
        },
        {
            id: 'contact',
            title: 'Contact Information',
            content: `If you have any questions about these terms, please contact us at legal@goryl.com or by mail at Zaillisy Legal Department, 123 Commerce Street, Suite 100, New York, NY 10001.`
        }
    ];
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <div className="flex justify-center mb-6">
              <Shield className="w-16 h-16"/>
            </div>
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Please read these terms carefully before using our services. By using Zaillisy, you agree to be bound by these terms.
            </p>
            <p className="text-sm mt-4 opacity-90">Last updated: December 15, 2024</p>
          </motion.div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Navigation</h2>
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => (<a key={section.id} href={`#${section.id}`} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-purple-100 hover:text-purple-700 transition-colors">
                  {section.title}
                </a>))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Terms Content */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            {sections.map((section, index) => (<motion.div key={section.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }} id={section.id} className={`mb-8 ${index !== sections.length - 1 ? 'border-b border-gray-200 pb-8' : ''}`}>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{section.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{section.content}</p>
              </motion.div>))}
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 border-t border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }} className="text-center">
            <div className="flex justify-center mb-4">
              <FileText className="w-12 h-12 text-yellow-600"/>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Important Legal Notice</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              These terms constitute a legally binding agreement between you and Zaillisy. If you do not agree to these terms, 
              please do not use our services. We recommend consulting with a legal professional if you have any questions 
              about these terms.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }}>
            <h2 className="text-3xl font-bold mb-4">Questions About These Terms?</h2>
            <p className="text-gray-300 mb-8">
              Our legal team is here to help clarify any questions you may have about our terms of service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:legal@goryl.com" className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2">
                <Mail className="w-4 h-4"/>
                Email Legal Team
              </a>
              <a href="/contact-us" className="bg-transparent border border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-gray-900 transition-colors">
                Contact Support
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>);
}
