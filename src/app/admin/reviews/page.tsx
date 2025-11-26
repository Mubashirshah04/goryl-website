'use client'

import React, { useState, useEffect } from 'react'
import {
  Star, Eye, Trash2, Download, Filter, ChevronDown, ChevronUp,
  Calendar, User, Package, Flag, AlertTriangle, CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import AdminLayout from '@/components/layout/AdminLayout'
import {
  subscribeToReviews,
  removeReview,
  ReviewAnalytics
} from '@/lib/adminService'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    rating: 'all',
    status: 'all',
    product: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedReviews, setSelectedReviews] = useState<string[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToReviews(filters, (newReviews) => {
      setReviews(newReviews)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [filters])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }))
  }

  const handleReviewAction = async (reviewId: string, action: string, details?: any) => {
    try {
      if (action === 'remove') {
        await removeReview(reviewId, details)
        toast.success('Review removed successfully')
      }
    } catch (error) {
      toast.error(`Failed to ${action} review`)
      console.error('Review action error:', error)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600'
    if (rating >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'removed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-current text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating})</span>
      </div>
    )
  }

  const exportReviews = () => {
    const csvContent = [
      ['Review ID', 'Product', 'User', 'Rating', 'Review', 'Status', 'Reports', 'Date'],
      ...reviews.map(review => [
        review.id,
        review.productName,
        review.userName,
        review.rating.toString(),
        review.review,
        review.status,
        review.reportCount.toString(),
        formatDate(review.createdAt)
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reviews-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const actions = (
    <div className="flex items-center space-x-2">
      <button
        onClick={exportReviews}
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
      title="Reviews"
      subtitle="Manage product reviews and moderation"
      searchPlaceholder="Search reviews by product or user..."
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="removed">Removed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  />
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
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
              <Star className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{reviews.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Reviews</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reviews.filter(r => r.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <Flag className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reported</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reviews.filter(r => r.reportCount > 0).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Reports</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {reviews.filter(r => r.reportCount >= 3).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Table */}
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
                          setSelectedReviews(reviews.map(r => r.id))
                        } else {
                          setSelectedReviews([])
                        }
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reports</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                      No reviews found
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedReviews.includes(review.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedReviews(prev => [...prev, review.id])
                            } else {
                              setSelectedReviews(prev => prev.filter(id => id !== review.id))
                            }
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{review.productName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">ID: {review.productId.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{review.userName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">ID: {review.userId.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={getRatingColor(review.rating)}>
                          {renderStars(review.rating)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 line-clamp-2">{review.review}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(review.status)}`}>
                          {review.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Flag className={`w-4 h-4 mr-1 ${review.reportCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                          <span className={`text-sm font-medium ${review.reportCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {review.reportCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(review.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-purple-600 hover:text-purple-900"
                            onClick={() => {/* Open review detail drawer */}}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {review.status === 'active' && (
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleReviewAction(review.id, 'remove', { reason: 'Admin removal' })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {review.reportCount > 0 && (
                            <button
                              className="text-yellow-600 hover:text-yellow-900"
                              onClick={() => {/* Open report details */}}
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
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
