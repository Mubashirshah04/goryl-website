/**
 * AWS DynamoDB Wishlist Service
 * 
 * Replaces Firestore wishlist with AWS DynamoDB
 * NO FIREBASE - Pure AWS
 */

import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoClient } from './awsDynamoService';

const WISHLIST_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_WISHLIST_TABLE || 'goryl-wishlists';

interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: any;
  addedAt: string;
}

/**
 * Add product to wishlist
 */
export const addToWishlist = async (userId: string, productId: string, product: any): Promise<void> => {
  // ✅ Client-side: Use API route instead of direct DynamoDB access
  const isClientSide = typeof window !== 'undefined';
  if (isClientSide) {
    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId, product }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to wishlist');
      }

      console.log('✅ Added product to wishlist via API');
      return;
    } catch (error: any) {
      console.error('❌ Error adding to wishlist via API:', error);
      throw error;
    }
  }

  // ✅ Server-side: Direct DynamoDB access
  try {
    const { docClient } = getDynamoClient();
    if (!docClient) {
      throw new Error('DynamoDB client not initialized');
    }

    // Check if item already exists
    const existing = await isInWishlist(userId, productId);
    if (existing) {
      throw new Error('Product already in wishlist');
    }

    // Add wishlist item
    const wishlistItem: WishlistItem = {
      id: `${userId}_${productId}`,
      userId,
      productId,
      product,
      addedAt: new Date().toISOString(),
    };

    const command = new PutCommand({
      TableName: WISHLIST_TABLE,
      Item: wishlistItem,
    });

    await docClient.send(command);
    console.log('✅ Added product to wishlist in DynamoDB');
  } catch (error: any) {
    // Handle ResourceNotFoundException (table doesn't exist) - check multiple ways
    const errorName = error?.name || '';
    const errorMessage = error?.message || '';
    const errorCode = error?.$metadata?.httpStatusCode || error?.code || '';
    
    const isResourceNotFound = 
      errorName === 'ResourceNotFoundException' ||
      errorName === 'ResourceNotFound' ||
      errorMessage.toLowerCase().includes('not found') ||
      errorMessage.toLowerCase().includes('does not exist') ||
      errorMessage.toLowerCase().includes('requested resource not found') ||
      errorCode === 404 ||
      errorCode === 'ResourceNotFoundException';
    
    if (isResourceNotFound) {
      console.error(`❌ DynamoDB table "${WISHLIST_TABLE}" not found. Please create the table first.`);
      throw new Error(`Wishlist table not found. Please create the DynamoDB table "${WISHLIST_TABLE}" in AWS Console.`);
    }
    
    console.error('Error adding to wishlist:', error);
    throw error;
  }
};

/**
 * Remove product from wishlist
 */
