'use client';
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Eye, Truck, CheckCircle, X, Download, Filter, ChevronDown, ChevronUp, DollarSign, User, Package } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { subscribeToOrders, updateOrderStatus } from '@/lib/adminService';
export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'all',
        paymentStatus: 'all',
        seller: 'all',
        buyer: 'all',
        country: 'all',
        dateFrom: '',
        dateTo: '',
        search: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedOrders, setSelectedOrders] = useState([]);
    useEffect(() => {
        const unsubscribe = subscribeToOrders(filters, (newOrders) => {
            setOrders(newOrders);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [filters]);
    const handleFilterChange = (key, value) => {
        setFilters(prev => (Object.assign(Object.assign({}, prev), { [key]: value })));
    };
    const handleSearch = (query) => {
        setFilters(prev => (Object.assign(Object.assign({}, prev), { search: query })));
    };
    const handleOrderAction = async (orderId, action, details) => {
        try {
            await updateOrderStatus(orderId, action, details);
            toast.success(`Order ${action} successfully`);
        }
        catch (error) {
            toast.error(`Failed to ${action} order`);
            console.error('Order action error:', error);
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
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'shipped':
                return 'bg-blue-100 text-blue-800';
            case 'paid':
                return 'bg-purple-100 text-purple-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'refunded':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    const exportOrders = () => {
        const csvContent = [
            ['Order ID', 'Buyer', 'Seller', 'Amount', 'Status', 'Payment Status', 'Date'],
            ...orders.map(order => [
                order.id,
                order.buyerName,
                order.sellerName,
                formatCurrency(order.total),
                order.status,
                order.paymentStatus,
                formatDate(order.createdAt)
            ])
        ].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };
    const actions = (<div className="flex items-center space-x-2">
      <button onClick={exportOrders} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
        <Download className="w-4 h-4 mr-2 inline"/>
        Export
      </button>
      <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
        <Filter className="w-4 h-4 mr-2 inline"/>
        Filters
        {showFilters ? <ChevronUp className="w-4 h-4 ml-2 inline"/> : <ChevronDown className="w-4 h-4 ml-2 inline"/>}
      </button>
    </div>);
    return (<AdminLayout title="Orders & Payments" subtitle="Manage platform orders and payment processing" searchPlaceholder="Search orders by ID, buyer, or seller..." onSearch={handleSearch} actions={actions}>
      <div className="space-y-6">
        {/* Filters */}
        {showFilters && (<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Order Status</label>
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Status</label>
                <select value={filters.paymentStatus} onChange={(e) => handleFilterChange('paymentStatus', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black">
                  <option value="all">All Payment Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Country</label>
                <select value={filters.country} onChange={(e) => handleFilterChange('country', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black">
                  <option value="all">All Countries</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
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
              <ShoppingCart className="w-8 h-8 text-blue-600"/>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-600"/>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(orders.reduce((sum, order) => sum + order.total, 0))}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-purple-600"/>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {orders.filter(o => o.status === 'delivered').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <X className="w-8 h-8 text-red-600"/>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Refunded</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {orders.filter(o => o.status === 'refunded').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input type="checkbox" onChange={(e) => {
            if (e.target.checked) {
                setSelectedOrders(orders.map(o => o.id));
            }
            else {
                setSelectedOrders([]);
            }
        }} className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"/>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (<tr>
                    <td colSpan={10} className="px-6 py-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    </td>
                  </tr>) : orders.length === 0 ? (<tr>
                    <td colSpan={10} className="px-6 py-4 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>) : (orders.map((order) => (<tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={(e) => {
                if (e.target.checked) {
                    setSelectedOrders(prev => [...prev, order.id]);
                }
                else {
                    setSelectedOrders(prev => prev.filter(id => id !== order.id));
                }
            }} className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"/>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        #{order.id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500"/>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{order.buyerName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{order.buyerEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500"/>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{order.sellerName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{order.sellerEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{order.productName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(order.total)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-purple-600 hover:text-purple-900" onClick={() => { }}>
                            <Eye className="w-4 h-4"/>
                          </button>
                          {order.status === 'pending' && (<button className="text-green-600 hover:text-green-900" onClick={() => handleOrderAction(order.id, 'paid')}>
                              <CheckCircle className="w-4 h-4"/>
                            </button>)}
                          {order.status === 'paid' && (<button className="text-blue-600 hover:text-blue-900" onClick={() => handleOrderAction(order.id, 'shipped')}>
                              <Truck className="w-4 h-4"/>
                            </button>)}
                          {order.status === 'shipped' && (<button className="text-green-600 hover:text-green-900" onClick={() => handleOrderAction(order.id, 'delivered')}>
                              <CheckCircle className="w-4 h-4"/>
                            </button>)}
                          {order.status !== 'refunded' && (<button className="text-red-600 hover:text-red-900" onClick={() => handleOrderAction(order.id, 'refunded')}>
                              <X className="w-4 h-4"/>
                            </button>)}
                        </div>
                      </td>
                    </tr>)))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>);
}
