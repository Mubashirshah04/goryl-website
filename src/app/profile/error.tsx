'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function ProfileError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 space-y-4 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Something went wrong!</h2>
        
        <p className="text-gray-600 dark:text-gray-300">
          We couldn't load the profile page. This might be due to a network issue or the profile not existing.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 text-left">
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Error details:</p>
          <p className="text-xs text-red-600 mt-1">{error.message}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Home className="mr-2 h-4 w-4" />
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}