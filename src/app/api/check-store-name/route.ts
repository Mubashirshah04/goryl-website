import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { storeName } = await request.json();

    if (!storeName || storeName.length < 3) {
      return NextResponse.json(
        { available: false, message: 'Store name must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Convert to lowercase for checking
    const cleanStoreName = storeName.toLowerCase().trim();

    // For now, always return available to bypass database checks
    // TODO: Implement proper database validation when AWS/Firestore is properly configured
    return NextResponse.json({
      available: true,
      message: 'Store name available',
      storeName: cleanStoreName
    });

  } catch (error) {
    console.error('Error checking store name:', error);
    return NextResponse.json(
      { available: false, message: 'Error checking store name' },
      { status: 500 }
    );
  }
}
