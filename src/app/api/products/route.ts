import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/lib/awsDynamoService';

/**
 * GET /api/products
 * Returns products from DynamoDB
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const sellerId = searchParams.get('sellerId') || undefined;
    const status = (searchParams.get('status') || 'active') as 'active' | 'inactive' | 'draft';
    const orderByField = searchParams.get('orderByField') || searchParams.get('orderBy') || 'createdAt';
    const orderDirection = (searchParams.get('orderDirection') || 'desc') as 'asc' | 'desc';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const search = searchParams.get('search') || undefined;

    const products = await getProducts(
      {
        category,
        sellerId,
        status,
        minPrice,
        maxPrice,
        search,
      },
      orderByField,
      orderDirection,
      limit
    );

    // Even if DynamoDB failed, return success with empty array
    // This prevents 500 errors from breaking the app
    return NextResponse.json({
      success: true,
      data: products || [],
      count: products?.length || 0,
    });
  } catch (error: any) {
    console.error('❌ API Error fetching products:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    
    // Return success with empty array instead of error
    // This prevents the app from breaking if DynamoDB is unavailable
    return NextResponse.json(
      {
        success: true,
        data: [],
        count: 0,
        warning: 'Unable to fetch products from DynamoDB. Please check AWS configuration.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 200 } // Changed to 200 instead of 500
    );
  }
}

/**
 * POST /api/products
 * Create a new product in DynamoDB
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.sellerId) {
      return NextResponse.json(
        { success: false, error: 'Title and sellerId are required' },
        { status: 400 }
      );
    }

    // Create product in DynamoDB with timeout protection
    const createProductPromise = createProduct(body);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 second timeout
    });

    const productId = await Promise.race([createProductPromise, timeoutPromise]) as string;

    return NextResponse.json({
      success: true,
      data: { id: productId },
      id: productId, // Also include at root level for compatibility
      message: 'Product created successfully',
    });
  } catch (error: any) {
    console.error('❌ API Error creating product:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });

    // Handle timeout errors
    if (error.message?.includes('timeout') || error.message?.includes('Request timeout')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request timeout. Please try again.',
        },
        { status: 504 } // Gateway Timeout
      );
    }

    // Handle 502 Bad Gateway errors
    if (error.message?.includes('502') || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return NextResponse.json(
        {
          success: false,
          error: 'Server temporarily unavailable. Please try again in a moment.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create product',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

