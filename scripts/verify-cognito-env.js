/**
 * Verify AWS Cognito Environment Variables
 * 
 * This script checks if Cognito environment variables are properly set
 * and provides instructions if they're missing.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying AWS Cognito Environment Variables...\n');

const rootDir = path.resolve(__dirname, '..');
const envLocalPath = path.join(rootDir, '.env.local');
const envPath = path.join(rootDir, '.env');

// Check if .env.local exists
if (!fs.existsSync(envLocalPath)) {
  console.error('❌ .env.local file not found!');
  console.error('\n📝 Solution:');
  console.error('   1. Copy env.example.local to .env.local:');
  console.error('      copy env.example.local .env.local');
  console.error('   2. Edit .env.local and add your AWS Cognito credentials');
  console.error('   3. Restart the dev server');
  process.exit(1);
}

// Read and parse .env.local
const content = fs.readFileSync(envLocalPath, 'utf8');
const lines = content.split('\n');

// Required Cognito variables
const requiredVars = {
  'NEXT_PUBLIC_COGNITO_USER_POOL_ID': false,
  'NEXT_PUBLIC_COGNITO_CLIENT_ID': false,
  'NEXT_PUBLIC_COGNITO_DOMAIN': false,
  'NEXT_PUBLIC_AWS_REGION': false,
};

const foundVars = {};

// Parse the file
lines.forEach((line, index) => {
  const trimmed = line.trim();
  
  // Skip empty lines and comments
  if (!trimmed || trimmed.startsWith('#')) {
    return;
  }
  
  // Check for each required variable
  Object.keys(requiredVars).forEach(key => {
    if (trimmed.startsWith(key + '=')) {
      const value = trimmed.split('=').slice(1).join('=').trim();
      foundVars[key] = value;
      
      // Check if value is empty or placeholder
      if (!value || value === '' || value.includes('XXXXXXXXX') || value.includes('your_')) {
        console.error(`⚠️  ${key} is set but has placeholder/empty value`);
        console.error(`   Line ${index + 1}: ${trimmed.substring(0, 80)}`);
      } else {
        requiredVars[key] = true;
        const displayValue = value.length > 30 ? value.substring(0, 30) + '...' : value;
        console.log(`✅ ${key} = ${displayValue}`);
      }
    }
  });
});

console.log('\n📊 Summary:');
let allGood = true;
Object.keys(requiredVars).forEach(key => {
  if (requiredVars[key]) {
    console.log(`   ✅ ${key}`);
  } else {
    console.log(`   ❌ ${key} - MISSING`);
    allGood = false;
  }
});

if (!allGood) {
  console.error('\n❌ Some required environment variables are missing!');
  console.error('\n📝 Next Steps:');
  console.error('   1. Open .env.local file');
  console.error('   2. Add the missing variables:');
  console.error('      NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-south-1_XXXXXXXXX');
  console.error('      NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX');
  console.error('      NEXT_PUBLIC_COGNITO_DOMAIN=your-domain.auth.ap-south-1.amazoncognito.com');
  console.error('      NEXT_PUBLIC_AWS_REGION=ap-south-1');
  console.error('   3. Stop the dev server (Ctrl + C)');
  console.error('   4. Delete .next folder:');
  console.error('      Windows: rmdir /s /q .next');
  console.error('      Mac/Linux: rm -rf .next');
  console.error('   5. Restart server: npm run dev');
  console.error('\n📖 For setup instructions, see: QUICK_COGNITO_SETUP.md');
  process.exit(1);
}

console.log('\n✅ All required Cognito environment variables are set!');
console.log('\n⚠️  IMPORTANT: If you just added these variables, you MUST:');
console.log('   1. Stop the dev server (Ctrl + C)');
console.log('   2. Delete .next folder');
console.log('   3. Restart server: npm run dev');
console.log('\n   Next.js embeds NEXT_PUBLIC_ variables at BUILD TIME.');
console.log('   Without restarting, the old build will still be used.\n');

