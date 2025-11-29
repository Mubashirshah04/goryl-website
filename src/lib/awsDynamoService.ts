/**
 * AWS DynamoDB Service for Products
 * 
 * PURE AWS APPROACH:
 * - AWS DynamoDB for Products (replaces Firestore completely)
 * - Fast, scalable, cost-effective
 * - In-memory caching for instant loading
 * 
 * This service provides much faster product queries than Firestore
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand, DeleteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

// AWS Configuration
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1'; // Mumbai region for India
const PRODUCTS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_PRODUCTS_TABLE || 'goryl-products';

// Get AWS Credentials
export const getAWSCredentials = () => {
  // Try both NEXT_PUBLIC_ (for client) and non-prefixed (for server)
  const accessKeyId = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '';
  const secretAccessKey = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '';

  // Debug: Log credential status (without exposing actual secrets)
  // Only check on server-side to avoid client-side errors
  if (typeof window === 'undefined') {
    console.log('🔑 AWS Credentials Check (Server-side):');
    console.log(`  - Region: ${REGION}`);
    console.log(`  - Access Key ID: ${accessKeyId ? accessKeyId.substring(0, 8) + '...' + accessKeyId.substring(accessKeyId.length - 4) : 'MISSING'}`);
    console.log(`  - Secret Key: ${secretAccessKey ? '***SET***' : 'MISSING'}`);
    if (accessKeyId) {
      console.log(`  - Access Key Length: ${accessKeyId.length} (should be 20)`);
    }
    if (secretAccessKey) {
      console.log(`  - Secret Key Length: ${secretAccessKey.length} (should be 40+)`);
    }
    
    if (!accessKeyId || !secretAccessKey) {
      console.warn('⚠️ AWS Credentials not found in environment variables');
      console.warn('  Server-side: Will use AWS SDK default credential chain (IAM role, env vars, etc.)');
      console.warn('  Client-side: Should use API routes instead of direct DynamoDB calls');
    } else if (accessKeyId.length !== 20 || !accessKeyId.startsWith('AKIA')) {
      console.error('❌ AWS Access Key ID format is INVALID!');
      console.error('  - Should start with "AKIA"');
      console.error('  - Should be exactly 20 characters');
      console.error(`  - Current: "${accessKeyId.substring(0, 20)}" (length: ${accessKeyId.length})`);
    } else if (secretAccessKey.length < 40) {
      console.error('❌ AWS Secret Access Key format is INVALID!');
      console.error('  - Should be at least 40 characters');
      console.error(`  - Current length: ${secretAccessKey.length}`);
    } else {
      console.log('✅ AWS Credentials format looks correct!');
    }
  }

  // Server-side: use provided credentials if available, otherwise use default credential chain
  // Client-side should NEVER call this directly - use API routes instead
  if (!accessKeyId || !secretAccessKey) {
    if (typeof window === 'undefined') {
      // Server-side: can use IAM role or environment credentials
      // Return undefined to let AWS SDK use default credential chain
      console.log('⚠️ Server-side: No explicit credentials, using AWS SDK default credential chain');
      return undefined;
    } else {
      // Client-side: This should never happen - client should use API routes
      // Don't error, just return undefined - the calling code should handle it
      console.warn('⚠️ Client-side DynamoDB access detected - this should use API routes instead');
      return undefined;
    }
  }

  return {
    accessKeyId,
    secretAccessKey,
  };
};

// Initialize DynamoDB Client - lazy initialization for better error handling
let dynamoClient: DynamoDBClient | null = null;
let docClient: DynamoDBDocumentClient | null = null;

export const getDynamoClient = () => {
  // ✅ Prevent client-side direct DynamoDB access
  const isClientSide = typeof window !== 'undefined';
  if (isClientSide) {
    console.error('❌ getDynamoClient() cannot be called client-side. Use API routes instead.');
    console.error('   Stack trace:', new Error().stack);
    // Return a mock client that will fail gracefully instead of throwing
    // This prevents the app from crashing, but operations will fail
    return {
      dynamoClient: null as any,
      docClient: {
        send: async () => {
          throw new Error('Cannot use DynamoDB client on client-side. Use API routes instead.');
        }
      } as any
    };
  }

  if (!dynamoClient) {
    const credentials = getAWSCredentials();
    const config: any = {
      region: REGION,
    };
    
    // Only add credentials if they are provided
    if (credentials) {
      config.credentials = credentials;
    }
    
    dynamoClient = new DynamoDBClient(config);
    docClient = DynamoDBDocumentClient.from(dynamoClient);
  }
  return { dynamoClient, docClient: docClient! };
};

// In-memory cache for ultra-fast loading
const productCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Product Interface (same as Firestore)
export interface Product {
  id?: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  sellerId: string;
  sellerName: string;
  sellerPhoto?: string;
  seller?: {
    id: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
    rating: number;
  };
  likes: string[];
  views: number;
  rating: number;
  reviewCount: number;
  comments?: number;
  status: 'active' | 'inactive' | 'draft';
  tags?: string[];
  brand?: string;
  discount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  status?: 'active' | 'inactive' | 'draft' | 'pending';
  search?: string;
}

/**
 * Get product by ID (with caching)
 */
