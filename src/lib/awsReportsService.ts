/**
 * AWS DynamoDB Service for Reports
 * 
 * Replaces Firebase Firestore reports with DynamoDB
 * NO FIREBASE - Pure AWS
 */

import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoClient } from './awsDynamoService';

const REPORTS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_REPORTS_TABLE || 'goryl-reports';

export interface Report {
  id?: string;
  type: 'reel' | 'product' | 'user' | 'comment';
  targetId: string;
  reporterId: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Report a reel (or other content)
 */
export const reportReel = async (
  reelId: string,
  userId: string,
  reason: string,
  description?: string
): Promise<string> => {
  try {
    const { docClient } = getDynamoClient();
    if (!docClient) {
      throw new Error('DynamoDB client not initialized');
    }

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const report: Report = {
      id: reportId,
      type: 'reel',
      targetId: reelId,
      reporterId: userId,
      reason,
      description: description || '',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: REPORTS_TABLE,
      Item: report,
    });

    await docClient.send(command);
    console.log('✅ Report submitted to DynamoDB');
    return reportId;
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException' || error.message?.includes('not found')) {
      console.warn(`⚠️ DynamoDB table "${REPORTS_TABLE}" not found - report not saved`);
      // Return a fake ID so the UI doesn't break
      return `report_${Date.now()}`;
    }
    console.error('Error reporting reel:', error);
    throw error;
  }
};

export default {
  reportReel,
};

