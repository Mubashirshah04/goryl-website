"use client";

import { useSearchParams, useRouter } from "next/navigation";
import ProfilePageClient from "./profile-client-fixed";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useCustomSession";

// Force dynamic rendering - don't prerender this page
export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  // Client-side mounting check to avoid hydration issues
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const authLoading = status === 'loading';

  // Use effect to mark component as mounted after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only run this code on the client side after mounting
  const searchParams = useSearchParams();
  const uid = searchParams?.get("uid")?.trim() || "";
  const username = searchParams?.get("username")?.trim() || "";

  // If no identifier provided and user is logged in, use their ID
  useEffect(() => {
    // Wait for auth to finish loading before redirecting
    if (isMounted && !authLoading && !uid && !username) {
      // Check if user is logged in
      if (!user?.id && !user?.email) {
        console.log('❌ No user found, redirecting to login');
        router.replace('/auth-login');
      } else {
        console.log('✅ User found, showing profile:', { userId: user.id, email: user.email });
      }
    }
  }, [isMounted, uid, username, user?.id, user?.email, authLoading, router]);

  console.log("Profile page rendering with uid/username from query:", { uid, username });

  // Show loading UI during hydration or auth check
  if (!isMounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em]"></div>
          <p className="mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Pass user ID if no uid/username provided
  // Use email as fallback if id is not available
  const effectiveUid = uid || username || user?.id || user?.email || '';

  console.log('Profile page effectiveUid:', effectiveUid);

  return (
    <ProfileProvider>
      <ProfilePageClient uid={effectiveUid} username={username} />
    </ProfileProvider>
  );
}

