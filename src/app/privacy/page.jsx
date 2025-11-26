'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, Users, Database, Globe, CheckCircle, AlertTriangle } from 'lucide-react';
const privacySections = [
    {
        id: 'information-collection',
        title: 'Information We Collect',
        icon: <Database className="w-6 h-6 text-purple-600"/>,
        content: `
      <h3>Personal Information</h3>
      <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This may include:</p>
      <ul>
        <li>Name, email address, and phone number</li>
        <li>Billing and shipping addresses</li>
        <li>Payment information (processed securely by our payment partners)</li>
        <li>Account preferences and settings</li>
      </ul>
      
      <h3>Automatically Collected Information</h3>
      <p>When you use our services, we automatically collect certain information, including:</p>
      <ul>
        <li>Device information (IP address, browser type, operating system)</li>
        <li>Usage data (pages visited, time spent, interactions)</li>
        <li>Location information (with your consent)</li>
        <li>Cookies and similar tracking technologies</li>
      </ul>
    `
    },
    {
        id: 'information-use',
        title: 'How We Use Your Information',
        icon: <Eye className="w-6 h-6 text-purple-600"/>,
        content: `
      <h3>Primary Uses</h3>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Provide, maintain, and improve our services</li>
        <li>Process transactions and send related information</li>
        <li>Send technical notices, updates, and support messages</li>
        <li>Respond to your comments, questions, and requests</li>
        <li>Communicate with you about products, services, and events</li>
      </ul>
      
      <h3>Analytics and Improvement</h3>
      <p>We also use information to:</p>
      <ul>
        <li>Analyze usage patterns and trends</li>
        <li>Develop new features and services</li>
        <li>Ensure security and prevent fraud</li>
        <li>Comply with legal obligations</li>
      </ul>
    `
    },
    {
        id: 'information-sharing',
        title: 'Information Sharing',
        icon: <Users className="w-6 h-6 text-purple-600"/>,
        content: `
      <h3>When We Share Information</h3>
      <p>We may share your information in the following circumstances:</p>
      <ul>
        <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our platform</li>
        <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
        <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
        <li><strong>Consent:</strong> With your explicit consent for specific purposes</li>
      </ul>
      
      <h3>What We Don't Share</h3>
      <p>We do not sell, rent, or trade your personal information to third parties for their marketing purposes without your consent.</p>
    `
    },
    {
        id: 'data-security',
        title: 'Data Security',
        icon: <Lock className="w-6 h-6 text-purple-600"/>,
        content: `
      <h3>Security Measures</h3>
      <p>We implement appropriate technical and organizational measures to protect your personal information, including:</p>
      <ul>
        <li>Encryption of data in transit and at rest</li>
        <li>Regular security assessments and updates</li>
        <li>Access controls and authentication measures</li>
        <li>Employee training on data protection</li>
      </ul>
      
      <h3>Data Breach Response</h3>
      <p>In the unlikely event of a data breach, we will:</p>
      <ul>
        <li>Notify affected users within 72 hours</li>
        <li>Take immediate steps to contain and remediate the breach</li>
        <li>Cooperate with relevant authorities</li>
        <li>Provide guidance on protective measures</li>
      </ul>
    `
    },
    {
        id: 'your-rights',
        title: 'Your Rights and Choices',
        icon: <CheckCircle className="w-6 h-6 text-purple-600"/>,
        content: `
      <h3>Access and Control</h3>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal information</li>
        <li>Correct inaccurate or incomplete information</li>
        <li>Request deletion of your personal information</li>
        <li>Object to or restrict certain processing activities</li>
        <li>Data portability (receive your data in a structured format)</li>
      </ul>
      
      <h3>Communication Preferences</h3>
      <p>You can control how we communicate with you:</p>
      <ul>
        <li>Opt out of marketing communications</li>
        <li>Choose your preferred communication channels</li>
        <li>Update your notification settings</li>
        <li>Unsubscribe from specific types of emails</li>
      </ul>
    `
    },
    {
        id: 'cookies',
        title: 'Cookies and Tracking',
        icon: <Globe className="w-6 h-6 text-purple-600"/>,
        content: `
      <h3>Types of Cookies We Use</h3>
      <p>We use various types of cookies for different purposes:</p>
      <ul>
        <li><strong>Essential Cookies:</strong> Required for basic site functionality</li>
        <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our site</li>
        <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
        <li><strong>Marketing Cookies:</strong> Used for advertising and analytics</li>
      </ul>
      
      <h3>Managing Cookies</h3>
      <p>You can control cookies through:</p>
      <ul>
        <li>Your browser settings</li>
        <li>Our cookie consent banner</li>
        <li>Third-party opt-out tools</li>
        <li>Contacting our support team</li>
      </ul>
    `
    }
];
export default function PrivacyPage() {
    const [activeSection, setActiveSection] = useState(null);
    const toggleSection = (sectionId) => {
        setActiveSection(activeSection === sectionId ? null : sectionId);
    };
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Shield className="w-16 h-16 mx-auto mb-6"/>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Privacy Policy
              </h1>
              <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
                How we collect, use, and protect your personal information
              </p>
              <p className="text-purple-100">
                Last updated: January 15, 2024
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Introduction
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              At Zaillisy, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
              e-commerce platform and related services.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              By using our services, you agree to the collection and use of information in accordance with this policy. 
              If you have any questions about this Privacy Policy, please contact us at privacy@goryl.com.
            </p>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
              <div className="flex items-start">
                <AlertTriangle className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0"/>
                <div>
                  <h3 className="text-blue-900 font-semibold mb-2">Important Notice</h3>
                  <p className="text-blue-800 text-sm">
                    This Privacy Policy applies to all users of Zaillisy's services. By continuing to use our platform, 
                    you acknowledge that you have read and understood this policy.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Privacy Sections */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-6">
            {privacySections.map((section, index) => (<motion.div key={section.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <button onClick={() => toggleSection(section.id)} className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center">
                    <div className="mr-4">
                      {section.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {section.title}
                    </h3>
                  </div>
                  <div className={`transform transition-transform ${activeSection === section.id ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </button>
                
                {activeSection === section.id && (<div className="px-6 pb-6">
                    <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: section.content }}/>
                  </div>)}
              </motion.div>))}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Contact Us
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              If you have any questions about this Privacy Policy or our data practices, 
              please don't hesitate to contact us.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Privacy Team</h3>
                <p className="text-gray-600 mb-2">privacy@goryl.com</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">For privacy-related inquiries</p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Data Protection Officer</h3>
                <p className="text-gray-600 mb-2">dpo@goryl.com</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">For GDPR and legal matters</p>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2">Mailing Address</h3>
              <p className="text-purple-800">
                Zaillisy Inc.<br />
                Attn: Privacy Team<br />
                123 Commerce St, Suite 100<br />
                New York, NY 10001<br />
                United States
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Updates Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Changes to This Privacy Policy
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices, 
              technology, legal requirements, or other factors. When we make changes, we will:
            </p>
            <ul className="text-gray-600 space-y-2 mb-6">
              <li>• Update the "Last updated" date at the top of this policy</li>
              <li>• Notify you through our platform or email for significant changes</li>
              <li>• Provide you with an opportunity to review the changes before they take effect</li>
              <li>• Obtain your consent when required by law</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300">
              We encourage you to review this Privacy Policy periodically to stay informed about how 
              we protect your information.
            </p>
          </motion.div>
        </div>
      </div>
    </div>);
}
