/**
 * Pure AWS Product Service
 * 
 * Uses AWS DynamoDB only - no Firebase fallback
 * Fast, scalable, perfect for e-commerce
 * 
 * SECURITY: Client-side calls go through API routes (no exposed credentials)
 * Server-side calls use DynamoDB directly
 */

import { Product, ProductFilters } from './awsDynamoService';

// Check if we're on the client or server
const isClientSide = typeof window !== 'undefined';

/**
 * Get products - uses API route on client, direct DynamoDB on server
 */
export const getProducts = async (
  filters: ProductFilters = {},
  orderByField: string = 'createdAt',
  orderDirection: 'asc' | 'desc' = 'desc',
  limitCount: number = 20
): Promise<Product[]> => {
  try {
    if (isClientSide) {
      // Client-side: Use API route (secure, no exposed credentials)
      console.log('🌐 Client-side: Fetching products from API route');
      const params = new URLSearchParams({
        ...(filters.category && { category: filters.category }),
        ...(filters.minPrice !== undefined && { minPrice: filters.minPrice.toString() }),
        ...(filters.maxPrice !== undefined && { maxPrice: filters.maxPrice.toString() }),
        ...(filters.sellerId && { sellerId: filters.sellerId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        orderByField,
        orderDirection,
        limit: limitCount.toString()
      });

      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } else {
      // Server-side: Use DynamoDB directly (secure, credentials in .env)
      console.log('🚀 Server-side: Using AWS DynamoDB directly');
      const { getProducts: getDynamoProducts } = await import('./awsDynamoService');
      return await getDynamoProducts(filters, orderByField, orderDirection, limitCount);
    }
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

/**
 * Get product by ID - uses API route on client, direct DynamoDB on server
 */
export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    if (isClientSide) {
      // Client-side: Use API route
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } else {
      // Server-side: Use DynamoDB directly
      const { getProductById: getDynamoProductById } = await import('./awsDynamoService');
      return await getDynamoProductById(productId);
    }
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
};

/**
 * Create product - uses API route on client, direct DynamoDB on server
 */
export const createProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    if (isClientSide) {
      // Client-side: Use API route with retry logic
      let lastError: any = null;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
            signal: AbortSignal.timeout(30000) // 30 second timeout
      });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            lastError = new Error(errorData.error || `API error: ${response.status}`);
            
            // Retry on 502/504 errors
            if ((response.status === 502 || response.status === 504) && attempt < maxRetries) {
              console.log(`⚠️ Retry attempt ${attempt}/${maxRetries} for product creation...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
              continue;
            }
            
            throw lastError;
          }
          
      const data = await response.json();
          return data.success ? (data.data?.id || data.id) : '';
        } catch (fetchError: any) {
          lastError = fetchError;
          
          // Retry on network errors
          if ((fetchError.name === 'AbortError' || fetchError.message?.includes('fetch')) && attempt < maxRetries) {
            console.log(`⚠️ Retry attempt ${attempt}/${maxRetries} for product creation...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          
          throw fetchError;
        }
      }
      
      throw lastError || new Error('Failed to create product after retries');
    } else {
      // Server-side: Use DynamoDB directly
      const { createProduct: createDynamoProduct } = await import('./awsDynamoService');
      return await createDynamoProduct(product);
    }
  } catch (error) {
    console.error('Error creating product in DynamoDB:', error);
    throw error;
  }
};

/**
 * Update product - uses API route on client, direct DynamoDB on server
 */
export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<void> => {
  try {
    if (isClientSide) {
      // Client-side: Use API route
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
    } else {
      // Server-side: Use DynamoDB directly
      const { updateProduct: updateDynamoProduct } = await import('./awsDynamoService');
      await updateDynamoProduct(productId, updates);
    }
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

/**
 * Delete product - uses API route on client, direct DynamoDB on server
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    if (isClientSide) {
      // Client-side: Use API route
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
    } else {
      // Server-side: Use DynamoDB directly
      const { deleteProduct: deleteDynamoProduct } = await import('./awsDynamoService');
      await deleteDynamoProduct(productId);
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

