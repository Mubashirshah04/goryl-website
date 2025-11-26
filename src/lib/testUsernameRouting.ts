import { getUserByUsername } from './userService';

// Test function to verify username-based routing works
export const testUsernameRouting = async (): Promise<void> => {
  try {
    console.log('Testing username-based routing...');
    
    // Test with a known username
    const user = await getUserByUsername('user');
    
    if (user) {
      console.log(`✅ Found user with username 'user': ${user.id}`);
      console.log(`🔗 Profile URL would be: /profile/username/${user.username}`);
    } else {
      console.log('ℹ️ No user found with username "user"');
    }
    
    // Test with a non-existent username
    const nonExistentUser = await getUserByUsername('nonexistentuser123');
    
    if (!nonExistentUser) {
      console.log('✅ Correctly returned null for non-existent username');
    } else {
      console.log('⚠️ Unexpectedly found user for non-existent username');
    }
    
    console.log('✅ Username routing test completed successfully');
  } catch (error) {
    console.error('❌ Error testing username routing:', error);
  }
};

// Run the test
// testUsernameRouting();