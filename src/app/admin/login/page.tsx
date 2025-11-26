'use client'

import React, { useState } from 'react'
import { useAuthStore } from '@/store/authStoreCognito'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from '@/lib/firebaseAuth'
import { auth } from '@/lib/firebase'
import { toast } from 'sonner'
import { Shield, Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { user, loading: authLoading } = useAuthStore()
  const router = useRouter()

  // Check if user is already logged in as admin
  React.useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    if (user) {
      // Check if admin using email
      const ADMIN_EMAILS = ['mobiletesting736@gmail.com'];
      const userEmail = user.email || '';
      const isAdmin = ADMIN_EMAILS.includes(userEmail);
      
      if (isAdmin) {
        console.log('✅ Admin already logged in, redirecting to dashboard');
        router.replace('/admin');
      } else {
        console.log('❌ Non-admin user, redirecting to home');
        router.replace('/');
      }
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const loggedInUser = userCredential.user

      // Check if admin using email
      const ADMIN_EMAILS = ['mobiletesting736@gmail.com'];
      const userEmail = loggedInUser.email || '';
      const isAdmin = ADMIN_EMAILS.includes(userEmail);

      if (!isAdmin) {
        // Don't show any error message, just redirect silently
        console.log('❌ Non-admin login attempt');
        router.replace('/');
        return;
      }

      console.log('✅ Admin login successful');
      toast.success('Admin login successful');
      router.replace('/admin');
    } catch (error: any) {
      console.error('Admin login error:', error)
      toast.error(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // Show login form only if not logged in
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // If user is logged in, useEffect will handle redirect
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-full">
            <Shield className="w-12 h-12 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
          Admin Portal
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Secure access for administrators only
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
