'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStoreCognito';
import { useUserProfileStore } from '@/store/userProfileStore';
import { Upload, ArrowLeft, Package, Video, FileText, Plus, Image as ImageIcon, ShoppingBag, Store, Building2 } from 'lucide-react';
import { toast } from 'sonner';
export default function UploadPage() {
    const { user, loading: authLoading, refreshUserData } = useAuthStore();
    const { profile, loading: profileLoading, fetchProfile } = useUserProfileStore();
    const router = useRouter();
    const hasRun = useRef(false); // Ref to prevent multiple executions
    const [isSeller, setIsSeller] = useState(false);
    useEffect(() => {
        // Wait for auth state to be determined
        if (authLoading)
            return;
        // Prevent multiple executions
        if (hasRun.current)
            return;
        if (!user) {
            router.push('/auth-login');
            return;
        }
        // Mark as run
        hasRun.current = true;
        // Only run this effect once when user is authenticated
        const checkSellerStatus = async () => {
            try {
                // Fetch profile without forcing refresh to avoid loading state issues
                await fetchProfile(user.sub);
            }
            catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('Error loading profile information');
            }
        };
        checkSellerStatus();
    }, [user === null || user === void 0 ? void 0 : user.sub, authLoading, router]); // FIXED: removed fetchProfile from deps to prevent infinite loop
    useEffect(() => {
        if (profile) {
            // Include all seller account types - personal, brand, and company
            const sellerRoles = ['personal_seller', 'brand', 'company'];
            setIsSeller(sellerRoles.includes(profile.role));
            if (!sellerRoles.includes(profile.role)) {
                toast.error('Only sellers can access the upload page');
                router.push('/');
            }
        }
    }, [profile, router]);
    const uploadOptions = [
        {
            title: 'Upload Product',
            description: 'Add a new product to your store',
            icon: Package,
            href: '/product/upload',
            color: 'bg-purple-500',
            hoverColor: 'hover:bg-purple-600'
        },
        {
            title: 'Upload Images',
            description: 'Add product images and galleries',
            icon: ImageIcon,
            href: '/upload/images',
            color: 'bg-blue-500',
            hoverColor: 'hover:bg-blue-600'
        },
        {
            title: 'Upload Video',
            description: 'Create product videos and reels',
            icon: Video,
            href: '/upload/video',
            color: 'bg-red-500',
            hoverColor: 'hover:bg-red-600'
        },
        {
            title: 'Upload Documents',
            description: 'Add product documentation',
            icon: FileText,
            href: '/upload/documents',
            color: 'bg-green-500',
            hoverColor: 'hover:bg-green-600'
        }
    ];
    // Show loading state while determining auth status
    if (authLoading || profileLoading) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Loading...</h1>
          <p className="text-gray-600 dark:text-gray-300">Checking your authentication status</p>
        </div>
      </div>);
    }
    if (!user) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please login first</h1>
          <p className="text-gray-600 dark:text-gray-300">You need to be authenticated to upload content</p>
        </div>
      </div>);
    }
    if (!isSeller) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Seller Access Required</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Only sellers can access the upload page</p>
          <Link href="/become-seller" className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2"/>
            Become a Seller
          </Link>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600"/>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Upload Content</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {(profile === null || profile === void 0 ? void 0 : profile.role) === 'brand' && 'Brand Account'}
                  {(profile === null || profile === void 0 ? void 0 : profile.role) === 'company' && 'Company Account'}
                  {(profile === null || profile === void 0 ? void 0 : profile.role) === 'personal_seller' && 'Personal Seller Account'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                {(profile === null || profile === void 0 ? void 0 : profile.role) === 'brand' && <Store className="w-4 h-4 text-purple-600"/>}
                {(profile === null || profile === void 0 ? void 0 : profile.role) === 'company' && <Building2 className="w-4 h-4 text-purple-600"/>}
                {(profile === null || profile === void 0 ? void 0 : profile.role) === 'personal_seller' && <ShoppingBag className="w-4 h-4 text-purple-600"/>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Options */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">What would you like to upload?</h2>
          <p className="text-gray-600 dark:text-gray-300">Choose the type of content you want to add to your store</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {uploadOptions.map((option, index) => {
            const Icon = option.icon;
            return (<Link key={index} href={option.href} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${option.color} ${option.hoverColor} transition-colors`}>
                    <Icon className="w-6 h-6 text-white"/>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                      {option.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {option.description}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180"/>
                  </div>
                </div>
              </Link>);
        })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Your Upload Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{(profile === null || profile === void 0 ? void 0 : profile.totalProducts) || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Videos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Documents</div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-purple-50 rounded-xl p-6">
          <h3 className="font-semibold text-purple-900 mb-3">Upload Tips</h3>
          <ul className="space-y-2 text-sm text-purple-800">
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
              <span>Use high-quality images (minimum 800x800px)</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
              <span>Add detailed product descriptions</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
              <span>Include multiple images from different angles</span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
              <span>Set competitive prices to attract buyers</span>
            </li>
          </ul>
        </div>
      </div>
    </div>);
}

