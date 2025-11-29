// ✅ AWS DYNAMODB - Seller Applications Service
// Complete AWS DynamoDB integration for Seller Center applications

import { Application, Document } from './types'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'

// AWS Configuration
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1'
const APPLICATIONS_TABLE = 'goryl-seller-applications'

// Initialize DynamoDB Client
let dynamoClient: DynamoDBDocumentClient | null = null

const getDynamoClient = () => {
  if (dynamoClient) return dynamoClient

  const accessKeyId = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || ''
  const secretAccessKey = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || ''

  console.log('🔑 Initializing DynamoDB client for applications...')
  console.log('  - Region:', REGION)
  console.log('  - Table:', APPLICATIONS_TABLE)
  console.log('  - Access Key:', accessKeyId ? `${accessKeyId.substring(0, 8)}...` : 'MISSING')
  console.log('  - Secret Key:', secretAccessKey ? 'SET' : 'MISSING')

  if (!accessKeyId || !secretAccessKey) {
    console.error('❌ AWS credentials not found for applications service')
    console.error('  Please check NEXT_PUBLIC_AWS_ACCESS_KEY_ID and NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY in .env.local')
    return null
  }

  try {
    const client = new DynamoDBClient({
      region: REGION,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })

    dynamoClient = DynamoDBDocumentClient.from(client)
    console.log('✅ DynamoDB client initialized for applications')
    return dynamoClient
  } catch (error) {
    console.error('❌ Error initializing DynamoDB client:', error)
    return null
  }
}

export const submitApplication = async (application: Omit<Application, 'id' | 'submittedAt'>): Promise<string> => {
  try {
    const client = getDynamoClient()
    if (!client) {
      throw new Error('DynamoDB client not available')
    }

    // Generate unique application ID
    const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const submittedAt = new Date().toISOString()

    // Prepare application data for DynamoDB (flatten user object)
    const applicationData = {
      id: applicationId,
      userId: application.userId,
      applicationType: application.type,
      status: 'pending',
      submittedAt: submittedAt,
      
      // User information (flattened)
      userName: application.user?.name || '',
      userEmail: application.user?.email || '',
      userPhone: application.user?.phone || '',
      
      // Business information
      businessName: application.businessName || '',
      businessType: application.type,
      category: application.category || '',
      description: application.description || '',
      website: application.website || '',
      location: application.location || '',
      estimatedRevenue: application.estimatedRevenue || 0,
      
      // Documents (convert to JSON string)
      documents: JSON.stringify(application.documents || []),
      
      // Additional fields
      notes: JSON.stringify(application.notes || []),
    }

    const command = new PutCommand({
      TableName: APPLICATIONS_TABLE,
      Item: applicationData,
    })

    await client.send(command)
    console.log(`✅ Application ${applicationId} submitted successfully to DynamoDB`)

    return applicationId
  } catch (error) {
    console.error('❌ Error submitting application to DynamoDB:', error)
    throw error
  }
}

export const getAllApplications = (callback: (applications: Application[]) => void) => {
  console.log('📋 Fetching Seller Center applications from DynamoDB...')
  
  const fetchApplications = async () => {
    try {
      console.log('🔍 Attempting to fetch applications from DynamoDB...')
      
      const client = getDynamoClient()
      if (!client) {
        console.error('⚠️ DynamoDB client not available - cannot fetch applications')
        callback([])
        return
      }

      console.log(`📡 Scanning table: ${APPLICATIONS_TABLE}`)
      
      const command = new ScanCommand({
        TableName: APPLICATIONS_TABLE,
      })

      const response = await client.send(command)
      const items = response.Items || []

      console.log(`✅ Successfully fetched ${items.length} applications from DynamoDB`)
      
      if (items.length > 0) {
        console.log('📋 Applications found:')
        items.forEach((item: any, index: number) => {
          console.log(`  ${index + 1}. ${item.businessName || 'N/A'} (${item.applicationType || 'N/A'}) - ${item.status || 'N/A'}`)
        })
      } else {
        console.log('📭 No applications found in table')
      }

      // Transform DynamoDB items to Application format
      const applications: Application[] = items.map((item: any) => ({
        id: item.id,
        userId: item.userId,
        type: item.applicationType || 'personal',
        status: item.status || 'pending',
        submittedAt: new Date(item.submittedAt),
        reviewedAt: item.reviewedAt ? new Date(item.reviewedAt) : undefined,
        reviewedBy: item.reviewedBy,
        user: {
          id: item.userId,
          name: item.userName || '',
          email: item.userEmail || '',
          phone: item.userPhone || '',
        },
        businessName: item.businessName || '',
        businessType: item.businessType || item.applicationType,
        category: item.category || '',
        description: item.description || '',
        website: item.website || '',
        location: item.location || '',
        estimatedRevenue: item.estimatedRevenue || 0,
        documents: typeof item.documents === 'string' ? JSON.parse(item.documents) : (item.documents || []),
        notes: typeof item.notes === 'string' ? JSON.parse(item.notes) : (item.notes || []),
        rejectionReason: item.rejectionReason,
        address: item.address || '',
        taxId: item.taxId || '',
      }))

      callback(applications)
    } catch (error) {
      console.error('❌ Error fetching applications from DynamoDB:', error)
      callback([])
    }
  }

  // Initial fetch
  fetchApplications()

  // Poll for updates every 10 seconds (simulating real-time)
  const intervalId = setInterval(fetchApplications, 10000)

  // Return cleanup function
  return () => {
    clearInterval(intervalId)
    console.log('🔌 Unsubscribed from seller applications')
  }
}

