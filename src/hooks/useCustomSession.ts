'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  role: string;
  image?: string;
}

interface Session {
  user: User;
  expires: string;
}

// Load session synchronously on initial render
function getInitialSession(): { session: Session | null; status: 'loading' | 'authenticated' | 'unauthenticated' } {
  if (typeof window === 'undefined') {
    return { session: null, status: 'unauthenticated' };
  }

  try {
    const storedSession = localStorage.getItem('session');
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      if (parsedSession.user) {
        const user = parsedSession.user;
        
        // Add username if missing
        if (!user.username && user.name) {
          user.username = user.name.toLowerCase().replace(/\s+/g, '');
        } else if (!user.username && user.email) {
          user.username = user.email.split('@')[0];
        }
        
        console.log('✅ Session loaded synchronously:', { 
          userId: user.id, 
          username: user.username,
          name: user.name,
          email: user.email 
        });
        
        return { 
          session: { ...parsedSession, user }, 
          status: 'authenticated' 
        };
      }
    }
  } catch (error) {
    console.error('Session load error:', error);
  }

  return { session: null, status: 'unauthenticated' };
}

export function useSession() {
  // Load session synchronously on first render
  const initial = getInitialSession();
  const [session, setSession] = useState<Session | null>(initial.session);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>(initial.status);

  useEffect(() => {
    // This effect is just for future updates, initial load is already done
    if (typeof window === 'undefined') {
      return;
    }
    
    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'session') {
        const newSession = getInitialSession();
        setSession(newSession.session);
        setStatus(newSession.status);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Always return a valid object, even during SSR
  return {
    data: session,
    status,
  };
}

// Alias for backwards compatibility
export function useCustomSession() {
  const { data, status } = useSession();
  return {
    session: data?.user ? {
      userId: data.user.id,
      username: data.user.username,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      picture: data.user.image
    } : null,
    status
  };
}

export async function signOut() {
  try {
    // Call Firebase Function signout
    await fetch('/api/auth/signout', {
      method: 'POST',
      credentials: 'include',
    });

    // Clear local storage
    localStorage.clear();

    // Redirect to home
    window.location.href = '/';
  } catch (error) {
    console.error('Sign out error:', error);
    // Force redirect anyway
    window.location.href = '/';
  }
}
