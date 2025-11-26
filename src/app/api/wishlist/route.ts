import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserWishlist, 
  addToWishlist, 
  removeFromWishlist, 
  isInWishlist,
  getWishlistCount 
} from '@/lib/awsWishlistService';

/**
 * GET /api/wishlist?userId=xxx
 * Returns user's wishlist
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const wishlist = await getUserWishlist(userId);

    return NextResponse.json({
      success: true,
      data: wishlist,
      count: wishlist.length,
    });
  } catch (error: any) {
    console.error('❌ API Error fetching wishlist:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch wishlist',
        data: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wishlist
 * Add product to wishlist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, productId, product } = body;

    if (!userId || !productId) {
      return NextResponse.json(
        { success: false, error: 'User ID and Product ID are required' },
        { status: 400 }
      );
    }

    await addToWishlist(userId, productId, product);

    return NextResponse.json({
      success: true,
      message: 'Product added to wishlist',
    });
  } catch (error: any) {
    console.error('❌ API Error adding to wishlist:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to add to wishlist',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/wishlist?userId=xxx&productId=xxx
 * Remove product from wishlist
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');

    if (!userId || !productId) {
      return NextResponse.json(
        { success: false, error: 'User ID and Product ID are required' },
        { status: 400 }
      );
    }

    await removeFromWishlist(userId, productId);

    return NextResponse.json({
      success: true,
      message: 'Product removed from wishlist',
    });
  } catch (error: any) {
    console.error('❌ API Error removing from wishlist:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to remove from wishlist',
      },
      { status: 500 }
    );
  }
}

