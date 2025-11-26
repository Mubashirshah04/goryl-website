import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, createOrUpdateUserProfile, updateUserProfile as updateProfile } from '@/lib/awsUserService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('id');
    const username = searchParams.get('username');

    if (!userId && !username) {
      return NextResponse.json(
        { error: 'User ID or username required' },
        { status: 400 }
      );
    }

    let profile;
    if (userId) {
      profile = await getUserProfile(userId);
    } else if (username) {
      const { getUserByUsername } = await import('@/lib/awsUserService');
      profile = await getUserByUsername(username);
    }

    // ✅ AWS DynamoDB ONLY - If not found, sync from Firestore to AWS
    if (!profile) {
      console.log('⚠️ Profile not found in AWS DynamoDB, syncing from Firestore...');
      try {
        const { doc, getDoc, collection, query, where, getDocs } = await import('@/lib/firestore');
        const { db } = await import('@/lib/firebase');
        
        let userDoc: any = null;
        if (userId) {
          const docRef = doc(db, 'users', userId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            userDoc = docSnap;
          }
        } else if (username) {
          const usersQuery = query(collection(db, 'users'), where('username', '==', username));
          const querySnapshot = await getDocs(usersQuery);
          if (!querySnapshot.empty) {
            userDoc = querySnapshot.docs[0];
          }
        }
        
        if (userDoc) {
          const firestoreData = userDoc.exists ? userDoc.data() : userDoc.data();
          const profileData = {
            ...firestoreData,
            id: userDoc.id,
            joinedAt: firestoreData.joinedAt?.toDate()?.toISOString() || new Date().toISOString(),
            followers: Array.isArray(firestoreData.followers) ? firestoreData.followers : [],
            following: Array.isArray(firestoreData.following) ? firestoreData.following : [],
            createdAt: firestoreData.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          console.log('✅ Profile found in Firestore, creating in AWS DynamoDB...');
          
          // ✅ Create in AWS DynamoDB
          await createOrUpdateUserProfile(userDoc.id, profileData);
          
          // ✅ Now fetch from AWS DynamoDB (fresh from AWS)
          if (userId) {
            profile = await getUserProfile(userId);
          } else if (username) {
            const { getUserByUsername } = await import('@/lib/awsUserService');
            profile = await getUserByUsername(username);
          }
          
          if (profile) {
            console.log('✅ Profile synced to AWS DynamoDB successfully');
            return NextResponse.json(profile);
          }
        }
      } catch (syncError) {
        console.error('❌ Error syncing profile from Firestore to AWS:', syncError);
      }
      
      console.error('❌ Profile not found in AWS DynamoDB and could not sync from Firestore:', userId || username);
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, profileData } = await request.json();

    if (!userId || !profileData) {
      return NextResponse.json(
        { error: 'User ID and profile data required' },
        { status: 400 }
      );
    }

    await createOrUpdateUserProfile(userId, profileData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error creating/updating user profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create/update user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('id');
    const updates = await request.json();

    if (!userId || !updates) {
      return NextResponse.json(
        { error: 'User ID and updates required' },
        { status: 400 }
      );
    }

    await updateProfile(userId, updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, updates } = await request.json();

    if (!userId || !updates) {
      return NextResponse.json(
        { error: 'User ID and updates required' },
        { status: 400 }
      );
    }

    await updateProfile(userId, updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
