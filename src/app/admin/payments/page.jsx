'use client';
import React, { useState, useEffect } from 'react';
import { CreditCard, Eye, CheckCircle, X, Download, Filter, ChevronDown, ChevronUp, DollarSign, User, Clock, AlertCircle, TrendingUp, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { subscribeToPayments, updatePaymentStatus } from '@/lib/adminService';
import { createPaymentHold, releasePaymentHold, processWithdrawRequest, subscribeToAllSellerPayments, subscribeToWithdrawRequests } from '@/lib/adminPaymentService';
export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'all',
        seller: 'all',
        dateFrom: '',
        dateTo: '',
        search: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedPayments, setSelectedPayments] = useState([]);
    const [sellerSummaries, setSellerSummaries] = useState([]);
    const [showHoldModal, setShowHoldModal] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [holdAmount, setHoldAmount] = useState('');
    const [holdReason, setHoldReason] = useState('');
    useEffect(() => {
        let unsubscribeWithdrawRequests: (() => void) | null = null;
        let unsubscribeSellers: (() => void) | null = null;

        // Subscribe to withdraw requests instead of payments
        try {
            unsubscribeWithdrawRequests = subscribeToWithdrawRequests(
                { status: filters.status === 'all' ? undefined : filters.status },
                (requests) => {
                    // Filter by search if needed
                    let filteredRequests = requests;
                    if (filters.search) {
                        const searchLower = filters.search.toLowerCase();
                        filteredRequests = requests.filter(req =>
                            req.sellerName.toLowerCase().includes(searchLower) ||
                            req.id.toLowerCase().includes(searchLower)
                        );
                    }
                    setPayments(filteredRequests);
                    setLoading(false);
                }
            );
        } catch (error) {
            console.error('Error subscribing to withdraw requests:', error);
            setLoading(false);
        }

        // Subscribe to seller payment summaries
        try {
            unsubscribeSellers = subscribeToAllSellerPayments((summaries) => {
                setSellerSummaries(summaries);
            });
        } catch (error) {
            console.error('Error subscribing to seller payments:', error);
        }

        return () => {
            if (unsubscribeWithdrawRequests && typeof unsubscribeWithdrawRequests === 'function') {
                unsubscribeWithdrawRequests();
            }
            if (unsubscribeSellers && typeof unsubscribeSellers === 'function') {
                unsubscribeSellers();
            }
        };
    }, [filters]);
    const handleFilterChange = (key, value) => {
        setFilters(prev => (Object.assign(Object.assign({}, prev), { [key]: value })));
    };
    const handleSearch = (query) => {
        setFilters(prev => (Object.assign(Object.assign({}, prev), { search: query })));
    };
    const handlePaymentAction = async (paymentId, action, details) => {
        try {
            if (action === 'approve' || action === 'reject' || action === 'pay') {
                await processWithdrawRequest(paymentId, action, 'admin', details);
            }
            else {
                await updatePaymentStatus(paymentId, action, details);
            }
            toast.success(`Payment ${action} successfully`);
        }
        catch (error) {
            toast.error(`Failed to ${action} payment`);
            console.error('Payment action error:', error);
        }
    };
    const handleCreateHold = async () => {
        if (!selectedSeller || !holdAmount || !holdReason) {
            toast.error('Please fill all fields');
            return;
        }
        try {
            const result = await createPaymentHold(selectedSeller.sellerId, selectedSeller.sellerName, parseFloat(holdAmount), holdReason, 'admin');
            if (result.success) {
                toast.success('Payment hold created successfully');
                setShowHoldModal(false);
                setHoldAmount('');
                setHoldReason('');
                setSelectedSeller(null);
            }
            else {
                toast.error(result.error || 'Failed to create payment hold');
            }
        }
        catch (error) {
            toast.error('Failed to create payment hold');
            console.error('Hold creation error:', error);
        }
    };
    const handleReleaseHold = async (holdId) => {
        try {
            const result = await releasePaymentHold(holdId, 'admin');
            if (result.success) {
                toast.success('Payment hold released successfully');
            }
            else {
                toast.error(result.error || 'Failed to release payment hold');
            }
        }
        catch (error) {
            toast.error('Failed to release payment hold');
            console.error('Hold release error:', error);
        }
    };
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };
    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'approved':
                return 'bg-blue-100 text-blue-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    const exportPayments = () => {
        const csvContent = [
            ['Payment ID', 'Seller', 'Amount', 'Status', 'Requested Date', 'Processed Date'],
            ...payments.map(payment => [
                payment.id,
                payment.sellerName,
                formatCurrency(payment.amount),
                payment.status,
                payment.requestedAt ? formatDate(payment.requestedAt instanceof Date ? payment.requestedAt : (payment.requestedAt?.toDate ? payment.requestedAt.toDate() : new Date())) : '',
                payment.processedAt ? formatDate(payment.processedAt instanceof Date ? payment.processedAt : (payment.processedAt?.toDate ? payment.processedAt.toDate() : new Date())) : ''
            ])
        ].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };
    const actions = (<div className="flex items-center space-x-2">
      <button onClick={exportPayments} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
        <Download className="w-4 h-4 mr-2 inline"/>
        Export
      </button>
      <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
        <Filter className="w-4 h-4 mr-2 inline"/>
        Filters
        {showFilters ? <ChevronUp className="w-4 h-4 ml-2 inline"/> : <ChevronDown className="w-4 h-4 ml-2 inline"/>}
      </button>
    </div>);
    return (<AdminLayout title="Payouts" subtitle="Manage seller payouts and payment processing" searchPlaceholder="Search payments by seller or ID..." onSearch={handleSearch} actions={actions}>
      <div className="space-y-6">
        {/* Filters */}
        {showFilters && (<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"/>
                  <input type="date" value={filters.dateTo} onChange={(e) => handleFilterChange('dateTo', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"/>
                </div>
              </div>
            </div>
          </div>)}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <CreditCard className="w-8 h-8 text-blue-600"/>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Payouts</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{payments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600"/>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(payments.reduce((sum, payment) => sum + payment.amount, 0))}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600"/>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {payments.filter(p => p.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-purple-600"/>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {payments.filter(p => p.status === 'paid').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Balances Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Seller Balances Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="w-6 h-6 text-blue-600 mr-3"/>
                <div>
                  <p className="text-sm font-medium text-blue-900">Total Revenue</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0) * 1.5)}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <Building2 className="w-6 h-6 text-green-600 mr-3"/>
                <div>
                  <p className="text-sm font-medium text-green-900">Available for Payout</p>
                  <p className="text-lg font-bold text-green-900">
                    {formatCurrency(payments.filter(p => p.status === 'pending' || p.status === 'approved').reduce((sum, p) => sum + p.amount, 0))}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <CreditCard className="w-6 h-6 text-purple-600 mr-3"/>
                <div>
                  <p className="text-sm font-medium text-purple-900">Platform Fees</p>
                  <p className="text-lg font-bold text-purple-900">
                    {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0) * 0.1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Payment Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Seller Payment Management</h3>
            <button onClick={() => setShowHoldModal(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
              Create Payment Hold
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Held Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sellerSummaries.map((seller) => (<tr key={seller.sellerId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500"/>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{seller.sellerName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">ID: {seller.sellerId.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(seller.totalEarnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {formatCurrency(seller.availableBalance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {formatCurrency(seller.heldAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                      {formatCurrency(seller.pendingWithdrawals)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {seller.orderCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => {
                setSelectedSeller(seller);
                setShowHoldModal(true);
            }} className="text-red-600 hover:text-red-900" title="Create Hold">
                          <AlertCircle className="w-4 h-4"/>
                        </button>
                        <button className="text-blue-600 hover:text-blue-900" title="View Details">
                          <Eye className="w-4 h-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input type="checkbox" onChange={(e) => {
            if (e.target.checked) {
                setSelectedPayments(payments.map(p => p.id));
            }
            else {
                setSelectedPayments([]);
            }
        }} className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"/>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (<tr>
                    <td colSpan={9} className="px-6 py-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    </td>
                  </tr>) : payments.length === 0 ? (<tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>) : (payments.map((payment) => (<tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" checked={selectedPayments.includes(payment.id)} onChange={(e) => {
                if (e.target.checked) {
                    setSelectedPayments(prev => [...prev, payment.id]);
                }
                else {
                    setSelectedPayments(prev => prev.filter(id => id !== payment.id));
                }
            }} className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"/>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        #{payment.id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500"/>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{payment.sellerName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">ID: {payment.sellerId.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(payment.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.requestedAt ? formatDate(payment.requestedAt instanceof Date ? payment.requestedAt : (payment.requestedAt?.toDate ? payment.requestedAt.toDate() : new Date())) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.processedAt ? formatDate(payment.processedAt instanceof Date ? payment.processedAt : (payment.processedAt?.toDate ? payment.processedAt.toDate() : new Date())) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.transactionId || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-purple-600 hover:text-purple-900" onClick={() => { }}>
                            <Eye className="w-4 h-4"/>
                          </button>
                          {payment.status === 'pending' && (<>
                              <button className="text-green-600 hover:text-green-900" onClick={() => handlePaymentAction(payment.id, 'approve')}>
                                <CheckCircle className="w-4 h-4"/>
                              </button>
                              <button className="text-red-600 hover:text-red-900" onClick={() => {
                                  const reason = prompt('Rejection reason:') || 'Admin rejection';
                                  handlePaymentAction(payment.id, 'reject', { rejectionReason: reason });
                              }}>
                                <X className="w-4 h-4"/>
                              </button>
                            </>)}
                          {payment.status === 'approved' && (<button className="text-blue-600 hover:text-blue-900" onClick={() => {
                              const transactionId = prompt('Enter Transaction ID for this payment:');
                              if (transactionId) {
                                  handlePaymentAction(payment.id, 'pay', { transactionId });
                              }
                          }}>
                              <CreditCard className="w-4 h-4"/>
                            </button>)}
                        </div>
                      </td>
                    </tr>)))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Hold Modal */}
        {showHoldModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Payment Hold</h3>
                <button onClick={() => {
                setShowHoldModal(false);
                setSelectedSeller(null);
                setHoldAmount('');
                setHoldReason('');
            }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6"/>
                </button>
              </div>

              <div className="space-y-4">
                {selectedSeller && (<div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Seller: {selectedSeller.sellerName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Available: {formatCurrency(selectedSeller.availableBalance)}</p>
                  </div>)}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hold Amount ($)</label>
                  <input type="number" value={holdAmount} onChange={(e) => setHoldAmount(e.target.value)} placeholder="Enter amount to hold" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"/>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason for Hold</label>
                  <textarea value={holdReason} onChange={(e) => setHoldReason(e.target.value)} placeholder="Enter reason for payment hold" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"/>
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <button onClick={handleCreateHold} className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                    Create Hold
                  </button>
                  <button onClick={() => {
                setShowHoldModal(false);
                setSelectedSeller(null);
                setHoldAmount('');
                setHoldReason('');
            }} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>)}
      </div>
    </AdminLayout>);
}
