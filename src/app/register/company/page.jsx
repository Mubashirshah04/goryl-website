'use client';
import React from 'react';
import Link from 'next/link';
import { Building, ArrowLeft, ArrowRight } from 'lucide-react';
export default function CompanyRegisterPage() {
    return (<div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/register" className="inline-flex items-center text-purple-600 hover:text-purple-500 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2"/>
              Back to account types
            </Link>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl mb-4">
              <Building className="w-8 h-8 text-white"/>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Account</h1>
            <p className="text-gray-600 dark:text-gray-300">For businesses and enterprises</p>
          </div>

          {/* Features */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Company Account Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Multiple Brand Management</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Manage multiple brands under one account</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Advanced Analytics</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Detailed insights and performance metrics</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Team Collaboration</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Invite team members and manage permissions</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Priority Support</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Dedicated support for business accounts</p>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Requirements for Company Account</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Valid business registration documents</li>
              <li>• Company tax identification number</li>
              <li>• Business bank account</li>
              <li>• KYC verification documents</li>
              <li>• Company logo and branding materials</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link href="/become-seller?type=company">
              <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center justify-center">
                Apply for Company Account
                <ArrowRight className="w-5 h-5 ml-2"/>
              </button>
            </Link>
            
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-300">
                Already have an account?{' '}
                <Link href="/auth-login" className="text-purple-600 hover:text-purple-500 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
