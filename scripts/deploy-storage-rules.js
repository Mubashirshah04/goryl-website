#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function deployStorageRules() {
  console.log('🚀 Deploying Firebase Storage Rules...');
  
  try {
    // Check if Firebase CLI is installed
    await execAsync('firebase --version');
    console.log('✅ Firebase CLI is installed');
  } catch (error) {
    console.error('❌ Firebase CLI is not installed. Please install it first:');
    console.log('   npm install -g firebase-tools');
    process.exit(1);
  }
  
  try {
    // Login check
    const { stdout } = await execAsync('firebase projects:list');
    console.log('✅ Firebase CLI is authenticated');
  } catch (error) {
    console.error('❌ Not logged into Firebase. Please login first:');
    console.log('   firebase login');
    process.exit(1);
  }
  
  try {
    // Deploy storage rules
    console.log('📤 Deploying storage rules...');
    const { stdout, stderr } = await execAsync('firebase deploy --only storage', { cwd: __dirname + '/..' });
    
    if (stderr) {
      console.error('⚠️  Warning during deployment:');
      console.error(stderr);
    }
    
    console.log('✅ Storage rules deployed successfully!');
    console.log(stdout);
  } catch (error) {
    console.error('❌ Failed to deploy storage rules:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the deployment
if (require.main === module) {
  deployStorageRules();
}

module.exports = { deployStorageRules };