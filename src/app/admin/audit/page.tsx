'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText, Eye, Download, Filter, ChevronDown, ChevronUp,
  Calendar, User, Search, Clock, AlertTriangle, CheckCircle, X
} from 'lucide-react'
import { toast } from 'sonner'
import AdminLayout from '@/components/layout/AdminLayout'
import {
  subscribeToAuditLogs,
  AuditLog
} from '@/lib/adminService'

export default function AdminAuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    actor: '',
    action: '',
    targetType: '',
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined,
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLogs, setSelectedLogs] = useState<string[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToAuditLogs(filters, (newLogs) => {
      setAuditLogs(newLogs)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [filters])

  const handleFilterChange = (key: string, value: string | Date | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }))
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'UPDATE_USER_ROLE':
      case 'UPDATE_KYC_STATUS':
        return '👤'
      case 'UPDATE_PRODUCT_STATUS':
      case 'FEATURE_PRODUCT':
        return '📦'
      case 'UPDATE_ORDER_STATUS':
        return '🛒'
      case 'BAN_USER':
      case 'UNBAN_USER':
        return '🚫'
      case 'APPROVE_PAYMENT':
      case 'REJECT_PAYMENT':
        return '💳'
      case 'REMOVE_REVIEW':
        return '⭐'
      default:
        return '📝'
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('BAN') || action.includes('REJECT') || action.includes('REMOVE')) {
      return 'text-red-600'
    }
    if (action.includes('APPROVE') || action.includes('UPDATE')) {
      return 'text-green-600'
    }
    return 'text-blue-600'
  }

  const exportAuditLogs = () => {
    const csvContent = [
      ['Timestamp', 'Actor', 'Action', 'Target Type', 'Target ID', 'IP Address', 'User Agent'],
      ...auditLogs.map(log => [
        formatDate(log.timestamp),
        log.actorName,
        log.action,
        log.targetType,
        log.targetId,
        log.ip,
        log.userAgent
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const actions = (
    <div className="flex items-center space-x-2">
      <button
        onClick={exportAuditLogs}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
      >
        <Download className="w-4 h-4 mr-2 inline" />
        Export
      </button>
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
      >
        <Filter className="w-4 h-4 mr-2 inline" />
        Filters
        {showFilters ? <ChevronUp className="w-4 h-4 ml-2 inline" /> : <ChevronDown className="w-4 h-4 ml-2 inline" />}
      </button>
    </div>
  )

  return (
    <AdminLayout
      title="Audit Log"
      subtitle="Track all platform activities and changes"
      searchPlaceholder="Search audit logs by actor or action..."
      onSearch={handleSearch}
      actions={actions}
    >
      <div className="space-y-6">
        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Action Type</label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                >
                  <option value="all">All Actions</option>
                  <option value="UPDATE_USER_ROLE">Update User Role</option>
                  <option value="UPDATE_KYC_STATUS">Update KYC Status</option>
                  <option value="UPDATE_PRODUCT_STATUS">Update Product Status</option>
                  <option value="UPDATE_ORDER_STATUS">Update Order Status</option>
                  <option value="BAN_USER">Ban User</option>
                  <option value="UNBAN_USER">Unban User</option>
                  <option value="APPROVE_PAYMENT">Approve Payment</option>
                  <option value="REJECT_PAYMENT">Reject Payment</option>
                  <option value="REMOVE_REVIEW">Remove Review</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Type</label>
                <select
                  value={filters.targetType}
                  onChange={(e) => handleFilterChange('targetType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                >
                  <option value="all">All Types</option>
                  <option value="user">User</option>
                  <option value="product">Product</option>
                  <option value="order">Order</option>
                  <option value="payment">Payment</option>
                  <option value="review">Review</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  />
                  <input
                    type="date"
                    value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{auditLogs.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approvals</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {auditLogs.filter(log => log.action.includes('APPROVE')).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <X className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejections</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {auditLogs.filter(log => log.action.includes('REJECT') || log.action.includes('BAN')).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {auditLogs.filter(log => {
                    const today = new Date()
                    const logDate = new Date(log.timestamp)
                    return logDate.toDateString() === today.toDateString()
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLogs(auditLogs.map(log => log.id))
                        } else {
                          setSelectedLogs([])
                        }
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedLogs.includes(log.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLogs(prev => [...prev, log.id])
                            } else {
                              setSelectedLogs(prev => prev.filter(id => id !== log.id))
                            }
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{log.actorName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">ID: {log.actorId.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">{getActionIcon(log.action)}</span>
                          <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 capitalize">{log.targetType}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">ID: {log.targetId.slice(-8)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ip}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-purple-600 hover:text-purple-900"
                          onClick={() => {/* Open log detail drawer */}}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
