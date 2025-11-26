'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, Package, Users, CreditCard, 
  Eye, CheckCircle, X, Download, Plus, Edit, Trash2,
  Building2, Calendar, ArrowRight, AlertCircle, Wallet,
  Banknote, Receipt, FileText, Settings, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { 
  subscribeToAllSellerPayments, 
  getSellerPaymentSummary,
  processWithdrawRequest 
} from '@/lib/adminPaymentService';
// ✅ AWS DYNAMODB - Firestore removed
// ✅ AWS - Using AWS services
import { motion } from 'framer-motion';

interface SellerFinanceDetails {
  sellerId: string;
  sellerName: string;
  totalEarnings: number;
  availableBalance: number;
  heldAmount: number;
  pendingWithdrawals: number;
  totalWithdrawn: number;
  orderCount: number;
  productCount: number;
  totalProductsSold: number;
  totalRevenue: number;
  totalPaymentsReceived: number;
  paymentsReceivedCount: number;
  lastPaymentDate?: Date;
  email?: string;
  phone?: string;
  accountType?: string;
}

interface PaymentMethod {
  id: string;
  type: 'bank' | 'paypal' | 'stripe' | 'crypto';
  accountName: string;
  accountDetails: string;
  isActive: boolean;
  createdAt: Date;
}

