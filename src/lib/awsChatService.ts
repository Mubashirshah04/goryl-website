/**
 * AWS DynamoDB Service for Chat
 * 
 * Pure AWS DynamoDB - replaces Firebase Realtime DB completely
 * Fast, scalable, cost-effective for chat
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

// AWS Configuration
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';
const CHATS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_CHATS_TABLE || 'goryl-chats';
const MESSAGES_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_MESSAGES_TABLE || 'goryl-messages';

// Get AWS Credentials (server-side only)
const getAWSCredentials = () => {
  // Server-side: prefer non-prefixed vars for security
  const accessKeyId = typeof window === 'undefined' 
    ? (process.env.AWS_ACCESS_KEY_ID || process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '')
    : '';
  const secretAccessKey = typeof window === 'undefined'
    ? (process.env.AWS_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '')
    : '';

  if (!accessKeyId || !secretAccessKey) {
    return undefined; // Let AWS SDK use default credential chain
  }

  return {
    accessKeyId,
    secretAccessKey,
  };
};

// Initialize DynamoDB Client
const dynamoClient = new DynamoDBClient({
  region: REGION,
  credentials: getAWSCredentials(),
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

// In-memory cache for ultra-fast loading
const chatsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export interface ChatMessage {
  id?: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  senderName?: string;
  senderPhoto?: string;
  text: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Chat {
  id: string;
  participants: string[];
  participantNames: { [key: string]: string };
  participantPhotos: { [key: string]: string };
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSender: string;
  unreadCount?: { [key: string]: number };
  createdAt: string;
  updatedAt: string;
}

/**
 * Get or create chat room
 */
