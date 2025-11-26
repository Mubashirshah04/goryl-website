/**
 * Fix .env.local File Encoding
 * 
 * Converts .env.local from UTF-16 to UTF-8
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing .env.local file encoding...\n');

const envLocalPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envLocalPath)) {
  console.error('❌ .env.local file not found!');
  process.exit(1);
}

// Read file as buffer
const buffer = fs.readFileSync(envLocalPath);

// Check encoding
function detectEncoding(buffer) {
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return 'UTF-16 LE';
  }
  if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return 'UTF-16 BE';
  }
  if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return 'UTF-8 BOM';
  }
  return 'UTF-8';
}

const currentEncoding = detectEncoding(buffer);
console.log(`   Current encoding: ${currentEncoding}`);

if (currentEncoding === 'UTF-8') {
  console.log('✅ File is already in UTF-8 encoding!');
  process.exit(0);
}

// Convert UTF-16 to UTF-8
let content;
if (currentEncoding === 'UTF-16 LE') {
  // Remove BOM (first 2 bytes) and convert UTF-16 LE to string
  const utf16Buffer = buffer.slice(2); // Remove BOM
  content = utf16Buffer.toString('utf16le');
} else if (currentEncoding === 'UTF-16 BE') {
  // Convert UTF-16 BE to string
  const utf16Buffer = buffer.slice(2); // Remove BOM
  // Swap bytes for BE
  const swapped = Buffer.alloc(utf16Buffer.length);
  for (let i = 0; i < utf16Buffer.length; i += 2) {
    swapped[i] = utf16Buffer[i + 1];
    swapped[i + 1] = utf16Buffer[i];
  }
  content = swapped.toString('utf16le');
} else {
  content = buffer.toString('utf8');
}

// Clean up content - remove null bytes and fix line endings
content = content
  .replace(/\0/g, '') // Remove null bytes
  .replace(/\r\n/g, '\n') // Normalize line endings
  .replace(/\r/g, '\n'); // Handle old Mac line endings

// Fix leading spaces in NEXT_PUBLIC_COGNITO_DOMAIN
const lines = content.split('\n');
const fixedLines = lines.map(line => {
  // Remove leading spaces from NEXT_PUBLIC_COGNITO_DOMAIN
  const trimmed = line.trim();
  if (trimmed.startsWith('NEXT_PUBLIC_COGNITO_DOMAIN')) {
    return trimmed;
  }
  return line;
});

const fixedContent = fixedLines.join('\n');

// Create backup
const backupPath = envLocalPath + '.backup.' + Date.now();
fs.copyFileSync(envLocalPath, backupPath);
console.log(`   ✅ Backup created: ${path.basename(backupPath)}`);

// Write as UTF-8
fs.writeFileSync(envLocalPath, fixedContent, 'utf8');
console.log('   ✅ File converted to UTF-8');
console.log('   ✅ Leading spaces removed from NEXT_PUBLIC_COGNITO_DOMAIN');

// Verify
const verifyBuffer = fs.readFileSync(envLocalPath);
const verifyEncoding = detectEncoding(verifyBuffer);
console.log(`   ✅ Verified encoding: ${verifyEncoding}`);

// Check for Cognito variables
const verifyContent = fs.readFileSync(envLocalPath, 'utf8');
const hasClientId = verifyContent.includes('NEXT_PUBLIC_COGNITO_CLIENT_ID=');
const hasUserPoolId = verifyContent.includes('NEXT_PUBLIC_COGNITO_USER_POOL_ID=');
const hasDomain = verifyContent.includes('NEXT_PUBLIC_COGNITO_DOMAIN=');

console.log('\n📊 Cognito Variables Check:');
console.log(`   NEXT_PUBLIC_COGNITO_CLIENT_ID: ${hasClientId ? '✅ Found' : '❌ Missing'}`);
console.log(`   NEXT_PUBLIC_COGNITO_USER_POOL_ID: ${hasUserPoolId ? '✅ Found' : '❌ Missing'}`);
console.log(`   NEXT_PUBLIC_COGNITO_DOMAIN: ${hasDomain ? '✅ Found' : '❌ Missing'}`);

console.log('\n✅ File fixed! Next steps:');
console.log('   1. Delete .next folder: rmdir /s /q .next');
console.log('   2. Restart server: npm run dev');

