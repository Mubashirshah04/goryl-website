import { Product as ProductType, User } from "./types";
import cachingService, { CacheRegion } from "./cachingService";

// Product interface for instant loading
export interface OptimizedProduct {
  id?: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerIsVerified: boolean;
  sellerRating: number;
  sellerFollowers: number;
  seller: {
    id: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
    rating: number;
    followers: number;
  };
  likes: string[];
  views: number;
  rating: number;
  reviewCount: number;
  comments: number;
  status: "active" | "inactive" | "draft";
  tags?: string[];
  brand?: string;
  discount?: number;
  createdAt?: string;
  updatedAt?: string;
  _lastUpdated?: number;
  _cacheVersion?: number;
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = 'product_cache_';

// Cache helper functions
const getFromCache = (key: string) => {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    const cacheTime = localStorage.getItem(`${CACHE_PREFIX}${key}_time`);

    if (cached && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.warn('Failed to get from cache:', error);
  }
  return null;
};

const setInCache = (key: string, data: any) => {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(data));
    localStorage.setItem(`${CACHE_PREFIX}${key}_time`, Date.now().toString());
  } catch (error) {
    console.warn('Failed to set in cache:', error);
  }
};

const clearCache = () => {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear cache:', error);
  }
};

// Get optimized products from API
export const getOptimizedProducts = async (
  filters: {
    category?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  } = {},
  orderByField: string = 'createdAt',
  orderDirection: 'asc' | 'desc' = 'desc',
  limitCount: number = 20
): Promise<OptimizedProduct[]> => {
  const cacheKey = `products:${JSON.stringify(filters)}_${orderByField}_${orderDirection}_${limitCount}`;

  console.log("🚀 Fetching products");

  // Try to get from local storage first
  const cachedProducts = getFromCache(cacheKey);
  if (cachedProducts) {
    console.log("✨ Loaded products from cache instantly");
    return cachedProducts;
  }

  try {
    // Build query params
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.search) params.append('search', filters.search);
    params.append('orderByField', orderByField);
    params.append('orderDirection', orderDirection);
    params.append('limit', limitCount.toString());

    // Fetch products from API
    const response = await fetch(`/api/products?${params.toString()}`);
    const data = await response.json();
    
    if (!data.success) {
      console.error('API Error:', data.error || 'Unknown error');
      return [];
    }

    // Map API response to OptimizedProduct format
    const optimizedProducts = (data.data || []).map((item: any): OptimizedProduct => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      price: item.price,
      category: item.category,
      images: item.images || [],
      stock: item.stock || 0,
      sellerId: item.sellerId,
      sellerName: item.sellerName || 'Unknown',
      sellerAvatar: item.sellerAvatar || item.sellerPhoto,
      sellerIsVerified: item.sellerIsVerified || false,
      sellerRating: item.sellerRating || 0,
      sellerFollowers: item.sellerFollowers || 0,
      seller: {
        id: item.sellerId,
        name: item.sellerName || 'Unknown',
        avatar: item.sellerAvatar || item.sellerPhoto,
        isVerified: item.sellerIsVerified || false,
        rating: item.sellerRating || 0,
        followers: item.sellerFollowers || 0,
      },
      likes: item.likes || [],
      views: item.views || 0,
      rating: item.rating || 0,
      reviewCount: item.reviewCount || 0,
      comments: item.comments || 0,
      status: item.status || 'active',
      tags: item.tags || [],
      brand: item.brand,
      discount: item.discount,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      _lastUpdated: Date.now(),
      _cacheVersion: 1,
    }));

    // Cache results
    setInCache(cacheKey, optimizedProducts);

    console.log(`✅ Products fetched: ${optimizedProducts.length}`);
    return optimizedProducts;
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    return [];
  }
};

// Preload critical products (stub for now)
export const preloadCriticalProducts = async () => {
  console.log('⚡ Preloading critical products...');
  try {
    // Fetch top 5 products for instant display
    await getOptimizedProducts({}, 'createdAt', 'desc', 5);
    console.log('✅ Critical products preloaded');
  } catch (error) {
    console.warn('⚠️ Failed to preload critical products:', error);
  }
};

// Export service
export default {
  getOptimizedProducts,
  clearCache,
  preloadCriticalProducts,
};
