'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, ChevronUp, HelpCircle, MessageCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
export default function FAQs() {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');
    const categories = [
        { id: 'all', name: 'All Questions', count: 24 },
        { id: 'account', name: 'Account & Security', count: 6 },
        { id: 'orders', name: 'Orders & Shipping', count: 8 },
        { id: 'returns', name: 'Returns & Refunds', count: 5 },
        { id: 'payment', name: 'Payment & Billing', count: 5 }
    ];
    const faqs = [
        // Account & Security
        { category: 'account', question: 'How do I create an account?', answer: 'Creating an account is easy! Click the "Sign Up" button in the top right corner, fill in your email and password, and you will be ready to start shopping in minutes.' },
        { category: 'account', question: 'How do I reset my password?', answer: 'If you have forgotten your password, click the "Forgot Password" link on the login page. Enter your email address and we will send you a secure link to reset your password.' },
        { category: 'account', question: 'How can I update my account information?', answer: 'You can update your account information by logging into your account and visiting the "Account Settings" section.' },
        { category: 'account', question: 'Is my personal information secure?', answer: 'Yes, we take your security seriously. We use industry-standard encryption to protect your personal and payment information.' },
        { category: 'account', question: 'Can I have multiple addresses saved?', answer: 'Yes! You can save multiple shipping addresses in your account. This is especially useful if you want to ship to different locations.' },
        { category: 'account', question: 'How do I delete my account?', answer: 'To delete your account, please contact our customer support team. We will need to verify your identity first.' },
        // Orders & Shipping
        { category: 'orders', question: 'How can I track my order?', answer: 'You can track your order by logging into your account and visiting the "My Orders" section. You will receive tracking updates via email and SMS as well.' },
        { category: 'orders', question: 'How long does shipping take?', answer: 'Shipping times vary depending on your location and the shipping method you choose. Standard shipping typically takes 3-5 business days.' },
        { category: 'orders', question: 'Do you ship internationally?', answer: 'Yes! We ship to over 50 countries worldwide. Shipping times and costs vary by location.' },
        { category: 'orders', question: 'Can I change my shipping address after ordering?', answer: 'You can change your shipping address within 2 hours of placing your order by contacting our customer support team.' },
        { category: 'orders', question: 'What if my package is lost or damaged?', answer: 'If your package is lost or damaged, please contact our customer support team within 30 days of the expected delivery date.' },
        { category: 'orders', question: 'Can I cancel my order?', answer: 'You can cancel your order within 1 hour of placing it by contacting our customer support team.' },
        { category: 'orders', question: 'Do you offer free shipping?', answer: 'Yes! We offer free standard shipping on orders over $50. Free shipping applies to most locations within the continental United States.' },
        { category: 'orders', question: 'What shipping carriers do you use?', answer: 'We work with major shipping carriers including FedEx, UPS, and USPS. The specific carrier used for your order will depend on your location.' },
        // Returns & Refunds
        { category: 'returns', question: 'What is your return policy?', answer: 'We offer a 30-day return policy for most items. Products must be unused and in their original packaging.' },
        { category: 'returns', question: 'How do I return an item?', answer: 'To return an item, log into your account and go to "My Orders." Find the order containing the item you want to return and click "Return Item."' },
        { category: 'returns', question: 'How long does it take to process a refund?', answer: 'Once we receive your returned item, we will inspect it and process your refund within 3-5 business days.' },
        { category: 'returns', question: 'Do I have to pay for return shipping?', answer: 'Return shipping is free for items that arrive damaged or defective. For other returns, you may be responsible for return shipping costs.' },
        { category: 'returns', question: 'Can I exchange an item instead of returning it?', answer: 'Yes! You can exchange an item for a different size, color, or style. Simply select "Exchange" instead of "Return" when processing your return.' },
        // Payment & Billing
        { category: 'payment', question: 'What payment methods do you accept?', answer: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, Google Pay, and bank transfers for business accounts.' },
        { category: 'payment', question: 'Is it safe to pay online?', answer: 'Yes, your payment information is completely secure. We use industry-standard SSL encryption and never store your credit card details on our servers.' },
        { category: 'payment', question: 'Do you offer payment plans?', answer: 'Yes! We offer flexible payment plans through our financing partners. You can split your purchase into monthly payments with 0% interest on qualifying orders.' },
        { category: 'payment', question: 'Can I use multiple payment methods?', answer: 'Currently, we only accept one payment method per order. However, you can use gift cards or store credit along with another payment method.' },
        { category: 'payment', question: 'Do you charge sales tax?', answer: 'Sales tax is charged based on your shipping address and local tax laws. The tax amount will be calculated and displayed during checkout.' }
    ];
    const filteredFaqs = faqs.filter(faq => activeCategory === 'all' || faq.category === activeCategory).filter(faq => searchQuery === '' ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()));
    const handleSearch = () => {
        if (searchQuery.trim()) {
            toast.success(`Searching for: ${searchQuery}`);
        }
    };
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-gray-600 mb-8">Find quick answers to common questions about our products and services</p>
            
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input type="text" placeholder="Search for questions or topics..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} className="w-full px-6 py-4 pl-12 pr-20 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6"/>
                <button onClick={handleSearch} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">Search</button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Categories */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mb-12">
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category) => (<button key={category.id} onClick={() => setActiveCategory(category.id)} className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeCategory === category.id
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}`}>
                {category.name} ({category.count})
              </button>))}
          </div>
        </motion.div>

        {/* FAQs */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (<motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 + index * 0.05 }} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button onClick={() => setExpandedFaq(expandedFaq === index ? null : index)} className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                  {expandedFaq === index ? (<ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0"/>) : (<ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0"/>)}
                </button>
                {expandedFaq === index && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-6 pb-4">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
                  </motion.div>)}
              </motion.div>))}
          </div>

          {filteredFaqs.length === 0 && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No questions found</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Try adjusting your search terms or browse all categories</p>
              <button onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
            }} className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
                View All Questions
              </button>
            </motion.div>)}
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Still need help?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">Cannot find what you are looking for? Our support team is here to help</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
            { icon: <MessageCircle className="w-8 h-8"/>, title: 'Live Chat', description: 'Get instant help from our support team', action: 'Start Chat', color: 'bg-blue-500 hover:bg-blue-600' },
            { icon: <Mail className="w-8 h-8"/>, title: 'Email Support', description: 'Send us a detailed message', action: 'Send Email', color: 'bg-green-500 hover:bg-green-600' },
            { icon: <HelpCircle className="w-8 h-8"/>, title: 'Help Center', description: 'Browse our comprehensive help articles', action: 'Visit Help Center', color: 'bg-purple-500 hover:bg-purple-600' }
        ].map((method, index) => (<motion.div key={method.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }} className="text-center">
                  <div className={`${method.color} w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-4 transition-colors`}>
                    {method.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{method.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{method.description}</p>
                  <button className={`${method.color} text-white px-6 py-3 rounded-lg font-medium transition-colors`}>
                    {method.action}
                  </button>
                </motion.div>))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>);
}
