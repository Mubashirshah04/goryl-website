import { NextRequest, NextResponse } from 'next/server';
import { getProductById, updateProduct } from '@/lib/awsDynamoService';

/**
 * GET /api/products/[id]
 * Returns a single product by ID from DynamoDB
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle Next.js 15 async params
    const resolvedParams = params instanceof Promise ? await params : params;
    const productId = resolvedParams.id;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product ID is required',
        },
        { status: 400 }
      );
    }

    const product = await getProductById(productId);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error('❌ API Error fetching product:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch product',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/products/[id]
 * Update a product in DynamoDB
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle Next.js 15 async params
    const resolvedParams = params instanceof Promise ? await params : params;
    const productId = resolvedParams.id;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product ID is required',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Update product in DynamoDB
    await updateProduct(productId, body);

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
    });
  } catch (error: any) {
    console.error('❌ API Error updating product:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update product',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

