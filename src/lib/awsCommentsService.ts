/**
 * AWS DynamoDB Service for Reel Comments
 * 
 * Replaces Firebase Firestore comments with DynamoDB
 * NO FIREBASE - Pure AWS
 */

import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoClient } from './awsDynamoService';

const COMMENTS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_COMMENTS_TABLE || 'goryl-reel-comments';

export interface ReelComment {
  id: string; // Primary key: comment_<timestamp>_<random>
  reelId: string; // Partition key for GSI
  userId: string;
  userName: string;
  userPhotoURL?: string;
  text: string;
  content?: string; // For compatibility
  likesCount: number;
  likedBy: string[]; // Array of user IDs who liked
  parentCommentId?: string; // For replies
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Add comment to reel
 */
export const addReelComment = async (
  reelId: string,
  userId: string,
  userName: string,
  userPhoto: string,
  content: string,
  parentCommentId?: string
): Promise<string> => {
  try {
    const { docClient } = getDynamoClient();
    if (!docClient) {
      throw new Error('DynamoDB client not initialized');
    }

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const comment: ReelComment = {
      id: commentId,
      reelId,
      userId,
      userName,
      userPhotoURL: userPhoto,
      text: content,
      content, // Keep both for compatibility
      likesCount: 0,
      likedBy: [],
      parentCommentId,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: COMMENTS_TABLE,
      Item: comment,
    });

    await docClient.send(command);

    // Update reel comment count using AWS Reels Service
    try {
      const { getReelById, updateReel } = await import('./awsReelsService');
      const reel = await getReelById(reelId);
      if (reel) {
        await updateReel(reelId, {
          comments: (reel.comments || 0) + 1,
        });
      }
    } catch (error) {
      console.warn('Error updating reel comment count:', error);
    }

    console.log('✅ Added comment to reel in DynamoDB');
    return commentId;
  } catch (error: any) {
    console.error('Error adding reel comment:', error);
    throw error;
  }
};

/**
 * Get reel comments
 */
export const getReelComments = async (reelId: string, limitCount: number = 50): Promise<ReelComment[]> => {
  try {
    const { docClient } = getDynamoClient();
    if (!docClient) {
      console.warn('DynamoDB client not initialized - returning empty comments');
      return [];
    }

    const command = new QueryCommand({
      TableName: COMMENTS_TABLE,
      IndexName: 'reelId-createdAt-index', // GSI for querying by reelId
      KeyConditionExpression: 'reelId = :reelId',
      ExpressionAttributeValues: {
        ':reelId': reelId,
      },
      ScanIndexForward: false, // Descending order (newest first)
      Limit: limitCount,
    });

    const response = await docClient.send(command);
    return (response.Items as ReelComment[]) || [];
  } catch (error: any) {
    // Handle ResourceNotFoundException
    if (error.name === 'ResourceNotFoundException' || error.message?.includes('not found')) {
      console.warn(`⚠️ DynamoDB table "${COMMENTS_TABLE}" not found - returning empty comments`);
      return [];
    }
    
    console.error('Error getting reel comments:', error);
    return [];
  }
};

/**
 * Subscribe to reel comments (ULTRA FAST polling for real-time feel)
 */
export const subscribeToReelComments = (
  reelId: string,
  callback: (comments: ReelComment[]) => void,
  pollInterval: number = 1000 // Poll every 1 second for near real-time
): (() => void) => {
  let isActive = true;

  const fetchComments = async () => {
    if (!isActive) return;
    
    try {
      const comments = await getReelComments(reelId);
      callback(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      callback([]);
    }
  };

  // Fetch immediately
  fetchComments();

  // Poll for updates (very fast for real-time feel)
  const interval = setInterval(fetchComments, pollInterval);

  // Return unsubscribe function
  return () => {
    isActive = false;
    clearInterval(interval);
  };
};

/**
 * Like a reel comment
 */
export const likeReelComment = async (reelId: string, commentId: string, userId: string): Promise<void> => {
  try {
    const { docClient } = getDynamoClient();
    if (!docClient) {
      throw new Error('DynamoDB client not initialized');
    }

    // Get current comment
    const getCommand = new GetCommand({
      TableName: COMMENTS_TABLE,
      Key: { id: commentId },
    });

    const response = await docClient.send(getCommand);
    if (!response.Item) {
      throw new Error('Comment not found');
    }

    const comment = response.Item as ReelComment;
    const isLiked = comment.likedBy?.includes(userId) || false;

    if (isLiked) {
      // Already liked, do nothing
      return;
    }

    // Update comment - add userId to likedBy array
    const currentLikedBy = comment.likedBy || [];
    const newLikedBy = [...currentLikedBy, userId];

    const updateCommand = new UpdateCommand({
      TableName: COMMENTS_TABLE,
      Key: { id: commentId },
      UpdateExpression: 'SET likesCount = likesCount + :inc, likedBy = :likedBy, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':likedBy': newLikedBy,
        ':updatedAt': new Date().toISOString(),
      },
    });

    await docClient.send(updateCommand);
    console.log('✅ Liked comment in DynamoDB');
  } catch (error: any) {
    console.error('Error liking reel comment:', error);
    throw error;
  }
};

/**
 * Unlike a reel comment
 */
export const unlikeReelComment = async (reelId: string, commentId: string, userId: string): Promise<void> => {
  try {
    const { docClient } = getDynamoClient();
    if (!docClient) {
      throw new Error('DynamoDB client not initialized');
    }

    // Get current comment
    const getCommand = new GetCommand({
      TableName: COMMENTS_TABLE,
      Key: { id: commentId },
    });

    const response = await docClient.send(getCommand);
    if (!response.Item) {
      throw new Error('Comment not found');
    }

    const comment = response.Item as ReelComment;
    const isLiked = comment.likedBy?.includes(userId) || false;

    if (!isLiked) {
      // Not liked, do nothing
      return;
    }

    // Remove userId from likedBy array
    const newLikedBy = (comment.likedBy || []).filter(id => id !== userId);

    // Update comment
    const updateCommand = new UpdateCommand({
      TableName: COMMENTS_TABLE,
      Key: { id: commentId },
      UpdateExpression: 'SET likesCount = likesCount - :dec, likedBy = :likedBy, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':dec': 1,
        ':likedBy': newLikedBy,
        ':updatedAt': new Date().toISOString(),
      },
    });

    await docClient.send(updateCommand);
    console.log('✅ Unliked comment in DynamoDB');
  } catch (error: any) {
    console.error('Error unliking reel comment:', error);
    throw error;
  }
};

/**
 * Delete a comment
 */
export const deleteReelComment = async (reelId: string, commentId: string): Promise<void> => {
  try {
    const { docClient } = getDynamoClient();
    if (!docClient) {
      throw new Error('DynamoDB client not initialized');
    }

    const command = new DeleteCommand({
      TableName: COMMENTS_TABLE,
      Key: { id: commentId },
    });

    await docClient.send(command);

    // Update reel comment count
    try {
      const { getReelById, updateReel } = await import('./awsReelsService');
      const reel = await getReelById(reelId);
      if (reel) {
        await updateReel(reelId, {
          comments: Math.max(0, (reel.comments || 0) - 1),
        });
      }
    } catch (error) {
      console.warn('Error updating reel comment count:', error);
    }

    console.log('✅ Deleted comment from DynamoDB');
  } catch (error: any) {
    console.error('Error deleting reel comment:', error);
    throw error;
  }
};

export default {
  addReelComment,
  getReelComments,
  subscribeToReelComments,
  likeReelComment,
  unlikeReelComment,
  deleteReelComment,
};

