'use client';
import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStoreCognito';
import { checkAndFixUserAccountType } from '@/lib/applicationService';
import { toast } from 'sonner';
import { CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
export default function FixAccountPage() {
    const { user, userData } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const handleFixAccount = async () => {
        if (!user) {
            toast.error('Please login first');
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            console.log('🔍 Starting account fix process for user:', user.sub);
            const wasFixed = await checkAndFixUserAccountType(user.sub);
            if (wasFixed) {
                setResult('Account type has been successfully updated!');
                toast.success('Account type updated successfully!');
                // Refresh the auth store to reflect changes
                setTimeout(() => {
                    useAuthStore.getState().refreshUserData();
                }, 500);
            }
            else {
                setResult('Your account already has the correct type.');
                toast.info('Your account already has the correct type.');
            }
        }
        catch (error) {
            console.error('Error fixing account:', error);
            setResult('Failed to update account type. Please try again.');
            toast.error('Failed to update account type. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    if (!user) {
        return (<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full text-center border border-white/20">
          <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4"/>
          <h1 className="text-2xl font-bold text-white mb-4">Please Login</h1>
          <p className="text-purple-200 mb-6">
            You need to be logged in to fix your account type.
          </p>
          <button onClick={() => window.location.href = '/auth-login'} className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-600 hover:to-indigo-600 transition-all duration-300">
            Go to Login
          </button>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Fix Account Type</h1>
          <p className="text-purple-200">
            If your account was approved but the type didn't change, use this tool to fix it.
          </p>
        </div>

        <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">Current Account Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-purple-200 text-sm">User ID</p>
              <p className="text-white font-mono text-sm">{user.sub}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Current Role</p>
              <p className="text-white font-semibold">{(userData === null || userData === void 0 ? void 0 : userData.role) || 'Not set'}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Account Type</p>
              <p className="text-white font-semibold">{(userData === null || userData === void 0 ? void 0 : userData.accountType) || 'Not set'}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Verified Seller</p>
              <p className="text-white font-semibold">
                {(userData === null || userData === void 0 ? void 0 : userData.isVerifiedSeller) ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
          <ul className="space-y-2 text-purple-200">
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              <span>Checks if you have an approved application</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              <span>Verifies your current account type matches your approved application</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              <span>Updates your account type if there's a mismatch</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleFixAccount} disabled={loading} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center">
            {loading ? (<>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin"/>
                Fixing Account...
              </>) : (<>
                <CheckCircle className="w-5 h-5 mr-2"/>
                Fix My Account
              </>)}
          </button>
          
          <button onClick={() => window.location.href = '/'} className="px-6 py-4 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all duration-300 border border-white/20">
            Go Home
          </button>
        </div>

        {result && (<div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2"/>
              <span className="text-green-200">{result}</span>
            </div>
          </div>)}

        <div className="mt-6 text-center text-sm text-purple-300">
          <p>
            After fixing your account, you may need to refresh the page to see the changes.
          </p>
        </div>
      </div>
    </div>);
}

