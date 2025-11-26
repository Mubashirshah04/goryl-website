/**
 * Firestore to DynamoDB Migration Script
 * 
 * Ye script Firestore se saari data AWS DynamoDB mein migrate karega
 * 
 * Usage:
 *   npm run migrate:firestore-to-dynamodb
 *   OR
 *   npx tsx scripts/migrate-firestore-to-dynamodb.ts
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

// Firebase config - use your actual config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase if not already initialized
let db: any;
if (typeof window === 'undefined') {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
} else {
  // Client-side - use existing firebase instance
  const { db: dbClient } = require('../src/lib/firebase');
  db = dbClient;
}

// Configuration
const BATCH_SIZE = 25; // Process in batches to avoid overwhelming the system
const DRY_RUN = false; // Set to true to test without actually migrating

/**
 * Migrate Products from Firestore to DynamoDB
 */
async function migrateProducts() {
  console.log('🔄 Starting Products migration...');
  
  try {
    const { getDynamoClient } = await import('../src/lib/awsDynamoService');
    const { docClient } = getDynamoClient();
    
    if (!docClient) {
      console.error('❌ DynamoDB client not initialized - skipping products migration');
      return;
    }

    const productsSnapshot = await getDocs(collection(db, 'products'));
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📦 Found ${products.length} products to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (product: any) => {
        try {
          // Prepare product data for DynamoDB
          const productData: any = {
            id: product.id,
            title: product.title || product.name || '',
            description: product.description || '',
            price: product.price || 0,
            category: product.category || '',
            images: product.images || [],
            stock: product.stock || 0,
            sellerId: product.sellerId || '',
            sellerName: product.sellerName || product.seller?.name || '',
            likes: Array.isArray(product.likes) ? product.likes : [],
            views: product.views || 0,
            rating: product.rating || 0,
            reviewCount: product.reviewCount || 0,
            comments: product.comments || 0,
            status: product.status || 'active',
            tags: product.tags || [],
            brand: product.brand || '',
            discount: product.discount || 0,
          };

          // Handle timestamps
          if (product.createdAt) {
            productData.createdAt = product.createdAt?.toDate?.()?.toISOString() || 
                                    (typeof product.createdAt === 'string' ? product.createdAt : new Date().toISOString());
          } else {
            productData.createdAt = new Date().toISOString();
          }

          if (product.updatedAt) {
            productData.updatedAt = product.updatedAt?.toDate?.()?.toISOString() || 
                                    (typeof product.updatedAt === 'string' ? product.updatedAt : new Date().toISOString());
          } else {
            productData.updatedAt = new Date().toISOString();
          }

          if (!DRY_RUN) {
            const command = new PutCommand({
              TableName: process.env.NEXT_PUBLIC_DYNAMODB_PRODUCTS_TABLE || 'goryl-products',
              Item: productData
            });

            await docClient.send(command);
          }

          successCount++;
          if (successCount % 10 === 0) {
            console.log(`✅ Migrated ${successCount}/${products.length} products...`);
          }
        } catch (error: any) {
          errorCount++;
          console.error(`❌ Error migrating product ${product.id}:`, error.message);
        }
      }));

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Products migration complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
  } catch (error: any) {
    console.error('❌ Error during products migration:', error);
    throw error;
  }
}

/**
 * Migrate Categories from Firestore to DynamoDB
 */
