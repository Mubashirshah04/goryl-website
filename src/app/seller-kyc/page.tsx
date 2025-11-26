'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStoreCognito';
import { Store, Palette, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { SellerCategory } from '@/types/kyc';

export default function SellerKYCPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<SellerCategory | null>(null);

  if (!user) {
    router.push('/auth-login');
    return null;
  }

  const handleCategorySelect = (category: SellerCategory) => {
    setSelectedCategory(category);
    // Navigate to appropriate KYC form
    if (category === 'artisan') {
      router.push('/seller-kyc/artisan');
    } else {
      router.push('/seller-kyc/business');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Seller Verification (KYC)
            </h1>
            <p className="text-gray-600 text-lg">
              Choose your seller category to begin verification
            </p>
          </div>

          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">KYC Verification Required</p>
                <p>
                  To start selling on Zaillisy, you must complete KYC verification. 
                  Choose the category that best describes your business type.
                </p>
              </div>
            </div>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Artisan Seller */}
            <div
              onClick={() => handleCategorySelect('artisan')}
              className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Artisan Seller
              </h3>
              <p className="text-gray-600 mb-4 text-center">
                Handmade / Individual Creator
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Create handmade products
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Home studio or small shop
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Individual creator/artist
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Etsy-style marketplace
                </li>
              </ul>
              <div className="mt-6 text-center">
                <span className="inline-block px-4 py-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-lg font-semibold group-hover:shadow-md transition-shadow">
                  Select Artisan
                </span>
              </div>
            </div>

            {/* Business Seller */}
            <div
              onClick={() => handleCategorySelect('business')}
              className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Store className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Business Seller
              </h3>
              <p className="text-gray-600 mb-4 text-center">
                Company or Registered Store
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Registered company/store
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Business license
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  FBR NTN (Pakistan)
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Multiple products/categories
                </li>
              </ul>
              <div className="mt-6 text-center">
                <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-400 to-indigo-400 text-white rounded-lg font-semibold group-hover:shadow-md transition-shadow">
                  Select Business
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-gray-600 dark:text-gray-300">
              Need help?{' '}
              <Link href="/support" className="text-purple-600 hover:text-purple-700 font-semibold">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

