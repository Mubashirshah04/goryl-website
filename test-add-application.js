// Test script to add a sample application to DynamoDB
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const REGION = 'ap-south-1';
const TABLE_NAME = 'goryl-seller-applications';

// AWS Credentials
const ACCESS_KEY_ID = 'AKIAYLA4NN7R5LEPDX4Z';
const SECRET_ACCESS_KEY = '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';

const client = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

const dynamoClient = DynamoDBDocumentClient.from(client);

async function addTestApplication() {
  try {
    const testApplication = {
      id: `app_test_${Date.now()}`,
      userId: 'test-user-123',
      applicationType: 'brand',
      status: 'pending',
      submittedAt: new Date().toISOString(),
      user: {
        id: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+923001234567',
      },
      businessName: 'Test Store',
      businessType: 'brand',
      category: 'Electronics',
      description: 'Test application for seller center',
      website: 'https://example.com',
      location: 'Karachi, Pakistan',
      estimatedRevenue: 50000,
      documents: [
        {
          id: 'doc_test_1',
          name: 'CNIC Front',
          type: 'image',
          url: 'https://example.com/cnic-front.jpg',
          uploadedAt: new Date().toISOString(),
          verified: false,
        },
      ],
      notes: [],
    };

    console.log('📝 Adding test application to DynamoDB...');
    
    const putCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: testApplication,
    });

    await dynamoClient.send(putCommand);
    console.log('✅ Test application added successfully!');
    console.log('Application ID:', testApplication.id);

    // Verify by scanning
    console.log('\n📋 Scanning all applications...');
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
    });

    const result = await dynamoClient.send(scanCommand);
    console.log(`✅ Found ${result.Items?.length || 0} applications in table`);
    
    if (result.Items && result.Items.length > 0) {
      console.log('\nApplications:');
      result.Items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.businessName} (${item.applicationType}) - ${item.status}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addTestApplication();
