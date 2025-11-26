'use client';

import React, { useState } from 'react';
import { sendTestEmail } from '@/lib/testEmail';
import { toast } from 'sonner';

export default function TestEmailPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTestEmail = async () => {
    setLoading(true);
    try {
      const result = await sendTestEmail();
      setResult(result);
      
      if (result.success) {
        toast.success('✅ Test email sent! Check your Gmail inbox in 1-2 minutes');
      } else {
        toast.error('❌ Failed to send test email');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('❌ Error sending test email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📧</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Test Email System
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Test if Firebase email extension is working
          </p>
        </div>

        <button
          onClick={handleTestEmail}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 hover:shadow-lg'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Sending...</span>
            </div>
          ) : (
            '📧 Send Test Email'
          )}
        </button>

        {result && (
          <div className={`mt-6 p-4 rounded-xl ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`font-semibold mb-2 ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? '✅ Success!' : '❌ Error'}
            </h3>
            <p className={`text-sm ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.success 
                ? `Email queued with ID: ${result.emailId}. Check your Gmail inbox!`
                : `Error: ${result.error?.message || 'Unknown error'}`
              }
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
            Make sure Firebase email extension is installed and configured
          </p>
        </div>
      </div>
    </div>
  );
}
