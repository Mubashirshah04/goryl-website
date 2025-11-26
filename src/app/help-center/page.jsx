'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, MessageCircle, Phone, Mail, Clock, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
export default function HelpCenter() {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState(null);
    const popularTopics = [
        { icon: <BookOpen className="w-6 h-6"/>, title: 'Getting Started', description: 'Learn how to create an account and make your first purchase', color: 'bg-blue-500' },
        { icon: <MessageCircle className="w-6 h-6"/>, title: 'Order Issues', description: 'Track orders, request refunds, and resolve delivery problems', color: 'bg-green-500' },
        { icon: <Phone className="w-6 h-6"/>, title: 'Account & Security', description: 'Manage your account settings and security preferences', color: 'bg-purple-500' },
        { icon: <Mail className="w-6 h-6"/>, title: 'Payment Methods', description: 'Learn about accepted payment options and billing', color: 'bg-orange-500' }
    ];
    const faqs = [
        { question: 'How do I create an account?', answer: 'Click "Sign Up" in the top right corner, fill in your email and password, and you\'ll be ready to start shopping in minutes.' },
        { question: 'How can I track my order?', answer: 'Log into your account and visit "My Orders" section. You\'ll receive tracking updates via email and SMS.' },
        { question: 'What is your return policy?', answer: 'We offer a 30-day return policy for most items. Products must be unused and in original packaging.' },
        { question: 'How do I contact customer support?', answer: 'Reach us through live chat, email at support@goryl.com, or call 1-800-GORYL. Available 24/7.' },
        { question: 'Do you ship internationally?', answer: 'Yes! We ship to over 50 countries worldwide. Shipping times and costs vary by location.' },
        { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, PayPal, Apple Pay, Google Pay, and bank transfers for business accounts.' }
    ];
    const handleSearch = () => {
        if (searchQuery.trim()) {
            toast.success(`Searching for: ${searchQuery}`);
        }
    };
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">How can we help you?</h1>
            <p className="text-xl text-gray-600 mb-8">Find answers to common questions or get in touch with our support team</p>
            
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input type="text" placeholder="Search for help articles, FAQs, or topics..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} className="w-full px-6 py-4 pl-12 pr-20 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6"/>
                <button onClick={handleSearch} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">Search</button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Topics</h2>
          <p className="text-gray-600 dark:text-gray-300">Quick access to the most common help topics</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularTopics.map((topic, index) => (<motion.div key={topic.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group">
              <div className={`${topic.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>{topic.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{topic.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{topic.description}</p>
              <div className="flex items-center text-blue-500 font-medium text-sm group-hover:text-blue-600">
                Learn more
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"/>
              </div>
            </motion.div>))}
        </div>
      </div>

      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Still need help?</h2>
            <p className="text-gray-600 dark:text-gray-300">Our support team is here to help you 24/7</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
            { icon: <MessageCircle className="w-8 h-8"/>, title: 'Live Chat', description: 'Get instant help from our support team', action: 'Start Chat', color: 'bg-blue-500 hover:bg-blue-600' },
            { icon: <Mail className="w-8 h-8"/>, title: 'Email Support', description: 'Send us a detailed message', action: 'Send Email', color: 'bg-green-500 hover:bg-green-600' },
            { icon: <Phone className="w-8 h-8"/>, title: 'Phone Support', description: 'Speak directly with our team', action: 'Call Now', color: 'bg-purple-500 hover:bg-purple-600' }
        ].map((method, index) => (<motion.div key={method.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }} className="text-center">
                <div className={`${method.color} w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-4 transition-colors`}>{method.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{method.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{method.description}</p>
                <button className={`${method.color} text-white px-6 py-3 rounded-lg font-medium transition-colors`}>{method.action}</button>
              </motion.div>))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-600 dark:text-gray-300">Quick answers to common questions</p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (<motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button onClick={() => setExpandedFaq(expandedFaq === index ? null : index)} className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                {expandedFaq === index ? <ChevronUp className="w-5 h-5 text-gray-500"/> : <ChevronDown className="w-5 h-5 text-gray-500"/>}
              </button>
              {expandedFaq === index && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-6 pb-4">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
                </motion.div>)}
            </motion.div>))}
        </div>
      </div>

      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}>
            <Clock className="w-12 h-12 mx-auto mb-4 text-blue-400"/>
            <h2 className="text-2xl font-bold mb-2">Support Hours</h2>
            <p className="text-gray-300 mb-4">Our customer support team is available 24/7 to assist you</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-gray-400 dark:text-gray-500">
              <span>📧 Email: support@goryl.com</span>
              <span>📞 Phone: 1-800-GORYL</span>
              <span>💬 Live Chat: Available 24/7</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>);
}
