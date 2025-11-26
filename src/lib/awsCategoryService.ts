/**
 * AWS DynamoDB Service for Categories
 * 
 * Migrated from Firebase to AWS DynamoDB
 * Fast, scalable, cost-effective
 * 
 * SECURITY: Client-side calls go through API routes (no exposed credentials)
 * Server-side calls use DynamoDB directly
 */

import { GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

// AWS Configuration
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';
const CATEGORIES_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_CATEGORIES_TABLE || 'goryl-categories';

export interface Category {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  createdAt?: string;
  updatedAt?: string;
}

// In-memory cache for categories
const categoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Check if we're on the client or server
const isClientSide = typeof window !== 'undefined';

/**
 * Get all active categories - uses API route on client, direct DynamoDB on server
 */
export const getCategories = async (): Promise<Category[]> => {
  // Check cache first
  const cacheKey = 'categories_all';
  const cached = categoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    if (isClientSide) {
      // Client-side: Use API route (secure, no exposed credentials)
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      const categories = data.success ? data.data : [];

      // Cache the results
      categoryCache.set(cacheKey, { data: categories, timestamp: Date.now() });
      return categories;
    } else {
      // Server-side: Use DynamoDB directly
      const { getDynamoClient } = await import('./awsDynamoService');
      const { docClient } = getDynamoClient();

      if (!docClient) {
        console.error('❌ DynamoDB client not initialized - credentials may be missing');
        return getDefaultCategories();
      }

      const command = new ScanCommand({
        TableName: CATEGORIES_TABLE,
        FilterExpression: '#isActive = :isActive',
        ExpressionAttributeNames: {
          '#isActive': 'isActive'
        },
        ExpressionAttributeValues: {
          ':isActive': true
        }
      });

      const response = await docClient.send(command);
      let categories = (response.Items || []) as Category[];

      // Sort by sortOrder
      categories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

      // Cache the results
      categoryCache.set(cacheKey, { data: categories, timestamp: Date.now() });

      return categories;
    }
  } catch (error: any) {
    console.error('Error getting categories:', error);
    // Return default categories if DynamoDB fails
    return getDefaultCategories();
  }
};

/**
 * Get default categories as fallback
 */
const getDefaultCategories = (): Category[] => {
  return [
    { id: '1', name: 'Electronics', slug: 'electronics', isActive: true, sortOrder: 1, productCount: 0 },
    { id: '2', name: 'Fashion', slug: 'fashion', isActive: true, sortOrder: 2, productCount: 0 },
    { id: '3', name: 'Home & Garden', slug: 'home-garden', isActive: true, sortOrder: 3, productCount: 0 },
    { id: '4', name: 'Sports', slug: 'sports', isActive: true, sortOrder: 4, productCount: 0 },
    { id: '5', name: 'Books', slug: 'books', isActive: true, sortOrder: 5, productCount: 0 }
  ];
};

/**
 * Get category by ID
 */
export const getCategory = async (categoryId: string): Promise<Category | null> => {
  // Check cache first
  const cacheKey = `category_${categoryId}`;
  const cached = categoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    if (isClientSide) {
      // Client-side: Use API route (would need to create /api/categories/[id])
      // For now, fetch all and filter
      const categories = await getCategories();
      const category = categories.find(cat => cat.id === categoryId) || null;
      if (category) {
        categoryCache.set(cacheKey, { data: category, timestamp: Date.now() });
      }
      return category;
    } else {
      // Server-side: Use DynamoDB directly
      const { getDynamoClient } = await import('./awsDynamoService');
      const { docClient } = getDynamoClient();

      if (!docClient) {
        return null;
      }

      const command = new GetCommand({
        TableName: CATEGORIES_TABLE,
        Key: { id: categoryId }
      });

      const response = await docClient.send(command);

      if (response.Item) {
        const category = response.Item as Category;
        // Cache the result
        categoryCache.set(cacheKey, { data: category, timestamp: Date.now() });
        return category;
      }

      return null;
    }
  } catch (error) {
    console.error('Error getting category:', error);
    return null;
  }
};

