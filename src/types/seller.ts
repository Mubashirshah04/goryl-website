export interface SellerApplication {
  id?: string;
  userId: string;
  userEmail: string;
  accountType: 'company' | 'brand' | 'personal';
  status: 'pending' | 'approved' | 'rejected';
  
  // Basic Information
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  
  // Account Type Specific Fields
  companyRegistrationId?: string; // For Company
  brandName?: string; // For Brand
  cnic?: string; // For Personal
  taxId?: string;
  
  // Business Details
  businessDescription: string;
  productCategories: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  expectedMonthlySales: string;
  
  // Documents
  kycDocuments: {
    idProof: string; // URL
    businessProof?: string; // URL for company/brand
    taxCertificate?: string; // URL
  };
  
  // Media
  logo?: string; // URL
  coverPhoto?: string; // URL
  productSamples?: string[]; // URLs
  
  // Payment Information
  paymentMethod: 'bank_transfer' | 'credit_card' | 'paypal';
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    swiftCode?: string;
  };
  
  // Fee Information
  feeAmount: number;
  feeCurrency: string;
  feeType: 'one_time' | 'yearly';
  feePaid: boolean;
  paymentTransactionId?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  
  // Admin Notes
  adminNotes?: string;
  rejectionReason?: string;
}

export interface FeeStructure {
  id?: string;
  country: string;
  currency: string;
  companyFee: number;
  brandFee: number;
  personalFee: number;
  feeType: 'one_time' | 'yearly';
  trialPeriod?: number; // days
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SellerAccount {
  id?: string;
  userId: string;
  userEmail: string;
  accountType: 'company' | 'brand' | 'personal';
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  
  // Business Details
  businessDescription: string;
  productCategories: string[];
  logo?: string;
  coverPhoto?: string;
  
  // Verification
  isVerified: boolean;
  verificationDocuments: {
    idProof: string;
    businessProof?: string;
    taxCertificate?: string;
  };
  
  // Statistics
  totalProducts: number;
  totalSales: number;
  totalOrders: number;
  rating: number;
  reviewCount: number;
  
  // Settings
  isActive: boolean;
  autoApproveOrders: boolean;
  notificationSettings: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  approvedAt: Date;
}

export interface ApplicationFormData {
  // Step 1: Account Type Selection
  accountType: 'company' | 'brand' | 'personal';
  
  // Step 2: Basic Information
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  
  // Step 3: Account Specific Information
  companyRegistrationId?: string;
  brandName?: string;
  cnic?: string;
  taxId?: string;
  
  // Step 4: Business Details
  businessDescription: string;
  productCategories: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  expectedMonthlySales: string;
  
  // Step 5: Documents
  kycDocuments: {
    idProof: File | null;
    businessProof?: File | null;
    taxCertificate?: File | null;
  };
  
  // Step 6: Media
  logo?: File | null;
  coverPhoto?: File | null;
  productSamples: File[];
  
  // Step 7: Payment
  paymentMethod: 'bank_transfer' | 'credit_card' | 'paypal';
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    swiftCode?: string;
  };
}

export interface AccountTypeInfo {
  type: 'company' | 'brand' | 'personal';
  title: string;
  description: string;
  features: string[];
  requirements: string[];
  fee: number;
  currency: string;
  icon: string;
  color: string;
}

export interface ApplicationStep {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

export interface UploadProgress {
  file: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}
