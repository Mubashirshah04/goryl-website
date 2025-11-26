'use client';

import { use, useEffect, useState } from 'react';
import ProfilePageClient from '../profile-client-fixed';
import { ProfileProvider } from '@/contexts/ProfileContext';

export default function ProfileIdPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const [isClient, setIsClient] = useState(false);
  
  // Unwrap params using React.use() for Next.js 15 compatibility
  // If params is already an object, Promise.resolve will keep it as is
  // If params is a Promise, use() will unwrap it
  const resolvedParams = use(params instanceof Promise ? params : Promise.resolve(params));
  const identifier = resolvedParams?.id || '';
  
  // Try username first (Firebase UIDs are typically 28 characters)
  // If identifier is less than 28 chars and doesn't look like a UID, treat as username
  // Otherwise, try as UID
  const isLikelyUsername = identifier && identifier.length < 28 && !identifier.includes(' ') && identifier.trim() !== '';
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !identifier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <ProfileProvider>
      <ProfilePageClient 
        username={isLikelyUsername ? identifier : undefined} 
        uid={!isLikelyUsername ? identifier : undefined} 
      />
    </ProfileProvider>
  );
}
