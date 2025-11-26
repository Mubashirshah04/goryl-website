'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  X, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  DollarSign,
  Building,
  User,
  FileText
} from 'lucide-react';
import { ApplicationFormData } from '@/types/seller';

interface ApplicationStepsProps {
  currentStep: number;
  formData: ApplicationFormData;
  onInputChange: (field: string, value: any) => void;
  onFileUpload: (field: string, file: File | null) => void;
  onMultipleFileUpload: (field: string, files: File[]) => void;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  feeStructure: any;
}

export default function ApplicationSteps({
  currentStep,
  formData,
  onInputChange,
  onFileUpload,
  onMultipleFileUpload,
  onNext,
  onPrev,
  onSubmit,
  isLoading,
  feeStructure
}: ApplicationStepsProps) {
  
  const productCategories = [
    'Fashion', 'Electronics', 'Beauty & Health', 'Home & Garden',
    'Sports & Fitness', 'Books & Media', 'Toys & Games', 'Automotive'
  ];

  const countries = [
    'Pakistan', 'United States', 'United Kingdom', 'Canada', 'Australia',
    'Germany', 'France', 'India', 'China', 'Japan'
  ];

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner (0-1 years)' },
    { value: 'intermediate', label: 'Intermediate (1-3 years)' },
    { value: 'advanced', label: 'Advanced (3+ years)' }
  ];

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'paypal', label: 'PayPal' }
  ];

  const renderStep2 = () => (
    <motion.div
      key="step-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Basic Information</h2>
        <p className="text-gray-600 dark:text-gray-300">Please provide your basic business details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.businessName}
            onChange={(e) => onInputChange('businessName', e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
            placeholder="Enter your business name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Contact Person <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.contactPerson}
            onChange={(e) => onInputChange('contactPerson', e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
            placeholder="Enter contact person name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
            placeholder="Enter your phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Country <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.country}
            onChange={(e) => onInputChange('country', e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
          >
            <option value="">Select country</option>
            {countries.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => onInputChange('city', e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
            placeholder="Enter your city"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => onInputChange('address', e.target.value)}
            rows={3}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
            placeholder="Enter your complete address"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
        <button
          onClick={onPrev}
          className="w-full sm:w-auto bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 mr-2 inline" />
          Previous
        </button>
        <button
          onClick={onNext}
          className="w-full sm:w-auto bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm sm:text-base"
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2 inline" />
        </button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      key="step-3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Account Specific Information</h2>
        <p className="text-gray-600 dark:text-gray-300">Provide details specific to your account type</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {formData.accountType === 'company' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Registration ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.companyRegistrationId || ''}
                onChange={(e) => onInputChange('companyRegistrationId', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
                placeholder="Enter company registration ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tax ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.taxId || ''}
                onChange={(e) => onInputChange('taxId', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
                placeholder="Enter tax identification number"
              />
            </div>
          </>
        )}

        {formData.accountType === 'brand' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Brand Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.brandName || ''}
                onChange={(e) => onInputChange('brandName', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
                placeholder="Enter brand name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tax ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.taxId || ''}
                onChange={(e) => onInputChange('taxId', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
                placeholder="Enter tax identification number"
              />
            </div>
          </>
        )}

        {formData.accountType === 'personal' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CNIC (National ID) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.cnic || ''}
              onChange={(e) => onInputChange('cnic', e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
              placeholder="Enter your CNIC number"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
        <button
          onClick={onPrev}
          className="w-full sm:w-auto bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 mr-2 inline" />
          Previous
        </button>
        <button
          onClick={onNext}
          className="w-full sm:w-auto bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm sm:text-base"
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2 inline" />
        </button>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      key="step-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Business Details</h2>
        <p className="text-gray-600 dark:text-gray-300">Tell us more about your business</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Business Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.businessDescription}
            onChange={(e) => onInputChange('businessDescription', e.target.value)}
            rows={4}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
            placeholder="Describe your business, products, and why you want to sell on Zaillisy..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Product Categories <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {productCategories.map((category) => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.productCategories.includes(category)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onInputChange('productCategories', [...formData.productCategories, category]);
                    } else {
                      onInputChange('productCategories', formData.productCategories.filter(c => c !== category));
                    }
                  }}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">{category}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              E-commerce Experience <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.experienceLevel}
              onChange={(e) => onInputChange('experienceLevel', e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
            >
              {experienceLevels.map((level) => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Expected Monthly Sales <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.expectedMonthlySales}
              onChange={(e) => onInputChange('expectedMonthlySales', e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
            >
              <option value="">Select expected sales</option>
              <option value="0-10000">$0 - $10,000</option>
              <option value="10000-50000">$10,000 - $50,000</option>
              <option value="50000-100000">$50,000 - $100,000</option>
              <option value="100000+">$100,000+</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
        <button
          onClick={onPrev}
          className="w-full sm:w-auto bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 mr-2 inline" />
          Previous
        </button>
        <button
          onClick={onNext}
          className="w-full sm:w-auto bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm sm:text-base"
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2 inline" />
        </button>
      </div>
    </motion.div>
  );

  const renderStep5 = () => (
    <motion.div
      key="step-5"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Upload Documents</h2>
        <p className="text-gray-600 dark:text-gray-300">Upload required KYC documents</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ID Proof (CNIC/Passport) <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
            <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => onFileUpload('kycDocuments.idProof', e.target.files?.[0] || null)}
              className="hidden"
              id="idProof"
            />
            <label htmlFor="idProof" className="cursor-pointer text-purple-600 hover:text-purple-700 text-sm sm:text-base">
              {formData.kycDocuments.idProof ? formData.kycDocuments.idProof.name : 'Choose file'}
            </label>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">PDF, JPG, or PNG (max 5MB)</p>
          </div>
        </div>

        {formData.accountType !== 'personal' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Proof (Registration Certificate)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => onFileUpload('kycDocuments.businessProof', e.target.files?.[0] || null)}
                  className="hidden"
                  id="businessProof"
                />
                <label htmlFor="businessProof" className="cursor-pointer text-purple-600 hover:text-purple-700 text-sm sm:text-base">
                  {formData.kycDocuments.businessProof ? formData.kycDocuments.businessProof.name : 'Choose file'}
                </label>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">PDF, JPG, or PNG (max 5MB)</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tax Certificate
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => onFileUpload('kycDocuments.taxCertificate', e.target.files?.[0] || null)}
                  className="hidden"
                  id="taxCertificate"
                />
                <label htmlFor="taxCertificate" className="cursor-pointer text-purple-600 hover:text-purple-700 text-sm sm:text-base">
                  {formData.kycDocuments.taxCertificate ? formData.kycDocuments.taxCertificate.name : 'Choose file'}
                </label>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">PDF, JPG, or PNG (max 5MB)</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
        <button
          onClick={onPrev}
          className="w-full sm:w-auto bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 mr-2 inline" />
          Previous
        </button>
        <button
          onClick={onNext}
          className="w-full sm:w-auto bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm sm:text-base"
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2 inline" />
        </button>
      </div>
    </motion.div>
  );

  const renderStep6 = () => {
    return (
      <motion.div
      key="step-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Media & Samples</h2>
        <p className="text-gray-600 dark:text-gray-300">Upload your logo, cover photo, and product samples (optional)</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Logo
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
              <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => onFileUpload('logo', e.target.files?.[0] || null)}
                className="hidden"
                id="logo"
              />
              <label htmlFor="logo" className="cursor-pointer text-purple-600 hover:text-purple-700 text-sm sm:text-base">
                {formData.logo ? formData.logo.name : 'Choose logo'}
              </label>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">JPG, PNG, or WebP (max 2MB)</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cover Photo
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
              <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => onFileUpload('coverPhoto', e.target.files?.[0] || null)}
                className="hidden"
                id="coverPhoto"
              />
              <label htmlFor="coverPhoto" className="cursor-pointer text-purple-600 hover:text-purple-700 text-sm sm:text-base">
                {formData.coverPhoto ? formData.coverPhoto.name : 'Choose cover photo'}
              </label>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">JPG, PNG, or WebP (max 5MB)</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Product Samples (up to 5 files)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
            <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.mp4"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                onMultipleFileUpload('productSamples', files);
              }}
              className="hidden"
              id="productSamples"
            />
            <label htmlFor="productSamples" className="cursor-pointer text-purple-600 hover:text-purple-700 text-sm sm:text-base">
              Choose product samples
            </label>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Images or videos (max 10MB each)</p>
            
            {formData.productSamples.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Selected files:</p>
                <div className="space-y-1">
                  {formData.productSamples.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-xs sm:text-sm text-gray-600 truncate">{file.name}</span>
                      <button
                        onClick={() => {
                          const newFiles = formData.productSamples.filter((_, i) => i !== index);
                          onMultipleFileUpload('productSamples', newFiles);
                        }}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
          <button
            onClick={onPrev}
            className="w-full sm:w-auto bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2 inline" />
            Previous
          </button>
          <button
            onClick={onNext}
            className="w-full sm:w-auto bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm sm:text-base"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2 inline" />
          </button>
        </div>
      </div>
      </motion.div>
    );
  };

    const renderStep7 = () => {
      return (
        <motion.div
        key="step-7"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Payment Setup</h2>
          <p className="text-gray-600 dark:text-gray-300">Configure your payment method</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <label key={method.value} className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={formData.paymentMethod === method.value}
                    onChange={(e) => onInputChange('paymentMethod', e.target.value)}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-gray-700 text-sm sm:text-base">{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          {formData.paymentMethod === 'bank_transfer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankDetails?.accountName || ''}
                  onChange={(e) => onInputChange('bankDetails.accountName', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
                  placeholder="Enter account holder name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankDetails?.accountNumber || ''}
                  onChange={(e) => onInputChange('bankDetails.accountNumber', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
                  placeholder="Enter account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankDetails?.bankName || ''}
                  onChange={(e) => onInputChange('bankDetails.bankName', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
                  placeholder="Enter bank name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Swift Code
                </label>
                <input
                  type="text"
                  value={formData.bankDetails?.swiftCode || ''}
                  onChange={(e) => onInputChange('bankDetails.swiftCode', e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base text-gray-900 dark:text-white"
                  placeholder="Enter swift code (if applicable)"
                />
              </div>
            </div>
          )}

          {feeStructure && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
                <div>
                  <h4 className="font-medium text-blue-900 text-sm sm:text-base">Application Fee</h4>
                  <p className="text-blue-800 text-sm">
                    {feeStructure.currency} {feeStructure[`${formData.accountType}Fee`]?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
          <button
            onClick={onPrev}
            className="w-full sm:w-auto bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2 inline" />
            Previous
          </button>
          <button
            onClick={onNext}
            className="w-full sm:w-auto bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm sm:text-base"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2 inline" />
          </button>
        </div>
      </motion.div>
    );
  };

    const renderStep8 = () => {
      return (
        <motion.div
        key="step-8"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Review & Submit</h2>
          <p className="text-gray-600 dark:text-gray-300">Review your application before submitting</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 sm:p-6 space-y-6">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Application Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Account Type</h4>
                <div className="flex items-center">
                  {formData.accountType === 'company' && <Building className="w-4 h-4 text-blue-600 mr-2" />}
                  {formData.accountType === 'brand' && <FileText className="w-4 h-4 text-purple-600 mr-2" />}
                  {formData.accountType === 'personal' && <User className="w-4 h-4 text-green-600 mr-2" />}
                  <span className="capitalize text-sm sm:text-base">{formData.accountType} Account</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Business Name</h4>
                <p className="text-gray-600 text-sm sm:text-base">{formData.businessName}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Contact Person</h4>
                <p className="text-gray-600 text-sm sm:text-base">{formData.contactPerson}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Email</h4>
                <p className="text-gray-600 text-sm sm:text-base">{formData.email}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Phone</h4>
                <p className="text-gray-600 text-sm sm:text-base">{formData.phone}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Location</h4>
                <p className="text-gray-600 text-sm sm:text-base">{formData.city}, {formData.country}</p>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Product Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.productCategories.map((category) => (
                    <span key={category} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs sm:text-sm">
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Business Description</h4>
                <p className="text-gray-600 text-sm sm:text-base">{formData.businessDescription}</p>
              </div>
            </div>
          </div>

          {feeStructure && (
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Fee Information</h4>
              <div className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base">Application Fee:</span>
                  <span className="font-semibold text-purple-600 text-sm sm:text-base">
                    {feeStructure.currency} {feeStructure[`${formData.accountType}Fee`]?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1 text-sm sm:text-base">What happens next?</h4>
                <p className="text-blue-800 text-xs sm:text-sm">
                  After submitting your application, our team will review your details within 2-3 business days. 
                  If approved, you'll receive an email with your seller account setup instructions and next steps.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
          <button
            onClick={onPrev}
            className="w-full sm:w-auto bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2 inline" />
            Previous
          </button>
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="w-full sm:w-auto bg-green-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {isLoading ? 'Submitting...' : 'Submit Application'}
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 ml-2 inline" />
          </button>
        </div>
      </motion.div>
    );
  };

    // Render current step
    switch (currentStep) {
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      case 7:
        return renderStep7();
      case 8:
        return renderStep8();
      default:
        return null;
    }
  }
