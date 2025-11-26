/**
 * AWS Admin Service
 * Handles all admin-related operations using AWS services
 * - DynamoDB for data storage
 * - Lambda for backend operations
 * - API Gateway for REST endpoints
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// Table names from environment variables
const USERS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_USERS_TABLE || 'goryl-users';
const PRODUCTS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_PRODUCTS_TABLE || 'goryl-products';
const ORDERS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_ORDERS_TABLE || 'goryl-orders';
const AUDIT_LOGS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_AUDIT_LOGS_TABLE || 'goryl-audit-logs';

export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingApplications: number;
  pendingProducts: number;
  monthlyGrowth: number;
  userRoles: {
    normal: number;
    personal: number;
    brand: number;
    company: number;
    admin: number;
  };
  revenueAnalytics: {
    today: number;
    week7d: number;
    month30d: number;
  };
  orderStatus: {
    pending: number;
    paid: number;
    shipped: number;
    delivered: number;
    refunded: number;
  };
  productStatus: {
    approved: number;
    pending: number;
    rejected: number;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  targetId?: string;
  targetType?: string;
  timestamp: Date;
  details?: any;
}

/**
 * Fetch admin statistics from DynamoDB
 */
export async function fetchAdminStats(): Promise<AdminStats> {
  try {
    console.log('📊 Fetching admin stats from AWS DynamoDB...');

    // Fetch users count and roles
    const usersCommand = new ScanCommand({
      TableName: USERS_TABLE,
      Select: 'ALL_ATTRIBUTES',
    });
    const usersResult = await docClient.send(usersCommand);
    const users = usersResult.Items || [];

    // Count user roles
    const userRoles = {
      normal: users.filter(u => !u.role || u.role === 'normal').length,
      personal: users.filter(u => u.role === 'personal').length,
      brand: users.filter(u => u.role === 'brand').length,
      company: users.filter(u => u.role === 'company').length,
      admin: users.filter(u => u.role === 'admin').length,
    };

    // Fetch products
    const productsCommand = new ScanCommand({
      TableName: PRODUCTS_TABLE,
      Select: 'ALL_ATTRIBUTES',
    });
    const productsResult = await docClient.send(productsCommand);
    const products = productsResult.Items || [];

    // Count product statuses
    const productStatus = {
      approved: products.filter(p => p.status === 'approved').length,
      pending: products.filter(p => p.status === 'pending').length,
      rejected: products.filter(p => p.status === 'rejected').length,
    };

    // Fetch orders
    const ordersCommand = new ScanCommand({
      TableName: ORDERS_TABLE,
      Select: 'ALL_ATTRIBUTES',
    });
    const ordersResult = await docClient.send(ordersCommand);
    const orders = ordersResult.Items || [];

    // Count order statuses
    const orderStatus = {
      pending: orders.filter(o => o.status === 'pending').length,
      paid: orders.filter(o => o.status === 'paid').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      refunded: orders.filter(o => o.status === 'refunded').length,
    };

    // Calculate revenue
    const totalRevenue = orders
      .filter(o => o.status !== 'refunded')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    // Calculate time-based revenue
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const revenueToday = orders
      .filter(o => o.status !== 'refunded' && o.createdAt && new Date(o.createdAt).getTime() > oneDayAgo)
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const revenueWeek = orders
      .filter(o => o.status !== 'refunded' && o.createdAt && new Date(o.createdAt).getTime() > sevenDaysAgo)
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const revenueMonth = orders
      .filter(o => o.status !== 'refunded' && o.createdAt && new Date(o.createdAt).getTime() > thirtyDaysAgo)
      .reduce((sum, order) => sum + (order.total || 0), 0);

    // Count pending applications (users with pending KYC)
    const pendingApplications = users.filter(u => u.kycStatus === 'pending').length;

    const stats: AdminStats = {
      totalUsers: users.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue,
      pendingApplications,
      pendingProducts: productStatus.pending,
      monthlyGrowth: 0, // Calculate based on historical data
      userRoles,
      revenueAnalytics: {
        today: revenueToday,
        week7d: revenueWeek,
        month30d: revenueMonth,
      },
      orderStatus,
      productStatus,
    };

    console.log('✅ Admin stats fetched successfully:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error fetching admin stats:', error);
    throw error;
  }
}

/**
 * Subscribe to admin stats (polling-based for now, can be upgraded to WebSocket)
 */
export function subscribeToAdminStats(callback: (stats: AdminStats) => void): () => void {
  console.log('📡 Setting up admin stats subscription...');

  let isActive = true;

  const fetchAndUpdate = async () => {
    if (!isActive) return;

    try {
      const stats = await fetchAdminStats();
      callback(stats);
    } catch (error) {
      console.error('Error in stats subscription:', error);
    }

    // Poll every 30 seconds
    if (isActive) {
      setTimeout(fetchAndUpdate, 30000);
    }
  };

  // Initial fetch
  fetchAndUpdate();

  // Return unsubscribe function
  return () => {
    isActive = false;
    console.log('🔌 Admin stats subscription closed');
  };
}

/**
 * Fetch audit logs from DynamoDB
 */
export async function fetchAuditLogs(filters?: any): Promise<AuditLog[]> {
  try {
    console.log('📋 Fetching audit logs from AWS DynamoDB...');

    const command = new ScanCommand({
      TableName: AUDIT_LOGS_TABLE,
      Limit: 100, // Get last 100 logs
    });

    const result = await docClient.send(command);
    const logs = (result.Items || []).map(item => ({
      id: item.id,
      action: item.action,
      actorId: item.actorId,
      actorName: item.actorName,
      targetId: item.targetId,
      targetType: item.targetType,
      timestamp: new Date(item.timestamp),
      details: item.details,
    }));

    // Sort by timestamp descending
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    console.log(`✅ Fetched ${logs.length} audit logs`);
    return logs;
  } catch (error) {
    console.error('❌ Error fetching audit logs:', error);
    return [];
  }
}

/**
 * Subscribe to audit logs (polling-based)
 */
export function subscribeToAuditLogs(filters: any, callback: (logs: AuditLog[]) => void): () => void {
  console.log('📡 Setting up audit logs subscription...');

  let isActive = true;

  const fetchAndUpdate = async () => {
    if (!isActive) return;

    try {
      const logs = await fetchAuditLogs(filters);
      callback(logs);
    } catch (error) {
      console.error('Error in audit logs subscription:', error);
    }

    // Poll every 30 seconds
    if (isActive) {
      setTimeout(fetchAndUpdate, 30000);
    }
  };

  // Initial fetch
  fetchAndUpdate();

  // Return unsubscribe function
  return () => {
    isActive = false;
    console.log('🔌 Audit logs subscription closed');
  };
}

/**
 * Create audit log entry
 */
export async function createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  try {
    const auditLog: AuditLog = {
      ...log,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    const command = new PutCommand({
      TableName: AUDIT_LOGS_TABLE,
      Item: auditLog,
    });

    await docClient.send(command);
    console.log('✅ Audit log created:', auditLog.action);
  } catch (error) {
    console.error('❌ Error creating audit log:', error);
  }
}
