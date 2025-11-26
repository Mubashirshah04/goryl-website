// KYC System Types and Interfaces

export type SellerCategory = 'business' | 'artisan';
export type KYCTier = 'tier1' | 'tier2' | 'tier3';
export type KYCStatus = 'pending' | 'verified' | 'rejected';

// Seller KYC Document
export interface SellerKYC {
  id?: string;
  sellerId: string;
  userId: string;
  userEmail: string;
  
  // Seller Category
  category: SellerCategory; // 'business' | 'artisan'
  
  // KYC Tier
  tier: KYCTier; // 'tier1' | 'tier2' | 'tier3'
  
  // Status
  status: KYCStatus; // 'pending' | 'verified' | 'rejected'
  
  // Basic Information (All Tiers)
  fullName: string; // As per CNIC
  email: string;
  phone: string;
  
  // CNIC Information (Tier 1+)
  cnic?: string;
  cnicFront?: string; // URL to uploaded image
  cnicBack?: string; // URL to uploaded image
  
  // Selfie with CNIC (Tier 1+)
  selfieWithCNIC?: string; // URL to uploaded image
  
  // Address (Tier 1+)
  address?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  
  // Artisan Specific Fields
  artisanInfo?: {
    productionAddress: string; // Where they make products (home studio/shop)
    productProof?: string[]; // URLs to videos/photos showing handmade products
    productDescription?: string;
  };
  
  // Business Specific Fields
  businessInfo?: {
    businessName: string;
    businessRegistrationId?: string; // For registered businesses
    fbrNTN?: string; // FBR NTN for Pakistan
    businessLicense?: string; // URL to business license document
    taxCertificate?: string; // URL to tax certificate
  };
  
  // Payment Information
  paymentInfo?: {
    payoneerEmail?: string; // For Artisan sellers
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountTitle?: string;
    iban?: string;
  };
  
  // Fraud Detection Data
  fraudDetection?: {
    cnicDuplicateChecked: boolean;
    cnicDuplicateFound: boolean;
    duplicateAccountIds?: string[]; // IDs of accounts with same CNIC
    deviceId?: string;
    ipAddress?: string;
    browserFingerprint?: string;
    faceMatchScore?: number; // AI face matching score (0-100)
    faceMatchVerified?: boolean;
  };
  
  // Verification Details
  verifiedBy?: string; // Admin UID
  verifiedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  remarks?: string; // Admin notes
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
}

// KYC Tier Limits
export interface KYCTierLimits {
  tier: KYCTier;
  name: string;
  description: string;
  sellingLimit: {
    daily?: number; // Daily selling limit
    monthly?: number; // Monthly selling limit
    total?: number; // Total account balance limit
  };
  paymentRestrictions: {
    autoTransfer: boolean; // Auto-transfer payments
    manualReview: boolean; // Manual review required
    withdrawalLimit?: number; // Withdrawal limit per transaction
    withdrawalFrequency?: 'daily' | 'weekly' | 'monthly';
  };
  features: string[];
  requirements: string[];
}

// KYC Form Data for Artisan
export interface ArtisanKYCFormData {
  // Step 1: Basic Info
  fullName: string;
  email: string;
  phone: string;
  
  // Step 2: CNIC
  cnic: string;
  cnicFrontFile: File | null;
  cnicBackFile: File | null;
  
  // Step 3: Selfie
  selfieFile: File | null;
  
  // Step 4: Address
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  
  // Step 5: Production Address
  productionAddress: string;
  
  // Step 6: Product Proof
  productProofFiles: File[]; // Videos or photos
  productDescription: string;
  
  // Step 7: Payment Info
  payoneerEmail: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountTitle?: string;
}

// KYC Form Data for Business
export interface BusinessKYCFormData {
  // Step 1: Basic Info
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  
  // Step 2: Business Registration
  businessRegistrationId?: string;
  fbrNTN?: string;
  businessLicenseFile?: File | null;
  taxCertificateFile?: File | null;
  
  // Step 3: CNIC (Owner/Director)
  cnic: string;
  cnicFrontFile: File | null;
  cnicBackFile: File | null;
  
  // Step 4: Address
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  
  // Step 5: Payment Info
  bankName: string;
  bankAccountNumber: string;
  bankAccountTitle: string;
  iban?: string;
}

// KYC Review (Admin)
export interface KYCReview {
  kycId: string;
  reviewerId: string;
  action: 'approve' | 'reject';
  remarks?: string;
  rejectionReason?: string;
  tier?: KYCTier; // If approving, which tier to assign
}

// CNIC Validation Result
export interface CNICValidationResult {
  isValid: boolean;
  formatted?: string;
  error?: string;
}

