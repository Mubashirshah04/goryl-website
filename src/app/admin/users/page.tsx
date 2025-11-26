'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Search, Filter, MoreVertical, Eye, UserX, Shield, 
  Mail, Phone, Calendar, MapPin, Smartphone, Monitor, Tablet,
  ChevronDown, ChevronUp, Download, RefreshCw, Plus,
  User, UserCheck, Building, Crown, CheckCircle, XCircle, Clock,
  AlertTriangle, Ban, Settings, Edit, Trash2, ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import AdminLayout from '@/components/layout/AdminLayout'

interface User {
  id: string
  name: string
  email: string
  role: 'normal' | 'personal' | 'brand' | 'company'
  status: 'active' | 'suspended' | 'banned' | 'pending'
  avatar: string
  joinDate: Date
  lastLogin: Date
  location: string
  totalOrders: number
  totalSpent: number
  loginHistory: LoginHistory[]
  devices: Device[]
}

interface LoginHistory {
  id: string
  timestamp: Date
  device: string
  location: string
  ip: string
  success: boolean
}

interface Device {
  id: string
  name: string
  type: 'mobile' | 'desktop' | 'tablet'
  lastUsed: Date
  location: string
  active: boolean
}

const demoUsers: User[] = [];

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  // Load users from AWS DynamoDB via API
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        
        const userList: User[] = (data.users || []).map((user: any) => ({
          id: user.id || user.userId,
          name: user.name || user.username || '',
          email: user.email || '',
          role: user.role || 'normal',
          status: user.status || 'active',
          avatar: user.avatar || user.profilePic || '',
          joinDate: user.createdAt ? new Date(user.createdAt) : new Date(),
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : new Date(),
          location: user.location || '',
          totalOrders: user.totalOrders || 0,
          totalSpent: user.totalSpent || 0,
          loginHistory: user.loginHistory || [],
          devices: user.devices || []
        }));
        
        console.log('✅ Loaded', userList.length, 'users from AWS');
        setUsers(userList)
      } catch (error) {
        console.error('Failed to load users:', error)
        toast.error('Failed to load users')
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showProfileDrawer, setShowProfileDrawer] = useState(false)
  const [loading, setLoading] = useState(false)

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users

    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchQuery, roleFilter, statusFilter])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleUserAction = async (userId: string, action: 'suspend' | 'ban' | 'activate') => {
    setLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          status: action === 'activate' ? 'active' : action === 'suspend' ? 'suspended' : 'banned'
        }
      }
      return user
    }))

    toast.success(`User ${action === 'activate' ? 'activated' : action === 'suspend' ? 'suspended' : 'banned'} successfully`)
    setLoading(false)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'normal': return <User className="w-4 h-4" />
      case 'personal': return <UserCheck className="w-4 h-4" />
      case 'brand': return <Crown className="w-4 h-4" />
      case 'company': return <Building className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'normal': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'personal': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'brand': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'company': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'suspended': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'banned': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'pending': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const exportUsers = () => {
    toast.success('Exporting users data...')
    // Implement CSV/PDF export
  }

  return (
    <AdminLayout 
      title="User Management" 
      subtitle="Manage platform users and permissions"
      searchPlaceholder="Search users by name, email, or location..."
      onSearch={handleSearch}
      actions={
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportUsers}
            className="bg-white/10 text-white px-4 py-2 rounded-xl font-bold hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-4 py-2 rounded-xl font-bold hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-300 shadow-lg flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </motion.button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Total Users</p>
                <p className="text-3xl font-bold text-white">{users.length}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Active Users</p>
                <p className="text-3xl font-bold text-white">{users.filter(u => u.status === 'active').length}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-2xl border border-green-500/30">
                <UserCheck className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Sellers</p>
                <p className="text-3xl font-bold text-white">{users.filter(u => ['personal', 'brand', 'company'].includes(u.role)).length}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-200">Pending</p>
                <p className="text-3xl font-bold text-white">{users.filter(u => u.status === 'pending').length}</p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-2xl border border-yellow-500/30">
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <h2 className="text-2xl font-bold text-white">Users</h2>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Role Filter */}
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none pr-10"
                >
                  <option value="all">All Roles</option>
                  <option value="normal">Normal Users</option>
                  <option value="personal">Personal Sellers</option>
                  <option value="brand">Brands</option>
                  <option value="company">Companies</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-300 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none pr-10"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                  <option value="pending">Pending</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-300 pointer-events-none" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-6 text-purple-200 font-semibold">User</th>
                  <th className="text-left p-6 text-purple-200 font-semibold">Role</th>
                  <th className="text-left p-6 text-purple-200 font-semibold">Status</th>
                  <th className="text-left p-6 text-purple-200 font-semibold">Location</th>
                  <th className="text-left p-6 text-purple-200 font-semibold">Last Login</th>
                  <th className="text-left p-6 text-purple-200 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedUser(user)
                      setShowProfileDrawer(true)
                    }}
                  >
                    <td className="p-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">{user.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{user.name}</p>
                          <p className="text-purple-200 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1 capitalize">{user.role}</span>
                      </span>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                        {user.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {user.status === 'suspended' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {user.status === 'banned' && <Ban className="w-3 h-3 mr-1" />}
                        {user.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        <span className="capitalize">{user.status}</span>
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-purple-300" />
                        <span className="text-white">{user.location}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-purple-200">{formatDate(user.lastLogin)}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedUser(user)
                            setShowProfileDrawer(true)
                          }}
                          className="p-2 bg-blue-500/20 rounded-xl hover:bg-blue-500/30 transition-colors border border-blue-500/30"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4 text-blue-400" />
                        </motion.button>
                        
                        {user.status === 'active' ? (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUserAction(user.id, 'suspend')
                            }}
                            className="p-2 bg-yellow-500/20 rounded-xl hover:bg-yellow-500/30 transition-colors border border-yellow-500/30"
                            title="Suspend User"
                          >
                            <UserX className="w-4 h-4 text-yellow-400" />
                          </motion.button>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUserAction(user.id, 'activate')
                            }}
                            className="p-2 bg-green-500/20 rounded-xl hover:bg-green-500/30 transition-colors border border-green-500/30"
                            title="Activate User"
                          >
                            <UserCheck className="w-4 h-4 text-green-400" />
                          </motion.button>
                        )}
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUserAction(user.id, 'ban')
                          }}
                          className="p-2 bg-red-500/20 rounded-xl hover:bg-red-500/30 transition-colors border border-red-500/30"
                          title="Ban User"
                        >
                          <Ban className="w-4 h-4 text-red-400" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Profile Drawer */}
        <AnimatePresence>
          {showProfileDrawer && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowProfileDrawer(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-white/20">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">User Profile</h2>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowProfileDrawer(false)}
                      className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                    >
                      <XCircle className="w-6 h-6 text-white" />
                    </motion.button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* User Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <h3 className="text-lg font-bold text-white mb-4">Basic Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xl">{selectedUser.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-white font-semibold text-lg">{selectedUser.name}</p>
                            <p className="text-purple-200">{selectedUser.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-purple-300" />
                          <span className="text-white">{selectedUser.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-purple-300" />
                          <span className="text-white">Joined {formatDate(selectedUser.joinDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <h3 className="text-lg font-bold text-white mb-4">Account Status</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-purple-200">Role:</span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(selectedUser.role)}`}>
                            {getRoleIcon(selectedUser.role)}
                            <span className="ml-1 capitalize">{selectedUser.role}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-purple-200">Status:</span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedUser.status)}`}>
                            <span className="capitalize">{selectedUser.status}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-purple-200">Total Orders:</span>
                          <span className="text-white font-semibold">{selectedUser.totalOrders}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-purple-200">Total Spent:</span>
                          <span className="text-white font-semibold">${selectedUser.totalSpent.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Login History */}
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4">Login History</h3>
                    <div className="space-y-3">
                      {selectedUser.loginHistory.map((login) => (
                        <div key={login.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-500/20 rounded-xl">
                              <Smartphone className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{login.device}</p>
                              <p className="text-purple-200 text-sm">{login.location} • {login.ip}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white text-sm">{formatDate(login.timestamp)}</p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              login.success 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {login.success ? 'Success' : 'Failed'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Devices */}
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4">Active Devices</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.devices.map((device) => (
                        <div key={device.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                          <div className={`p-2 rounded-xl ${
                            device.type === 'mobile' ? 'bg-blue-500/20' :
                            device.type === 'desktop' ? 'bg-green-500/20' :
                            'bg-purple-500/20'
                          }`}>
                            {device.type === 'mobile' ? <Smartphone className="w-4 h-4 text-blue-400" /> :
                             device.type === 'desktop' ? <Monitor className="w-4 h-4 text-green-400" /> :
                             <Tablet className="w-4 h-4 text-purple-400" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{device.name}</p>
                            <p className="text-purple-200 text-sm">{device.location}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white text-sm">{formatDate(device.lastUsed)}</p>
                            {device.active && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  )
}
