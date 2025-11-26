/**
 * Rebuild Next.js with Environment Variables
 * 
 * This script deletes .next folder and restarts the server
 * to ensure environment variables are properly loaded
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Rebuilding Next.js with Environment Variables...\n');

const nextFolderPath = path.join(__dirname, '..', '.next');

// Check if .next folder exists
if (fs.existsSync(nextFolderPath)) {
  console.log('📁 Found .next folder, deleting...');
  try {
    // Use rimraf if available, otherwise use native delete
    if (process.platform === 'win32') {
      execSync(`rmdir /s /q "${nextFolderPath}"`, { stdio: 'inherit' });
    } else {
      execSync(`rm -rf "${nextFolderPath}"`, { stdio: 'inherit' });
    }
    console.log('✅ .next folder deleted successfully\n');
  } catch (error) {
    console.error('❌ Error deleting .next folder:', error.message);
    console.error('\n💡 Please manually delete .next folder:');
    console.error('   Windows: rmdir /s /q .next');
    console.error('   Mac/Linux: rm -rf .next');
    process.exit(1);
  }
} else {
  console.log('⚠️ .next folder not found (already deleted or not built yet)\n');
}

// Verify .env.local exists
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envLocalPath)) {
  console.error('❌ .env.local file not found!');
  console.error('   Please create .env.local file with your environment variables');
  process.exit(1);
}

console.log('✅ .env.local file found');
console.log('\n📋 Next Steps:');
console.log('   1. Stop your current server (Ctrl + C)');
console.log('   2. Restart server: npm run dev');
console.log('   3. Next.js will automatically rebuild with new environment variables');
console.log('\n💡 Note: Next.js embeds NEXT_PUBLIC_ variables at BUILD TIME');
console.log('   After deleting .next folder, restarting server will rebuild with new variables');

