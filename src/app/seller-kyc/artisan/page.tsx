'use client';

/**
 * Artisan Seller KYC Form
 * Complete verification form for handmade/individual creators
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStoreCognito';
import {
  ArrowLeft,
  Upload,
  Camera,
  CheckCircle,
  AlertCircle,
  X,
  FileImage,
  FileVideo,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { createArtisanKYC, validateCNIC } from '@/lib/kycService';
import { ArtisanKYCFormData } from '@/types/kyc';

export default function ArtisanKYCPage() {
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
  const [formData, setFormData] = useState<ArtisanKYCFormData>({
    fullName: '',
    email: user?.email || '',
    phone: '',
    cnic: '',
    cnicFrontFile: null,
    cnicBackFile: null,
    selfieFile: null,
    address: {
      street: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Pakistan'
    },
    productionAddress: '',
    productProofFiles: [],
    productDescription: '',
    payoneerEmail: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountTitle: ''
  });

  const totalSteps = 7;

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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-purple-600 border-r-transparent"></div>
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

  const handleFileChange = (field: 'cnicFrontFile' | 'cnicBackFile' | 'selfieFile' | 'productProofFiles', file: File | File[] | null) => {
    if (field === 'productProofFiles') {
      setFormData(prev => ({
        ...prev,
        productProofFiles: Array.isArray(file) ? file : (file ? [...prev.productProofFiles, file] : [])
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: file as File | null
      }));
    }
  };

  const removeProductProof = (index: number) => {
    setFormData(prev => ({
      ...prev,
      productProofFiles: prev.productProofFiles.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.fullName || !formData.email || !formData.phone) {
          toast.error('Please fill all required fields');
          return false;
        }
        return true;
      case 2:
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
      case 3:
        if (!formData.selfieFile) {
          toast.error('Please upload a selfie with your CNIC');
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
        if (!formData.productionAddress) {
          toast.error('Please provide your production address');
          return false;
        }
        return true;
      case 6:
        if (formData.productProofFiles.length === 0) {
          toast.error('Please upload at least one product proof (video or photo)');
          return false;
        }
        if (!formData.productDescription) {
          toast.error('Please describe your products');
          return false;
        }
        return true;
      case 7:
        if (!formData.payoneerEmail) {
          toast.error('Payoneer email is required');
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
      const kycId = await createArtisanKYC(formData, user.sub, user.email);
      
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
    required = false,
    multiple = false
  }: {
    label: string;
    accept: string;
    value: File | File[] | null;
    onChange: (file: File | File[] | null) => void;
    required?: boolean;
    multiple?: boolean;
  }) => {
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      if (multiple) {
        onChange(Array.from(files));
      } else {
        onChange(files[0]);
      }
    };

    const files = multiple ? (Array.isArray(value) ? value : []) : (value ? [value] : []);

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-500 transition-colors">
          <div className="space-y-1 text-center w-full">
            {files.length === 0 ? (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                    <span>Upload {multiple ? 'files' : 'file'}</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept={accept}
                      onChange={handleFileSelect}
                      multiple={multiple}
                      required={required}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, MP4 up to 10MB</p>
              </>
            ) : (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {file.type.startsWith('video/') ? (
                        <FileVideo className="w-5 h-5 text-purple-600" />
                      ) : (
                        <FileImage className="w-5 h-5 text-purple-600" />
                      )}
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    {multiple && (
                      <button
                        type="button"
                        onClick={() => onChange(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Change {multiple ? 'Files' : 'File'}
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
            Artisan Seller KYC Verification
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Complete all steps to verify your account</p>
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
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
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
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
                <p className="text-gray-600 dark:text-gray-300">Enter your personal details</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name (As per CNIC) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter your full name as shown on CNIC"
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

          {/* Step 2: CNIC Documents */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">CNIC Documents</h2>
                <p className="text-gray-600 dark:text-gray-300">Upload your CNIC front and back images</p>
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

          {/* Step 3: Selfie with CNIC */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Selfie with CNIC</h2>
                <p className="text-gray-600 dark:text-gray-300">Take a selfie holding your CNIC clearly visible</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Instructions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Hold your CNIC next to your face</li>
                      <li>Make sure both your face and CNIC are clearly visible</li>
                      <li>Use good lighting</li>
                      <li>No filters or editing</li>
                    </ul>
                  </div>
                </div>
              </div>

              <FileUploadField
                label="Selfie with CNIC"
                accept="image/*"
                value={formData.selfieFile}
                onChange={(file) => handleFileChange('selfieFile', file)}
                required
              />
            </div>
          )}

          {/* Step 4: Address */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Address</h2>
                <p className="text-gray-600 dark:text-gray-300">Enter your residential address</p>
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

          {/* Step 5: Production Address */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Production Address</h2>
                <p className="text-gray-600 dark:text-gray-300">Where do you create/make your products?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Production Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.productionAddress}
                  onChange={(e) => handleInputChange('productionAddress', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Home studio, shop address, workshop location, etc."
                  required
                />
              </div>
            </div>
          )}

          {/* Step 6: Product Proof */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Proof</h2>
                <p className="text-gray-600 dark:text-gray-300">Show us your handmade products</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">What to upload:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Video of you making/creating the product (preferred)</li>
                      <li>Or 2-3 high-quality photos showing your products</li>
                      <li>Clear images showing the handmade nature</li>
                    </ul>
                  </div>
                </div>
              </div>

              <FileUploadField
                label="Product Proof (Videos or Photos)"
                accept="image/*,video/*"
                value={formData.productProofFiles}
                onChange={(files) => handleFileChange('productProofFiles', files)}
                required
                multiple
              />

              {formData.productProofFiles.length > 0 && (
                <div className="space-y-2">
                  {formData.productProofFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {file.type.startsWith('video/') ? (
                          <FileVideo className="w-5 h-5 text-purple-600" />
                        ) : (
                          <FileImage className="w-5 h-5 text-purple-600" />
                        )}
                        <span className="text-sm text-gray-700">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProductProof(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.productDescription}
                  onChange={(e) => handleInputChange('productDescription', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe what you create, your process, materials used, etc."
                  required
                />
              </div>
            </div>
          )}

          {/* Step 7: Payment Information */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Information</h2>
                <p className="text-gray-600 dark:text-gray-300">How you'll receive payments</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payoneer Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.payoneerEmail}
                  onChange={(e) => handleInputChange('payoneerEmail', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="your.email@example.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This email should be registered with your Payoneer account
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bank Details (Optional - for Tier 2 upgrade)</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={formData.bankAccountNumber}
                      onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Title
                    </label>
                    <input
                      type="text"
                      value={formData.bankAccountTitle}
                      onChange={(e) => handleInputChange('bankAccountTitle', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
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
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-shadow"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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


