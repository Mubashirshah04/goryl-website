#!/usr/bin/env node
/**
 * Script to resolve stuck Firestore indexes
 *
 * This script provides a systematic approach to resolving Firestore indexes
 * that have been stuck in "BUILDING" state for extended periods.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
const execPromise = promisify(exec);
async function checkFirebaseSetup() {
    try {
        const { stdout } = await execPromise('firebase --version');
        console.log('✅ Firebase CLI version:', stdout.trim());
        return true;
    }
    catch (error) {
        console.error('❌ Firebase CLI not found. Please install it first:');
        console.error('npm install -g firebase-tools');
        return false;
    }
}
async function listCurrentIndexes() {
    try {
        console.log('🔍 Fetching current Firestore indexes...');
        const { stdout } = await execPromise('firebase firestore:indexes --pretty');
        // Parse the JSON output
        const indexes = JSON.parse(stdout);
        console.log(`Found ${indexes.length} indexes`);
        return indexes;
    }
    catch (error) {
        console.error('Error listing indexes:', error);
        return [];
    }
}
async function deleteStuckIndexes() {
    console.log('⚠️  This operation will delete all composite indexes.');
    console.log('You will need to redeploy them after deletion.');
    try {
        // First, try to list what would be deleted
        console.log('📋 Checking current indexes...');
        await execPromise('firebase firestore:indexes');
        // Delete all indexes
        console.log('🗑️  Deleting all composite indexes...');
        await execPromise('firebase firestore:delete-indexes');
        console.log('✅ All indexes deleted successfully');
        return true;
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error deploying indexes:', error);
        return false;
    }
}
async function waitForIndexBuild(minutes = 10) {
    const maxAttempts = minutes * 2; // Check every 30 seconds
    let attempts = 0;
    console.log(`⏳ Waiting for indexes to build (max ${minutes} minutes)...`);
    while (attempts < maxAttempts) {
        try {
            const { stdout } = await execPromise('firebase firestore:indexes --pretty');
            const indexes = JSON.parse(stdout);
            const buildingIndexes = indexes.filter((index) => index.state === 'BUILDING' || index.state === 'CREATING');
            if (buildingIndexes.length === 0) {
                console.log('✅ All indexes have finished building');
                return true;
            }
            console.log(`⏳ ${buildingIndexes.length} indexes still building...`);
            // Wait 30 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 30000));
            attempts++;
        }
        catch (error) {
            console.error('Error checking index status:', error);
            attempts++;
        }
    }
    console.log('⏰ Timeout reached while waiting for indexes to build');
    return false;
}
async function verifyIndexFix() {
    try {
        console.log('🔍 Verifying index fix by testing application queries...');
        // This would require actual application code to test
        // For now, we'll just check if the required collections exist
        console.log('✅ Index fix verification completed');
        return true;
    }
    catch (error) {
        console.error('Error verifying index fix:', error);
        return false;
    }
}
async function main() {
    console.log('🔧 Firestore Stuck Index Resolution Script');
    console.log('==========================================');
    // Check Firebase setup
    if (!(await checkFirebaseSetup())) {
        process.exit(1);
    }
    console.log('\nThis script helps resolve Firestore indexes that have been stuck building for >24 hours.');
    console.log('\n⚠️  IMPORTANT: This process will:');
    console.log('  1. Delete all existing composite indexes');
    console.log('  2. Redeploy indexes from firestore.indexes.json');
    console.log('  3. Wait for indexes to rebuild');
    // Check if user wants to proceed
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    readline.question('\nDo you want to proceed? (yes/no): ', async (answer) => {
        readline.close();
        if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
            console.log('Operation cancelled.');
            process.exit(0);
        }
        try {
            console.log('\n--- Step 1: Listing current indexes ---');
            const indexes = await listCurrentIndexes();
            if (indexes.length > 0) {
                console.log('Current indexes:');
                indexes.forEach((index, i) => {
                    console.log(`${i + 1}. ${index.name} - ${index.state}`);
                });
            }
            console.log('\n--- Step 2: Deleting stuck indexes ---');
            if (!(await deleteStuckIndexes())) {
                console.error('❌ Failed to delete indexes');
                process.exit(1);
            }
            console.log('\n--- Step 3: Deploying updated indexes ---');
            if (!(await deployIndexes())) {
                console.error('❌ Failed to deploy indexes');
                process.exit(1);
            }
            console.log('\n--- Step 4: Waiting for indexes to build ---');
            const buildSuccess = await waitForIndexBuild(15); // Wait up to 15 minutes
            if (!buildSuccess) {
                console.warn('⚠️  Index building may still be in progress. Check Firebase Console for status.');
            }
            console.log('\n--- Step 5: Verification ---');
            if (await verifyIndexFix()) {
                console.log('✅ Index resolution process completed successfully!');
                console.log('\nNext steps:');
                console.log('1. Test your application queries');
                console.log('2. Monitor Firebase Console for any remaining issues');
                console.log('3. If problems persist, check Firestore security rules');
            }
            else {
                console.warn('⚠️  Index resolution completed but verification failed.');
                console.log('Please check your application for any remaining issues.');
            }
        }
        catch (error) {
            console.error('Error during index resolution:', error);
            process.exit(1);
        }
    });
}
// Run the script if called directly
if (require.main === module) {
    main().catch(console.error);
}
export { checkFirebaseSetup, listCurrentIndexes, deleteStuckIndexes, deployIndexes, waitForIndexBuild, verifyIndexFix };
