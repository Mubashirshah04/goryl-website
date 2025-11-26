'use client';

/**
 * Business Seller KYC Form
 * Complete verification form for registered companies/stores
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStoreCognito';
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  FileImage,
  Loader2,
  Building
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { createBusinessKYC, validateCNIC } from '@/lib/kycService';
import { BusinessKYCFormData } from '@/types/kyc';

export default function BusinessKYCPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const searchParams = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return null;
  }, []);
  const applicationId = searchParams?.get('applicationId');
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingApplication, setLoadingApplication] = useState(!!applicationId);
  const [formData, setFormData] = useState<BusinessKYCFormData>({
    fullName: '',
    businessName: '',
    email: user?.email || '',
    phone: '',
    businessRegistrationId: '',
    fbrNTN: '',
    businessLicenseFile: null,
    taxCertificateFile: null,
    cnic: '',
    cnicFrontFile: null,
    cnicBackFile: null,
    address: {
      street: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Pakistan'
    },
    bankName: '',
    bankAccountNumber: '',
    bankAccountTitle: '',
    iban: ''
  });

  const totalSteps = 5;

  // Fetch application data if applicationId is provided
  useEffect(() => {
    if (applicationId && user?.sub) {
      const fetchApplicationData = async () => {
        try {
          const { doc, getDoc } = await import('@/lib/firestore');
          const { db } = await import('@/lib/firebase');
          const appDoc = await getDoc(doc(db, 'applications', applicationId));
          
          if (appDoc.exists()) {
            const appData = appDoc.data();
            // Pre-fill form with application data
            setFormData(prev => ({
              ...prev,
              fullName: appData.user?.name || prev.fullName,
              businessName: appData.businessName || prev.businessName,
              email: appData.user?.email || user.email || prev.email,
              phone: appData.user?.phone || prev.phone,
            }));
          }
        } catch (error) {
          console.error('Error fetching application:', error);
        } finally {
          setLoadingApplication(false);
        }
      };
      fetchApplicationData();
    } else {
      setLoadingApplication(false);
    }
  }, [applicationId, user]);

  if (!user) {
    router.push('/auth-login');
    return null;
  }

  if (loadingApplication) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading application data...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleFileChange = (
    field: 'cnicFrontFile' | 'cnicBackFile' | 'businessLicenseFile' | 'taxCertificateFile',
    file: File | null
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.fullName || !formData.businessName || !formData.email || !formData.phone) {
          toast.error('Please fill all required fields');
          return false;
        }
        return true;
      case 2:
        if (!formData.businessRegistrationId && !formData.fbrNTN) {
          toast.error('Either Business Registration ID or FBR NTN is required');
          return false;
        }
        return true;
      case 3:
        const cnicValidation = validateCNIC(formData.cnic);
        if (!cnicValidation.isValid) {
          toast.error(cnicValidation.error || 'Invalid CNIC');
          return false;
        }
        if (!formData.cnicFrontFile || !formData.cnicBackFile) {
          toast.error('Please upload both CNIC front and back images');
          return false;
        }
        return true;
      case 4:
        if (!formData.address.street || !formData.address.city || !formData.address.province) {
          toast.error('Please fill complete address');
          return false;
        }
        return true;
      case 5:
        if (!formData.bankName || !formData.bankAccountNumber || !formData.bankAccountTitle) {
          toast.error('Please fill all bank details');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (!user?.sub || !user?.email) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const kycId = await createBusinessKYC(formData, user.sub, user.email);
      
      // Link KYC to application if applicationId exists
      if (applicationId) {
        try {
          const { doc, updateDoc } = await import('@/lib/firestore');
          const { db } = await import('@/lib/firebase');
          await updateDoc(doc(db, 'applications', applicationId), {
            kycId: kycId,
            kycStatus: 'pending',
            updatedAt: new Date()
          });
        } catch (err) {
          console.error('Error linking KYC to application:', err);
        }
      }
      
      toast.success('KYC submitted successfully! Pending admin review.');
      router.push(`/seller-kyc/status?kycId=${kycId}${applicationId ? '&applicationId=' + applicationId : ''}`);
    } catch (error: any) {
      console.error('KYC submission error:', error);
      toast.error(error.message || 'Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  // File Upload Component
  const FileUploadField = ({
    label,
    accept,
    value,
    onChange,
    required = false
  }: {
    label: string;
    accept: string;
    value: File | null;
    onChange: (file: File | null) => void;
    required?: boolean;
  }) => {
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) {
        onChange(null);
        return;
      }
      onChange(files[0]);
    };

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-500 transition-colors">
          <div className="space-y-1 text-center w-full">
            {!value ? (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                    <span>Upload file</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept={accept}
                      onChange={handleFileSelect}
                      required={required}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileImage className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-700">{value.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(value.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Change File
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/seller-kyc"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Business Seller KYC Verification
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Complete all steps to verify your business account</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Information</h2>
                <p className="text-gray-600 dark:text-gray-300">Enter your business and contact details</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Owner/Director Full Name (As per CNIC) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter full name as shown on CNIC"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="+92 300 1234567"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Business Registration */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Registration</h2>
                <p className="text-gray-600 dark:text-gray-300">Enter your business registration details</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Tier 3 Verification</p>
                    <p>
                      Providing FBR NTN and Business Registration ID will automatically qualify you for Tier 3 (Professional Seller) status.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Registration ID
                </label>
                <input
                  type="text"
                  value={formData.businessRegistrationId}
                  onChange={(e) => handleInputChange('businessRegistrationId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Registration number from SECP/Registrar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  FBR NTN (Pakistan) <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fbrNTN}
                  onChange={(e) => handleInputChange('fbrNTN', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="1234567-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Federal Board of Revenue National Tax Number (if applicable)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileUploadField
                  label="Business License"
                  accept="image/*,.pdf"
                  value={formData.businessLicenseFile}
                  onChange={(file) => handleFileChange('businessLicenseFile', file)}
                />
                <FileUploadField
                  label="Tax Certificate"
                  accept="image/*,.pdf"
                  value={formData.taxCertificateFile}
                  onChange={(file) => handleFileChange('taxCertificateFile', file)}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> At least one of Business Registration ID or FBR NTN is required.
                  Uploading both documents along with business license will grant you Tier 3 status.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: CNIC Documents */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Owner CNIC Documents</h2>
                <p className="text-gray-600 dark:text-gray-300">Upload CNIC of business owner/director</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CNIC Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cnic}
                  onChange={(e) => handleInputChange('cnic', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="12345-1234567-1"
                  maxLength={15}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Format: XXXXX-XXXXXXX-X</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileUploadField
                  label="CNIC Front Image"
                  accept="image/*"
                  value={formData.cnicFrontFile}
                  onChange={(file) => handleFileChange('cnicFrontFile', file)}
                  required
                />
                <FileUploadField
                  label="CNIC Back Image"
                  accept="image/*"
                  value={formData.cnicBackFile}
                  onChange={(file) => handleFileChange('cnicBackFile', file)}
                  required
                />
              </div>
            </div>
          )}

          {/* Step 4: Address */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Address</h2>
                <p className="text-gray-600 dark:text-gray-300">Enter your registered business address</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.address.province}
                    onChange={(e) => handleInputChange('address.province', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Province</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                    <option value="Azad Kashmir">Azad Kashmir</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.address.postalCode}
                    onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.address.country}
                    onChange={(e) => handleInputChange('address.country', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Bank Details */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Bank Details</h2>
                <p className="text-gray-600 dark:text-gray-300">Enter your business bank account information</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountTitle}
                    onChange={(e) => handleInputChange('bankAccountTitle', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  IBAN (Optional)
                </label>
                <input
                  type="text"
                  value={formData.iban}
                  onChange={(e) => handleInputChange('iban', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="PK36 SCBL 0000 0011 2345 6702"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-shadow"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit KYC'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


