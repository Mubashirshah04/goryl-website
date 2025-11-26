'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStoreCognito';
import { useRouter } from 'next/navigation';
import { 
  Users, CheckCircle, XCircle, Clock, Search, Filter, 
  ArrowUpDown, Eye, MessageSquare, Calendar, User
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
// ✅ AWS DYNAMODB - Firestore removed
// ✅ AWS - Using AWS services
import { getRoleDisplayName } from '@/lib/accountConversionService';

interface ConversionRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  currentRole: string;
  requestedRole: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  adminNotes?: string;
  processedBy?: string;
  processedAt?: Timestamp;
}

export default function AccountConversionsPage() {
  const { user, userData, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [requests, setRequests] = useState<ConversionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ConversionRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Check authentication and admin role
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/admin/login');
      return;
    }

    if (userData?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      router.push('/');
      return;
    }
  }, [user, userData, authLoading, router]);

  // Subscribe to conversion requests
  useEffect(() => {
    if (!user || userData?.role !== 'admin') return;

    const q = query(
      collection(db, 'accountConversionRequests'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ConversionRequest));

      setRequests(requestsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching conversion requests:', error);
      toast.error('Failed to load conversion requests');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userData]);

  // Filter requests
  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesSearch = 
      request.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.currentRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestedRole.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Handle approve request
  const handleApprove = async (request: ConversionRequest) => {
    try {
      const requestRef = doc(db, 'accountConversionRequests', request.id);
      await updateDoc(requestRef, {
        status: 'approved',
        processedBy: user?.sub,
        processedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        adminNotes: adminNotes || 'Request approved'
      });

      // Update user role
      const userRef = doc(db, 'users', request.userId);
      await updateDoc(userRef, {
        role: request.requestedRole,
        updatedAt: Timestamp.now()
      });

      toast.success(`Account conversion approved! User role updated to ${getRoleDisplayName(request.requestedRole)}`);
      setShowDetailsModal(false);
      setAdminNotes('');
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  // Handle reject request
  const handleReject = async (request: ConversionRequest) => {
    if (!adminNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      const requestRef = doc(db, 'accountConversionRequests', request.id);
      await updateDoc(requestRef, {
        status: 'rejected',
        processedBy: user?.sub,
        processedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        adminNotes: adminNotes
      });

      toast.success('Request rejected');
      setShowDetailsModal(false);
      setAdminNotes('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Stats
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Conversion Requests</h1>
          <p className="text-gray-600 dark:text-gray-300">Review and manage user account type conversion requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Requests</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Pending</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Approved</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.approved}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">Rejected</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.rejected}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No conversion requests found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{request.userName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{request.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">{getRoleDisplayName(request.currentRole)}</span>
                          <span className="mx-2">→</span>
                          <span className="font-medium text-blue-600">{getRoleDisplayName(request.requestedRole)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {request.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setAdminNotes(request.adminNotes || '');
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Conversion Request Details</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* User Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">User Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Name:</p>
                      <p className="font-medium">{selectedRequest.userName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Email:</p>
                      <p className="font-medium">{selectedRequest.userEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Conversion Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Conversion Details</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Current Role</p>
                        <p className="font-bold text-gray-900 dark:text-white">{getRoleDisplayName(selectedRequest.currentRole)}</p>
                      </div>
                      <div className="text-2xl text-blue-600">→</div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Requested Role</p>
                        <p className="font-bold text-blue-600">{getRoleDisplayName(selectedRequest.requestedRole)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Reason for Conversion</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedRequest.reason}</p>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block font-semibold text-gray-900 mb-2">
                    Admin Notes {selectedRequest.status === 'pending' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this request..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    disabled={selectedRequest.status !== 'pending'}
                  />
                </div>

                {/* Status Info */}
                {selectedRequest.status !== 'pending' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Status:</span>{' '}
                      <span className={`font-bold ${
                        selectedRequest.status === 'approved' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedRequest.status.toUpperCase()}
                      </span>
                    </p>
                    {selectedRequest.processedAt && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Processed:</span>{' '}
                        {selectedRequest.processedAt.toDate().toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-gray-200 flex gap-3">
                {selectedRequest.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleApprove(selectedRequest)}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve Request
                    </button>
                    <button
                      onClick={() => handleReject(selectedRequest)}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject Request
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Close
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setAdminNotes('');
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