// Alias for getCategory to satisfy interface requirements
export const getCategoryById = getCategory;

/**
 * Get category by slug
 */
export const getCategoryBySlug = async (slug: string): Promise<Category | null> => {
  try {
    if (isClientSide) {
      // Client-side: Fetch all and filter
      const categories = await getCategories();
      return categories.find(cat => cat.slug === slug) || null;
    } else {
      // Server-side: Use DynamoDB directly
      const { getDynamoClient } = await import('./awsDynamoService');
      const { docClient } = getDynamoClient();

      if (!docClient) {
        return null;
      }

      const command = new ScanCommand({
        TableName: CATEGORIES_TABLE,
        FilterExpression: 'slug = :slug AND #isActive = :isActive',
        ExpressionAttributeNames: {
          '#isActive': 'isActive'
        },
        ExpressionAttributeValues: {
          ':slug': slug,
          ':isActive': true
        },
        Limit: 1
      });

      const response = await docClient.send(command);

      if (response.Items && response.Items.length > 0) {
        return response.Items[0] as Category;
      }

      return null;
    }
  } catch (error) {
    console.error('Error getting category by slug:', error);
    return null;
  }
};

/**
 * Create category
 */
export const createCategory = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const category: Category = {
      ...categoryData,
      id: categoryId,
      createdAt: now,
      updatedAt: now
    };

    const { getDynamoClient } = await import('./awsDynamoService');
    const { docClient } = getDynamoClient();

    if (!docClient) {
      throw new Error('DynamoDB client not initialized');
    }

    const command = new PutCommand({
      TableName: CATEGORIES_TABLE,
      Item: category
    });

    await docClient.send(command);

    // Clear cache
    clearCategoryCache();

    return categoryId;
  } catch (error) {
    console.error('Error creating category in DynamoDB:', error);
    throw error;
  }
};

/**
 * Update category
 */
export const updateCategory = async (categoryId: string, updates: Partial<Category>): Promise<void> => {
  try {
    const updateExpression: string[] = [];
    const expressionAttributeValues: any = {};
    const expressionAttributeNames: any = { '#updatedAt': 'updatedAt' };

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const { getDynamoClient } = await import('./awsDynamoService');
    const { docClient } = getDynamoClient();

    if (!docClient) {
      throw new Error('DynamoDB client not initialized');
    }

    const command = new UpdateCommand({
      TableName: CATEGORIES_TABLE,
      Key: { id: categoryId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    });

    await docClient.send(command);

    // Clear cache
    clearCategoryCache();
    categoryCache.delete(`category_${categoryId}`);
  } catch (error) {
    console.error('Error updating category in DynamoDB:', error);
    throw error;
  }
};

/**
 * Delete category (soft delete - sets isActive to false)
 */
export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    await updateCategory(categoryId, { isActive: false });
  } catch (error) {
    console.error('Error deleting category in DynamoDB:', error);
    throw error;
  }
};

/**
 * Update category product count
 */
export const updateCategoryProductCount = async (categoryId: string, increment: boolean = true): Promise<void> => {
  try {
    const category = await getCategory(categoryId);
    if (!category) {
      console.warn(`Category ${categoryId} not found for product count update`);
      return;
    }

    const newCount = increment
      ? (category.productCount || 0) + 1
      : Math.max(0, (category.productCount || 0) - 1);

    await updateCategory(categoryId, { productCount: newCount });
  } catch (error) {
    console.error('Error updating category product count in DynamoDB:', error);
    // Don't throw error as this is not critical
  }
};

/**
 * Clear category cache
 */
export const clearCategoryCache = (): void => {
  categoryCache.clear();
};

export default {
  getCategories,
  getCategory,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryProductCount,
  clearCategoryCache,
  getCategoryById: getCategory
};