export default function AdminFinancePage() {
  const [sellers, setSellers] = useState<SellerFinanceDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeller, setSelectedSeller] = useState<SellerFinanceDetails | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentTransactionId, setPaymentTransactionId] = useState('');

  // Platform total stats
  const platformStats = useMemo(() => {
    const totalRevenue = sellers.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalEarnings = sellers.reduce((sum, s) => sum + s.totalEarnings, 0);
    const totalProductsSold = sellers.reduce((sum, s) => sum + s.totalProductsSold, 0);
    const totalPending = sellers.reduce((sum, s) => sum + s.pendingWithdrawals, 0);
    const totalPaid = sellers.reduce((sum, s) => sum + s.totalWithdrawn, 0);
    
    return {
      totalRevenue,
      totalEarnings,
      totalProductsSold,
      totalPending,
      totalPaid,
      totalSellers: sellers.length
    };
  }, [sellers]);

  // Fetch all sellers with detailed finance info
  useEffect(() => {
    const unsubscribe = subscribeToAllSellerPayments(async (summaries) => {
      const detailedSellers: SellerFinanceDetails[] = [];
      
      for (const summary of summaries) {
        try {
          // Get seller's products count
          const productsQuery = query(
            collection(db, 'products'),
            where('sellerId', '==', summary.sellerId)
          );
          const productsSnapshot = await getDocs(productsQuery);
          const productCount = productsSnapshot.docs.length;

          // Get seller's delivered orders for revenue calculation
          const ordersQuery = query(
            collection(db, 'orders'),
            where('sellerId', '==', summary.sellerId),
            where('status', '==', 'delivered')
          );
          const ordersSnapshot = await getDocs(ordersQuery);
          
          let totalProductsSold = 0;
          let totalRevenue = 0;
          
          ordersSnapshot.forEach(orderDoc => {
            const order = orderDoc.data();
            totalRevenue += order.totalAmount || order.total || 0;
            totalProductsSold += order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 1;
          });

          // Get withdraw requests for payment history
          const withdrawQuery = query(
            collection(db, 'withdrawRequests'),
            where('sellerId', '==', summary.sellerId)
          );
          const withdrawSnapshot = await getDocs(withdrawQuery);
          
          let lastPaymentDate: Date | undefined;
          let totalPaymentsReceived = 0;
          let paymentsReceivedCount = 0;
          
          withdrawSnapshot.forEach(doc => {
            const request = doc.data();
            if (request.status === 'paid') {
              totalPaymentsReceived += request.paidAmount || request.amount || 0;
              paymentsReceivedCount++;
              const paymentDate = request.processedAt?.toDate?.();
              if (paymentDate && (!lastPaymentDate || paymentDate > lastPaymentDate)) {
                lastPaymentDate = paymentDate;
              }
            }
          });

          // Get seller profile info
          let sellerEmail = '';
          let sellerPhone = '';
          let accountType = '';
          try {
            const sellerDoc = await getDoc(doc(db, 'users', summary.sellerId));
            if (sellerDoc.exists()) {
              const sellerData = sellerDoc.data();
              sellerEmail = sellerData.email || '';
              sellerPhone = sellerData.phone || '';
              accountType = sellerData.role || sellerData.accountType || '';
            }
          } catch (error) {
            console.error('Error fetching seller profile:', error);
          }

          detailedSellers.push({
            ...summary,
            productCount,
            totalProductsSold,
            totalRevenue,
            totalPaymentsReceived,
            paymentsReceivedCount,
            lastPaymentDate,
            email: sellerEmail,
            phone: sellerPhone,
            accountType
          });
        } catch (error) {
          console.error(`Error fetching details for seller ${summary.sellerId}:`, error);
          detailedSellers.push({
            ...summary,
            productCount: 0,
            totalProductsSold: 0,
            totalRevenue: 0
          });
        }
      }
      
      setSellers(detailedSellers);
      setLoading(false);
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Fetch payment methods
  useEffect(() => {
    const q = query(
      collection(db, 'adminPaymentMethods'),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const methods: PaymentMethod[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || 'bank',
          accountName: data.accountName || '',
          accountDetails: data.accountDetails || '',
          isActive: data.isActive !== false,
          createdAt: data.createdAt?.toDate?.() || new Date()
        };
      });
      setPaymentMethods(methods);
    }, (error) => {
      console.error('Error fetching payment methods:', error);
      setPaymentMethods([]);
    });

    return () => unsubscribe();
  }, []);

  const filteredSellers = useMemo(() => {
    if (!searchQuery) return sellers;
    const query = searchQuery.toLowerCase();
    return sellers.filter(seller =>
      seller.sellerName.toLowerCase().includes(query) ||
      seller.sellerId.toLowerCase().includes(query)
    );
  }, [sellers, searchQuery]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const handleAddPaymentMethod = async (methodData: Omit<PaymentMethod, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'adminPaymentMethods'), {
        ...methodData,
        isActive: true,
        createdAt: serverTimestamp()
      });
      toast.success('Payment method added successfully');
      setShowPaymentMethodModal(false);
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error('Failed to add payment method');
    }
  };

  const handleUpdatePaymentMethod = async (id: string, updates: Partial<PaymentMethod>) => {
    try {
      await updateDoc(doc(db, 'adminPaymentMethods', id), updates);
      toast.success('Payment method updated');
      setShowPaymentMethodModal(false);
      setSelectedPaymentMethod(null);
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast.error('Failed to update payment method');
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      await updateDoc(doc(db, 'adminPaymentMethods', id), { isActive: false });
      toast.success('Payment method deleted');
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to delete payment method');
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedSeller || !paymentAmount || !paymentTransactionId) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      // Find pending withdraw request for this seller
      const withdrawQuery = query(
        collection(db, 'withdrawRequests'),
        where('sellerId', '==', selectedSeller.sellerId),
        where('status', '==', 'pending')
      );
      const withdrawSnapshot = await getDocs(withdrawQuery);

      if (withdrawSnapshot.empty) {
        toast.error('No pending withdraw request found for this seller');
        return;
      }

      // Process the first pending request
      const requestId = withdrawSnapshot.docs[0].id;
      await processWithdrawRequest(requestId, 'pay', 'admin', {
        transactionId: paymentTransactionId,
        customAmount: parseFloat(paymentAmount)
      });

      toast.success(`Payment of ${formatCurrency(parseFloat(paymentAmount))} processed successfully`);
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentTransactionId('');
      setSelectedSeller(null);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    }
  };

  const exportFinanceReport = () => {
    const csvContent = [
      ['Platform Finance Report'],
      ['Generated:', new Date().toISOString()],
      [''],
      ['Platform Statistics'],
      ['Total Revenue', formatCurrency(platformStats.totalRevenue)],
      ['Total Earnings', formatCurrency(platformStats.totalEarnings)],
      ['Total Products Sold', platformStats.totalProductsSold.toString()],
      ['Total Pending Payments', formatCurrency(platformStats.totalPending)],
      ['Total Paid Out', formatCurrency(platformStats.totalPaid)],
      ['Total Sellers', platformStats.totalSellers.toString()],
      [''],
      ['Seller Detailed Finance Report'],
      ['Seller Name', 'Email', 'Account Type', 'Total Products', 'Products Sold', 'Total Orders', 
       'Total Revenue', 'Total Earnings', 'Total Payments Received', 'Payments Count', 
       'Pending Withdrawals', 'Available Balance', 'Held Amount', 'Total Withdrawn', 'Last Payment Date'],
      ...filteredSellers.map(seller => [
        seller.sellerName,
        seller.email || 'N/A',
        seller.accountType || 'N/A',
        seller.productCount.toString(),
        seller.totalProductsSold.toString(),
        seller.orderCount.toString(),
        formatCurrency(seller.totalRevenue),
        formatCurrency(seller.totalEarnings),
        formatCurrency(seller.totalPaymentsReceived),
        seller.paymentsReceivedCount.toString(),
        formatCurrency(seller.pendingWithdrawals),
        formatCurrency(seller.availableBalance),
        formatCurrency(seller.heldAmount),
        formatCurrency(seller.totalWithdrawn),
        formatDate(seller.lastPaymentDate)
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  return (
    <AdminLayout 
      title="Finance & Accounts" 
      subtitle="Manage platform earnings and seller payments"
      searchPlaceholder="Search sellers..."
      onSearch={setSearchQuery}
      actions={
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPaymentMethodModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment Method</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportFinanceReport}
            className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </motion.button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Platform Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(platformStats.totalRevenue)}</p>
              </div>
              <TrendingUp className="w-12 h-12 opacity-80" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Total Products Sold</p>
                <p className="text-3xl font-bold">{platformStats.totalProductsSold.toLocaleString()}</p>
              </div>
              <Package className="w-12 h-12 opacity-80" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm mb-1">Pending Payments</p>
                <p className="text-3xl font-bold">{formatCurrency(platformStats.totalPending)}</p>
              </div>
              <Clock className="w-12 h-12 opacity-80" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">Total Paid Out</p>
                <p className="text-3xl font-bold">{formatCurrency(platformStats.totalPaid)}</p>
              </div>
              <CreditCard className="w-12 h-12 opacity-80" />
            </div>
          </motion.div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Settings className="w-6 h-6" />
              <span>Payment Methods</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paymentMethods.map(method => {
              let displayDetails = method.accountDetails;
              if (method.type === 'stripe') {
                try {
                  const details = JSON.parse(method.accountDetails);
                  const pubKey = details.publishableKey || details.publishable_key || '';
                  displayDetails = pubKey ? `${pubKey.substring(0, 12)}...${pubKey.substring(pubKey.length - 4)}` : 'Stripe Account';
                } catch {
                  displayDetails = 'Stripe Account';
                }
              }
              
              return (
                <div
                  key={method.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-white font-medium">{method.accountName}</p>
                      {method.type === 'stripe' && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-purple-200 text-xs font-medium">{method.type.toUpperCase()}</p>
                    <p className="text-purple-300 text-xs mt-1 truncate">{displayDetails}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedPaymentMethod(method);
                        setShowPaymentMethodModal(true);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg text-purple-300 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this payment method?')) {
                          handleDeletePaymentMethod(method.id);
                        }
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {paymentMethods.length === 0 && (
              <div className="col-span-full text-center py-8">
                <Wallet className="w-16 h-16 text-purple-300 mx-auto mb-4 opacity-50" />
                <p className="text-purple-200 mb-2">No payment methods added</p>
                <p className="text-purple-300 text-sm mb-4">
                  Add a Stripe account to receive all website payments
                </p>
                <button
                  onClick={() => setShowPaymentMethodModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Stripe Account</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Seller Finance Details */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
            <Users className="w-6 h-6" />
            <span>Seller Finance Details</span>
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-purple-200 mt-4">Loading seller details...</p>
            </div>
          ) : filteredSellers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-purple-300 mx-auto mb-4 opacity-50" />
              <p className="text-purple-200">No sellers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-purple-200 font-semibold">Seller</th>
                    <th className="text-left py-3 px-4 text-purple-200 font-semibold">Products Info</th>
                    <th className="text-left py-3 px-4 text-purple-200 font-semibold">Revenue</th>
                    <th className="text-left py-3 px-4 text-purple-200 font-semibold">Payments</th>
                    <th className="text-left py-3 px-4 text-purple-200 font-semibold">Balance</th>
                    <th className="text-left py-3 px-4 text-purple-200 font-semibold">Orders</th>
                    <th className="text-left py-3 px-4 text-purple-200 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSellers.map((seller) => (
                    <motion.tr
                      key={seller.sellerId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-white font-medium">{seller.sellerName}</p>
                          <p className="text-purple-300 text-xs">ID: {seller.sellerId.slice(-8)}</p>
                          {seller.email && (
                            <p className="text-purple-400 text-xs mt-1">{seller.email}</p>
                          )}
                          {seller.accountType && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
                              {seller.accountType}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Package className="w-4 h-4 text-blue-400" />
                            <span className="text-white text-sm">
                              <span className="font-semibold">{seller.productCount}</span> Products
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <span className="text-white text-sm">
                              <span className="font-semibold">{seller.totalProductsSold.toLocaleString()}</span> Sold
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div>
                            <p className="text-green-400 font-semibold text-sm">
                              {formatCurrency(seller.totalRevenue)}
                            </p>
                            <p className="text-purple-300 text-xs">Total Revenue</p>
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">
                              {formatCurrency(seller.totalEarnings)}
                            </p>
                            <p className="text-purple-300 text-xs">Total Earnings</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div>
                            <p className="text-green-400 font-semibold text-sm">
                              {formatCurrency(seller.totalPaymentsReceived)}
                            </p>
                            <p className="text-purple-300 text-xs">{seller.paymentsReceivedCount} Payments</p>
                          </div>
                          <div>
                            <p className="text-yellow-400 font-medium text-sm">
                              {formatCurrency(seller.pendingWithdrawals)}
                            </p>
                            <p className="text-purple-300 text-xs">Pending</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div>
                            <p className="text-green-400 font-semibold text-base">
                              {formatCurrency(seller.availableBalance)}
                            </p>
                            <p className="text-purple-300 text-xs">Available</p>
                          </div>
                          {seller.heldAmount > 0 && (
                            <div>
                              <p className="text-red-400 text-xs">
                                {formatCurrency(seller.heldAmount)} Held
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-purple-300 text-xs">
                              Last: {formatDate(seller.lastPaymentDate)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <p className="text-white font-semibold text-base">{seller.orderCount}</p>
                          <p className="text-purple-300 text-xs">Total Orders</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => {
                              setSelectedSeller(seller);
                              setShowPaymentModal(true);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center space-x-1 transition-colors"
                          >
                            <Wallet className="w-4 h-4" />
                            <span>Pay</span>
                          </button>
                          <button
                            onClick={() => {
                              // Open seller details modal or navigate
                              window.open(`/profile?uid=${seller.sellerId}`, '_blank');
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center space-x-1 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Modal */}
      {showPaymentMethodModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              {selectedPaymentMethod ? 'Edit' : 'Add'} Payment Method
            </h3>
            <PaymentMethodForm
              method={selectedPaymentMethod}
              onSave={(data) => {
                if (selectedPaymentMethod) {
                  handleUpdatePaymentMethod(selectedPaymentMethod.id, data);
                } else {
                  handleAddPaymentMethod(data);
                }
              }}
              onCancel={() => {
                setShowPaymentMethodModal(false);
                setSelectedPaymentMethod(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Payment Processing Modal */}
      {showPaymentModal && selectedSeller && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Process Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-purple-200 text-sm mb-2">Seller</label>
                <p className="text-white font-medium">{selectedSeller.sellerName}</p>
              </div>
              <div>
                <label className="block text-purple-200 text-sm mb-2">Available Balance</label>
                <p className="text-green-400 font-semibold text-lg">
                  {formatCurrency(selectedSeller.availableBalance)}
                </p>
              </div>
              <div>
                <label className="block text-purple-200 text-sm mb-2">Payment Amount</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-purple-200 text-sm mb-2">Transaction ID</label>
                <input
                  type="text"
                  value={paymentTransactionId}
                  onChange={(e) => setPaymentTransactionId(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter transaction ID"
                />
              </div>
              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={handleProcessPayment}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Process Payment
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedSeller(null);
                    setPaymentAmount('');
                    setPaymentTransactionId('');
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// Payment Method Form Component
function PaymentMethodForm({ 
  method, 
  onSave, 
  onCancel 
}: { 
  method: PaymentMethod | null;
  onSave: (data: Omit<PaymentMethod, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<'bank' | 'paypal' | 'stripe' | 'crypto'>(method?.type || 'stripe');
  const [accountName, setAccountName] = useState(method?.accountName || '');
  const [accountDetails, setAccountDetails] = useState(method?.accountDetails || '');
  
  // For Stripe, parse and store keys separately
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  
  // Load existing Stripe keys if editing
  useEffect(() => {
    if (method && method.type === 'stripe') {
      try {
        const details = JSON.parse(method.accountDetails || '{}');
        setStripePublishableKey(details.publishableKey || details.publishable_key || '');
        setStripeSecretKey(details.secretKey || details.secret_key || '');
      } catch {
        // If not JSON, treat as plain text
      }
    }
  }, [method]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalAccountDetails = accountDetails;
    
    // For Stripe, store keys as JSON
    if (type === 'stripe') {
      finalAccountDetails = JSON.stringify({
        publishableKey: stripePublishableKey,
        secretKey: stripeSecretKey,
        accountName: accountName,
      });
    }
    
    onSave({
      type,
      accountName,
      accountDetails: finalAccountDetails,
      isActive: true
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-purple-200 text-sm mb-2">Payment Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="stripe">Stripe (Recommended - All payments will go here)</option>
          <option value="bank">Bank Account</option>
          <option value="paypal">PayPal</option>
          <option value="crypto">Crypto Wallet</option>
        </select>
        {type === 'stripe' && (
          <p className="text-yellow-300 text-xs mt-1">
            ⚠️ All website payments will be processed through this Stripe account
          </p>
        )}
      </div>
      <div>
        <label className="block text-purple-200 text-sm mb-2">Account Name</label>
        <input
          type="text"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder={type === 'stripe' ? 'e.g., Main Admin Stripe Account' : 'Account name'}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
        />
      </div>
      
      {type === 'stripe' ? (
        <>
          <div>
            <label className="block text-purple-200 text-sm mb-2">Stripe Publishable Key</label>
            <input
              type="text"
              value={stripePublishableKey}
              onChange={(e) => setStripePublishableKey(e.target.value)}
              placeholder="pk_live_... or pk_test_..."
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <p className="text-purple-300 text-xs mt-1">
              Get this from <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline">Stripe Dashboard</a>
            </p>
          </div>
          <div>
            <label className="block text-purple-200 text-sm mb-2">Stripe Secret Key</label>
            <input
              type="password"
              value={stripeSecretKey}
              onChange={(e) => setStripeSecretKey(e.target.value)}
              placeholder="sk_live_... or sk_test_..."
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <p className="text-purple-300 text-xs mt-1">
              ⚠️ Keep this secret! Never share this key publicly.
            </p>
          </div>
        </>
      ) : (
        <div>
          <label className="block text-purple-200 text-sm mb-2">Account Details</label>
          <textarea
            value={accountDetails}
            onChange={(e) => setAccountDetails(e.target.value)}
            placeholder="Account number, IBAN, wallet address, etc."
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={3}
            required
          />
        </div>
      )}
      
      <div className="flex items-center space-x-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}


