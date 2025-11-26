/**
 * AWS DynamoDB Service for Likes
 * 
 * Migrated from Firebase to AWS DynamoDB
 * Fast, scalable, cost-effective
 */

import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoClient } from './awsDynamoService';
import { updateProduct } from './awsDynamoService';

// AWS Configuration
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';
const LIKES_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_LIKES_TABLE || 'goryl-likes';

export interface Like {
  id?: string;
  userId: string;
  targetType: 'product' | 'review' | 'comment';
  targetId: string;
  createdAt?: string;
}

/**
 * Like an item (product, review, or comment)
 */
export const likeItem = async (userId: string, targetType: Like['targetType'], targetId: string): Promise<void> => {
  try {
    const likeId = `${userId}_${targetType}_${targetId}`;
    const now = new Date().toISOString();

    // Check if already liked
    const existingLike = await isItemLiked(userId, targetType, targetId);
    if (existingLike) {
      console.log('Item already liked');
      return;
    }

    const { docClient } = getDynamoClient();
    
    // Create like record
    const likeCommand = new PutCommand({
      TableName: LIKES_TABLE,
      Item: {
        id: likeId,
        userId,
        targetType,
        targetId,
        createdAt: now
      }
    });

    await docClient.send(likeCommand);

    // Update target item's like count
    if (targetType === 'product') {
      // Get current product to update like count
      const { getProductById } = await import('./awsDynamoService');
      const product = await getProductById(targetId);
      if (product) {
        const currentLikes = product.likes || [];
        if (!currentLikes.includes(userId)) {
          await updateProduct(targetId, {
            likes: [...currentLikes, userId]
          });
        }
      }
    } else if (targetType === 'comment') {
      // Update comment likes (would need to implement comment service first)
      // For now, we'll just create the like record
    }

    console.log(`✅ Liked ${targetType} ${targetId} by user ${userId}`);
  } catch (error) {
    console.error('Error liking item in DynamoDB:', error);
    throw error;
  }
};

/**
 * Unlike an item
 */
export const unlikeItem = async (userId: string, targetType: Like['targetType'], targetId: string): Promise<void> => {
  try {
    const likeId = `${userId}_${targetType}_${targetId}`;
    const { docClient } = getDynamoClient();

    // Delete like record
    const deleteCommand = new DeleteCommand({
      TableName: LIKES_TABLE,
      Key: { id: likeId }
    });

    await docClient.send(deleteCommand);

    // Update target item's like count
    if (targetType === 'product') {
      const { getProductById } = await import('./awsDynamoService');
      const product = await getProductById(targetId);
      if (product) {
        const currentLikes = product.likes || [];
        const updatedLikes = currentLikes.filter(id => id !== userId);
        await updateProduct(targetId, {
          likes: updatedLikes
        });
      }
    }

    console.log(`✅ Unliked ${targetType} ${targetId} by user ${userId}`);
  } catch (error) {
    console.error('Error unliking item in DynamoDB:', error);
    throw error;
  }
};

/**
 * Check if item is liked by user
 */
export const isItemLiked = async (userId: string, targetType: Like['targetType'], targetId: string): Promise<boolean> => {
  try {
    const likeId = `${userId}_${targetType}_${targetId}`;
    const { docClient } = getDynamoClient();

    const command = new GetCommand({
      TableName: LIKES_TABLE,
      Key: { id: likeId }
    });

    const response = await docClient.send(command);
    return !!response.Item;
  } catch (error) {
    console.error('Error checking if item is liked in DynamoDB:', error);
    return false;
  }
};

/**
 * Get like count for an item
 */
export const getLikeCount = async (targetType: Like['targetType'], targetId: string): Promise<number> => {
  try {
    const { docClient } = getDynamoClient();
    
    const command = new QueryCommand({
      TableName: LIKES_TABLE,
      IndexName: 'targetType-targetId-index', // Assuming this GSI exists
      KeyConditionExpression: 'targetType = :targetType AND targetId = :targetId',
      ExpressionAttributeValues: {
        ':targetType': targetType,
        ':targetId': targetId
      }
    });

    const response = await docClient.send(command);
    return response.Items?.length || 0;
  } catch (error) {
    // If GSI doesn't exist, fall back to scan (slower but works)
    try {
      const { docClient } = getDynamoClient();
      const command = new QueryCommand({
        TableName: LIKES_TABLE,
        FilterExpression: 'targetType = :targetType AND targetId = :targetId',
        ExpressionAttributeValues: {
          ':targetType': targetType,
          ':targetId': targetId
        }
      });

      const response = await docClient.send(command);
      return response.Items?.length || 0;
    } catch (scanError) {
      console.error('Error getting like count from DynamoDB:', scanError);
      return 0;
    }
  }
};

/**
 * Get all likes for a user
 */
export const getUserLikes = async (userId: string, targetType?: Like['targetType']): Promise<Like[]> => {
  try {
    const { docClient } = getDynamoClient();
    
    let command;
    if (targetType) {
      command = new QueryCommand({
        TableName: LIKES_TABLE,
        IndexName: 'userId-targetType-index', // Assuming this GSI exists
        KeyConditionExpression: 'userId = :userId AND targetType = :targetType',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':targetType': targetType
        }
      });
    } else {
      command = new QueryCommand({
        TableName: LIKES_TABLE,
        IndexName: 'userId-createdAt-index', // Assuming this GSI exists
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      });
    }

    const response = await docClient.send(command);
    return (response.Items || []) as Like[];
  } catch (error) {
    console.error('Error getting user likes from DynamoDB:', error);
    return [];
  }
};

export default {
  likeItem,
  unlikeItem,
  isItemLiked,
  getLikeCount,
  getUserLikes
};

