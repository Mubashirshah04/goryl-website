'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { HelpCircle, MessageCircle, Phone, Mail, MapPin, Clock, Search, ChevronDown, ChevronUp, FileText, Truck, CreditCard, Ruler, Package, ArrowRight } from 'lucide-react';
const faqs = [
    {
        question: "How do I track my order?",
        answer: "You can track your order by logging into your account and visiting the 'Orders' section, or by using the tracking number sent to your email."
    },
    {
        question: "What is your return policy?",
        answer: "We offer a 30-day return policy for most items. Products must be unused and in original packaging. Some items may have different return conditions."
    },
    {
        question: "How long does shipping take?",
        answer: "Standard shipping takes 3-5 business days, while express shipping takes 1-2 business days. International shipping may take 7-14 business days."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers."
    },
    {
        question: "How do I contact customer service?",
        answer: "You can reach us through live chat, email at support@goryl.com, or by calling our 24/7 support line at 1-800-GORYL."
    },
    {
        question: "Do you ship internationally?",
        answer: "Yes, we ship to over 50 countries worldwide. Shipping costs and delivery times vary by location."
    }
];
const helpCategories = [
    {
        icon: <Package className="w-6 h-6"/>,
        title: "Order Tracking",
        description: "Track your orders and delivery status",
        link: "/support/tracking"
    },
    {
        icon: <Truck className="w-6 h-6"/>,
        title: "Shipping Info",
        description: "Learn about shipping options and costs",
        link: "/support/shipping"
    },
    {
        icon: <FileText className="w-6 h-6"/>,
        title: "Returns & Refunds",
        description: "How to return items and get refunds",
        link: "/support/returns"
    },
    {
        icon: <CreditCard className="w-6 h-6"/>,
        title: "Payment Methods",
        description: "Accepted payment options and security",
        link: "/support/payments"
    },
    {
        icon: <Ruler className="w-6 h-6"/>,
        title: "Size Guide",
        description: "Find your perfect fit for clothing and shoes",
        link: "/support/size-guide"
    },
    {
        icon: <HelpCircle className="w-6 h-6"/>,
        title: "FAQs",
        description: "Frequently asked questions and answers",
        link: "/support/faqs"
    }
];
export default function SupportPage() {
    const [openFaq, setOpenFaq] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const handleFaqToggle = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };
    const handleContactSubmit = (e) => {
        e.preventDefault();
        toast.success('Message sent successfully! We\'ll get back to you within 24 hours.');
        setContactForm({ name: '', email: '', subject: '', message: '' });
    };
    const handleInputChange = (e) => {
        setContactForm(Object.assign(Object.assign({}, contactForm), { [e.target.name]: e.target.value }));
    };
    const filteredFaqs = faqs.filter(faq => faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()));
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <HelpCircle className="w-16 h-16 mx-auto mb-6"/>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Customer Support
              </h1>
              <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
                We're here to help you with any questions or concerns
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="py-8 bg-white border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search for help articles, FAQs, or contact information..." className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"/>
          </div>
        </div>
      </div>

      {/* Help Categories */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How can we help you?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Find answers to common questions and get the support you need
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((category, index) => (<motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} className="group">
                <div className="bg-gray-50 p-6 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-purple-600">
                      {category.icon}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors"/>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {category.description}
                  </p>
                </div>
              </motion.div>))}
          </div>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Quick answers to common questions
            </p>
          </div>
          
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (<motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <button onClick={() => handleFaqToggle(index)} className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <span className="font-semibold text-gray-900 dark:text-white">{faq.question}</span>
                  {openFaq === index ? (<ChevronUp className="w-5 h-5 text-gray-500"/>) : (<ChevronDown className="w-5 h-5 text-gray-500"/>)}
                </button>
                {openFaq === index && (<div className="px-6 pb-4">
                    <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
                  </div>)}
              </motion.div>))}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Contact Us
              </h2>
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name *
                    </label>
                    <input type="text" name="name" value={contactForm.name} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Your full name"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input type="email" name="email" value={contactForm.email} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="your@email.com"/>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject *
                  </label>
                  <input type="text" name="subject" value={contactForm.subject} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="What can we help you with?"/>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea name="message" value={contactForm.message} onChange={handleInputChange} required rows={5} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Tell us more about your question or concern..."/>
                </div>
                
                <button type="submit" className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                  Send Message
                </button>
              </form>
            </motion.div>

            {/* Contact Information */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Get in Touch
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                  Our customer support team is available 24/7 to help you with any questions or concerns.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Phone className="w-6 h-6 text-purple-600 mt-1"/>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Phone Support</h4>
                    <p className="text-gray-600 dark:text-gray-300">1-800-GORYL</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">24/7 available</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="w-6 h-6 text-purple-600 mt-1"/>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Email Support</h4>
                    <p className="text-gray-600 dark:text-gray-300">support@goryl.com</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Response within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MessageCircle className="w-6 h-6 text-purple-600 mt-1"/>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Live Chat</h4>
                    <p className="text-gray-600 dark:text-gray-300">Available on website</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Instant response</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-purple-600 mt-1"/>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Office Address</h4>
                    <p className="text-gray-600 dark:text-gray-300">123 Commerce St, Suite 100</p>
                    <p className="text-gray-600 dark:text-gray-300">New York, NY 10001</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="w-6 h-6 text-purple-600 mt-1"/>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Business Hours</h4>
                    <p className="text-gray-600 dark:text-gray-300">Monday - Friday: 9AM - 6PM EST</p>
                    <p className="text-gray-600 dark:text-gray-300">Saturday: 10AM - 4PM EST</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>);
}