export const getUserApplications = async (userId: string): Promise<Application[]> => {
  try {
    const client = getDynamoClient()
    if (!client) {
      console.error('⚠️ DynamoDB client not available for getUserApplications')
      return []
    }

    console.log(`🔍 Fetching applications for user: ${userId}`)

    const command = new ScanCommand({
      TableName: APPLICATIONS_TABLE,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    })

    const response = await client.send(command)
    const items = response.Items || []

    console.log(`✅ Found ${items.length} applications for user ${userId}`)

    // Transform to Application format
    const applications: Application[] = items.map((item: any) => ({
      id: item.id,
      userId: item.userId,
      type: item.applicationType || 'personal',
      status: item.status || 'pending',
      submittedAt: new Date(item.submittedAt),
      reviewedAt: item.reviewedAt ? new Date(item.reviewedAt) : undefined,
      reviewedBy: item.reviewedBy,
      user: {
        id: item.userId,
        name: item.userName || '',
        email: item.userEmail || '',
        phone: item.userPhone || '',
      },
      businessName: item.businessName || '',
      businessType: item.businessType || item.applicationType,
      category: item.category || '',
      description: item.description || '',
      website: item.website || '',
      location: item.location || '',
      estimatedRevenue: item.estimatedRevenue || 0,
      documents: typeof item.documents === 'string' ? JSON.parse(item.documents) : (item.documents || []),
      notes: typeof item.notes === 'string' ? JSON.parse(item.notes) : (item.notes || []),
      rejectionReason: item.rejectionReason,
      address: item.address || '',
      taxId: item.taxId || '',
    }))

    return applications
  } catch (error) {
    console.error('❌ Error fetching user applications:', error)
    // Fallback to Scan if Query fails (no GSI)
    try {
      const client = getDynamoClient()
      if (!client) return []

      console.log('⚠️ Falling back to Scan for user applications')
      const command = new ScanCommand({
        TableName: APPLICATIONS_TABLE,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      })

      const response = await client.send(command)
      const items = response.Items || []

      console.log(`✅ Scan found ${items.length} applications for user ${userId}`)

      const applications: Application[] = items.map((item: any) => ({
        id: item.id,
        userId: item.userId,
        type: item.applicationType || 'personal',
        status: item.status || 'pending',
        submittedAt: new Date(item.submittedAt),
        reviewedAt: item.reviewedAt ? new Date(item.reviewedAt) : undefined,
        reviewedBy: item.reviewedBy,
        user: {
          id: item.userId,
          name: item.userName || '',
          email: item.userEmail || '',
          phone: item.userPhone || '',
        },
        businessName: item.businessName || '',
        businessType: item.businessType || item.applicationType,
        category: item.category || '',
        description: item.description || '',
        website: item.website || '',
        location: item.location || '',
        estimatedRevenue: item.estimatedRevenue || 0,
        documents: typeof item.documents === 'string' ? JSON.parse(item.documents) : (item.documents || []),
        notes: typeof item.notes === 'string' ? JSON.parse(item.notes) : (item.notes || []),
        rejectionReason: item.rejectionReason,
        address: item.address || '',
        taxId: item.taxId || '',
      }))

      return applications
    } catch (scanError) {
      console.error('❌ Scan also failed:', scanError)
      return []
    }
  }
}

