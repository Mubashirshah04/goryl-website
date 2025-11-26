'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Flag, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter,
  Download,
  RefreshCw,
  Search,
  Calendar
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/store/authStoreCognito';
import { toast } from 'sonner';
// ✅ AWS DYNAMODB - Firestore removed
// ✅ AWS - Using AWS services

interface Report {
  id: string;
  type: string;
  targetId: string;
  reporterId: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: Timestamp | Date;
  reviewedAt?: Timestamp | Date;
  reviewedBy?: string;
}

export default function AdminReportsPage() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewing' | 'resolved' | 'dismissed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'reel' | 'product' | 'user' | 'comment'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Check admin access
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      window.location.href = '/';
      return;
    }
  }, [user]);

  // Fetch reports in real-time
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    let q = query(
      collection(db, 'reports'),
      orderBy('createdAt', 'desc')
    );

    // Apply filters
    if (filter !== 'all') {
      q = query(q, where('status', '==', filter));
    }
    if (typeFilter !== 'all') {
      q = query(q, where('type', '==', typeFilter));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reportsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          reviewedAt: doc.data().reviewedAt?.toDate(),
        })) as Report[];
        
        setReports(reportsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching reports:', error);
        toast.error('Failed to load reports');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, filter, typeFilter]);

  // Filter reports by search query
  const filteredReports = reports.filter(report => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.reason.toLowerCase().includes(query) ||
      report.description?.toLowerCase().includes(query) ||
      report.targetId.toLowerCase().includes(query) ||
      report.reporterId.toLowerCase().includes(query)
    );
  });

  // Update report status
  const updateReportStatus = async (reportId: string, status: Report['status']) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status,
        reviewedAt: new Date(),
        reviewedBy: user?.sub
      });
      toast.success(`Report ${status}`);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report status');
    }
  };

  // Get status badge
  const getStatusBadge = (status: Report['status']) => {
    const badges = {
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-300', text: 'Pending' },
      reviewing: { icon: Eye, color: 'bg-blue-100 text-blue-800 border-blue-300', text: 'Reviewing' },
      resolved: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-300', text: 'Resolved' },
      dismissed: { icon: XCircle, color: 'bg-gray-100 text-gray-800 border-gray-300', text: 'Dismissed' }
    };

    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  // Export reports
  const exportReports = () => {
    const csv = [
      ['ID', 'Type', 'Reason', 'Description', 'Status', 'Created At', 'Reporter ID'].join(','),
      ...filteredReports.map(r => [
        r.id,
        r.type,
        `"${r.reason}"`,
        `"${r.description || ''}"`,
        r.status,
        r.createdAt instanceof Date ? r.createdAt.toISOString() : '',
        r.reporterId
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Reports exported successfully');
  };

  if (loading) {
    return (
      <AdminLayout title="Reports" subtitle="Review and manage content reports">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Reports Management" 
      subtitle="Review and manage content reports"
      searchPlaceholder="Search reports..."
      onSearch={setSearchQuery}
      actions={
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportReports}
          className="bg-purple-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </motion.button>
      }
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Types</option>
                <option value="reel">Reels</option>
                <option value="product">Products</option>
                <option value="user">Users</option>
                <option value="comment">Comments</option>
              </select>
            </div>

            {/* Stats */}
            <div className="ml-auto flex items-center gap-4 text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Total: <strong className="text-gray-900 dark:text-white">{filteredReports.length}</strong>
              </span>
              <span className="text-yellow-600">
                Pending: <strong>{filteredReports.filter(r => r.status === 'pending').length}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
              <Flag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Reports Found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filter === 'all' ? 'No reports have been submitted yet.' : `No ${filter} reports found.`}
              </p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                          {report.type} Report
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Reported {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reason:</span>
                        <p className="text-gray-900 dark:text-white">{report.reason}</p>
                      </div>
                      {report.description && (
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Description:</span>
                          <p className="text-gray-600 dark:text-gray-400">{report.description}</p>
                        </div>
                      )}
                      <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Target ID: <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{report.targetId}</code></span>
                        <span>Reporter ID: <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{report.reporterId}</code></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateReportStatus(report.id, 'reviewing')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Start Review
                        </button>
                        <button
                          onClick={() => updateReportStatus(report.id, 'dismissed')}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Dismiss
                        </button>
                      </>
                    )}
                    {report.status === 'reviewing' && (
                      <>
                        <button
                          onClick={() => updateReportStatus(report.id, 'resolved')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Resolve
                        </button>
                        <button
                          onClick={() => updateReportStatus(report.id, 'dismissed')}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Dismiss
                        </button>
                      </>
                    )}
                    {(report.status === 'resolved' || report.status === 'dismissed') && (
                      <button
                        onClick={() => updateReportStatus(report.id, 'pending')}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reopen
                      </button>
                    )}
                    {report.type === 'reel' ? (
                      <button
                        onClick={() => window.open(`/videos?reel=${report.targetId}`, '_blank')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Reel
                      </button>
                    ) : report.type === 'product' ? (
                      <button
                        onClick={() => window.open(`/product/${report.targetId}`, '_blank')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Product
                      </button>
                    ) : (
                      <button
                        onClick={() => window.open(`/profile?uid=${report.targetId}`, '_blank')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View User
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}



