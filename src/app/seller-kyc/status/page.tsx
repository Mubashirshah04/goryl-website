'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStoreCognito';
import { CheckCircle, Clock, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getKYCById } from '@/lib/kycService';
import { SellerKYC, KYCStatus } from '@/types/kyc';

function KYCStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [kyc, setKYC] = useState<SellerKYC | null>(null);
  const [loading, setLoading] = useState(true);
  const kycId = searchParams?.get('kycId');

  useEffect(() => {
    if (!user) {
      router.push('/auth-login');
      return;
    }

    const fetchKYC = async () => {
      if (!kycId) {
        setLoading(false);
        return;
      }

      try {
        const kycData = await getKYCById(kycId);
        setKYC(kycData);
      } catch (error) {
        console.error('Error fetching KYC:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKYC();
  }, [kycId, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading KYC status...</p>
        </div>
      </div>
    );
  }

  if (!kyc) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">KYC Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Could not find your KYC application.</p>
          <Link
            href="/seller-kyc"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Start New KYC
          </Link>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: KYCStatus) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: KYCStatus) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusMessage = (status: KYCStatus) => {
    switch (status) {
      case 'verified':
        return {
          title: 'KYC Verified! 🎉',
          message: 'Your seller account has been verified. You can now start selling on Zaillisy.',
          action: 'Go to Seller Dashboard'
        };
      case 'rejected':
        return {
          title: 'KYC Rejected',
          message: kyc.rejectionReason || 'Your KYC application was rejected. Please review and resubmit.',
          action: 'Resubmit KYC'
        };
      case 'pending':
      default:
        return {
          title: 'KYC Under Review',
          message: 'Your KYC application is being reviewed by our team. This usually takes 1-3 business days.',
          action: 'Check Status Later'
        };
    }
  };

  const statusMessage = getStatusMessage(kyc.status);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Verification Status</h1>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-center mb-6">
            {getStatusIcon(kyc.status)}
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {statusMessage.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{statusMessage.message}</p>
            
            <div className={`inline-flex items-center px-4 py-2 rounded-lg border ${getStatusColor(kyc.status)}`}>
              <span className="font-semibold capitalize">{kyc.status}</span>
            </div>
          </div>

          {/* KYC Details */}
          <div className="border-t pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Category</p>
                <p className="font-semibold capitalize">{kyc.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Verification Tier</p>
                <p className="font-semibold capitalize">
                  Tier {kyc.tier.slice(-1)} - {kyc.tier === 'tier1' ? 'Basic' : kyc.tier === 'tier2' ? 'Verified Artisan' : 'Professional'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Submitted</p>
                <p className="font-semibold">
                  {kyc.submittedAt?.toLocaleDateString() || 'N/A'}
                </p>
              </div>
              {kyc.verifiedAt && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Verified</p>
                  <p className="font-semibold">
                    {kyc.verifiedAt.toLocaleDateString()}
                  </p>
                </div>
              )}
              {kyc.rejectedAt && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Rejected</p>
                  <p className="font-semibold">
                    {kyc.rejectedAt.toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {kyc.remarks && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-1">Admin Remarks</p>
                <p className="text-sm text-blue-800">{kyc.remarks}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {kyc.status === 'verified' ? (
              <Link
                href="/seller/dashboard"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg text-center font-semibold transition-shadow"
              >
                {statusMessage.action}
              </Link>
            ) : kyc.status === 'rejected' ? (
              <Link
                href="/seller-kyc"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg text-center font-semibold transition-shadow"
              >
                {statusMessage.action}
              </Link>
            ) : (
              <div className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-lg text-center font-semibold">
                {statusMessage.action}
              </div>
            )}
            
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-center font-semibold transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

        {/* Info Box */}
        {kyc.status === 'pending' && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">What happens next?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Our team will review your submitted documents</li>
                  <li>CNIC verification and fraud checks will be performed</li>
                  <li>Product proof will be manually reviewed</li>
                  <li>You'll receive an email once the review is complete</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KYCStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading KYC status...</p>
        </div>
      </div>
    }>
      <KYCStatusContent />
    </Suspense>
  );
}