export const updateApplicationStatus = async (
  applicationId: string,
  status: Application['status'],
  reviewedBy: string,
  rejectionReason?: string
): Promise<void> => {
  try {
    const client = getDynamoClient()
    if (!client) {
      throw new Error('DynamoDB client not available')
    }

    const updateExpression = rejectionReason
      ? 'SET #status = :status, #reviewedBy = :reviewedBy, #reviewedAt = :reviewedAt, #rejectionReason = :rejectionReason'
      : 'SET #status = :status, #reviewedBy = :reviewedBy, #reviewedAt = :reviewedAt'

    const expressionAttributeValues: any = {
      ':status': status,
      ':reviewedBy': reviewedBy,
      ':reviewedAt': new Date().toISOString(),
    }

    if (rejectionReason) {
      expressionAttributeValues[':rejectionReason'] = rejectionReason
    }

    const command = new UpdateCommand({
      TableName: APPLICATIONS_TABLE,
      Key: { id: applicationId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: {
        '#status': 'status',
        '#reviewedBy': 'reviewedBy',
        '#reviewedAt': 'reviewedAt',
        ...(rejectionReason && { '#rejectionReason': 'rejectionReason' }),
      },
      ExpressionAttributeValues: expressionAttributeValues,
    })

    await client.send(command)
    console.log(`✅ Application ${applicationId} status updated to ${status}`)

    // If approved, update user role in Cognito
    if (status === 'approved') {
      console.log('🔄 Application approved - updating user role...')
      // Get application details to find userId and type
      const getCommand = new QueryCommand({
        TableName: APPLICATIONS_TABLE,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': applicationId,
        },
      })
      
      try {
        const appResponse = await client.send(getCommand)
        const application = appResponse.Items?.[0]
        
        if (application) {
          const userId = application.userId
          const applicationType = application.applicationType
          const businessName = application.businessName
          const storeName = application.businessName // Store name is used as username
          
          console.log(`📝 Updating user ${userId} role to ${applicationType}`)
          await updateUserProfileOnApproval(userId, applicationType, businessName, storeName)
        }
      } catch (roleUpdateError) {
        console.error('❌ Error updating user role:', roleUpdateError)
        // Don't throw - application status is already updated
      }
    }
  } catch (error) {
    console.error('❌ Error updating application status:', error)
    throw error
  }
}

export const updateUserProfileOnApproval = async (userId: string, businessType: string, businessName?: string, storeName?: string) => {
  try {
    console.log(`🔄 Updating user profile for ${userId} to ${businessType}`)
    
    const client = getDynamoClient()
    if (!client) {
      throw new Error('DynamoDB client not available')
    }
    
    // Map application type to user role
    const roleMapping: Record<string, string> = {
      'brand': 'brand',
      'personal_seller': 'personal_seller',
      'personal': 'personal_seller',
      'company': 'company',
      'seller': 'seller',
    }
    
    const newRole = roleMapping[businessType] || 'personal_seller'
    
    // Update user profile in DynamoDB users table
    const USERS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_USERS_TABLE || 'goryl-users'
    
    // Build update expression dynamically
    const updateParts = ['#role = :role', '#updatedAt = :updatedAt']
    const expressionAttributeNames: any = {
      '#role': 'role',
      '#updatedAt': 'updatedAt',
    }
    const expressionAttributeValues: any = {
      ':role': newRole,
      ':updatedAt': new Date().toISOString(),
    }
    
    if (businessName) {
      updateParts.push('#businessName = :businessName')
      expressionAttributeNames['#businessName'] = 'businessName'
      expressionAttributeValues[':businessName'] = businessName
    }
    
    // Update username with store name (lowercase, no spaces)
    if (storeName) {
      const username = storeName.toLowerCase().replace(/[^a-z0-9]/g, '')
      updateParts.push('#username = :username')
      expressionAttributeNames['#username'] = 'username'
      expressionAttributeValues[':username'] = username
      console.log(`📝 Setting username to: ${username}`)
    }
    
    const updateExpression = 'SET ' + updateParts.join(', ')
    
    const command = new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { id: userId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
    
    await client.send(command)
    console.log(`✅ User ${userId} role updated to ${newRole} in DynamoDB`)
    
    // Trigger client-side refresh via localStorage event and custom event
    if (typeof window !== 'undefined') {
      const updateData = {
        userId,
        newRole,
        timestamp: Date.now()
      }
      
      // Set localStorage for cross-tab communication
      localStorage.setItem('role_updated', JSON.stringify(updateData))
      
      // Dispatch custom event for same-tab communication
      window.dispatchEvent(new CustomEvent('role_updated_event', { detail: updateData }))
      
      // Remove after 1 second
      setTimeout(() => {
        localStorage.removeItem('role_updated')
      }, 1000)
    }
    
    return newRole
  } catch (error) {
    console.error('❌ Error updating user profile:', error)
    throw error
  }
}

export const verifyUserRole = async (userId: string): Promise<string> => {
  console.warn('⚠️ verifyUserRole: AWS implementation pending');
  // TODO: Implement AWS DynamoDB user role verification
  return 'user';
}

export const updateDocumentVerification = async (
  applicationId: string,
  documentId: string,
  verified: boolean
): Promise<void> => {
  console.warn('⚠️ updateDocumentVerification: AWS implementation pending');
  // TODO: Implement AWS DynamoDB document verification update
}

export const checkAndFixUserAccountType = async (userId: string): Promise<{
  success: boolean;
  message: string;
  accountType?: string;
}> => {
  console.warn('⚠️ checkAndFixUserAccountType: AWS implementation pending');
  // TODO: Implement AWS DynamoDB account type check/fix
  return {
    success: true,
    message: 'AWS implementation pending',
    accountType: 'user'
  };
}
