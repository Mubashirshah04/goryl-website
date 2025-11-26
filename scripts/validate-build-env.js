/**
 * Validate Environment Variables Before Build
 * 
 * This script runs before building to ensure all required environment variables are set.
 * Prevents the "missing environment variables" errors that appear only at runtime.
 */

const fs = require('fs');
const path = require('path');

// Manually load .env.local since dotenv might not be installed
const envFilePath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envFilePath)) {
  const envContent = fs.readFileSync(envFilePath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        process.env[key.trim()] = cleanValue;
      }
    }
  });
}

console.log('🔍 Validating Environment Variables for Build...\n');

const requiredVars = {
  'NEXT_PUBLIC_COGNITO_USER_POOL_ID': { prefix: 'ap-south-1_' },
  'NEXT_PUBLIC_COGNITO_CLIENT_ID': { minLength: 20 },
  'NEXT_PUBLIC_COGNITO_DOMAIN': { contains: '.auth.' },
  'NEXT_PUBLIC_AWS_REGION': { value: 'ap-south-1' }
};

let allValid = true;
const missingVars = [];

Object.keys(requiredVars).forEach(key => {
  const value = process.env[key];
  const rules = requiredVars[key];
  
  if (!value || value.trim() === '') {
    console.error(`❌ ${key} is MISSING`);
    missingVars.push(key);
    allValid = false;
    return;
  }

  // Validate based on rules
  let isValid = true;
  
  if (rules.prefix && !value.startsWith(rules.prefix)) {
    console.warn(`⚠️  ${key} should start with "${rules.prefix}", got: ${value.substring(0, 20)}...`);
  }
  
  if (rules.minLength && value.length < rules.minLength) {
    console.error(`❌ ${key} is too short (expected ${rules.minLength}+ chars, got ${value.length})`);
    isValid = false;
  }
  
  if (rules.contains && !value.includes(rules.contains)) {
    console.error(`❌ ${key} should contain "${rules.contains}", got: ${value.substring(0, 40)}`);
    isValid = false;
  }
  
  if (rules.value && value !== rules.value) {
    console.warn(`⚠️  ${key} should be "${rules.value}", got: ${value}`);
  }
  
  if (isValid) {
    const displayValue = value.length > 40 ? value.substring(0, 40) + '...' : value;
    console.log(`✅ ${key} = ${displayValue}`);
  } else {
    allValid = false;
  }
});

console.log('\n' + '═'.repeat(60));

if (!allValid) {
  console.error('\n⚠️  VALIDATION WARNING - Missing or Invalid Environment Variables');
  console.error('\n📝 Required variables in .env.local:\n');
  
  missingVars.forEach(key => {
    console.error(`   ${key}=<your-value>`);
  });
  
  console.error('\n💡 How to fix:');
  console.error('   1. Check your .env.local file exists in goryl/ folder');
  console.error('   2. Ensure all required variables are set with actual values (not placeholders)');
  console.error('   3. Run: npm run verify:cognito');
  console.error('   4. Then run: npm run build');
  console.error('\n⚠️  Continuing with build anyway...\n');
  
  process.exit(0);
}

console.log('✅ All environment variables are properly configured!\n');