export const removeFromWishlist = async (userId: string, productId: string): Promise<void> => {
  // ✅ Client-side: Use API route instead of direct DynamoDB access
  const isClientSide = typeof window !== 'undefined';
  if (isClientSide) {
    try {
      const response = await fetch(`/api/wishlist?userId=${userId}&productId=${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove from wishlist');
      }

      console.log('✅ Removed product from wishlist via API');
      return;
    } catch (error: any) {
      console.error('❌ Error removing from wishlist via API:', error);
      throw error;
    }
  }

  // ✅ Server-side: Direct DynamoDB access
  try {
    const { docClient } = getDynamoClient();
    if (!docClient) {
      throw new Error('DynamoDB client not initialized');
    }

    const command = new DeleteCommand({
      TableName: WISHLIST_TABLE,
      Key: {
        id: `${userId}_${productId}`,
      },
    });

    await docClient.send(command);
    console.log('✅ Removed product from wishlist in DynamoDB');
  } catch (error: any) {
    // Handle ResourceNotFoundException (table doesn't exist) - check multiple ways
    const errorName = error?.name || '';
    const errorMessage = error?.message || '';
    const errorCode = error?.$metadata?.httpStatusCode || error?.code || '';
    
    const isResourceNotFound = 
      errorName === 'ResourceNotFoundException' ||
      errorName === 'ResourceNotFound' ||
      errorMessage.toLowerCase().includes('not found') ||
      errorMessage.toLowerCase().includes('does not exist') ||
      errorMessage.toLowerCase().includes('requested resource not found') ||
      errorCode === 404 ||
      errorCode === 'ResourceNotFoundException';
    
    if (isResourceNotFound) {
      console.warn(`⚠️ DynamoDB table "${WISHLIST_TABLE}" not found - operation skipped`);
      return; // Silently succeed if table doesn't exist
    }
    
    console.error('Error removing from wishlist:', error);
    throw error;
  }
};

/**
 * Get user's wishlist
 */
export const getUserWishlist = async (userId: string): Promise<WishlistItem[]> => {
  // ✅ Client-side: Use API route instead of direct DynamoDB access
  const isClientSide = typeof window !== 'undefined';
  if (isClientSide) {
    try {
      const response = await fetch(`/api/wishlist?userId=${userId}`);
      if (!response.ok) {
        console.error(`❌ API error: ${response.status} - ${response.statusText}`);
        return [];
      }

      const result = await response.json();
      return result.data || [];
    } catch (error: any) {
      console.error('❌ Error fetching wishlist from API:', error);
      return [];
    }
  }

  // ✅ Server-side: Direct DynamoDB access
  try {
    const { docClient } = getDynamoClient();
    if (!docClient) {
      console.warn('DynamoDB client not initialized - returning empty wishlist');
      return [];
    }

    const command = new QueryCommand({
      TableName: WISHLIST_TABLE,
      IndexName: 'userId-index', // GSI for querying by userId
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    });

    const response = await docClient.send(command);
    return (response.Items as WishlistItem[]) || [];
  } catch (error: any) {
    // Handle ResourceNotFoundException (table doesn't exist) - check multiple ways
    const errorName = error?.name || '';
    const errorMessage = error?.message || '';
    const errorCode = error?.$metadata?.httpStatusCode || error?.code || '';
    
    const isResourceNotFound = 
      errorName === 'ResourceNotFoundException' ||
      errorName === 'ResourceNotFound' ||
      errorMessage.toLowerCase().includes('not found') ||
      errorMessage.toLowerCase().includes('does not exist') ||
      errorMessage.toLowerCase().includes('requested resource not found') ||
      errorCode === 404 ||
      errorCode === 'ResourceNotFoundException';
    
    if (isResourceNotFound) {
      console.warn(`⚠️ DynamoDB table "${WISHLIST_TABLE}" not found.`);
      console.warn('💡 Please create the table in AWS Console with:');
      console.warn('   - Table Name:', WISHLIST_TABLE);
      console.warn('   - Primary Key: id (String)');
      console.warn('   - GSI Name: userId-index');
      console.warn('   - GSI Partition Key: userId (String)');
      return [];
    }
    
    // Handle other errors
    console.error('Error getting user wishlist:', {
      name: errorName,
      message: errorMessage,
      code: errorCode,
      error: error
    });
    return [];
  }
};

/**
 * Check if product is in wishlist
 */
export const isInWishlist = async (userId: string, productId: string): Promise<boolean> => {
  // ✅ Client-side: Use API route instead of direct DynamoDB access
  const isClientSide = typeof window !== 'undefined';
  if (isClientSide) {
    try {
      const response = await fetch(`/api/wishlist/check?userId=${userId}&productId=${productId}`);
      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.inWishlist || false;
    } catch (error: any) {
      console.error('❌ Error checking wishlist from API:', error);
      return false;
    }
  }

  // ✅ Server-side: Direct DynamoDB access
  try {
    const { docClient } = getDynamoClient();
    if (!docClient) {
      return false;
    }

    const command = new GetCommand({
      TableName: WISHLIST_TABLE,
      Key: {
        id: `${userId}_${productId}`,
      },
    });

    const response = await docClient.send(command);
    return !!response.Item;
  } catch (error: any) {
    // Handle ResourceNotFoundException (table doesn't exist) - check multiple ways
    const errorName = error?.name || '';
    const errorMessage = error?.message || '';
    const errorCode = error?.$metadata?.httpStatusCode || error?.code || '';
    
    const isResourceNotFound = 
      errorName === 'ResourceNotFoundException' ||
      errorName === 'ResourceNotFound' ||
      errorMessage.toLowerCase().includes('not found') ||
      errorMessage.toLowerCase().includes('does not exist') ||
      errorMessage.toLowerCase().includes('requested resource not found') ||
      errorCode === 404 ||
      errorCode === 'ResourceNotFoundException';
    
    if (isResourceNotFound) {
      console.warn(`⚠️ DynamoDB table "${WISHLIST_TABLE}" not found - returning false`);
      return false;
    }
    
    console.error('Error checking wishlist status:', error);
    return false;
  }
};

/**
 * Get wishlist count
 */
export const getWishlistCount = async (userId: string): Promise<number> => {
  try {
    const wishlist = await getUserWishlist(userId);
    return wishlist.length;
  } catch (error: any) {
    console.error('Error getting wishlist count:', error);
    return 0;
  }
};

export default {
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
  isInWishlist,
  getWishlistCount,
};

