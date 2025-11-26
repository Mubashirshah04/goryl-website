import { NextRequest, NextResponse } from 'next/server';
import { getCategories } from '@/lib/awsCategoryService';

/**
 * GET /api/categories
 * Returns categories from AWS DynamoDB
 */
export async function GET(request: NextRequest) {
  try {
    const categories = await getCategories();

    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    
    // Return default categories if DynamoDB fails
    const defaultCategories = [
      { id: '1', name: 'Electronics', slug: 'electronics', isActive: true, sortOrder: 1, productCount: 0 },
      { id: '2', name: 'Fashion', slug: 'fashion', isActive: true, sortOrder: 2, productCount: 0 },
      { id: '3', name: 'Home & Garden', slug: 'home-garden', isActive: true, sortOrder: 3, productCount: 0 },
      { id: '4', name: 'Sports', slug: 'sports', isActive: true, sortOrder: 4, productCount: 0 },
      { id: '5', name: 'Books', slug: 'books', isActive: true, sortOrder: 5, productCount: 0 },
    ];

    return NextResponse.json({
      success: true,
      data: defaultCategories,
      count: defaultCategories.length,
      fallback: true,
    });
  }
}

