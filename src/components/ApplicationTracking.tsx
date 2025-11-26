'use client'
import Link from 'next/link';

import React, { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle, FileText, Calendar } from 'lucide-react'
import { getUserApplications } from '@/lib/applicationService'

interface ApplicationData {
  id: string
  businessType: string
  businessName: string
  businessDescription: string
  status: 'pending' | 'approved' | 'rejected' | 'under_review'
  submittedAt: any
  createdAt: any
  notes?: string[]
  documents?: any[]
}

interface ApplicationTrackingProps {
  userId: string
}

export default function ApplicationTracking({ userId }: ApplicationTrackingProps) {
  const [applications, setApplications] = useState<ApplicationData[]>([])
  const [loading, setLoading] = useState(true)
  const [indexBuilding, setIndexBuilding] = useState(false)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    console.log('🔍 Fetching applications for userId:', userId)

    // Fetch applications from DynamoDB
    const loadApplications = async () => {
      try {
        console.log('📡 Loading applications for user:', userId)
        const apps = await getUserApplications(userId)
        console.log('✅ Loaded applications:', apps.length)
        
        // Transform to match ApplicationData interface
        const transformedApps = apps.map(app => ({
          id: app.id,
          businessType: app.type,
          businessName: app.businessName || '',
          businessDescription: app.description || '',
          status: app.status as 'pending' | 'approved' | 'rejected' | 'under_review',
          submittedAt: app.submittedAt,
          createdAt: app.submittedAt,
          notes: app.notes || [],
          documents: app.documents || [],
        }))
        
        setApplications(transformedApps)
        setLoading(false)
      } catch (error) {
        console.error('❌ Error fetching applications:', error)
        setLoading(false)
      }
    }

    loadApplications()
  }, [userId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'under_review':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-blue-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved'
      case 'rejected':
        return 'Rejected'
      case 'under_review':
        return 'Under Review'
      default:
        return 'Pending'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          {indexBuilding ? (
            <>
              <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Index Building in Progress</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                The system is currently setting up. This may take a few minutes.
                Please refresh the page in a few minutes to see your applications.
              </p>
            </>
          ) : (
            <>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Applications Found</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You haven't submitted any seller applications yet.
              </p>
              <Link
                href="/seller-center"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Apply to Become a Seller
              </Link>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Seller Applications</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">{applications.length} application{applications.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-4">
        {applications.map((app) => (
          <div key={app.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-900">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getStatusIcon(app.status)}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{app.businessName}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{app.businessType} Account</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                {getStatusText(app.status)}
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {app.businessDescription}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Submitted: {formatDate(app.submittedAt)}</span>
                </div>
                {app.documents && (
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{app.documents.length} document{app.documents.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>

            {app.notes && app.notes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Admin Notes:</h5>
                <div className="space-y-1">
                  {app.notes.map((note, index) => (
                    <p key={index} className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {note}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}