export const getProductById = async (productId: string): Promise<Product | null> => {
  // Check cache first
  const cacheKey = `product_${productId}`;
  const cached = productCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // ✅ Client-side: Use API route instead of direct DynamoDB access
  const isClientSide = typeof window !== 'undefined';
  if (isClientSide) {
    try {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        console.error(`❌ API error: ${response.status} - ${response.statusText}`);
        return null;
      }

      const result = await response.json();
      const product = result.data || result;

      if (product) {
        // Cache the result
        productCache.set(cacheKey, { data: product, timestamp: Date.now() });
        return product;
      }
      return null;
    } catch (error: any) {
      console.error('❌ Error fetching product from API:', error);
      return null;
    }
  }

  // ✅ Server-side: Direct DynamoDB access
  try {
    const { docClient } = getDynamoClient();
    
    // Check if DynamoDB client was successfully initialized
    if (!docClient) {
      console.error('❌ DynamoDB client not initialized - credentials may be missing');
      return null;
    }
    
    const command = new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId },
    });

    const response = await docClient.send(command);
    
    if (response.Item) {
      const product = response.Item as Product;
      // Cache the result
      productCache.set(cacheKey, { data: product, timestamp: Date.now() });
      return product;
    }

    return null;
  } catch (error: any) {
    console.error('❌ Error getting product from DynamoDB:', error);
    console.error('   Error name:', error.name);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    
    // Return null instead of throwing - allows app to continue
    return null;
  }
};

/**
 * Get products with filters (much faster than Firestore)
 */
export const getProducts = async (
  filters: ProductFilters = {},
  orderByField: string = 'createdAt',
  orderDirection: 'asc' | 'desc' = 'desc',
  limitCount: number = 20
): Promise<Product[]> => {
  // Check cache first
  const cacheKey = `products_${JSON.stringify(filters)}_${orderByField}_${orderDirection}_${limitCount}`;
  const cached = productCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // ✅ Client-side: Use API route instead of direct DynamoDB access
  const isClientSide = typeof window !== 'undefined';
  if (isClientSide) {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.sellerId) params.append('sellerId', filters.sellerId);
      if (filters.status) params.append('status', filters.status);
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.search) params.append('search', filters.search);
      params.append('orderByField', orderByField);
      params.append('orderDirection', orderDirection);
      params.append('limit', limitCount.toString());

      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) {
        console.error(`❌ API error: ${response.status} - ${response.statusText}`);
        return [];
      }

      const result = await response.json();
      const products = result.data || [];

      // Cache the results
      productCache.set(cacheKey, { data: products, timestamp: Date.now() });
      return products;
    } catch (error: any) {
      console.error('❌ Error fetching products from API:', error);
      return [];
    }
  }

  // ✅ Server-side: Direct DynamoDB access
  try {
    let command: QueryCommand | ScanCommand;

    // Optimize query based on filters
    if (filters.category || filters.sellerId || filters.status) {
      // Use Query (faster) when we have index filters
      const indexName = filters.category 
        ? 'category-createdAt-index'
        : filters.sellerId 
        ? 'sellerId-createdAt-index'
        : 'status-createdAt-index';

      const keyCondition: any = {};
      // Only add the key condition for the index we're actually using
      if (filters.category) {
        keyCondition.category = filters.category;
      } else if (filters.sellerId) {
        keyCondition.sellerId = filters.sellerId;
      } else if (filters.status) {
        keyCondition.status = filters.status || 'active';
      }

      // FilterExpression for price range
      let filterExpression = '';
      const expressionAttributeValues: any = {};
      
      if (filters.minPrice !== undefined) {
        filterExpression += 'price >= :minPrice';
        expressionAttributeValues[':minPrice'] = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        if (filterExpression) filterExpression += ' AND ';
        filterExpression += 'price <= :maxPrice';
        expressionAttributeValues[':maxPrice'] = filters.maxPrice;
      }

      // Build KeyConditionExpression and ExpressionAttributeNames
      // Only add attribute name if it's a reserved keyword (status)
      const keyField = Object.keys(keyCondition)[0];
      const keyValue = keyCondition[keyField];
      const expressionAttributeNames: any = {};
      
      // Only status is a reserved keyword, category and sellerId are fine
      if (keyField === 'status') {
        expressionAttributeNames['#status'] = 'status';
      }

      const keyAlias = keyField === 'status' ? '#status' : keyField;

      command = new QueryCommand({
        TableName: PRODUCTS_TABLE,
        IndexName: indexName,
        KeyConditionExpression: `${keyAlias} = :${keyField}`,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ExpressionAttributeValues: {
          ...expressionAttributeValues,
          [`:${keyField}`]: keyValue,
        },
        FilterExpression: filterExpression || undefined,
        Limit: limitCount,
        ScanIndexForward: orderDirection === 'asc', // true for ascending
      });
    } else {
      // Use Scan for general queries (slower but more flexible)
      let filterExpression = '';
      const expressionAttributeNames: any = {};
      const expressionAttributeValues: any = {};

      // Only filter by status if explicitly provided
      if (filters.status) {
        expressionAttributeNames['#status'] = 'status';
        filterExpression = '#status = :status';
        expressionAttributeValues[':status'] = filters.status;
      }

      if (filters.minPrice !== undefined) {
        if (filterExpression) filterExpression += ' AND ';
        filterExpression += 'price >= :minPrice';
        expressionAttributeValues[':minPrice'] = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        if (filterExpression) filterExpression += ' AND ';
        filterExpression += 'price <= :maxPrice';
        expressionAttributeValues[':maxPrice'] = filters.maxPrice;
      }

      command = new ScanCommand({
        TableName: PRODUCTS_TABLE,
        FilterExpression: filterExpression || undefined,
        ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
        ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
        Limit: limitCount,
      });
    }

    const { docClient } = getDynamoClient();
    
    // Check if DynamoDB client was successfully initialized
    if (!docClient) {
      console.error('❌ DynamoDB client not initialized - credentials may be missing');
      console.error('   Please check your .env.local file for AWS credentials');
      return []; // Return empty array instead of throwing
    }
    
    const response = await docClient.send(command);
    
    let products = (response.Items || []) as Product[];

    // Client-side search filter if provided
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      products = products.filter(product =>
        product.title.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.brand?.toLowerCase().includes(searchTerm) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Sort by orderByField (DynamoDB already sorted if using Query)
    if (response.ScannedCount === undefined || response.ScannedCount === 0) {
      // Manual sort for Scan results
      products.sort((a, b) => {
        const aVal = a[orderByField as keyof Product] as any;
        const bVal = b[orderByField as keyof Product] as any;
        
        if (orderDirection === 'desc') {
          return bVal > aVal ? 1 : -1;
        } else {
          return aVal > bVal ? 1 : -1;
        }
      });
    }

    // Limit results
    products = products.slice(0, limitCount);

    // Cache the results
    productCache.set(cacheKey, { data: products, timestamp: Date.now() });

    return products;
  } catch (error: any) {
    console.error('❌ Error getting products from DynamoDB:', error);
    console.error('   Error name:', error.name);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    
    // Check for specific AWS errors
    if (error.name === 'UnrecognizedClientException' || error.code === 'UnrecognizedClientException') {
      console.error('   ⚠️ AWS credentials are invalid or missing');
      console.error('   Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local');
    } else if (error.name === 'ResourceNotFoundException' || error.code === 'ResourceNotFoundException') {
      console.error('   ⚠️ DynamoDB table does not exist:', PRODUCTS_TABLE);
      console.error('   Please create the table in AWS DynamoDB Console');
    } else if (error.message?.includes('credential')) {
      console.error('   ⚠️ AWS credentials issue detected');
      console.error('   Please verify your AWS credentials in .env.local');
    }
    
    // Return empty array instead of throwing - allows app to continue
    console.warn('   Returning empty array - app will continue without products');
    return [];
  }
};

