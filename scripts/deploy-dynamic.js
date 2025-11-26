#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Dynamic Deployment Process...');

// Step 1: Build Next.js app for standalone
console.log('📦 Building Next.js app...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Next.js build completed');
} catch (error) {
  console.error('❌ Next.js build failed:', error.message);
  process.exit(1);
}

// Step 2: Copy standalone files to functions
console.log('📁 Copying standalone files to functions...');
try {
  const standaloneDir = path.join(__dirname, '..', '.next', 'standalone');
  const functionsDir = path.join(__dirname, '..', 'functions');
  
  if (fs.existsSync(standaloneDir)) {
    // Use Windows-compatible copy commands
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // Windows copy commands
      execSync(`xcopy "${standaloneDir}\\*" "${functionsDir}\\" /E /I /Y`, { stdio: 'inherit' });
      
      // Copy static files
      const staticDir = path.join(__dirname, '..', '.next', 'static');
      const functionsStaticDir = path.join(functionsDir, '.next', 'static');
      
      if (fs.existsSync(staticDir)) {
        // Ensure directory exists
        if (!fs.existsSync(path.dirname(functionsStaticDir))) {
          fs.mkdirSync(path.dirname(functionsStaticDir), { recursive: true });
        }
        execSync(`xcopy "${staticDir}" "${functionsStaticDir}" /E /I /Y`, { stdio: 'inherit' });
      }
    } else {
      // Unix/Linux copy commands
      execSync(`cp -r ${standaloneDir}/* ${functionsDir}/`, { stdio: 'inherit' });
      
      const staticDir = path.join(__dirname, '..', '.next', 'static');
      const functionsStaticDir = path.join(functionsDir, '.next', 'static');
      
      if (fs.existsSync(staticDir)) {
        execSync(`cp -r ${staticDir} ${functionsStaticDir}`, { stdio: 'inherit' });
      }
    }
    
    console.log('✅ Files copied successfully');
  } else {
    console.error('❌ Standalone directory not found');
    console.log('💡 Make sure to run "npm run build" first to generate standalone files');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ File copy failed:', error.message);
  process.exit(1);
}

// Step 3: Deploy to Firebase
console.log('🔥 Deploying to Firebase...');
try {
  execSync('firebase deploy', { stdio: 'inherit' });
  console.log('✅ Firebase deployment completed');
} catch (error) {
  console.error('❌ Firebase deployment failed:', error.message);
  process.exit(1);
}

console.log('🎉 Dynamic deployment completed successfully!');
console.log('🌐 Your app is now running with real-time dynamic routes!');
