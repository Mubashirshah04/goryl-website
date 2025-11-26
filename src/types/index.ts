// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  profilePic?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  role: 'user' | 'personal_seller' | 'brand' | 'company' | 'admin';
  isVerified: boolean;
  isActive: boolean;
  followers: number;
  following: number;
  totalProducts: number;
  totalSales: number;
  rating: number;
  reviews: number;
  joinedAt: Date;
  updatedAt: Date;
  preferences: {
    emailMarketing: boolean;
    notifications: boolean;
    publicProfile: boolean;
  };
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  businessInfo?: {
    businessName: string;
    businessType: string;
    registrationNumber?: string;
    taxId?: string;
  };
  payoneerInfo?: {
    email: string;
    payeeId: string;
    isVerified: boolean;
  };
}

// Product Types
export interface Product {
  id: string;
  sellerId: string;
  seller: {
    id: string;
    name: string;
    profilePic?: string;
    isVerified: boolean;
  };
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  category: string;
  subcategory?: string;
  tags: string[];
  images: string[];
  videos?: string[];
  variants?: ProductVariant[];
  inventory: {
    total: number;
    available: number;
    reserved: number;
  };
  status: 'active' | 'inactive' | 'draft' | 'sold_out';
  isFeatured: boolean;
  isTrending: boolean;
  rating: number;
  reviewCount: number;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  metadata: {
    weight?: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    materials?: string[];
    colors?: string[];
    sizes?: string[];
  };
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  price?: number;
  inventory: number;
  images?: string[];
}

// Order Types
export interface Order {
  id: string;
  buyerId: string;
  buyer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  sellerId: string;
  seller: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'payoneer' | 'credit_card' | 'paypal';
  shippingAddress: Address;
  billingAddress: Address;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface OrderItem {
  productId: string;
  product: {
    id: string;
    title: string;
    image: string;
    price: number;
  };
  variant?: ProductVariant;
  quantity: number;
  price: number;
  total: number;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

// Review Types
export interface Review {
  id: string;
  productId: string;
  buyerId: string;
  buyer: {
    id: string;
    name: string;
    profilePic?: string;
  };
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  isVerified: boolean;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

// Cart Types
export interface CartItem {
  productId: string;
  product: {
    id: string;
    title: string;
    image: string;
    price: number;
    sellerId: string;
    sellerName: string;
  };
  variant?: ProductVariant;
  quantity: number;
  addedAt: Date;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  itemCount: number;
  updatedAt: Date;
}

// Social Types
export interface Comment {
  id: string;
  productId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    profilePic?: string;
  };
  content: string;
  images?: string[];
  likes: number;
  replies: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Like {
  id: string;
  userId: string;
  targetType: 'product' | 'review' | 'comment';
  targetId: string;
  createdAt: Date;
}

export interface Share {
  id: string;
  userId: string;
  productId: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'whatsapp' | 'email';
  createdAt: Date;
}

// Chat Types
export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: { [userId: string]: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    profilePic?: string;
  };
  content: string;
  type: 'text' | 'image' | 'file' | 'product';
  metadata?: {
    productId?: string;
    productTitle?: string;
    productImage?: string;
    productPrice?: number;
  };
  isRead: boolean;
  createdAt: Date;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parentId?: string;
  children?: Category[];
  productCount: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Application Types
export interface SellerApplication {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  type: 'personal_seller' | 'brand' | 'company';
  status: 'pending' | 'approved' | 'rejected' | 'incomplete';
  businessName: string;
  website?: string;
  description?: string;
  category: string;
  estimatedRevenue: number;
  location: string;
  documents: ApplicationDocument[];
  notes: ApplicationNote[];
  payoneerEmail: string;
  payoneerPayeeId: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationDocument {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  url: string;
  uploadedAt: Date;
  verified: boolean;
}

export interface ApplicationNote {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'order_update' | 'payment_received' | 'new_review' | 'new_follower' | 'product_like' | 'comment_reply' | 'application_update';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

// Analytics Types
export interface Analytics {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeSellers: number;
  pendingApplications: number;
  recentOrders: Order[];
  topProducts: Product[];
  topSellers: User[];
}

// Payment Types
export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: 'payoneer' | 'credit_card' | 'paypal';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  payoneerEmail?: string;
  payoneerPayeeId?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Payout Types
export interface Payout {
  id: string;
  sellerId: string;
  seller: {
    id: string;
    name: string;
    email: string;
  };
  amount: number;
  currency: string;
  payoneerEmail: string;
  payoneerPayeeId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  orders: string[];
  transactionId?: string;
  notes?: string;
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
}

// Search Types
export interface SearchFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  sellerType?: 'personal_seller' | 'brand' | 'company';
  location?: string;
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'newest' | 'popular';
}

// Reel Types
export interface Reel {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    profilePic?: string;
    isVerified: boolean;
  };
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  productId?: string;
  product?: {
    id: string;
    title: string;
    image: string;
    price: number;
  };
  likes: number;
  comments: number;
  shares: number;
  views: number;
  duration: number;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Wishlist Types
export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: {
    id: string;
    title: string;
    image: string;
    price: number;
    sellerId: string;
    sellerName: string;
  };
  addedAt: Date;
}

// Settings Types
export interface UserSettings {
  id: string;
  userId: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    orderUpdates: boolean;
    newProducts: boolean;
    promotions: boolean;
    social: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'followers';
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
  };
  language: string;
  currency: string;
  timezone: string;
  updatedAt: Date;
}
