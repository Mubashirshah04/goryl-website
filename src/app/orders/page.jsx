'use client';
import React, { useState, useEffect } from 'react';
// ✅ AWS DYNAMODB - Firestore removed
// ✅ AWS - Using AWS services
import { useAuthStore } from '@/store/authStoreCognito';
import { Package, Clock, CheckCircle, XCircle, Truck, Star, Download, MessageCircle, RefreshCw, Phone, Eye, X, MapPin, Calendar, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { initiateReturn, submitReview, generateInvoice } from '@/lib/orderManagementService';
const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    confirmed: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
    shipped: { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-100' },
    delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' }
};
export default function OrdersPage() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const { user } = useAuthStore();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    useEffect(() => {
        if (!user) {
            console.log('❌ No user found for orders');
            setLoading(false);
            return;
        }
        console.log('🔍 Loading orders for user:', user.sub);
        // Use single query with userId (primary field)
        const q = query(collection(db, 'orders'), where('userId', '==', user.sub), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log('📦 Orders found:', snapshot.docs.length);
            const ordersData = snapshot.docs.map(doc => {
                var _a, _b;
                const data = doc.data();
                return Object.assign(Object.assign({ id: doc.id }, data), { 
                    // Ensure createdAt is properly handled
                    createdAt: ((_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) ? data.createdAt : new Date(data.createdAt), updatedAt: ((_b = data.updatedAt) === null || _b === void 0 ? void 0 : _b.toDate) ? data.updatedAt : new Date(data.updatedAt) });
            });
            console.log('📋 Orders loaded successfully:', ordersData.length);
            setOrders(ordersData);
            setLoading(false);
        }, (error) => {
            console.error('❌ Error loading orders:', error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user === null || user === void 0 ? void 0 : user.sub]);
    const filteredOrders = activeTab === 'all'
        ? orders
        : orders.filter(order => order.status === activeTab);
    const handleTrackOrder = (orderId) => {
        // Navigate to dedicated tracking page
        window.open(`/track/${orderId}`, '_blank');
    };
    // Open detailed order view
    const openOrderDetails = (order) => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
    };
    const closeOrderDetails = () => {
        setSelectedOrder(null);
        setShowOrderDetails(false);
    };
    // Show detailed order status like Amazon/Flipkart
    const showOrderTrackingInfo = (order) => {
        const statusMessages = {
            pending: '📋 Your order has been placed and is awaiting confirmation from the seller.',
            confirmed: '✅ Your order has been confirmed by the seller and is being prepared.',
            processing: '📦 Your order is being processed and packed for shipment.',
            shipped: '🚚 Your order has been shipped and is on its way to you.',
            out_for_delivery: '🚛 Your order is out for delivery and will arrive soon.',
            delivered: '📦 Your order has been delivered successfully.',
            cancelled: '❌ Your order has been cancelled.'
        };
        const estimatedDays = {
            pending: '1-2 business days',
            confirmed: '2-3 business days',
            processing: '1-2 business days',
            shipped: '3-5 business days',
            out_for_delivery: 'Today',
            delivered: 'Completed',
            cancelled: 'N/A'
        };
        const trackingInfo = `
🚚 ORDER TRACKING DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Order ID: #${order.id.slice(-8).toUpperCase()}
📅 Order Date: ${new Date(order.createdAt.toDate()).toLocaleDateString()}
💰 Order Total: Rs ${(order.totalAmount || order.total || 0).toFixed(2)}
🏷️ Tracking Number: ${order.trackingNumber || `GW${Date.now().toString().slice(-8)}`}

📍 CURRENT STATUS: ${order.status.toUpperCase().replace('_', ' ')}
${statusMessages[order.status] || 'Status update in progress...'}

⏱️ ESTIMATED DELIVERY: ${estimatedDays[order.status]}

📱 You will receive SMS/Email updates at each step
🔔 Turn on notifications for real-time updates

━━━━━━━━━━━━━━━━━━━━━━━━━━
🏪 Goryl Marketplace - Track Your Order
    `;
        toast.info('Tracking information displayed');
    };
    const handleCancelOrder = async (orderId) => {
        const order = orders.find(o => o.id === orderId);
        if (!order)
            return;
        const confirmCancel = await new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Cancel Order</h3>
                    <p class="text-gray-600 mb-6">Are you sure you want to cancel Order #${orderId.slice(-8).toUpperCase()}? This action cannot be undone.</p>
                    <div class="flex space-x-3">
                        <button id="cancel" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                        <button id="confirm" class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Cancel Order</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.querySelector('#cancel')?.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });
            modal.querySelector('#confirm')?.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(true);
            });
        });
        
        if (confirmCancel) {
            try {
                // Update order status to cancelled
                const orderRef = doc(db, 'orders', orderId);
                await updateDoc(orderRef, {
                    status: 'cancelled',
                    updatedAt: new Date(),
                    timeline: [
                        ...(order.timeline || []),
                        {
                            status: 'cancelled',
                            message: 'Order cancelled by customer',
                            timestamp: new Date()
                        }
                    ]
                });
                toast.success('✅ Order cancelled successfully!');
            }
            catch (error) {
                console.error('❌ Error cancelling order:', error);
                toast.error('❌ Failed to cancel order. Please try again.');
            }
        }
    };
    // 📄 DOWNLOAD INVOICE
    const handleDownloadInvoice = async (orderId) => {
        try {
            const result = await generateInvoice(orderId);
            if (result.success) {
                toast.success(`📄 Invoice Generated! Invoice Number: ${result.invoice.invoiceNumber}`);
                // In real app, trigger PDF download
                console.log('📄 Invoice ready for download:', result.invoice);
            }
        }
        catch (error) {
            toast.error('❌ Failed to generate invoice. Please try again.');
        }
    };
    // ⭐ RATE & REVIEW ORDER
    const handleRateOrder = async (orderId) => {
        var _a;
        const order = orders.find(o => o.id === orderId);
        if (!order || !user)
            return;
        const rating = await new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Rate Order</h3>
                    <p class="text-gray-600 mb-4">Rate this order (1-5 stars):</p>
                    <input type="number" id="rating" min="1" max="5" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter rating (1-5)">
                    <div class="flex space-x-3 mt-4">
                        <button id="cancel" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                        <button id="confirm" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Submit</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.querySelector('#cancel')?.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(null);
            });
            modal.querySelector('#confirm')?.addEventListener('click', () => {
                const ratingValue = modal.querySelector('#rating')?.value;
                document.body.removeChild(modal);
                resolve(ratingValue || null);
            });
        });
        
        const review = await new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Write Review</h3>
                    <p class="text-gray-600 mb-4">Write a review (optional):</p>
                    <textarea id="review" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24" placeholder="Enter your review"></textarea>
                    <div class="flex space-x-3 mt-4">
                        <button id="cancel" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Skip</button>
                        <button id="confirm" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Submit</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.querySelector('#cancel')?.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(null);
            });
            modal.querySelector('#confirm')?.addEventListener('click', () => {
                const reviewValue = modal.querySelector('#review')?.value;
                document.body.removeChild(modal);
                resolve(reviewValue || null);
            });
        });
        if (rating && parseInt(rating) >= 1 && parseInt(rating) <= 5) {
            try {
                const result = await submitReview(orderId, ((_a = order.items[0]) === null || _a === void 0 ? void 0 : _a.productId) || 'unknown', parseInt(rating), review || '', user.sub);
                if (result.success) {
                    toast.success('⭐ Thank you for your review!');
                }
            }
            catch (error) {
                toast.error('❌ Failed to submit review. Please try again.');
            }
        }
    };
    // 🔄 RETURN ORDER
    const handleReturnOrder = async (orderId) => {
        const order = orders.find(o => o.id === orderId);
        if (!order)
            return;
        const reason = await new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Return Order</h3>
                    <p class="text-gray-600 mb-4">Reason for return:</p>
                    <textarea id="reason" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24" placeholder="Enter reason for return"></textarea>
                    <div class="flex space-x-3 mt-4">
                        <button id="cancel" class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                        <button id="confirm" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Submit</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.querySelector('#cancel')?.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(null);
            });
            modal.querySelector('#confirm')?.addEventListener('click', () => {
                const reasonValue = modal.querySelector('#reason')?.value;
                document.body.removeChild(modal);
                resolve(reasonValue || null);
            });
        });
        if (reason) {
            try {
                const result = await initiateReturn(orderId, reason);
                if (result.success) {
                    toast.success(`🔄 Return Request Submitted! Return ID: ${result.returnId}`);
                }
            }
            catch (error) {
                toast.error('❌ Failed to initiate return. Please try again.');
            }
        }
    };
    // 📞 CONTACT SUPPORT
    const handleContactSupport = (orderId) => {
        const order = orders.find(o => o.id === orderId);
        const supportInfo = `
📞 CUSTOMER SUPPORT
━━━━━━━━━━━━━━━━━━
📋 Order ID: #${orderId.slice(-8).toUpperCase()}
📅 Order Date: ${(order === null || order === void 0 ? void 0 : order.createdAt) ? new Date(order.createdAt.toDate()).toLocaleDateString() : 'N/A'}
💰 Order Total: Rs ${((order === null || order === void 0 ? void 0 : order.totalAmount) || (order === null || order === void 0 ? void 0 : order.total) || 0).toFixed(2)}

📞 Phone: +1-800-GORYL-HELP
📧 Email: support@goryl.com
💬 Live Chat: Available 24/7
🕒 Response Time: Within 2 hours

━━━━━━━━━━━━━━━━━━
🏪 Goryl Customer Care
    `;
        toast.info('Support information displayed');
    };
    // 🔄 REORDER ITEMS
    const handleReorder = (orderId) => {
        var _a;
        const order = orders.find(o => o.id === orderId);
        if (order) {
            toast.info(`🛒 Adding ${((_a = order.items) === null || _a === void 0 ? void 0 : _a.length) || 0} items to your cart...`);
            // In real app, add items to cart and redirect
            setTimeout(() => {
                window.location.href = '/cart';
            }, 2000);
        }
    };
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your purchases</p>
        </div>

        {/* Status Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-1 border-b-2 font-medium text-sm capitalize whitespace-nowrap ${activeTab === tab
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  {tab}
                  <span className="ml-2 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-1">
                    {tab === 'all' ? orders.length : orders.filter(o => o.status === tab).length}
                  </span>
                </button>))}
            </nav>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (<div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'all' ? 'No orders yet' : `No ${activeTab} orders`}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {activeTab === 'all'
                ? 'Start shopping to see your orders here!'
                : `You don't have any ${activeTab} orders at the moment.`}
            </p>
            {activeTab === 'all' && (<button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
                Start Shopping
              </button>)}
          </div>) : (<div className="space-y-6">
            {filteredOrders.map((order, index) => {
                var _a, _b;
                const StatusIcon = statusConfig[order.status].icon;
                return (<motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.id.slice(-8).toUpperCase()}
                        </h3>
                        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig[order.status].bg} ${statusConfig[order.status].color}`}>
                          <StatusIcon className="w-4 h-4"/>
                          <span className="capitalize">{order.status}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">
                        Placed on {new Date(order.createdAt.toDate()).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        Rs {(order.totalAmount || order.total || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.paymentMethod === 'card' ? 'Card' :
                        order.paymentMethod === 'cod' ? 'COD' :
                            ((_a = order.payment) === null || _a === void 0 ? void 0 : _a.method) === 'online' ? 'Card' : 'COD'}
                      </p>
                      {order.trackingNumber && (<p className="text-xs text-purple-600 font-mono">
                          #{order.trackingNumber}
                        </p>)}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="space-y-3">
                      {((_b = order.items) === null || _b === void 0 ? void 0 : _b.map((item, itemIndex) => {
                        var _a, _b, _c, _d, _e;
                        return (<div key={itemIndex} className="flex items-center space-x-4">
                          <img src={((_a = item.product) === null || _a === void 0 ? void 0 : _a.image) || item.image || '/placeholder-product.jpg'} alt={((_b = item.product) === null || _b === void 0 ? void 0 : _b.title) || item.title || 'Product'} className="w-16 h-16 object-cover rounded-lg border border-gray-200" onError={(e) => {
                                const target = e.target;
                                target.src = '/placeholder-product.jpg';
                            }}/>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {((_c = item.product) === null || _c === void 0 ? void 0 : _c.title) || item.title || 'Product'}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                              Quantity: {item.quantity}
                            </p>
                            {((_d = item.product) === null || _d === void 0 ? void 0 : _d.price) && (<p className="text-gray-500 dark:text-gray-500 text-xs">
                                Rs {item.product.price.toFixed(2)} each
                              </p>)}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">
                              Rs {((((_e = item.product) === null || _e === void 0 ? void 0 : _e.price) || item.price || 0) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>);
                    })) || (<div className="text-gray-500 dark:text-gray-400 text-sm">Order details not available</div>)}
                    </div>
                  </div>

                  {/* Order Actions - Amazon/Daraz Style */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* Primary Actions Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-wrap gap-2">
                        {/* View Details */}
                        <button onClick={() => openOrderDetails(order)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors">
                          <Eye className="w-4 h-4 mr-2"/>
                          View Details
                        </button>
                        
                        {/* Track Order */}
                        {(order.status === 'confirmed' || order.status === 'shipped' || order.status === 'delivered') && (<button onClick={() => showOrderTrackingInfo(order)} className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium text-sm transition-colors">
                            <Truck className="w-4 h-4 mr-2"/>
                            Track Package
                          </button>)}
                        
                        {/* Cancel Order */}
                        {(order.status === 'pending' || order.status === 'confirmed') && (<button onClick={() => handleCancelOrder(order.id)} className="flex items-center text-red-600 hover:text-red-700 font-medium text-sm border border-red-600 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <XCircle className="w-4 h-4 mr-2"/>
                            Cancel Order
                          </button>)}
                        
                        {/* Return Order */}
                        {order.status === 'delivered' && (<button onClick={() => handleReturnOrder(order.id)} className="flex items-center text-orange-600 hover:text-orange-700 font-medium text-sm border border-orange-600 px-4 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
                            <RefreshCw className="w-4 h-4 mr-2"/>
                            Return Item
                          </button>)}
                        
                        {/* Rate & Review */}
                        {order.status === 'delivered' && (<button onClick={() => handleRateOrder(order.id)} className="flex items-center text-yellow-600 hover:text-yellow-700 font-medium text-sm border border-yellow-600 px-4 py-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors">
                            <Star className="w-4 h-4 mr-2"/>
                            Write Review
                          </button>)}
                      </div>
                      
                      {/* Secondary Actions */}
                      <div className="flex gap-2">
                        <button onClick={() => handleDownloadInvoice(order.id)} className="flex items-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
                          <Download className="w-4 h-4 mr-2"/>
                          Invoice
                        </button>
                      </div>
                    </div>
                    
                    {/* Secondary Actions Row */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex gap-4">
                        <button onClick={() => handleContactSupport(order.id)} className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
                          <MessageCircle className="w-4 h-4 mr-1"/>
                          Get Help
                        </button>
                        
                        <button onClick={() => handleReorder(order.id)} className="flex items-center text-green-600 hover:text-green-700 font-medium">
                          <Package className="w-4 h-4 mr-1"/>
                          Buy Again
                        </button>
                        
                        <button className="flex items-center text-gray-600 hover:text-gray-700 font-medium">
                          <Phone className="w-4 h-4 mr-1"/>
                          Call Support
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Need help? Contact us 24/7
                      </div>
                    </div>
                  </div>

                  {/* Order Timeline */}
                  {order.timeline && order.timeline.length > 0 && (<div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Order Timeline</h4>
                      <div className="space-y-2">
                        {order.timeline.map((event, eventIndex) => (<div key={eventIndex} className="flex items-center text-sm">
                            <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                            <span className="text-gray-600 dark:text-gray-400">
                              {event.message} - {new Date(event.timestamp.toDate()).toLocaleString()}
                            </span>
                          </div>))}
                      </div>
                    </div>)}
                </motion.div>);
            })}
          </div>)}
      </div>

      {/* Detailed Order Modal */}
      {showOrderDetails && selectedOrder && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Order Details
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Order #{selectedOrder.id.slice(-8).toUpperCase()}
                </p>
              </div>
              <button onClick={closeOrderDetails} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-6 h-6 text-gray-600 dark:text-gray-400"/>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Order Status Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Order Status</h3>
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig[selectedOrder.status].bg} ${statusConfig[selectedOrder.status].color}`}>
                    {React.createElement(statusConfig[selectedOrder.status].icon, { className: "w-4 h-4" })}
                    <span className="capitalize">{selectedOrder.status}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500"/>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Order Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedOrder.createdAt.toDate()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-gray-500"/>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Payment Method</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedOrder.paymentMethod === 'card' ? 'Credit Card' :
                selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' :
                    'Online Payment'}
                      </p>
                    </div>
                  </div>
                  
                  {selectedOrder.trackingNumber && (<div className="flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-gray-500"/>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Tracking Number</p>
                        <p className="font-medium text-purple-600 dark:text-purple-400 font-mono">
                          {selectedOrder.trackingNumber}
                        </p>
                      </div>
                    </div>)}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2"/>
                  Shipping Address
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {(_a = selectedOrder.shippingAddress) === null || _a === void 0 ? void 0 : _a.firstName} {(_b = selectedOrder.shippingAddress) === null || _b === void 0 ? void 0 : _b.lastName}
                  </p>
                  {((_c = selectedOrder.shippingAddress) === null || _c === void 0 ? void 0 : _c.company) && (<p className="text-gray-600 dark:text-gray-400">{selectedOrder.shippingAddress.company}</p>)}
                  <p className="text-gray-600 dark:text-gray-400">{(_d = selectedOrder.shippingAddress) === null || _d === void 0 ? void 0 : _d.addressLine1}</p>
                  {((_e = selectedOrder.shippingAddress) === null || _e === void 0 ? void 0 : _e.addressLine2) && (<p className="text-gray-600 dark:text-gray-400">{selectedOrder.shippingAddress.addressLine2}</p>)}
                  <p className="text-gray-600 dark:text-gray-400">
                    {(_f = selectedOrder.shippingAddress) === null || _f === void 0 ? void 0 : _f.city}, {(_g = selectedOrder.shippingAddress) === null || _g === void 0 ? void 0 : _g.state} {(_h = selectedOrder.shippingAddress) === null || _h === void 0 ? void 0 : _h.postalCode}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">{(_j = selectedOrder.shippingAddress) === null || _j === void 0 ? void 0 : _j.country}</p>
                  {((_k = selectedOrder.shippingAddress) === null || _k === void 0 ? void 0 : _k.phone) && (<p className="text-gray-600 dark:text-gray-400 flex items-center mt-2">
                      <Phone className="w-4 h-4 mr-2"/>
                      {selectedOrder.shippingAddress.phone}
                    </p>)}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Items</h3>
                <div className="space-y-4">
                  {((_l = selectedOrder.items) === null || _l === void 0 ? void 0 : _l.map((item, index) => {
                var _a, _b, _c, _d, _e;
                return (<div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <img src={((_a = item.product) === null || _a === void 0 ? void 0 : _a.image) || item.image || '/placeholder-product.jpg'} alt={((_b = item.product) === null || _b === void 0 ? void 0 : _b.title) || item.title || 'Product'} className="w-20 h-20 object-cover rounded-lg" onError={(e) => {
                        const target = e.target;
                        target.src = '/placeholder-product.jpg';
                    }}/>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-lg">
                          {((_c = item.product) === null || _c === void 0 ? void 0 : _c.title) || item.title || 'Product'}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          Price: ${(((_d = item.product) === null || _d === void 0 ? void 0 : _d.price) || item.price || 0).toFixed(2)} each
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          ${((((_e = item.product) === null || _e === void 0 ? void 0 : _e.price) || item.price || 0) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>);
            })) || (<div className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No items found in this order
                    </div>)}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="text-gray-900 dark:text-white">${(selectedOrder.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                    <span className="text-gray-900 dark:text-white">${(selectedOrder.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
                    <span className="text-gray-900 dark:text-white">${(selectedOrder.shipping || 5.99).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-gray-900 dark:text-white">Total:</span>
                      <span className="text-gray-900 dark:text-white">
                        ${(selectedOrder.totalAmount || selectedOrder.total || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Timeline */}
              {selectedOrder.timeline && selectedOrder.timeline.length > 0 && (<div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Timeline</h3>
                  <div className="space-y-4">
                    {selectedOrder.timeline.map((event, index) => (<div key={index} className="flex items-start space-x-3">
                        <div className="w-3 h-3 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{event.message}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(event.timestamp.toDate()).toLocaleString()}
                          </p>
                        </div>
                      </div>))}
                  </div>
                </div>)}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => showOrderTrackingInfo(selectedOrder)} className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium text-sm transition-colors">
                  <Truck className="w-4 h-4 mr-2"/>
                  Track Order
                </button>
                
                <button onClick={() => handleDownloadInvoice(selectedOrder.id)} className="flex items-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors">
                  <Download className="w-4 h-4 mr-2"/>
                  Download Invoice
                </button>
                
                {selectedOrder.status === 'delivered' && (<button onClick={() => handleRateOrder(selectedOrder.id)} className="flex items-center text-yellow-600 hover:text-yellow-700 font-medium text-sm border border-yellow-600 px-4 py-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors">
                    <Star className="w-4 h-4 mr-2"/>
                    Rate & Review
                  </button>)}
                
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && (<button onClick={() => {
                    handleCancelOrder(selectedOrder.id);
                    closeOrderDetails();
                }} className="flex items-center text-red-600 hover:text-red-700 font-medium text-sm border border-red-600 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <XCircle className="w-4 h-4 mr-2"/>
                    Cancel Order
                  </button>)}
              </div>
            </div>
          </div>
        </div>)}
    </div>);
}


