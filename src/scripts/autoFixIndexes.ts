#!/usr/bin/env node

/**
 * Automated script to resolve stuck Firestore indexes
 * 
 * This script automatically resolves Firestore indexes that have been stuck 
 * in "BUILDING" state for extended periods.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function checkFirebaseSetup() {
  try {
    const { stdout } = await execPromise('firebase --version');
    console.log('✅ Firebase CLI version:', stdout.trim());
    return true;
  } catch (error) {
    console.error('❌ Firebase CLI not found. Please install it first:');
    console.error('npm install -g firebase-tools');
    return false;
  }
}

async function deleteStuckIndexes() {
  try {
    console.log('🗑️  Deleting all composite indexes...');
    await execPromise('firebase firestore:delete-indexes');
    console.log('✅ All indexes deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting indexes:', error);
    return false;
  }
}

async function deployIndexes() {
  try {
    console.log('🚀 Deploying Firestore indexes from firestore.indexes.json...');
    const { stdout, stderr } = await execPromise('firebase deploy --only firestore:indexes');
    
    if (stderr) {
      console.warn('Deployment warnings:', stderr);
    }
    
    console.log('Deployment output:', stdout);
    console.log('✅ Indexes deployment initiated');
    return true;
  } catch (error) {
    console.error('Error deploying indexes:', error);
    return false;
  }
}

async function main() {
  console.log('🔧 Automated Firestore Index Resolution');
  console.log('=====================================');
  
  // Check Firebase setup
  if (!(await checkFirebaseSetup())) {
    process.exit(1);
  }
  
  console.log('\nThis script will automatically:');
  console.log('1. Delete all existing composite indexes');
  console.log('2. Redeploy indexes from firestore.indexes.json');
  console.log('3. Complete the process');
  
  try {
    console.log('\n--- Step 1: Deleting stuck indexes ---');
    if (!(await deleteStuckIndexes())) {
      console.error('❌ Failed to delete indexes');
      process.exit(1);
    }
    
    console.log('\n--- Step 2: Deploying updated indexes ---');
    if (!(await deployIndexes())) {
      console.error('❌ Failed to deploy indexes');
      process.exit(1);
    }
    
    console.log('\n✅ Index resolution process completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Wait 5-10 minutes for indexes to build');
    console.log('2. Test your application queries');
    console.log('3. Monitor Firebase Console for any remaining issues');
    
  } catch (error) {
    console.error('Error during index resolution:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error);
}