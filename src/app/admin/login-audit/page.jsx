'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Download, RefreshCw, AlertTriangle, CheckCircle, XCircle, MapPin, Smartphone, Monitor, Tablet, User, Activity } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
const demoLoginAudits = [];
export default function LoginAuditPage() {
    const [loginAudits, setLoginAudits] = useState(demoLoginAudits);
    const [filteredAudits, setFilteredAudits] = useState(demoLoginAudits);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deviceFilter, setDeviceFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    // Filter audits based on search and filters
    React.useEffect(() => {
        let filtered = loginAudits;
        if (searchQuery) {
            filtered = filtered.filter(audit => audit.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                audit.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                audit.ipAddress.includes(searchQuery) ||
                audit.location.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (statusFilter !== 'all') {
            filtered = filtered.filter(audit => statusFilter === 'success' ? audit.success : !audit.success);
        }
        if (deviceFilter !== 'all') {
            filtered = filtered.filter(audit => audit.deviceType === deviceFilter);
        }
        setFilteredAudits(filtered);
    }, [loginAudits, searchQuery, statusFilter, deviceFilter]);
    const handleSearch = (query) => {
        setSearchQuery(query);
    };
    const refreshData = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success('Login audit data refreshed');
        }, 1000);
    };
    const exportAudit = () => {
        toast.success('Exporting login audit data...');
    };
    const getStatusColor = (success) => {
        return success
            ? 'bg-green-500/20 text-green-400 border-green-500/30'
            : 'bg-red-500/20 text-red-400 border-red-500/30';
    };
    const getStatusIcon = (success) => {
        return success ? <CheckCircle className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>;
    };
    const getDeviceIcon = (deviceType) => {
        switch (deviceType) {
            case 'mobile': return <Smartphone className="w-4 h-4"/>;
            case 'desktop': return <Monitor className="w-4 h-4"/>;
            case 'tablet': return <Tablet className="w-4 h-4"/>;
            default: return <Monitor className="w-4 h-4"/>;
        }
    };
    const getDeviceColor = (deviceType) => {
        switch (deviceType) {
            case 'mobile': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'desktop': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'tablet': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };
    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    };
    const formatDuration = (seconds) => {
        if (!seconds)
            return 'N/A';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };
    const successCount = loginAudits.filter(audit => audit.success).length;
    const failedCount = loginAudits.filter(audit => !audit.success).length;
    const uniqueUsers = new Set(loginAudits.map(audit => audit.userId)).size;
    return (<AdminLayout title="Login Audit" subtitle="Monitor user login activity and security events" searchPlaceholder="Search by user, email, IP, or location..." onSearch={handleSearch} actions={<div className="flex items-center space-x-3">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={refreshData} disabled={loading} className="bg-white/10 text-white px-4 py-2 rounded-xl font-bold hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center space-x-2 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
            <span>Refresh</span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportAudit} className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-4 py-2 rounded-xl font-bold hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-300 shadow-lg flex items-center space-x-2">
            <Download className="w-4 h-4"/>
            <span>Export</span>
          </motion.button>
        </div>}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Total Logins</p>
                <p className="text-3xl font-bold text-white">{loginAudits.length}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                <Shield className="w-8 h-8 text-blue-400"/>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Successful</p>
                <p className="text-3xl font-bold text-white">{successCount}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-2xl border border-green-500/30">
                <CheckCircle className="w-8 h-8 text-green-400"/>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Failed</p>
                <p className="text-3xl font-bold text-white">{failedCount}</p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-2xl border border-red-500/30">
                <XCircle className="w-8 h-8 text-red-400"/>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Unique Users</p>
                <p className="text-3xl font-bold text-white">{uniqueUsers}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
                <User className="w-8 h-8 text-purple-400"/>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <h2 className="text-2xl font-bold text-white">Login Activity</h2>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Status Filter */}
              <div className="relative">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none pr-10">
                  <option value="all">All Status</option>
                  <option value="success">Successful</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Device Filter */}
              <div className="relative">
                <select value={deviceFilter} onChange={(e) => setDeviceFilter(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none pr-10">
                  <option value="all">All Devices</option>
                  <option value="mobile">Mobile</option>
                  <option value="desktop">Desktop</option>
                  <option value="tablet">Tablet</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Login Audit Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-6 text-purple-200 font-semibold">User</th>
                  <th className="text-left p-6 text-purple-200 font-semibold">Status</th>
                  <th className="text-left p-6 text-purple-200 font-semibold">Device</th>
                  <th className="text-left p-6 text-purple-200 font-semibold">Location</th>
                  <th className="text-left p-6 text-purple-200 font-semibold">IP Address</th>
                  <th className="text-left p-6 text-purple-200 font-semibold">Timestamp</th>
                  <th className="text-left p-6 text-purple-200 font-semibold">Session</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudits.map((audit, index) => (<motion.tr key={audit.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + index * 0.1 }} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-6">
                      <div>
                        <p className="text-white font-semibold">{audit.userName}</p>
                        <p className="text-purple-200 text-sm">{audit.userEmail}</p>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(audit.success)}`}>
                        {getStatusIcon(audit.success)}
                        <span className="ml-1">{audit.success ? 'Success' : 'Failed'}</span>
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getDeviceColor(audit.deviceType)}`}>
                          {getDeviceIcon(audit.deviceType)}
                          <span className="ml-1 capitalize">{audit.deviceType}</span>
                        </span>
                        <div className="text-sm">
                          <p className="text-white">{audit.browser}</p>
                          <p className="text-purple-200">{audit.os}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-purple-300"/>
                        <span className="text-white">{audit.location}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-purple-200 font-mono text-sm">{audit.ipAddress}</span>
                    </td>
                    <td className="p-6">
                      <div>
                        <p className="text-white text-sm">{formatDate(audit.timestamp)}</p>
                        <p className="text-purple-200 text-xs">
                          {new Date().getTime() - audit.timestamp.getTime() < 86400000 ? 'Today' : 'Older'}
                        </p>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="text-sm">
                        <p className="text-white">{formatDuration(audit.sessionDuration)}</p>
                        {audit.logoutReason && (<p className="text-purple-200 text-xs">{audit.logoutReason}</p>)}
                      </div>
                    </td>
                  </motion.tr>))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Security Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Failed Login Attempts */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-400"/>
              </div>
              <h3 className="text-xl font-bold text-white">Failed Login Attempts</h3>
            </div>
            <div className="space-y-3">
              {loginAudits.filter(audit => !audit.success).slice(0, 5).map((audit) => (<div key={audit.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-white font-medium">{audit.userName || 'Unknown User'}</p>
                    <p className="text-purple-200 text-sm">{audit.ipAddress} • {audit.location}</p>
                  </div>
                  <span className="text-red-400 text-sm">{formatDate(audit.timestamp)}</span>
                </div>))}
            </div>
          </motion.div>

          {/* Device Distribution */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Activity className="w-6 h-6 text-blue-400"/>
              </div>
              <h3 className="text-xl font-bold text-white">Device Distribution</h3>
            </div>
            <div className="space-y-3">
              {[
            { type: 'mobile', count: loginAudits.filter(a => a.deviceType === 'mobile').length },
            { type: 'desktop', count: loginAudits.filter(a => a.deviceType === 'desktop').length },
            { type: 'tablet', count: loginAudits.filter(a => a.deviceType === 'tablet').length }
        ].map((device) => (<div key={device.type} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${getDeviceColor(device.type)}`}>
                      {getDeviceIcon(device.type)}
                    </div>
                    <span className="text-white font-medium capitalize">{device.type}</span>
                  </div>
                  <span className="text-white font-semibold">{device.count}</span>
                </div>))}
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>);
}
