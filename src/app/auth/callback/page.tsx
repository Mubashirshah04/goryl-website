'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStoreCognito';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const initialize = useAuthStore((state) => state.initialize);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get params from URL search params (client-side only)
        if (typeof window === 'undefined') return;
        
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const errorParam = params.get('error');
        const errorDescription = params.get('error_description');

        // Handle OAuth errors
        if (errorParam) {
          console.error('OAuth error:', errorParam, errorDescription);
          setError(errorDescription || errorParam);
          setLoading(false);
          setTimeout(() => {
            router.push(`/auth-login?error=${encodeURIComponent(errorDescription || errorParam)}`);
          }, 2000);
          return;
        }

        if (!code) {
          setError('No authorization code received');
          setLoading(false);
          setTimeout(() => {
            router.push('/auth-login?error=No authorization code received');
          }, 2000);
          return;
        }

        console.log('✅ OAuth authorization code received, exchanging for tokens...');

        // Get the redirect URI (must match what was used in the initial request)
        const redirectUri = `${window.location.origin}/auth/callback`;

        // Exchange authorization code for tokens
        const response = await fetch('/api/auth/oauth-callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirectUri,
          }),
        });

        // Check content type before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('❌ Non-JSON response received:', text.substring(0, 200));
          throw new Error(`Server returned ${response.status}: ${response.statusText}. Check if callback URL is configured in Cognito.`);
        }

        if (!response.ok) {
          const errorData = await response.json().catch((e) => {
            console.error('Error parsing error response:', e);
            return { error: `Token exchange failed: ${response.status} ${response.statusText}` };
          });
          throw new Error(errorData.error || errorData.error_description || 'Token exchange failed');
        }

        const data = await response.json();

        if (!data.success || !data.AccessToken || !data.IdToken) {
          throw new Error('Invalid token response');
        }

        console.log('✅ Tokens received, storing in localStorage...');

        // Store tokens in localStorage
        localStorage.setItem('cognito_access_token', data.AccessToken);
        localStorage.setItem('cognito_id_token', data.IdToken);
        if (data.RefreshToken) {
          localStorage.setItem('cognito_refresh_token', data.RefreshToken);
        }

        console.log('✅ Tokens stored, initializing auth store...');

        // Initialize auth store to fetch full user data
        await initialize();

        console.log('✅ Auth initialized, redirecting to home...');

        // Redirect to home page
        router.push('/');
        router.refresh();
      } catch (err: any) {
        console.error('❌ OAuth callback error:', err);
        setError(err.message || 'Authentication failed');
        setLoading(false);
        setTimeout(() => {
          router.push(`/auth-login?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
        }, 3000);
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, initialize]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Completing sign in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">❌ Error</div>
          <p className="text-white mb-4">{error}</p>
          <p className="text-gray-400 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return null;
}


