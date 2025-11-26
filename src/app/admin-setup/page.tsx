'use client'

import React, { useState } from 'react'
import { useAuthStore } from '@/store/authStoreCognito'
// ✅ AWS DYNAMODB - Firestore removed
// ✅ AWS - Using AWS services
import { toast } from 'sonner'
import { Shield, User, CheckCircle, AlertTriangle } from 'lucide-react'

export default function AdminSetupPage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [userExists, setUserExists] = useState<boolean | null>(null)

  const checkUserRole = async () => {
    if (!user) {
      toast.error('Please login first')
      return
    }

    setLoading(true)
    try {
      const userDoc = await getDoc(doc(db, 'users', user.sub))
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        setUserRole(userData.role || 'no-role')
        setUserExists(true)
        toast.success(`Current role: ${userData.role || 'No role set'}`)
      } else {
        setUserExists(false)
        setUserRole('')
        toast.info('User document not found in Firestore')
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      toast.error('Failed to check user role')
    } finally {
      setLoading(false)
    }
  }

  const createUserDocument = async () => {
    if (!user) {
      toast.error('Please login first')
      return
    }

    setLoading(true)
    try {
      await setDoc(doc(db, 'users', user.sub), {
        uid: user.sub,
        email: user.email,
        name: user.displayName || 'Unknown',
        role: 'user',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      setUserExists(true)
      setUserRole('user')
      toast.success('User document created successfully')
    } catch (error) {
      console.error('Error creating user document:', error)
      toast.error('Failed to create user document')
    } finally {
      setLoading(false)
    }
  }

  const setAdminRole = async () => {
    if (!user) {
      toast.error('Please login first')
      return
    }

    setLoading(true)
    try {
      await updateDoc(doc(db, 'users', user.sub), {
        role: 'admin',
        isVerified: true,
        updatedAt: new Date()
      })
      
      setUserRole('admin')
      toast.success('Admin role set successfully! You can now access admin pages.')
    } catch (error) {
      console.error('Error setting admin role:', error)
      toast.error('Failed to set admin role')
    } finally {
      setLoading(false)
    }
  }

  const removeAdminRole = async () => {
    if (!user) {
      toast.error('Please login first')
      return
    }

    setLoading(true)
    try {
      await updateDoc(doc(db, 'users', user.sub), {
        role: 'user',
        updatedAt: new Date()
      })
      
      setUserRole('user')
      toast.success('Admin role removed successfully')
    } catch (error) {
      console.error('Error removing admin role:', error)
      toast.error('Failed to remove admin role')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please login first</h1>
          <p className="text-gray-600 dark:text-gray-300">You need to be authenticated to access admin setup</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Setup</h1>
            <p className="text-gray-600 dark:text-gray-300">Configure admin privileges for testing</p>
          </div>

          {/* Current User Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current User</h2>
            <div className="space-y-2 text-sm">
              <p><strong>UID:</strong> {user.sub}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Name:</strong> {user.displayName || 'Not set'}</p>
              <p><strong>User Exists:</strong> {userExists === null ? 'Unknown' : userExists ? 'Yes' : 'No'}</p>
              <p><strong>Current Role:</strong> {userRole || 'Unknown'}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={checkUserRole}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <User className="w-4 h-4" />
              <span>{loading ? 'Checking...' : 'Check Current Role'}</span>
            </button>

            {userExists === false && (
              <button
                onClick={createUserDocument}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{loading ? 'Creating...' : 'Create User Document'}</span>
              </button>
            )}

            {userExists && userRole !== 'admin' && (
              <button
                onClick={setAdminRole}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Shield className="w-4 h-4" />
                <span>{loading ? 'Setting...' : 'Set Admin Role'}</span>
              </button>
            )}

            {userExists && userRole === 'admin' && (
              <button
                onClick={removeAdminRole}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{loading ? 'Removing...' : 'Remove Admin Role'}</span>
              </button>
            )}
          </div>

          {/* Status Messages */}
          {userRole === 'admin' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Admin access granted!</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                You can now access <a href="/admin/applications" className="underline">admin applications page</a>
              </p>
            </div>
          )}

          {userRole === 'user' && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-medium">Regular user access</span>
              </div>
              <p className="text-blue-700 text-sm mt-1">
                You can access user features but not admin pages
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Navigation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/admin/applications"
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>Admin Applications</span>
              </a>
              <a
                href="/test-applications"
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>My Applications</span>
              </a>
              <a
                href="/become-seller"
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Become a Seller</span>
              </a>
              <a
                href="/"
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span>Home</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


