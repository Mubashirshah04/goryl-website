'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { resetPassword } from '@/lib/auth';
import { toast } from 'sonner';
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await resetPassword(email);
            setSuccess(true);
            toast.success('Password reset email sent! Check your inbox.');
        }
        catch (error) {
            setError(error.message || 'Failed to send reset email');
            toast.error(error.message || 'Failed to send reset email');
        }
        finally {
            setLoading(false);
        }
    };
    if (success) {
        return (<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md mx-auto px-4">
          <div className="w-40 h-40 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-xl border border-white/20">
            <CheckCircle className="w-24 h-24 text-green-300"/>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Check your email
          </h1>
          <p className="text-purple-200 text-xl mb-8 leading-relaxed">
            We've sent a password reset link to <strong className="text-white">{email}</strong>
          </p>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 mb-8 shadow-2xl">
            <p className="text-purple-200 text-lg mb-6">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSuccess(false)} className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-8 py-4 rounded-2xl hover:from-purple-600 hover:to-fuchsia-600 transition-all duration-300 shadow-2xl font-bold text-lg">
              Try again
            </motion.button>
          </div>

          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-white/10 text-white px-8 py-4 rounded-2xl hover:bg-white/20 transition-all duration-300 border border-white/20 backdrop-blur-sm font-bold text-lg inline-flex items-center space-x-3">
            <Link href="/auth-login" className="flex items-center space-x-3">
              <ArrowLeft className="w-6 h-6"/>
              <span>Back to sign in</span>
            </Link>
          </motion.button>
        </motion.div>
      </div>);
    }
    return (<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md mx-auto px-4">
        <div className="w-40 h-40 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-xl border border-white/20">
          <Mail className="w-24 h-24 text-purple-300"/>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
          Reset your password
        </h1>
        <p className="text-purple-200 text-xl mb-8 leading-relaxed">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-purple-200 font-bold text-lg mb-3">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300" size={20}/>
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm text-lg" placeholder="Enter your email"/>
              </div>
            </div>

            {error && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center space-x-3 p-4 bg-red-500/20 rounded-2xl border border-red-500/30">
                <AlertCircle className="w-5 h-5 text-red-400"/>
                <span className="text-red-300 text-lg">{error}</span>
              </motion.div>)}

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white py-4 px-6 rounded-2xl font-bold text-lg hover:from-purple-600 hover:to-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-2xl">
              {loading ? 'Sending...' : 'Send reset link'}
            </motion.button>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-white/10 text-white px-8 py-4 rounded-2xl hover:bg-white/20 transition-all duration-300 border border-white/20 backdrop-blur-sm font-bold text-lg inline-flex items-center space-x-3">
            <Link href="/auth-login" className="flex items-center space-x-3">
              <ArrowLeft className="w-6 h-6"/>
              <span>Back to sign in</span>
            </Link>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>);
}