/**
 * Create product
 */
export const createProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const productData: Product = {
      ...product,
      id: productId,
      createdAt: now,
      updatedAt: now,
      views: 0,
      rating: 0,
      reviewCount: 0,
      likes: [],
    };

    const { docClient } = getDynamoClient();
    const command = new PutCommand({
      TableName: PRODUCTS_TABLE,
      Item: productData,
    });

    await docClient.send(command);

    // Clear cache
    clearProductCache();

    return productId;
  } catch (error) {
    console.error('Error creating product in DynamoDB:', error);
    throw error;
  }
};

/**
 * Update product
 */
export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<Product | null> => {
  try {
    const updateExpression: string[] = [];
    const expressionAttributeValues: any = {};
    const expressionAttributeNames: any = {};

    Object.entries(updates).forEach(([key, value]) => {
      updateExpression.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    });

    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const { docClient } = getDynamoClient();
    const command = new UpdateCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);

    // Clear cache
    clearProductCache();
    productCache.delete(`product_${productId}`);

    return result.Attributes as Product || null;
  } catch (error) {
    console.error('Error updating product in DynamoDB:', error);
    throw error;
  }
};

/**
 * Delete product
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const { docClient } = getDynamoClient();
    const command = new DeleteCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: productId },
    });

    await docClient.send(command);

    // Clear cache
    clearProductCache();
    productCache.delete(`product_${productId}`);
  } catch (error) {
    console.error('Error deleting product from DynamoDB:', error);
    throw error;
  }
};

/**
 * Clear product cache
 */
export const clearProductCache = (): void => {
  productCache.clear();
};

/**
 * Get cache stats
 */
export const getCacheStats = () => {
  return {
    cacheSize: productCache.size,
    cacheKeys: Array.from(productCache.keys()),
  };
};

export default {
  getProductById,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  clearProductCache,
  getCacheStats,
};

