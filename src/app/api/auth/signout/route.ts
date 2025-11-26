import { NextRequest, NextResponse } from 'next/server';
import { signOut } from '@/lib/awsCognitoService';

export async function POST(request: NextRequest) {
  try {
    await signOut();

    return NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (error: any) {
    console.error('❌ Sign out error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Sign out failed',
      },
      { status: 500 }
    );
  }
}

