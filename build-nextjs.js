const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building Next.js application...');

try {
  // Build the Next.js app
  execSync('npx next build', { stdio: 'inherit' });
  
  // Copy the .next directory to functions
  const source = path.join(__dirname, '.next');
  const dest = path.join(__dirname, 'functions', '.next');
  
  // Remove existing .next directory in functions
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true });
  }
  
  // Copy .next directory
  fs.cpSync(source, dest, { recursive: true });
  
  console.log('Next.js build completed and copied to functions directory');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}