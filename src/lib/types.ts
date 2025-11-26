// Minimal shared types to satisfy imports during AWS migration.
export type ID = string;

export interface AuthUser {
  sub?: string;
  email?: string;
  name?: string;
  [key: string]: any;
}

export interface User {
  id: ID;
  name?: string;
  displayName?: string;
  avatar?: string;
  email?: string;
  [key: string]: any;
}

export interface Product {
  id: ID;
  name?: string;
  price?: number;
  sellerId?: ID;
  sellerAvatar?: string;
  [key: string]: any;
}

export interface CartItem {
  productId: ID;
  quantity: number;
}

export interface Cart {
  id: ID;
  items: CartItem[];
  total?: number;
}

export interface WishlistItem {
  productId: ID;
  addedAt?: string;
}

export interface Story {
  id: ID;
  content?: string;
}

export interface Reel {
  id: ID;
  videoUrl?: string;
}

export interface KycValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  formatted?: string;
  qualityScore?: number;
}

export default {} as any;
// Core User Types
export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  username?: string;
  avatar?: string;
  profilePic?: string;
  photoURL?: string;
  bio?: string;
  phone?: string;
  role: 'user' | 'personal_seller' | 'seller' | 'brand' | 'company' | 'admin';
  accountType?: 'user' | 'personal_seller' | 'brand' | 'company' | 'admin';
  points?: number;
  redeemedCoupons?: string[];
  isVerified: boolean;
  isVerifiedSeller?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  followersCount?: number;
  followingCount?: number;
  followers?: string[];
  following?: string[];
  productsCount?: number;
  totalProducts?: number;
  rating: number;
  totalSales: number;
  reviews?: number;
  website?: string;
  location?: string;
  businessName?: string;
  businessType?: string;
  taxId?: string;
  registrationNumber?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  preferences?: {
    emailMarketing?: boolean;
    notifications?: boolean;
    publicProfile?: boolean;
  };
  businessInfo?: {
    businessName?: string;
    businessType?: string;
    registrationNumber?: string;
    taxId?: string;
  };
  payoneerInfo?: {
    email?: string;
    payeeId?: string;
    isVerified?: boolean;
  };
  payoneerAccount?: {
    payeeId: string;
    email: string;
    status: 'pending' | 'verified' | 'suspended';
  };
}

export interface Profile extends User {
  // Extended profile information
  website?: string;
  location?: string;
  businessName?: string;
  businessType?: string;
  taxId?: string;
  bankInfo?: {
    accountNumber: string;
    routingNumber: string;
    bankName: string;
  };
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  preferences?: {
    emailMarketing?: boolean;
    notifications?: boolean;
    publicProfile?: boolean;
  };
}

// Product Types
export interface Product {
  id?: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  videos?: string[];
  category: string;
  categoryId?: string;
  categoryName?: string;
  subCategory?: string;
  tags: string[];
  sellerId: string;
  sellerName?: string;
  sellerPhoto?: string;
  seller: {
    id: string;
    name: string;
    avatar?: string;
    profilePic?: string;
    photoURL?: string;
    isVerified: boolean;
    rating: number;
    followers?: number;
  };
  sellerRef?: {
    id: string;
    name: string;
    photoURL?: string;
    followers?: number;
  };
  stock: number;
  sku?: string;
  brand?: string;
  model?: string;
  video?: string;
  condition?: string;
  recommendedAge?: string;
  highlights?: string[];
  shippingInfo?: {
    weight?: number;
    dimensions?: { length: number; width: number; height: number };
    freeShipping?: boolean;
    shippingCost?: number;
    estimatedDays?: number;
    shippingMethod?: string;
    packageWeight?: number;
    packageDimensions?: { length: number; width: number; height: number };
    dangerousGoods?: string;
  };
  warrantyInfo?: {
    duration?: string;
    type?: string;
    coverage?: string;
    hasWarranty?: boolean;
    warrantyPeriod?: string;
    warrantyType?: string;
  };
  specifications?: Record<string, any>;
  variants?: Array<{
    name: string;
    options: string[];
    price: number;
  }>;
  inventory?: {
    total: number;
    available: number;
    reserved: number;
    lowStockThreshold: number;
  };
  shipping?: {
    weight: number;
    dimensions: { length: number; width: number; height: number };
    freeShipping: boolean;
    shippingCost: number;
  };
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
  };
  isActive: boolean;
  isFeatured: boolean;
  isTrending?: boolean;
  isOnSale: boolean;
  salePercentage?: number;
  likesCount?: number;
  likeCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  shareCount?: number;
  viewsCount?: number;
  viewCount?: number;
  rating: number;
  reviewsCount?: number;
  reviewCount?: number;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  status?: 'active' | 'inactive' | 'draft' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt?: any;
  updatedAt?: any;
  publishedAt?: any;
}

