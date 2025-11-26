'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success('Message sent successfully!');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Have a question? We'd love to hear from you. Our team is here to help you 24/7.</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { icon: <Mail className="w-6 h-6" />, title: 'Email Us', details: 'support@goryl.com', description: 'Get a response within 24 hours' },
            { icon: <Phone className="w-6 h-6" />, title: 'Call Us', details: '1-800-GORYL', description: 'Available 24/7 for urgent issues' },
            { icon: <MapPin className="w-6 h-6" />, title: 'Visit Us', details: '123 Commerce St, Tech City', description: 'Mon-Fri 9AM-6PM' }
          ].map((info, index) => (
            <motion.div key={info.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow">
              <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center text-white mx-auto mb-4">{info.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{info.title}</h3>
              <p className="text-lg font-medium text-blue-600 mb-2">{info.details}</p>
              <p className="text-gray-600 dark:text-gray-300">{info.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                  <input type="text" id="name" name="name" required value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white" placeholder="Enter your full name" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address *</label>
                  <input type="email" id="email" name="email" required value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white" placeholder="Enter your email" />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject *</label>
                <select id="subject" name="subject" required value={formData.subject} onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white">
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="billing">Billing Question</option>
                  <option value="order">Order Issue</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message *</label>
                <textarea id="message" name="message" required rows={6} value={formData.message} onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 dark:text-white" placeholder="Tell us how we can help you..." />
              </div>
              
              <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Why Choose Zaillisy?</h3>
            
            <div className="space-y-6">
              {[
                { icon: <CheckCircle className="w-5 h-5 text-green-600" />, title: '24/7 Support', description: 'Our customer support team is available round the clock to assist you with any questions or concerns.', bgColor: 'bg-green-100' },
                { icon: <CheckCircle className="w-5 h-5 text-blue-600" />, title: 'Fast Response', description: 'We typically respond to all inquiries within 24 hours, often much sooner.', bgColor: 'bg-blue-100' },
                { icon: <CheckCircle className="w-5 h-5 text-purple-600" />, title: 'Expert Team', description: 'Our support team consists of product experts who can help with any technical or account-related issues.', bgColor: 'bg-purple-100' },
                { icon: <CheckCircle className="w-5 h-5 text-orange-600" />, title: 'Multiple Channels', description: 'Contact us via email, phone, live chat, or social media - whatever works best for you.', bgColor: 'bg-orange-100' }
              ].map((feature, index) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className={`${feature.bgColor} w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`}>{feature.icon}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Response Times</h4>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between"><span>Live Chat:</span><span className="font-medium">Instant</span></div>
                <div className="flex justify-between"><span>Phone Support:</span><span className="font-medium">Immediate</span></div>
                <div className="flex justify-between"><span>Email Support:</span><span className="font-medium">Within 24 hours</span></div>
                <div className="flex justify-between"><span>Social Media:</span><span className="font-medium">Within 2 hours</span></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Visit Our Office</h2>
            <p className="text-gray-600 dark:text-gray-300">Come say hello at our office HQ</p>
          </motion.div>
          
          <div className="bg-gray-200 rounded-xl h-96 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">Interactive map would be embedded here</p>
              <p className="text-sm text-gray-500 mt-2">123 Commerce St, Tech City, TC 12345</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