export const getChatRoom = async (userId1: string, userId2: string): Promise<string> => {
  const participants = [userId1, userId2].sort();
  const chatId = participants.join('_');

  try {
    const command = new GetCommand({
      TableName: CHATS_TABLE,
      Key: { id: chatId },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      // Create new chat
      const chat: Chat = {
        id: chatId,
        participants,
        participantNames: {},
        participantPhotos: {},
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        lastMessageSender: '',
        unreadCount: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const createCommand = new PutCommand({
        TableName: CHATS_TABLE,
        Item: chat,
      });

      await docClient.send(createCommand);
    }

    return chatId;
  } catch (error) {
    console.error('Error getting/creating chat room:', error);
    throw error;
  }
};

/**
 * Send message
 */
export const sendMessage = async (
  senderId: string,
  receiverId: string,
  text: string,
  senderName?: string,
  senderPhoto?: string
): Promise<string> => {
  try {
    const chatId = await getChatRoom(senderId, receiverId);
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const message: ChatMessage = {
      id: messageId,
      chatId,
      senderId,
      receiverId,
      senderName,
      senderPhoto,
      text,
      read: false,
      createdAt: now,
    };

    // Save message
    const messageCommand = new PutCommand({
      TableName: MESSAGES_TABLE,
      Item: message,
    });

    await docClient.send(messageCommand);

    // Update chat metadata
    const chatUpdateCommand = new UpdateCommand({
      TableName: CHATS_TABLE,
      Key: { id: chatId },
      UpdateExpression: 'SET lastMessage = :msg, lastMessageTime = :time, lastMessageSender = :sender, updatedAt = :updated, ADD unreadCount.#receiver :inc',
      ExpressionAttributeNames: {
        '#receiver': receiverId,
      },
      ExpressionAttributeValues: {
        ':msg': text,
        ':time': now,
        ':sender': senderId,
        ':updated': now,
        ':inc': 1,
      },
    });

    await docClient.send(chatUpdateCommand);

    // Clear cache
    chatsCache.delete(chatId);

    return messageId;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Get messages for a chat
 */
export const getMessages = async (
  chatId: string,
  limit: number = 50
): Promise<ChatMessage[]> => {
  try {
    const command = new QueryCommand({
      TableName: MESSAGES_TABLE,
      IndexName: 'chatId-createdAt-index',
      KeyConditionExpression: 'chatId = :chatId',
      ExpressionAttributeValues: {
        ':chatId': chatId,
      },
      ScanIndexForward: false, // Newest first
      Limit: limit,
    });

    const response = await docClient.send(command);
    const messages = (response.Items || []) as ChatMessage[];

    // Sort by createdAt ascending for display
    return messages.reverse();
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

/**
 * Get user chats
 */
export const getUserChats = async (userId: string): Promise<Chat[]> => {
  // Check cache first
  const cacheKey = `chats_${userId}`;
  const cached = chatsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Query chats where user is a participant
    const command = new QueryCommand({
      TableName: CHATS_TABLE,
      IndexName: 'participants-updatedAt-index',
      KeyConditionExpression: 'participants = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: false, // Newest first
    });

    const response = await docClient.send(command);
    let chats = (response.Items || []) as Chat[];

    // Filter chats where userId is in participants array
    chats = chats.filter(chat => chat.participants.includes(userId));

    // Sort by lastMessageTime
    chats.sort((a, b) => {
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

    // Cache results
    chatsCache.set(cacheKey, { data: chats, timestamp: Date.now() });

    return chats;
  } catch (error) {
    console.error('Error getting user chats:', error);
    throw error;
  }
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (messageId: string, chatId: string, userId: string): Promise<void> => {
  try {
    // Update message
    const messageUpdateCommand = new UpdateCommand({
      TableName: MESSAGES_TABLE,
      Key: { id: messageId },
      UpdateExpression: 'SET #read = :read',
      ExpressionAttributeNames: {
        '#read': 'read',
      },
      ExpressionAttributeValues: {
        ':read': true,
      },
    });

    await docClient.send(messageUpdateCommand);

    // Reset unread count for user
    const chatUpdateCommand = new UpdateCommand({
      TableName: CHATS_TABLE,
      Key: { id: chatId },
      UpdateExpression: 'SET unreadCount.#userId = :zero',
      ExpressionAttributeNames: {
        '#userId': userId,
      },
      ExpressionAttributeValues: {
        ':zero': 0,
      },
    });

    await docClient.send(chatUpdateCommand);

    // Clear cache
    chatsCache.delete(chatId);
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

/**
 * Get unread count for chat
 */
export const getUnreadCount = async (chatId: string, userId: string): Promise<number> => {
  try {
    const command = new GetCommand({
      TableName: CHATS_TABLE,
      Key: { id: chatId },
    });

    const response = await docClient.send(command);
    const chat = response.Item as Chat;

    return chat?.unreadCount?.[userId] || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Subscribe to messages (polling-based for DynamoDB)
 * Note: For real-time updates, use AWS AppSync or WebSocket API Gateway
 */
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: ChatMessage[]) => void,
  pollInterval: number = 2000 // 2 seconds
): (() => void) => {
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;

    try {
      const messages = await getMessages(chatId);
      callback(messages);
    } catch (error) {
      console.error('Error polling messages:', error);
    }

    if (isActive) {
      setTimeout(poll, pollInterval);
    }
  };

  poll();

  // Return unsubscribe function
  return () => {
    isActive = false;
  };
};

/**
 * Subscribe to user chats (polling-based)
 */
export const subscribeToUserChats = (
  userId: string,
  callback: (chats: Chat[]) => void,
  pollInterval: number = 5000 // 5 seconds
): (() => void) => {
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;

    try {
      const chats = await getUserChats(userId);
      callback(chats);
    } catch (error) {
      console.error('Error polling chats:', error);
    }

    if (isActive) {
      setTimeout(poll, pollInterval);
    }
  };

  poll();

  // Return unsubscribe function
  return () => {
    isActive = false;
  };
};

export default {
  getChatRoom,
  sendMessage,
  getMessages,
  getUserChats,
  markMessageAsRead,
  getUnreadCount,
  subscribeToMessages,
  subscribeToUserChats,
};


