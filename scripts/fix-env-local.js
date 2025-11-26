#!/usr/bin/env node
/**
 * Script to fix .env.local file:
 * 1. Remove BOM encoding
 * 2. Add missing Cognito variables
 * 3. Ensure correct format
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const backupPath = path.join(__dirname, '..', '.env.local.backup');

console.log('🔧 Fixing .env.local file...\n');

// Backup original file
if (fs.existsSync(envPath)) {
  fs.copyFileSync(envPath, backupPath);
  console.log('✅ Created backup: .env.local.backup\n');
}

// Read file and remove BOM
let content = fs.readFileSync(envPath, 'utf8');
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
  console.log('✅ Removed UTF-8 BOM\n');
}

const lines = content.split('\n');

// Required Cognito variables with their values
const requiredVars = {
  'NEXT_PUBLIC_COGNITO_USER_POOL_ID': 'ap-south-1_UrgROe7bY',
  'NEXT_PUBLIC_COGNITO_CLIENT_ID': '1dnqju9c3c6fhtq937fl5gmh8e',
  'NEXT_PUBLIC_COGNITO_DOMAIN': 'zaillisy.auth.ap-south-1.amazoncognito.com',
  'NEXT_PUBLIC_AWS_REGION': 'ap-south-1',
};

// Track which variables exist
const existingVars = new Set();
const newLines = [];

// Process existing lines
lines.forEach((line) => {
  const trimmed = line.trim();
  
  // Skip empty lines and comments
  if (!trimmed || trimmed.startsWith('#')) {
    newLines.push(line);
    return;
  }
  
  // Check if line has = sign
  if (!trimmed.includes('=')) {
    newLines.push(line);
    return;
  }
  
  const [key, ...valueParts] = trimmed.split('=');
  const trimmedKey = key.trim();
  
  // Track existing variables
  if (requiredVars.hasOwnProperty(trimmedKey)) {
    existingVars.add(trimmedKey);
    
    // Fix format if needed (remove quotes, spaces)
    const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    newLines.push(`${trimmedKey}=${value}\n`);
  } else {
    // Keep other variables as-is
    newLines.push(line + (line.endsWith('\n') ? '' : '\n'));
  }
});

// Add missing variables
console.log('📝 Adding missing Cognito variables:\n');

let addedCount = 0;
Object.entries(requiredVars).forEach(([key, value]) => {
  if (!existingVars.has(key)) {
    // Find the AWS Cognito section or add at end
    let inserted = false;
    
    // Try to find AWS Cognito section
    for (let i = newLines.length - 1; i >= 0; i--) {
      if (newLines[i].includes('# AWS Cognito')) {
        // Insert after the comment and empty line
        newLines.splice(i + 2, 0, `${key}=${value}\n`);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      // Add at end
      newLines.push(`\n# AWS Cognito (Auth) - REQUIRED\n`);
      newLines.push(`${key}=${value}\n`);
    }
    
    console.log(`✅ Added: ${key}`);
    addedCount++;
  } else {
    console.log(`✅ Already exists: ${key}`);
  }
});

// Write fixed content
const fixedContent = newLines.join('');

// Write without BOM (UTF-8)
fs.writeFileSync(envPath, fixedContent, { encoding: 'utf8' });

console.log(`\n✅ Fixed .env.local file!`);
console.log(`   - Removed BOM encoding`);
console.log(`   - Added ${addedCount} missing variable(s)`);
console.log(`   - Fixed format (removed quotes/spaces)`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Stop dev server (Ctrl + C)`);
console.log(`   2. Delete .next folder: Remove-Item -Recurse -Force .next`);
console.log(`   3. Restart: npm run dev`);
console.log(`   4. Test in Incognito browser mode`);

