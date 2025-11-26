#!/usr/bin/env node
/**
 * Script to check .env.local file format and verify environment variables
 * This helps diagnose why Next.js might not be loading environment variables
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');

console.log('🔍 Checking .env.local file format...\n');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found at:', envPath);
  process.exit(1);
}

// Read file and remove BOM (Byte Order Mark) if present
let content = fs.readFileSync(envPath, 'utf8');
// Remove BOM (common on Windows)
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
  console.log('⚠️  Removed UTF-8 BOM from file\n');
}
const lines = content.split('\n');

const requiredVars = {
  'NEXT_PUBLIC_COGNITO_CLIENT_ID': false,
  'NEXT_PUBLIC_COGNITO_USER_POOL_ID': false,
  'NEXT_PUBLIC_COGNITO_DOMAIN': false,
  'NEXT_PUBLIC_AWS_REGION': false,
};

let hasErrors = false;

console.log('📋 Checking each line:\n');

lines.forEach((line, index) => {
  const trimmed = line.trim();
  
  // Skip empty lines and comments
  if (!trimmed || trimmed.startsWith('#')) {
    return;
  }
  
  // Check if line has = sign
  if (!trimmed.includes('=')) {
    console.error(`⚠️  Line ${index + 1}: Missing = sign: "${trimmed}"`);
    hasErrors = true;
    return;
  }
  
  const [key, ...valueParts] = trimmed.split('=');
  const value = valueParts.join('='); // Rejoin in case value contains =
  const trimmedKey = key.trim();
  const trimmedValue = value.trim();
  
  // Check for required variables
  if (requiredVars.hasOwnProperty(trimmedKey)) {
    // Check for common formatting issues
    const hasQuotes = trimmedValue.startsWith('"') || trimmedValue.startsWith("'");
    const hasSpaces = trimmed.includes(' = ') || trimmed.includes('= ');
    
    if (hasQuotes) {
      console.error(`⚠️  Line ${index + 1}: ${trimmedKey} has quotes around value`);
      console.error(`   Current: ${trimmed}`);
      console.error(`   Should be: ${trimmedKey}=${trimmedValue.replace(/^["']|["']$/g, '')}\n`);
      hasErrors = true;
    } else if (hasSpaces) {
      console.error(`⚠️  Line ${index + 1}: ${trimmedKey} has spaces around =`);
      console.error(`   Current: ${trimmed}`);
      console.error(`   Should be: ${trimmedKey}=${trimmedValue}\n`);
      hasErrors = true;
    } else if (!trimmedValue || trimmedValue === '' || trimmedValue.includes('XXXXXXXXX') || trimmedValue.includes('your_')) {
      console.error(`⚠️  Line ${index + 1}: ${trimmedKey} is set but has placeholder/empty value`);
      console.error(`   Value: "${trimmedValue}"\n`);
      hasErrors = true;
    } else {
      requiredVars[trimmedKey] = true;
      console.log(`✅ ${trimmedKey}: Set (${trimmedValue.substring(0, 20)}${trimmedValue.length > 20 ? '...' : ''})`);
    }
  }
});

console.log('\n📊 Summary:\n');

let allSet = true;
Object.entries(requiredVars).forEach(([key, isSet]) => {
  if (isSet) {
    console.log(`✅ ${key}: Found`);
  } else {
    console.error(`❌ ${key}: Missing`);
    allSet = false;
    hasErrors = true;
  }
});

if (hasErrors) {
  console.log('\n❌ Issues found in .env.local file!');
  console.log('\n📝 Common fixes:');
  console.log('   1. Remove quotes around values');
  console.log('   2. Remove spaces around = sign');
  console.log('   3. Ensure values are not placeholders');
  console.log('   4. Format: KEY=value (no spaces, no quotes)');
  console.log('\nExample:');
  console.log('   NEXT_PUBLIC_COGNITO_CLIENT_ID=1dnqju9c3c6fhtq937fl5gmh8e');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are properly formatted!');
  console.log('\n📝 Next steps:');
  console.log('   1. Stop dev server (Ctrl + C)');
  console.log('   2. Delete .next folder: Remove-Item -Recurse -Force .next');
  console.log('   3. Clear browser cache or use incognito mode');
  console.log('   4. Restart server: npm run dev');
  process.exit(0);
}