// Category Types
export interface Category {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  parentId?: string | null;
  children?: Category[];
  path?: string[];
  level: number;
  isActive: boolean;
  isFeatured?: boolean;
  productCount: number;
  productsCount?: number;
  sortOrder: number;
  createdAt?: any;
  updatedAt?: any;
}

// Order Types
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'cod' | 'card' | 'payoneer' | 'bank_transfer';
  shippingAddress: Address;
  billingAddress?: Address;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: {
    id: string;
    title: string;
    image: string;
    price: number;
  };
  quantity: number;
  price: number;
  total: number;
}

// Cart Types
export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  sellerId?: string;
  sellerName?: string;
  product: {
    id: string;
    title: string;
    image: string;
    price: number;
    stock: number;
    sellerId?: string;
    sellerName?: string;
  };
  quantity: number;
  addedAt: Date;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  updatedAt: Date;
}

// Wishlist Types
export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  addedAt: Date;
}

// Address Types
export interface Address {
  id: string;
  userId: string;
  type: 'home' | 'work' | 'other';
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Application Types
export interface Application {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  type: 'personal_seller' | 'brand' | 'company';
  status: 'pending' | 'approved' | 'rejected' | 'incomplete' | 'resubmission';
  businessName?: string;
  website?: string;
  description: string;
  category: string;
  estimatedRevenue: number;
  location: string;
  documents: Document[];
  notes: string[];
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'video';
  url: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
}

// Review Types
export interface Review {
  id: string;
  productId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerified: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Comment Types
export interface Comment {
  id: string;
  productId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  likesCount: number;
  repliesCount: number;
  parentId?: string;
  replies?: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

// Chat Types
export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
  createdAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  type: 'text' | 'image' | 'file' | 'product';
  metadata?: {
    productId?: string;
    fileName?: string;
    fileSize?: number;
    fileUrl?: string;
  };
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'order_update' | 'message' | 'application_update' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

// Payment Types
export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: 'cod' | 'card' | 'payoneer' | 'bank_transfer';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'held';
  transactionId?: string;
  gateway?: 'payoneer' | 'stripe' | 'paypal';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Payoneer Integration Types
export interface PayoneerAccount {
  id: string;
  userId: string;
  payeeId: string;
  email: string;
  accountType: 'personal' | 'business';
  status: 'pending' | 'verified' | 'suspended';
  verificationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payout {
  id: string;
  sellerId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'held' | 'rejected';
  payoneerAccountId: string;
  payoneerTransactionId?: string;
  adminNotes?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardPayment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover';
  last4Digits: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  gateway: 'payoneer' | 'stripe';
  transactionId?: string;
  metadata?: {
    cardBrand?: string;
    country?: string;
    funding?: string;
    wallet?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface EscrowAccount {
  id: string;
  type: 'admin' | 'seller';
  balance: number;
  currency: string;
  totalTransactions: number;
  pendingAmount: number;
  lastUpdated: Date;
}

// Analytics Types
export interface Analytics {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
  pendingApplications: number;
  topCategories: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  topSellers: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentOrders: Order[];
  salesChart: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
}

// Search Types
export interface SearchFilters {
  query?: string;
  category?: string;
  subCategory?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  brand?: string;
  seller?: string;
  sortBy?: 'newest' | 'price_low' | 'price_high' | 'rating' | 'popularity';
  inStock?: boolean;
  onSale?: boolean;
}

export interface SearchResult {
  products: Product[];
  categories: Category[];
  sellers: User[];
  total: number;
  hasMore: boolean;
}

// Reels Types
export interface Reel {
  id?: string;
  userId: string;
  productId?: string;
  product?: Product;
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  title?: string;
  tags?: string[];
  duration?: number;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  viewsCount?: number;
  likedBy?: string[];
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  status?: 'active' | 'inactive' | 'draft' | 'pending';
  rejectionReason?: string;
  createdAt?: any;
  updatedAt?: any;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface ProfileForm {
  name: string;
  displayName?: string;
  bio?: string;
  phone?: string;
  website?: string;
  location?: string;
}

export interface ApplicationForm {
  type: 'personal_seller' | 'brand' | 'company';
  businessName?: string;
  website?: string;
  description: string;
  category: string;
  estimatedRevenue: number;
  location: string;
  documents: File[];
}

// Event Types for realtime simulation
export interface RealtimeEvent {
  type: 'like' | 'comment' | 'message' | 'notification' | 'order_update';
  data: any;
  timestamp: Date;
}
// Utility Types
export type SortOrder = 'asc' | 'desc';
export type Status = 'active' | 'inactive' | 'pending' | 'approved' | 'rejected';
export type UserRole = 'user' | 'personal_seller' | 'brand' | 'company' | 'admin';
export type PaymentMethod = 'cod' | 'online' | 'bank_transfer';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

