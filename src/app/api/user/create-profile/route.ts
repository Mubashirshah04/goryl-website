import { NextRequest, NextResponse } from 'next/server';
import { createOrUpdateUserProfile } from '@/lib/awsUserService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, name } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email required' },
        { status: 400 }
      );
    }

    // Create basic profile in DynamoDB
    const profileData = {
      id: userId,
      email: email,
      name: name || email.split('@')[0],
      role: 'user' as const,
      followers: [],
      following: [],
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      approved: true,
      verified: false,
    };

    console.log('📝 Creating user profile in DynamoDB:', userId);
    await createOrUpdateUserProfile(userId, profileData);
    console.log('✅ User profile created successfully');

    return NextResponse.json({ success: true, profile: profileData });
  } catch (error: any) {
    console.error('❌ Error creating user profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user profile' },
      { status: 500 }
    );
  }
}
