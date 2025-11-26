/**
 * AWS DynamoDB Comment Service
 * Replaces Firestore for Product Comments
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

import { AWS_CONFIG } from './awsConfig';

// Initialize DynamoDB Client with proper configuration
const client = new DynamoDBClient({
  region: AWS_CONFIG.region,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || ''
  }
});

// Configure DynamoDB Document Client
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true }
});

// Use configured table name
const TABLE_NAME = process.env.NEXT_PUBLIC_AWS_COMMENTS_TABLE || 'ProductComments';

export interface Comment {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  comment: string;
  createdAt: string; // ISO String
  replies?: Comment[];
}

/**
 * Add a new comment
 */
export const addComment = async (comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> => {
  const newComment: Comment = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    ...comment,
    replies: []
  };

  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: newComment,
    });

    await docClient.send(command);
    return newComment;
  } catch (error) {
    console.error('Error adding comment to DynamoDB:', error);
    throw error;
  }
};

/**
 * Get comments for a product
 */
export const getComments = async (productId: string): Promise<Comment[]> => {
  try {
    // Note: In a real app, you'd want a GSI on productId. 
    // For now, we'll use Scan if GSI isn't set up, or Query if it is.
    // Assuming simple Scan for small scale or Query if Primary Key is productId (unlikely for comments)
    // Best practice: GSI on productId

    // Using Scan with filter for simplicity in migration (optimize later with GSI)
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'productId = :pid',
      ExpressionAttributeValues: {
        ':pid': productId,
      },
    });

    const response = await docClient.send(command);
    const comments = (response.Items || []) as Comment[];

    // Sort by createdAt desc
    return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching comments from DynamoDB:', error);
    return [];
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        id: commentId,
      },
    });

    await docClient.send(command);
  } catch (error) {
    console.error('Error deleting comment from DynamoDB:', error);
    throw error;
  }
};
