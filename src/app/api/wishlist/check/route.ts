import { NextRequest, NextResponse } from 'next/server';
import { isInWishlist } from '@/lib/awsWishlistService';

/**
 * GET /api/wishlist/check?userId=xxx&productId=xxx
 * Check if product is in wishlist
 */
export async function GET(request: NextRequest) {
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

    const inWishlist = await isInWishlist(userId, productId);

    return NextResponse.json({
      success: true,
      inWishlist,
    });
  } catch (error: any) {
    console.error('❌ API Error checking wishlist:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to check wishlist',
        inWishlist: false,
      },
      { status: 500 }
    );
  }
}

