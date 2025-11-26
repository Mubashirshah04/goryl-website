'use client';

import React from 'react';
import Link from 'next/link';
import { Store, ArrowLeft, ArrowRight } from 'lucide-react';

export default function BrandRegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/register" className="inline-flex items-center text-purple-600 hover:text-purple-500 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to account types
            </Link>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Brand Account</h1>
            <p className="text-gray-600 dark:text-gray-300">For established brands and retailers</p>
          </div>

          {/* Features */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Brand Account Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Brand Verification</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Get verified brand status and badge</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Marketing Tools</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Advanced marketing and promotion features</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Customer Insights</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Detailed customer analytics and behavior</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Brand Protection</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Protect your brand from counterfeit products</p>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Requirements for Brand Account</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Established brand with trademark registration</li>
              <li>• Brand verification documents</li>
              <li>• Business registration certificate</li>
              <li>• Brand logo and visual assets</li>
              <li>• Product catalog or portfolio</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link href="/become-seller?type=brand">
              <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center justify-center">
                Apply for Brand Account
                <ArrowRight className="w-5 h-5 ml-2" />
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
    </div>
  );
}