async function migrateCategories() {
  console.log('🔄 Starting Categories migration...');
  
  try {
    const { getDynamoClient } = await import('../src/lib/awsDynamoService');
    const { docClient } = getDynamoClient();
    
    if (!docClient) {
      console.error('❌ DynamoDB client not initialized - skipping categories migration');
      return;
    }

    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📁 Found ${categories.length} categories to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (const category of categories) {
      try {
        const categoryData: any = {
          id: category.id,
          name: category.name || '',
          slug: category.slug || '',
          description: category.description || '',
          image: category.image || '',
          parentId: category.parentId || '',
          isActive: category.isActive !== false,
          sortOrder: category.sortOrder || 0,
          productCount: category.productCount || 0,
        };

        // Handle timestamps
        if (category.createdAt) {
          categoryData.createdAt = category.createdAt?.toDate?.()?.toISOString() || 
                                   (typeof category.createdAt === 'string' ? category.createdAt : new Date().toISOString());
        } else {
          categoryData.createdAt = new Date().toISOString();
        }

        if (category.updatedAt) {
          categoryData.updatedAt = category.updatedAt?.toDate?.()?.toISOString() || 
                                   (typeof category.updatedAt === 'string' ? category.updatedAt : new Date().toISOString());
        } else {
          categoryData.updatedAt = new Date().toISOString();
        }

        if (!DRY_RUN) {
          const command = new PutCommand({
            TableName: process.env.NEXT_PUBLIC_DYNAMODB_CATEGORIES_TABLE || 'goryl-categories',
            Item: categoryData
          });

          await docClient.send(command);
        }

        successCount++;
        console.log(`✅ Migrated category: ${category.name || category.id}`);
      } catch (error: any) {
        errorCount++;
        console.error(`❌ Error migrating category ${category.id}:`, error.message);
      }
    }

    console.log(`✅ Categories migration complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
  } catch (error: any) {
    console.error('❌ Error during categories migration:', error);
    throw error;
  }
}

/**
 * Migrate User Profiles from Firestore to DynamoDB
 */
async function migrateUsers() {
  console.log('🔄 Starting Users migration...');
  
  try {
    const { getDynamoClient } = await import('../src/lib/awsDynamoService');
    const { docClient } = getDynamoClient();
    
    if (!docClient) {
      console.error('❌ DynamoDB client not initialized - skipping users migration');
      return;
    }

    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`👥 Found ${users.length} users to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (user: any) => {
        try {
          const userData: any = {
            id: user.id,
            name: user.name || 'User',
            email: user.email || '',
            photoURL: user.photoURL || '',
            customPhotoURL: user.customPhotoURL || '',
            profilePic: user.profilePic || '',
            avatar: user.avatar || '',
            bio: user.bio || '',
            about: user.about || '',
            role: user.role || 'user',
            username: user.username || '',
            approved: user.approved || false,
            verified: user.verified || false,
            followers: Array.isArray(user.followers) ? user.followers : [],
            following: Array.isArray(user.following) ? user.following : [],
            rating: user.rating || 0,
            reviews: user.reviews || 0,
            totalSales: user.totalSales || 0,
            totalProducts: user.totalProducts || 0,
            totalOrders: user.totalOrders || 0,
            totalRefunds: user.totalRefunds || 0,
            location: user.location || '',
            phone: user.phone || '',
            website: user.website || '',
            coverPhoto: user.coverPhoto || '',
            socialLinks: user.socialLinks || {},
            businessInfo: user.businessInfo || {},
            preferences: user.preferences || {
              notifications: true,
              emailMarketing: true,
              publicProfile: true,
            },
            analytics: user.analytics || {},
            settings: user.settings || {},
          };

          // Handle timestamps
          if (user.usernameLastChanged) {
            userData.usernameLastChanged = user.usernameLastChanged?.toDate?.()?.toISOString() || 
                                           (typeof user.usernameLastChanged === 'string' ? user.usernameLastChanged : undefined);
          }

          if (user.joinedAt) {
            userData.joinedAt = user.joinedAt?.toDate?.()?.toISOString() || 
                               (typeof user.joinedAt === 'string' ? user.joinedAt : new Date().toISOString());
          } else {
            userData.joinedAt = new Date().toISOString();
          }

          if (user.createdAt) {
            userData.createdAt = user.createdAt?.toDate?.()?.toISOString() || 
                                (typeof user.createdAt === 'string' ? user.createdAt : new Date().toISOString());
          } else {
            userData.createdAt = new Date().toISOString();
          }

          if (user.updatedAt) {
            userData.updatedAt = user.updatedAt?.toDate?.()?.toISOString() || 
                                (typeof user.updatedAt === 'string' ? user.updatedAt : new Date().toISOString());
          } else {
            userData.updatedAt = new Date().toISOString();
          }

          if (!DRY_RUN) {
            const command = new PutCommand({
              TableName: process.env.NEXT_PUBLIC_DYNAMODB_USERS_TABLE || 'goryl-users',
              Item: userData
            });

            await docClient.send(command);
          }

          successCount++;
          if (successCount % 50 === 0) {
            console.log(`✅ Migrated ${successCount}/${users.length} users...`);
          }
        } catch (error: any) {
          errorCount++;
          console.error(`❌ Error migrating user ${user.id}:`, error.message);
        }
      }));

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Users migration complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
  } catch (error: any) {
    console.error('❌ Error during users migration:', error);
    throw error;
  }
}

