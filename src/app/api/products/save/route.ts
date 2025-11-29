import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get userId from request headers (passed from client)
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      console.error('❌ Save: No userId provided');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { productId, save } = await request.json();

    if (!productId) {
      console.error('❌ Save: No productId provided');
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    console.log('💾 Save: Saving product', { userId, productId, save });

    // Call AWS Lambda or DynamoDB directly via environment variable
    const dynamodbEndpoint = process.env.DYNAMODB_ENDPOINT || 'https://dynamodb.us-east-1.amazonaws.com';
    
    // For now, just return success - the actual save will be handled by the client-side state
    // In production, you would call DynamoDB here
    
    return NextResponse.json({
      success: true,
      saved: save,
      message: save ? 'Product saved' : 'Product removed from saved'
    });
  } catch (error: any) {
    console.error('❌ Save error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save product' },
      { status: 500 }
    );
  }
}
