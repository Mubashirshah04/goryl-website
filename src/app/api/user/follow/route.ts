import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';
const USERS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_USERS_TABLE || 'goryl-users';

// Initialize DynamoDB client (server-side only)
const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

/**
 * POST /api/user/follow
 * Follow a user - AWS DynamoDB
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, targetUserId } = body;
    
    console.log('📌 Follow API received:', { userId, targetUserId });

    if (!userId || !targetUserId) {
      console.error('❌ Missing IDs:', { userId, targetUserId });
      return NextResponse.json(
        { error: 'User ID and target user ID required' },
        { status: 400 }
      );
    }

    if (userId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Get current user
    const currentUserCmd = new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: userId }
    });
    const currentUserResult = await docClient.send(currentUserCmd);
    const currentUser = currentUserResult.Item;

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found' },
        { status: 404 }
      );
    }

    // Get target user
    const targetUserCmd = new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: targetUserId }
    });
    const targetUserResult = await docClient.send(targetUserCmd);
    const targetUser = targetUserResult.Item;

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Add to following list if not already there
    const currentFollowing = currentUser.following || [];
    if (!currentFollowing.includes(targetUserId)) {
      const updateCmd = new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { id: userId },
        UpdateExpression: 'SET following = list_append(if_not_exists(following, :empty), :newFollowing)',
        ExpressionAttributeValues: {
          ':empty': [],
          ':newFollowing': [targetUserId]
        }
      });
      await docClient.send(updateCmd);
      console.log('✅ Follow API: Added to following list');
    }

    // Add to followers list if not already there
    const targetFollowers = targetUser.followers || [];
    if (!targetFollowers.includes(userId)) {
      const updateCmd = new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { id: targetUserId },
        UpdateExpression: 'SET followers = list_append(if_not_exists(followers, :empty), :newFollower)',
        ExpressionAttributeValues: {
          ':empty': [],
          ':newFollower': [userId]
        }
      });
      await docClient.send(updateCmd);
      console.log('✅ Follow API: Added to followers list');
    }

    return NextResponse.json({ success: true, message: 'Followed successfully' });
  } catch (error: any) {
    console.error('❌ Error following user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to follow user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/follow
 * Unfollow a user - AWS DynamoDB
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId, targetUserId } = await request.json();

    if (!userId || !targetUserId) {
      return NextResponse.json(
        { error: 'User ID and target user ID required' },
        { status: 400 }
      );
    }

    // Get current user
    const currentUserCmd = new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: userId }
    });
    const currentUserResult = await docClient.send(currentUserCmd);
    const currentUser = currentUserResult.Item;

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Current user not found' },
        { status: 404 }
      );
    }

    // Get target user
    const targetUserCmd = new GetCommand({
      TableName: USERS_TABLE,
      Key: { id: targetUserId }
    });
    const targetUserResult = await docClient.send(targetUserCmd);
    const targetUser = targetUserResult.Item;

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Remove from following list
    const currentFollowing = currentUser.following || [];
    const updatedFollowing = currentFollowing.filter((id: string) => id !== targetUserId);
    
    const updateFollowingCmd = new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: 'SET following = :following',
      ExpressionAttributeValues: {
        ':following': updatedFollowing
      }
    });
    await docClient.send(updateFollowingCmd);

    // Remove from followers list
    const targetFollowers = targetUser.followers || [];
    const updatedFollowers = targetFollowers.filter((id: string) => id !== userId);
    
    const updateFollowersCmd = new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { id: targetUserId },
      UpdateExpression: 'SET followers = :followers',
      ExpressionAttributeValues: {
        ':followers': updatedFollowers
      }
    });
    await docClient.send(updateFollowersCmd);

    return NextResponse.json({ success: true, message: 'Unfollowed successfully' });
  } catch (error: any) {
    console.error('❌ Error unfollowing user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}
