/**
 * Check Environment Variables Script
 * 
 * This script checks if .env.local file is being loaded correctly
 */

const fs = require('fs');
const path = require('path');

// Check file encoding
function detectEncoding(buffer) {
  // Check for UTF-16 LE BOM
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return 'UTF-16 LE';
  }
  // Check for UTF-16 BE BOM
  if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return 'UTF-16 BE';
  }
  // Check for UTF-8 BOM
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return 'UTF-8 BOM';
  }
  return 'UTF-8';
}

console.log('🔍 Checking Environment Variables...\n');

// Check if .env.local exists
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envPath = path.join(__dirname, '..', '.env');

console.log('📁 File Locations:');
console.log(`   .env.local: ${envLocalPath}`);
console.log(`   Exists: ${fs.existsSync(envLocalPath) ? '✅ YES' : '❌ NO'}`);
console.log(`   .env: ${envPath}`);
console.log(`   Exists: ${fs.existsSync(envPath) ? '✅ YES' : '❌ NO'}\n`);

if (fs.existsSync(envLocalPath)) {
  // Read file as buffer first to detect encoding
  const buffer = fs.readFileSync(envLocalPath);
  const encoding = detectEncoding(buffer);
  console.log(`   File encoding: ${encoding}`);
  
  if (encoding === 'UTF-16 LE' || encoding === 'UTF-16 BE') {
    console.error('\n❌ ISSUE FOUND: File is in UTF-16 encoding!');
    console.error('   Next.js requires UTF-8 encoding for .env.local file.');
    console.error('   Please re-save the file as UTF-8 without BOM.');
    console.error('\n   Fix steps:');
    console.error('   1. Open .env.local in Notepad++ or VS Code');
    console.error('   2. Go to Encoding menu');
    console.error('   3. Select "Convert to UTF-8" (NOT UTF-8 with BOM)');
    console.error('   4. Save the file');
    console.error('   5. Restart server');
    process.exit(1);
  }
  
  const content = fs.readFileSync(envLocalPath, 'utf8');
  const lines = content.split('\n');
  
  console.log('📄 .env.local File Content:');
  console.log(`   Total lines: ${lines.length}\n`);
  
  // Check for Cognito variables
  const cognitoVars = {
    'NEXT_PUBLIC_COGNITO_USER_POOL_ID': false,
    'NEXT_PUBLIC_COGNITO_CLIENT_ID': false,
    'NEXT_PUBLIC_COGNITO_DOMAIN': false,
  };
  
  console.log('\n📋 First 20 lines of file:');
  lines.slice(0, 20).forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();
    if (trimmed) {
      console.log(`   Line ${lineNum}: "${trimmed.substring(0, 70)}${trimmed.length > 70 ? '...' : ''}"`);
    }
  });
  
  console.log('\n🔍 Searching for Cognito variables in file...\n');
  
  // First, show ALL lines that might be relevant
  let foundCognitoLines = [];
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const lineNum = index + 1;
    
    // Show lines that contain COGNITO (case-insensitive)
    if (trimmed.toLowerCase().includes('cognito') || trimmed.toLowerCase().includes('aws')) {
      foundCognitoLines.push({ lineNum, line: trimmed });
      console.log(`   Line ${lineNum}: "${trimmed.substring(0, 80)}${trimmed.length > 80 ? '...' : ''}"`);
    }
  });
  
  if (foundCognitoLines.length === 0) {
    console.log('   ⚠️ No lines containing "cognito" or "aws" found in file!');
    console.log('   📝 Showing last 10 lines of file for debugging:');
    lines.slice(-10).forEach((line, idx) => {
      const actualLineNum = lines.length - 10 + idx + 1;
      console.log(`   Line ${actualLineNum}: "${line.substring(0, 80)}${line.length > 80 ? '...' : ''}"`);
    });
  }
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const lineNum = index + 1;
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }
    
    // Check if line has leading spaces
    if (line !== trimmed && trimmed.startsWith('NEXT_PUBLIC_')) {
      console.log(`   ⚠️ Line ${lineNum}: Has leading spaces - "${line.substring(0, 40)}..."`);
    }
    
    // Check for Cognito variables (exact match)
    Object.keys(cognitoVars).forEach(key => {
      if (trimmed.startsWith(key + '=')) {
        const value = trimmed.split('=')[1]?.trim();
        cognitoVars[key] = true;
        const displayValue = value ? (value.length > 30 ? value.substring(0, 30) + '...' : value) : 'Empty';
        console.log(`   ✅ Line ${lineNum}: ${key} = ${displayValue}`);
      }
      
      // Also check for partial matches (in case of typos)
      if (trimmed.toLowerCase().includes(key.toLowerCase()) && !trimmed.startsWith(key + '=')) {
        console.log(`   ⚠️ Line ${lineNum}: Contains "${key}" but format might be wrong: "${trimmed.substring(0, 60)}"`);
      }
    });
  });
  
  console.log('\n📊 Summary:');
  Object.keys(cognitoVars).forEach(key => {
    console.log(`   ${key}: ${cognitoVars[key] ? '✅ Found' : '❌ Missing'}`);
  });
  
  // Check for common issues
  console.log('\n🔧 Common Issues Check:');
  
  // Check for quotes
  const hasQuotes = content.includes('NEXT_PUBLIC_COGNITO_CLIENT_ID="') || 
                    content.includes("NEXT_PUBLIC_COGNITO_CLIENT_ID='");
  console.log(`   Quotes around values: ${hasQuotes ? '⚠️ YES (remove quotes)' : '✅ No quotes'}`);
  
  // Check for spaces around =
  const hasSpaces = content.match(/NEXT_PUBLIC_COGNITO_\w+\s*=\s*\w/);
  console.log(`   Spaces around =: ${hasSpaces ? '⚠️ YES (remove spaces)' : '✅ No spaces'}`);
  
  // Check for leading spaces
  const hasLeadingSpaces = lines.some(line => 
    line.trim().startsWith('NEXT_PUBLIC_') && line !== line.trim()
  );
  console.log(`   Leading spaces: ${hasLeadingSpaces ? '⚠️ YES (remove leading spaces)' : '✅ No leading spaces'}`);
  
} else {
  console.error('❌ .env.local file not found!');
  console.error('   Please create .env.local file in goryl folder root');
}

console.log('\n💡 Next Steps:');
console.log('   1. Fix any issues found above');
console.log('   2. Delete .next folder: rmdir /s /q .next');
console.log('   3. Restart server: npm run dev');

