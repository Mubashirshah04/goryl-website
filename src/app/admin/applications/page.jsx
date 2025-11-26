'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Download, Eye, CheckCircle, XCircle, Clock, AlertTriangle, FileText, Crown, MapPin, Mail, Phone, Globe, ExternalLink, ChevronDown, FileImage, FileVideo, FileText as FilePdf, X, MessageSquare, User, Building2, Store, RefreshCw, Play } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { doc, getDoc } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStoreCognito';
import { getAllApplications, updateApplicationStatus, updateDocumentVerification } from '@/lib/applicationService';
import { debounce } from '@/utils/debounce';
// Demo data removed - using real Firebase data only
export default function ApplicationsPage() {
    const { user, userData } = useAuthStore();
    const [applications, setApplications] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    // Check admin role
    useEffect(() => {
        const checkAdminRole = async () => {
            console.log('🔍 Checking admin role...', { user: user === null || user === void 0 ? void 0 : user.sub, userData: userData === null || userData === void 0 ? void 0 : userData.role });
            if (!user) {
                setCheckingAuth(false);
                return;
            }
            // Always check Firestore directly for admin role
            try {
                const userDoc = await getDoc(doc(db, 'users', user.sub));
                if (userDoc.exists()) {
                    const firestoreUserData = userDoc.data();
                    const isUserAdmin = firestoreUserData.role === 'admin';
                    console.log('✅ Using Firestore data:', { role: firestoreUserData.role, isAdmin: isUserAdmin });
                    setIsAdmin(isUserAdmin);
                    if (!isUserAdmin) {
                        toast.error('Access denied. Admin role required.');
                    }
                }
                else {
                    console.log('❌ User document not found in Firestore');
                    setIsAdmin(false);
                    toast.error('User profile not found.');
                }
            }
            catch (error) {
                console.error('Error checking admin role:', error);
                setIsAdmin(false);
                toast.error('Error checking permissions.');
            }
            finally {
                setCheckingAuth(false);
            }
        };
        checkAdminRole();
    }, [user]);
    // Real-time listener for applications (only if admin)
    useEffect(() => {
        if (!isAdmin || checkingAuth)
            return;
        console.log('🔍 Setting up real-time listener for applications...');
        const unsubscribe = getAllApplications((fetchedApplications) => {
            console.log(`📋 Real-time update: Found ${fetchedApplications.length} applications`);
            // Transform to match the local Application interface
            const transformedApplications = fetchedApplications.map(app => {
                var _a, _b, _c;
                // Preserve the original type from the application - this is the key fix
                // The app.type should directly correspond to the account type applied for
                let mappedType = app.type;
                // Ensure the type is one of our expected values
                if (!['personal', 'brand', 'company', 'seller', 'personal_seller'].includes(app.type)) {
                    // Default to 'personal' if type is not recognized
                    mappedType = 'personal';
                }
                else if (app.type === 'personal_seller') {
                    // Map personal_seller to personal for display purposes
                    mappedType = 'personal';
                }
                else {
                    // Use the type as-is for brand, company, seller
                    mappedType = app.type;
                }
                return {
                    id: app.id,
                    applicantName: ((_a = app.user) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown',
                    email: ((_b = app.user) === null || _b === void 0 ? void 0 : _b.email) || '',
                    phone: ((_c = app.user) === null || _c === void 0 ? void 0 : _c.phone) || '',
                    type: mappedType, // This will now correctly show the applied account type
                    status: app.status,
                    submittedDate: app.submittedAt,
                    location: app.location,
                    businessName: app.businessName || '',
                    website: app.website || '',
                    description: app.description,
                    documents: app.documents.map(doc => (Object.assign(Object.assign({}, doc), { uploadedDate: doc.uploadedAt || new Date() }))),
                    notes: app.notes,
                    estimatedRevenue: app.estimatedRevenue,
                    category: app.category,
                    address: '',
                    taxId: '',
                    bankInfo: {
                        accountNumber: '',
                        routingNumber: '',
                        bankName: ''
                    }
                };
            });
            setApplications(transformedApplications);
            setLoading(false);
            if (transformedApplications.length === 0) {
                toast.info('No applications found. Submit one from the Become Seller page!');
            }
        });
        // Cleanup listener on unmount
        return () => {
            console.log('🧹 Cleaning up real-time listener');
            unsubscribe();
        };
    }, [isAdmin, checkingAuth]);
    // Optimized filtering with useMemo
    const filteredApplications = useMemo(() => {
        let filtered = applications;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(app => 
                app.applicantName?.toLowerCase().includes(query) ||
                app.email?.toLowerCase().includes(query) ||
                app.businessName?.toLowerCase().includes(query) ||
                app.category?.toLowerCase().includes(query)
            );
        }
        if (typeFilter !== 'all') {
            filtered = filtered.filter(app => app.type === typeFilter);
        }
        if (statusFilter !== 'all') {
            filtered = filtered.filter(app => app.status === statusFilter);
        }
        return filtered;
    }, [applications, searchQuery, typeFilter, statusFilter]);

    // Debounced search handler
    const debouncedSearch = useCallback(
        debounce((query) => {
            setSearchQuery(query);
        }, 300),
        []
    );

    const handleSearch = useCallback((query) => {
        debouncedSearch(query);
    }, [debouncedSearch]);
    const handleApplicationAction = async (applicationId, action, reason) => {
        setActionLoading(applicationId);
        console.log('🔍 Handling application action:', { applicationId, action, reason });
        try {
            await updateApplicationStatus(applicationId, action, (user === null || user === void 0 ? void 0 : user.sub) || '', reason);
            toast.success(`Application ${action} successfully`);
            setActionLoading(null);
            setShowDetailsModal(false);
            setSelectedApplication(null);
        }
        catch (error) {
            console.error('Error updating application:', error);
            toast.error('Failed to update application');
            setActionLoading(null);
        }
    };
    const getTypeIcon = (type) => {
        switch (type) {
            case 'personal': return <User className="w-4 h-4"/>;
            case 'brand': return <Crown className="w-4 h-4"/>;
            case 'company': return <Building2 className="w-4 h-4"/>;
            case 'seller': return <Store className="w-4 h-4"/>;
            default: return <Shield className="w-4 h-4"/>;
        }
    };
    const getTypeColor = (type) => {
        switch (type) {
            case 'personal': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'brand': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'company': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'seller': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'incomplete': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'resubmission': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };
    const getDocumentIcon = (type) => {
        switch (type) {
            case 'image': return <FileImage className="w-4 h-4"/>;
            case 'pdf': return <FilePdf className="w-4 h-4"/>;
            case 'video': return <FileVideo className="w-4 h-4"/>;
            default: return <FileText className="w-4 h-4"/>;
        }
    };
    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    };
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };
    const exportApplications = () => {
        toast.success('Exporting applications data...');
        // Implement CSV/PDF export
    };
    const openDetailsModal = (application) => {
        setSelectedApplication(application);
        setShowDetailsModal(true);
    };
    const updateDocumentVerificationLocal = async (applicationId, documentId, verified) => {
        try {
            // Call the imported function
            await updateDocumentVerification(applicationId, documentId, verified, (user === null || user === void 0 ? void 0 : user.sub) || '');
            toast.success(`Document ${verified ? 'verified' : 'unverified'} successfully`);
        }
        catch (error) {
            console.error('Error updating document verification:', error);
            toast.error('Failed to update document verification');
        }
    };
    // Show loading while checking auth
    if (checkingAuth) {
        return (<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Checking permissions...</p>
        </div>
      </div>);
    }
    // Show access denied for non-admin users
    if (!isAdmin) {
        return (<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4"/>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-300 mb-4">You need admin privileges to access this page.</p>
          <button onClick={() => window.history.back()} className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
            Go Back
          </button>
        </div>
      </div>);
    }
    return (<AdminLayout title="Applications" subtitle="Review seller, brand, and company applications" searchPlaceholder="Search applications by name, business, or category..." onSearch={handleSearch} actions={<div className="flex items-center space-x-3">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportApplications} className="bg-white/10 text-white px-4 py-2 rounded-xl font-bold hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center space-x-2">
            <Download className="w-4 h-4"/>
            <span>Export</span>
          </motion.button>
        </div>}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Total</p>
                <p className="text-3xl font-bold text-white">{applications.length}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                <Shield className="w-8 h-8 text-blue-400"/>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Pending</p>
                <p className="text-3xl font-bold text-white">{applications.filter(a => a.status === 'pending').length}</p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-2xl border border-yellow-500/30">
                <Clock className="w-8 h-8 text-yellow-400"/>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Approved</p>
                <p className="text-3xl font-bold text-white">{applications.filter(a => a.status === 'approved').length}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-2xl border border-green-500/30">
                <CheckCircle className="w-8 h-8 text-green-400"/>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Rejected</p>
                <p className="text-3xl font-bold text-white">{applications.filter(a => a.status === 'rejected').length}</p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-2xl border border-red-500/30">
                <XCircle className="w-8 h-8 text-red-400"/>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Incomplete</p>
                <p className="text-3xl font-bold text-white">{applications.filter(a => a.status === 'incomplete').length}</p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-2xl border border-orange-500/30">
                <AlertTriangle className="w-8 h-8 text-orange-400"/>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <h2 className="text-2xl font-bold text-white">Applications</h2>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Type Filter */}
              <div className="relative">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none pr-10">
                  <option value="all">All Types</option>
                  <option value="personal">Personal Sellers</option>
                  <option value="brand">Brands</option>
                  <option value="company">Companies</option>
                  <option value="seller">Sellers</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-300 pointer-events-none"/>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none pr-10">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="incomplete">Incomplete</option>
                  <option value="resubmission">Resubmission</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-300 pointer-events-none"/>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Applications Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-200">Applicant Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-200">Account Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-200">Date Applied</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-200">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-purple-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredApplications.map((application, index) => (<motion.tr key={application.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + index * 0.1 }} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{application.applicantName.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{application.applicantName}</p>
                          <p className="text-purple-200 text-sm">{application.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(application.type)}`}>
                        {getTypeIcon(application.type)}
                        <span className="ml-1 capitalize">{application.type}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white">{formatDate(application.submittedDate)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(application.status)}`}>
                        {application.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1"/>}
                        {application.status === 'rejected' && <XCircle className="w-3 h-3 mr-1"/>}
                        {application.status === 'pending' && <Clock className="w-3 h-3 mr-1"/>}
                        {application.status === 'incomplete' && <AlertTriangle className="w-3 h-3 mr-1"/>}
                        {application.status === 'resubmission' && <RefreshCw className="w-3 h-3 mr-1"/>}
                        <span className="capitalize">{application.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => openDetailsModal(application)} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-xl hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-300 font-bold flex items-center space-x-2">
                        <Eye className="w-4 h-4"/>
                        <span>View Details</span>
                      </motion.button>
                    </td>
                  </motion.tr>))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Details Modal */}
        <AnimatePresence>
          {showDetailsModal && selectedApplication && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetailsModal(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="p-6 border-b border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{selectedApplication.applicantName}</h3>
                      <p className="text-purple-200">{selectedApplication.businessName || 'Personal Business'}</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowDetailsModal(false)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                      <X className="w-6 h-6 text-white"/>
                    </motion.button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <h4 className="text-lg font-bold text-white mb-4">Basic Information</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-purple-200 text-sm">Account Type</p>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(selectedApplication.type)}`}>
                            {getTypeIcon(selectedApplication.type)}
                            <span className="ml-1 capitalize">{selectedApplication.type}</span>
                          </span>
                        </div>
                        <div>
                          <p className="text-purple-200 text-sm">Category</p>
                          <p className="text-white font-semibold">{selectedApplication.category}</p>
                        </div>
                        <div>
                          <p className="text-purple-200 text-sm">Estimated Revenue</p>
                          <p className="text-white font-semibold">{formatCurrency(selectedApplication.estimatedRevenue)}</p>
                        </div>
                        <div>
                          <p className="text-purple-200 text-sm">Submitted</p>
                          <p className="text-white">{formatDate(selectedApplication.submittedDate)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <h4 className="text-lg font-bold text-white mb-4">Contact Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-purple-300"/>
                          <span className="text-white">{selectedApplication.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-purple-300"/>
                          <span className="text-white">{selectedApplication.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-purple-300"/>
                          <span className="text-white">{selectedApplication.location}</span>
                        </div>
                        {selectedApplication.website && (<div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4 text-purple-300"/>
                            <a href={selectedApplication.website} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-white flex items-center space-x-2">
                              <span>{selectedApplication.website}</span>
                              <ExternalLink className="w-4 h-4"/>
                            </a>
                          </div>)}
                      </div>
                    </div>
                  </div>

                  {/* Business Details */}
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h4 className="text-lg font-bold text-white mb-4">Business Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-purple-200 text-sm">Description</p>
                        <p className="text-white leading-relaxed">{selectedApplication.description}</p>
                      </div>
                      <div className="space-y-3">
                        {selectedApplication.address && (<div>
                            <p className="text-purple-200 text-sm">Address</p>
                            <p className="text-white">{selectedApplication.address}</p>
                          </div>)}
                        {selectedApplication.taxId && (<div>
                            <p className="text-purple-200 text-sm">Tax ID</p>
                            <p className="text-white">{selectedApplication.taxId}</p>
                          </div>)}
                      </div>
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-bold text-white">Submitted Documents</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-purple-200">
                          {selectedApplication.documents.filter(doc => doc.verified).length} of {selectedApplication.documents.length} verified
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {selectedApplication.documents.map((doc, index) => (<div key={doc.id || `doc-${index}`} className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
                          {/* Document Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-xl ${doc.verified ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                                {getDocumentIcon(doc.type)}
                              </div>
                              <div>
                                <p className="text-white font-semibold text-sm">{doc.name}</p>
                                <p className="text-purple-200 text-xs">{formatDate(doc.uploadedDate)}</p>
                              </div>
                            </div>
                            {doc.verified ? (<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                <CheckCircle className="w-3 h-3 mr-1"/>
                                Verified
                              </span>) : (<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                <Clock className="w-3 h-3 mr-1"/>
                                Pending
                              </span>)}
                          </div>

                          {/* Document Preview/Content */}
                          <div className="mb-4">
                            {doc.type === 'image' && (<div className="relative group">
                                <div className="aspect-video bg-white/5 rounded-xl overflow-hidden border border-white/10">
                                  <img src={doc.url || '/api/placeholder-image.jpg'} alt={doc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => {
                        const target = e.target;
                        target.src = '/api/placeholder-image.jpg';
                    }}/>
                                </div>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => window.open(doc.url, '_blank')} className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 font-semibold flex items-center space-x-2">
                                    <Eye className="w-4 h-4"/>
                                    <span>View Full</span>
                                  </motion.button>
                                </div>
                              </div>)}

                            {doc.type === 'pdf' && (<div className="bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-xl p-4 border border-red-500/30">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-red-500/30 rounded-xl">
                                    <FilePdf className="w-6 h-6 text-red-400"/>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-white font-medium text-sm">PDF Document</p>
                                    <p className="text-red-200 text-xs">Click to download</p>
                                  </div>
                                </div>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => {
                        const link = document.createElement('a');
                        link.href = doc.url;
                        link.download = doc.name;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }} className="w-full mt-3 px-4 py-2 bg-red-500/30 text-white rounded-xl hover:bg-red-500/40 transition-all duration-300 font-semibold flex items-center justify-center space-x-2">
                                  <Download className="w-4 h-4"/>
                                  <span>Download PDF</span>
                                </motion.button>
                              </div>)}

                            {doc.type === 'video' && (<div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl p-4 border border-blue-500/30">
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-blue-500/30 rounded-xl">
                                    <FileVideo className="w-6 h-6 text-blue-400"/>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-white font-medium text-sm">Video File</p>
                                    <p className="text-blue-200 text-xs">Click to view</p>
                                  </div>
                                </div>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => window.open(doc.url, '_blank')} className="w-full mt-3 px-4 py-2 bg-blue-500/30 text-white rounded-xl hover:bg-blue-500/40 transition-all duration-300 font-semibold flex items-center justify-center space-x-2">
                                  <Play className="w-4 h-4"/>
                                  <span>Play Video</span>
                                </motion.button>
                              </div>)}
                          </div>

                          {/* Document Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => window.open(doc.url, '_blank')} className="p-2 bg-blue-500/20 rounded-xl hover:bg-blue-500/30 transition-colors" title="View Document">
                                <Eye className="w-4 h-4 text-blue-400"/>
                              </motion.button>
                              
                              {doc.type === 'pdf' && (<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => {
                        const link = document.createElement('a');
                        link.href = doc.url;
                        link.download = doc.name;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }} className="p-2 bg-green-500/20 rounded-xl hover:bg-green-500/30 transition-colors" title="Download PDF">
                                  <Download className="w-4 h-4 text-green-400"/>
                                </motion.button>)}
                            </div>

                             {/* Verification Toggle */}
                             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => updateDocumentVerificationLocal(selectedApplication.id, doc.id, !doc.verified)} className={`p-2 rounded-xl transition-colors ${doc.verified
                    ? 'bg-red-500/20 hover:bg-red-500/30'
                    : 'bg-green-500/20 hover:bg-green-500/30'}`} title={doc.verified ? 'Mark as Unverified' : 'Mark as Verified'}>
                               {doc.verified ? (<XCircle className="w-4 h-4 text-red-400"/>) : (<CheckCircle className="w-4 h-4 text-green-400"/>)}
                             </motion.button>
                          </div>
                        </div>))}
                    </div>

                    {/* Document Categories Summary */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <h5 className="text-md font-semibold text-white mb-3">Document Categories</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['CNIC', 'NTN', 'Passport', 'Bank Statements'].map((category) => {
                const categoryDocs = selectedApplication.documents.filter(doc => doc.name.toLowerCase().includes(category.toLowerCase()));
                const verifiedCount = categoryDocs.filter(doc => doc.verified).length;
                return (<div key={category} className="bg-white/5 rounded-xl p-3 border border-white/10">
                              <p className="text-purple-200 text-sm font-medium">{category}</p>
                              <p className="text-white text-lg font-bold">
                                {verifiedCount}/{categoryDocs.length}
                              </p>
                              <p className="text-purple-200 text-xs">
                                {categoryDocs.length > 0 ? `${Math.round((verifiedCount / categoryDocs.length) * 100)}% verified` : 'No documents'}
                              </p>
                            </div>);
            })}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedApplication.notes.length > 0 && (<div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <h4 className="text-lg font-bold text-white mb-4">Review Notes</h4>
                      <div className="space-y-2">
                        {selectedApplication.notes.map((note, noteIndex) => (<div key={noteIndex} className="flex items-start space-x-3 p-3 bg-white/5 rounded-xl">
                            <div className="p-1 bg-purple-500/20 rounded-full">
                              <MessageSquare className="w-3 h-3 text-purple-400"/>
                            </div>
                            <p className="text-purple-200">{note}</p>
                          </div>))}
                      </div>
                    </div>)}

                  {/* Admin Controls */}
                  {selectedApplication.status === 'pending' && (<div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <h4 className="text-lg font-bold text-white mb-4">Admin Controls</h4>
                      <div className="flex flex-wrap items-center gap-4">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleApplicationAction(selectedApplication.id, 'approved')} disabled={actionLoading === selectedApplication.id} className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-bold flex items-center space-x-2 disabled:opacity-50">
                          <CheckCircle className="w-4 h-4"/>
                          <span>{actionLoading === selectedApplication.id ? 'Processing...' : 'Approve'}</span>
                        </motion.button>
                        
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleApplicationAction(selectedApplication.id, 'rejected')} disabled={actionLoading === selectedApplication.id} className="px-6 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all duration-300 border border-red-500/30 font-bold flex items-center space-x-2 disabled:opacity-50">
                          <XCircle className="w-4 h-4"/>
                          <span>{actionLoading === selectedApplication.id ? 'Processing...' : 'Reject'}</span>
                        </motion.button>

                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleApplicationAction(selectedApplication.id, 'incomplete')} disabled={actionLoading === selectedApplication.id} className="px-6 py-3 bg-orange-500/20 text-orange-400 rounded-xl hover:bg-orange-500/30 transition-all duration-300 border border-orange-500/30 font-bold flex items-center space-x-2 disabled:opacity-50">
                          <AlertTriangle className="w-4 h-4"/>
                          <span>{actionLoading === selectedApplication.id ? 'Processing...' : 'Mark Incomplete'}</span>
                        </motion.button>

                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleApplicationAction(selectedApplication.id, 'resubmission')} disabled={actionLoading === selectedApplication.id} className="px-6 py-3 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all duration-300 border border-blue-500/30 font-bold flex items-center space-x-2 disabled:opacity-50">
                          <RefreshCw className="w-4 h-4"/>
                          <span>{actionLoading === selectedApplication.id ? 'Processing...' : 'Request Resubmission'}</span>
                        </motion.button>
                      </div>
                    </div>)}
                </div>
              </motion.div>
            </motion.div>)}
        </AnimatePresence>
      </div>
    </AdminLayout>);
}