/**
 * Migrate Comments from Firestore to DynamoDB
 */
async function migrateComments() {
  console.log('🔄 Starting Comments migration...');
  
  try {
    const { getDynamoClient } = await import('../src/lib/awsDynamoService');
    const { docClient } = getDynamoClient();
    
    if (!docClient) {
      console.error('❌ DynamoDB client not initialized - skipping comments migration');
      return;
    }

    const commentsSnapshot = await getDocs(collection(db, 'comments'));
    const comments = commentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`💬 Found ${comments.length} comments to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < comments.length; i += BATCH_SIZE) {
      const batch = comments.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (comment: any) => {
        try {
          const commentData: any = {
            id: comment.id,
            productId: comment.productId || '',
            userId: comment.userId || '',
            userName: comment.userName || '',
            userPhoto: comment.userPhoto || '',
            text: comment.text || '',
            likes: comment.likes || 0,
            likedBy: Array.isArray(comment.likedBy) ? comment.likedBy : [],
            replies: Array.isArray(comment.replies) ? comment.replies : [],
            parentCommentId: comment.parentCommentId || '',
          };

          // Handle timestamps
          if (comment.createdAt) {
            commentData.createdAt = comment.createdAt?.toDate?.()?.toISOString() || 
                                   (typeof comment.createdAt === 'string' ? comment.createdAt : new Date().toISOString());
          } else {
            commentData.createdAt = new Date().toISOString();
          }

          if (comment.updatedAt) {
            commentData.updatedAt = comment.updatedAt?.toDate?.()?.toISOString() || 
                                   (typeof comment.updatedAt === 'string' ? comment.updatedAt : new Date().toISOString());
          } else {
            commentData.updatedAt = new Date().toISOString();
          }

          if (!DRY_RUN) {
            const command = new PutCommand({
              TableName: process.env.NEXT_PUBLIC_DYNAMODB_COMMENTS_TABLE || 'goryl-comments',
              Item: commentData
            });

            await docClient.send(command);
          }

          successCount++;
          if (successCount % 100 === 0) {
            console.log(`✅ Migrated ${successCount}/${comments.length} comments...`);
          }
        } catch (error: any) {
          errorCount++;
          console.error(`❌ Error migrating comment ${comment.id}:`, error.message);
        }
      }));

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Comments migration complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
  } catch (error: any) {
    console.error('❌ Error during comments migration:', error);
    throw error;
  }
}

/**
 * Migrate Likes from Firestore to DynamoDB
 * Also migrates likes from products/{productId}/likes subcollection
 */
async function migrateLikes() {
  console.log('🔄 Starting Likes migration...');
  
  try {
    const { getDynamoClient } = await import('../src/lib/awsDynamoService');
    const { docClient } = getDynamoClient();
    
    if (!docClient) {
      console.error('❌ DynamoDB client not initialized - skipping likes migration');
      return;
    }

    // Get likes from main collection
    let likes: any[] = [];
    try {
      const likesSnapshot = await getDocs(collection(db, 'likes'));
      likes = likesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.log('⚠️  No likes collection found, checking product subcollections...');
    }

    // Get likes from products/{productId}/likes subcollections
    try {
      const productsSnapshot = await getDocs(collection(db, 'products'));
      for (const productDoc of productsSnapshot.docs) {
        try {
          const productLikesSnapshot = await getDocs(collection(db, `products/${productDoc.id}/likes`));
          productLikesSnapshot.docs.forEach(likeDoc => {
            likes.push({
              id: `${likeDoc.id}_product_${productDoc.id}`,
              userId: likeDoc.id,
              targetType: 'product',
              targetId: productDoc.id,
              createdAt: likeDoc.data().createdAt || new Date()
            });
          });
        } catch (error) {
          // Subcollection doesn't exist, skip
        }
      }
    } catch (error) {
      console.log('⚠️  Could not read product likes subcollections');
    }

    console.log(`❤️  Found ${likes.length} likes to migrate`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < likes.length; i += BATCH_SIZE) {
      const batch = likes.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (like: any) => {
        try {
          // Parse like ID (format: userId_targetType_targetId)
          const likeId = like.id || `${like.userId}_${like.targetType}_${like.targetId}`;
          
          const likeData: any = {
            id: likeId,
            userId: like.userId || '',
            targetType: like.targetType || 'product',
            targetId: like.targetId || '',
          };

          // Handle timestamps
          if (like.createdAt) {
            likeData.createdAt = like.createdAt?.toDate?.()?.toISOString() || 
                                (typeof like.createdAt === 'string' ? like.createdAt : new Date().toISOString());
          } else {
            likeData.createdAt = new Date().toISOString();
          }

          if (!DRY_RUN) {
            const command = new PutCommand({
              TableName: process.env.NEXT_PUBLIC_DYNAMODB_LIKES_TABLE || 'goryl-likes',
              Item: likeData
            });

            await docClient.send(command);
          }

          successCount++;
          if (successCount % 100 === 0) {
            console.log(`✅ Migrated ${successCount}/${likes.length} likes...`);
          }
        } catch (error: any) {
          errorCount++;
          console.error(`❌ Error migrating like ${like.id}:`, error.message);
        }
      }));

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Likes migration complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
  } catch (error: any) {
    console.error('❌ Error during likes migration:', error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('');
  console.log('🚀 Firestore se AWS DynamoDB Migration Shuru Kar Rahe Hain...');
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN (data migrate nahi hogi)' : 'LIVE (data migrate hogi)'}`);
  console.log('');

  try {
    // Check AWS credentials
    const { getAWSCredentials } = await import('../src/lib/awsDynamoService');
    const credentials = getAWSCredentials();
    
    if (!credentials && typeof window === 'undefined') {
      console.log('⚠️  AWS credentials nahi mil rahi - default credential chain use hogi');
    }

    console.log('');
    console.log('📦 Migrating Collections:');
    console.log('   1. Categories');
    console.log('   2. Users');
    console.log('   3. Products');
    console.log('   4. Comments');
    console.log('   5. Likes');
    console.log('');

    // Migrate in order (dependencies first)
    await migrateCategories();
    console.log('');
    await migrateUsers();
    console.log('');
    await migrateProducts();
    console.log('');
    await migrateComments();
    console.log('');
    await migrateLikes();

    console.log('');
    console.log('✅ Migration Complete! 🎉');
    console.log('');
    console.log('📋 Ab Kya Karein:');
    console.log('   1. AWS DynamoDB Console mein data verify karein');
    console.log('   2. Application test karein');
    console.log('   3. Sab kuch theek hai toh Firestore collections disable kar sakte hain');
    console.log('');
  } catch (error: any) {
    console.error('');
    console.error('❌ Migration Failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  main().catch(console.error);
}

export { main as migrateFirestoreToDynamoDB };

