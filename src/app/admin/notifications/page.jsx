'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send, Users, Building, Crown, UserCheck, CheckCircle, XCircle, AlertTriangle, Target, Download, Plus, Eye, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
const demoNotifications = [
    {
        id: '1',
        title: 'Platform Maintenance',
        message: 'We will be performing scheduled maintenance on Sunday at 2 AM EST. The platform will be unavailable for approximately 2 hours.',
        type: 'info',
        target: 'all',
        sentAt: new Date('2024-01-20T10:30:00'),
        sentBy: 'Admin User',
        status: 'sent',
        recipients: 2847,
        opened: 1892
    },
    {
        id: '2',
        title: 'New Features Available',
        message: 'Check out our new advanced analytics dashboard and improved seller tools!',
        type: 'success',
        target: 'brand',
        sentAt: new Date('2024-01-19T14:15:00'),
        sentBy: 'Admin User',
        status: 'sent',
        recipients: 156,
        opened: 98
    },
    {
        id: '3',
        title: 'Payment System Update',
        message: 'We have updated our payment processing system. Please review the new terms and conditions.',
        type: 'warning',
        target: 'all',
        sentAt: new Date('2024-01-18T09:45:00'),
        sentBy: 'Admin User',
        status: 'sent',
        recipients: 2847,
        opened: 1245
    }
];
export default function NotificationsPage() {
    const [notifications, setNotifications] = useState(demoNotifications);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedType, setSelectedType] = useState('info');
    const [selectedTarget, setSelectedTarget] = useState('all');
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const sendNotification = async () => {
        if (!notificationTitle.trim() || !notificationMessage.trim()) {
            toast.error('Please fill in all fields');
            return;
        }
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        const newNotification = {
            id: Date.now().toString(),
            title: notificationTitle,
            message: notificationMessage,
            type: selectedType,
            target: selectedTarget,
            sentAt: new Date(),
            sentBy: 'Admin User',
            status: 'sent',
            recipients: Math.floor(Math.random() * 1000) + 500,
            opened: Math.floor(Math.random() * 500) + 100
        };
        setNotifications(prev => [newNotification, ...prev]);
        setShowCreateModal(false);
        setNotificationTitle('');
        setNotificationMessage('');
        setSelectedType('info');
        setSelectedTarget('all');
        toast.success('Notification sent successfully!');
        setLoading(false);
    };
    const deleteNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        toast.success('Notification deleted');
    };
    const getTypeColor = (type) => {
        switch (type) {
            case 'success': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        }
    };
    const getTypeIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4"/>;
            case 'warning': return <AlertTriangle className="w-4 h-4"/>;
            case 'error': return <XCircle className="w-4 h-4"/>;
            default: return <Bell className="w-4 h-4"/>;
        }
    };
    const getTargetIcon = (target) => {
        switch (target) {
            case 'normal': return <Users className="w-4 h-4"/>;
            case 'personal': return <UserCheck className="w-4 h-4"/>;
            case 'brand': return <Crown className="w-4 h-4"/>;
            case 'company': return <Building className="w-4 h-4"/>;
            default: return <Target className="w-4 h-4"/>;
        }
    };
    const formatDate = (date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };
    const exportNotifications = () => {
        toast.success('Exporting notifications data...');
    };
    return (<AdminLayout title="Notifications" subtitle="Send global notifications and manage notification history" actions={<div className="flex items-center space-x-3">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportNotifications} className="bg-white/10 text-white px-4 py-2 rounded-xl font-bold hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center space-x-2">
            <Download className="w-4 h-4"/>
            <span>Export</span>
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-4 py-2 rounded-xl font-bold hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-300 shadow-lg flex items-center space-x-2">
            <Plus className="w-4 h-4"/>
            <span>Send Notification</span>
          </motion.button>
        </div>}>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Total Sent</p>
                <p className="text-3xl font-bold text-white">{notifications.length}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                <Bell className="w-8 h-8 text-blue-400"/>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Total Recipients</p>
                <p className="text-3xl font-bold text-white">{notifications.reduce((sum, n) => sum + n.recipients, 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-2xl border border-green-500/30">
                <Users className="w-8 h-8 text-green-400"/>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Total Opened</p>
                <p className="text-3xl font-bold text-white">{notifications.reduce((sum, n) => sum + n.opened, 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
                <Eye className="w-8 h-8 text-purple-400"/>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Open Rate</p>
                <p className="text-3xl font-bold text-white">
                  {Math.round((notifications.reduce((sum, n) => sum + n.opened, 0) / notifications.reduce((sum, n) => sum + n.recipients, 0)) * 100)}%
                </p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-2xl border border-yellow-500/30">
                <Target className="w-8 h-8 text-yellow-400"/>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Notification History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-2xl font-bold text-white">Notification History</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-6 text-purple-200 font-semibold">Notification</th>
                  <th className="text-left p-6 text-purple-200 font-semibold">Type</th>
                  <th className="text-left p-6 text-purple-200 font-semibold">Target</th>
                  <th className="text-left p-6 text-purple-200 font-semibold">Sent</th>
                  <th className="text-left p-6 text-purple-200 font-semibold">Performance</th>
                  <th className="text-left p-6 text-purple-200 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification, index) => (<motion.tr key={notification.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + index * 0.1 }} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="p-6">
                      <div>
                        <p className="text-white font-semibold">{notification.title}</p>
                        <p className="text-purple-200 text-sm mt-1 line-clamp-2">{notification.message}</p>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(notification.type)}`}>
                        {getTypeIcon(notification.type)}
                        <span className="ml-1 capitalize">{notification.type}</span>
                      </span>
                    </td>
                    <td className="p-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {getTargetIcon(notification.target)}
                        <span className="ml-1 capitalize">{notification.target}</span>
                      </span>
                    </td>
                    <td className="p-6">
                      <div>
                        <p className="text-white text-sm">{formatDate(notification.sentAt)}</p>
                        <p className="text-purple-200 text-xs">by {notification.sentBy}</p>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-200">Recipients:</span>
                          <span className="text-white">{notification.recipients.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-200">Opened:</span>
                          <span className="text-white">{notification.opened.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-200">Rate:</span>
                          <span className="text-green-400">{Math.round((notification.opened / notification.recipients) * 100)}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center space-x-2">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 bg-blue-500/20 rounded-xl hover:bg-blue-500/30 transition-colors border border-blue-500/30" title="View Details">
                          <Eye className="w-4 h-4 text-blue-400"/>
                        </motion.button>
                        
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 bg-purple-500/20 rounded-xl hover:bg-purple-500/30 transition-colors border border-purple-500/30" title="Copy">
                          <Copy className="w-4 h-4 text-purple-400"/>
                        </motion.button>
                        
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => deleteNotification(notification.id)} className="p-2 bg-red-500/20 rounded-xl hover:bg-red-500/30 transition-colors border border-red-500/30" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-400"/>
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Create Notification Modal */}
        {showCreateModal && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-white/20">
                <h2 className="text-2xl font-bold text-white">Send Global Notification</h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Type Selection */}
                <div>
                  <label className="block text-purple-200 font-bold text-lg mb-3">Notification Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['info', 'success', 'warning', 'error'].map((type) => (<button key={type} onClick={() => setSelectedType(type)} className={`p-4 rounded-2xl border transition-all duration-300 ${selectedType === type
                    ? getTypeColor(type)
                    : 'bg-white/5 border-white/20 hover:bg-white/10'}`}>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(type)}
                          <span className="capitalize">{type}</span>
                        </div>
                      </button>))}
                  </div>
                </div>

                {/* Target Selection */}
                <div>
                  <label className="block text-purple-200 font-bold text-lg mb-3">Target Audience</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {['all', 'normal', 'personal', 'brand', 'company'].map((target) => (<button key={target} onClick={() => setSelectedTarget(target)} className={`p-4 rounded-2xl border transition-all duration-300 ${selectedTarget === target
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                    : 'bg-white/5 border-white/20 hover:bg-white/10 text-white'}`}>
                        <div className="flex items-center space-x-2">
                          {getTargetIcon(target)}
                          <span className="capitalize">{target}</span>
                        </div>
                      </button>))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-purple-200 font-bold text-lg mb-3">Title</label>
                  <input type="text" value={notificationTitle} onChange={(e) => setNotificationTitle(e.target.value)} placeholder="Enter notification title..." className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"/>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-purple-200 font-bold text-lg mb-3">Message</label>
                  <textarea value={notificationMessage} onChange={(e) => setNotificationMessage(e.target.value)} placeholder="Enter notification message..." rows={4} className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"/>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowCreateModal(false)} className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300">
                    Cancel
                  </motion.button>
                  
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={sendNotification} disabled={loading || !notificationTitle.trim() || !notificationMessage.trim()} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-xl hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-300 disabled:opacity-50 flex items-center space-x-2">
                    {loading ? (<>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>) : (<>
                        <Send className="w-4 h-4"/>
                        <span>Send Notification</span>
                      </>)}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>)}
      </div>
    </AdminLayout>);
}
