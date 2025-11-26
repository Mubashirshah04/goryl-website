'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStoreCognito';
import { useSession } from '@/hooks/useCustomSession';
import { useRouter } from 'next/navigation';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

// Admin emails from environment variable
const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { user: authUser, loading: authLoading } = useAuthStore();
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Try to get email from localStorage directly for immediate access
  const getStoredEmail = () => {
    if (typeof window === 'undefined') return null;
    try {
      const storedSession = localStorage.getItem('session');
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        return parsed?.user?.email || null;
      }
    } catch (e) {
      return null;
    }
    return null;
  };
  
  // Use session email if available, otherwise authUser email, otherwise localStorage
  const userEmail = session?.user?.email || authUser?.email || getStoredEmail();
  // Only consider loading if we don't have any email source
  const isLoading = !userEmail && (status === 'loading' || authLoading);
  
  // Debug logging
  console.log('🔍 AdminRouteGuard - Session Debug:', {
    hasSession: !!session,
    sessionUser: session?.user,
    sessionEmail: session?.user?.email,
    authUserEmail: authUser?.email,
    finalUserEmail: userEmail,
    adminEmails: ADMIN_EMAILS
  });

  useEffect(() => {
    console.log('🔍 AdminRouteGuard: Checking permissions...');
    console.log('  isLoading:', isLoading);
    console.log('  userEmail:', userEmail);
    console.log('  status:', status);
    console.log('  ADMIN_EMAILS:', ADMIN_EMAILS);
    
    // Wait for auth to load
    if (isLoading) {
      console.log('⏳ Waiting for auth to load...');
      return;
    }
    
    // If no user, redirect to home
    if (!userEmail) {
      console.log('❌ No user email found, redirecting to home');
      router.push('/');
      return;
    }
    
    // Check if user email is in admin list
    const isAdmin = isAdminEmail(userEmail);
    console.log('🔍 Checking admin status:', { email: userEmail, isAdmin });
    
    if (!isAdmin) {
      console.log('❌ Access denied. Email not in admin list');
      router.push('/');
      return;
    } else {
      console.log('✅ Admin access granted!');
    }
  }, [userEmail, isLoading, status, router]);

  // Show loading while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing if no user
  if (!userEmail) {
    return null;
  }

  // Check if user email is in admin list
  const isAdmin = isAdminEmail(userEmail);
  
  console.log('🔍 Final admin check:', {
    email: userEmail,
    isAdmin,
    adminEmails: ADMIN_EMAILS
  });
  
  // Allow access if user email is in admin list
  if (isAdmin) {
    console.log('✅ Admin access granted!');
    return <>{children}</>;
  }
  
  // Show access denied if not admin
  console.log('❌ Access denied. Email not in admin list');
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">Admin privileges required</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your email: {userEmail || 'Not set'}</p>
      </div>
    </div>
  );
}
