'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Download, ShoppingBag, Eye, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
export default function OrderSuccessModal({ isOpen, onClose, orderId, orderTotal, customerEmail }) {
    const router = useRouter();
    const handleViewOrder = () => {
        onClose();
        router.push(`/orders/${orderId}`);
    };
    const handleContinueShopping = () => {
        onClose();
        router.push('/explore');
    };
    const handleDownloadInvoice = async () => {
        try {
            // Create PDF invoice content
            const invoiceContent = `
        GORYL - ORDER INVOICE
        =====================
        
        Order ID: ${orderId}
        Date: ${new Date().toLocaleDateString()}
        Total Amount: $${orderTotal.toFixed(2)}
        Customer Email: ${customerEmail || 'N/A'}
        
        Thank you for your order!
        
        Order Details:
        - Order placed successfully
        - Payment processed
        - Confirmation sent to email
        
        For support, contact us at support@goryl.com
      `;
            // Create blob and download
            const blob = new Blob([invoiceContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${orderId}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
        catch (error) {
            console.error('Error downloading invoice:', error);
            toast.error('Failed to download invoice. Please try again.');
        }
    };
    return (<AnimatePresence>
      {isOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
          
          {/* Modal */}
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10">
              <X className="w-6 h-6"/>
            </button>

            {/* Success Animation */}
            <div className="text-center p-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400"/>
              </motion.div>

              <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Order Placed Successfully! 🎉
              </motion.h2>

              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-gray-600 dark:text-gray-400 mb-6">
                Your order has been confirmed and is being processed.
              </motion.p>

              {/* Order Details */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Order ID:</span>
                  <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                    #{orderId.slice(-8).toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    ${orderTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-1 rounded-full">
                    Processing
                  </span>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-3">
                <button onClick={handleViewOrder} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center justify-center space-x-2">
                  <Eye className="w-5 h-5"/>
                  <span>View Order Details</span>
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleDownloadInvoice} className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-4 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2">
                    <Download className="w-4 h-4"/>
                    <span>Invoice</span>
                  </button>

                  <button onClick={handleContinueShopping} className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-2.5 px-4 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2">
                    <ShoppingBag className="w-4 h-4"/>
                    <span>Shop More</span>
                  </button>
                </div>
              </motion.div>

              {/* Email Confirmation */}
              {customerEmail && (<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Order confirmation sent to {customerEmail}
                </motion.p>)}
            </div>
          </motion.div>
        </div>)}
    </AnimatePresence>);
}
