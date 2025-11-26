#!/usr/bin/env node
/**
 * Script to deploy Firestore indexes
 *
 * This script deploys the indexes defined in firestore.indexes.json
 * to resolve the "query requires an index" errors.
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
async function deployIndexes() {
    try {
        console.log('🚀 Deploying Firestore indexes from firestore.indexes.json...');
        const { stdout, stderr } = await execPromise('firebase deploy --only firestore:indexes');
        if (stderr) {
            console.warn('Deployment warnings:', stderr);
        }
        console.log('Deployment output:', stdout);
        console.log('✅ Indexes deployment initiated');
        console.log('\n📝 Next steps:');
        console.log('1. Go to Firebase Console: https://console.firebase.google.com/project/zaillisy/firestore/indexes');
        console.log('2. Check the "Composite" tab for index building progress');
        console.log('3. Wait 2-5 minutes for indexes to build');
        console.log('4. Refresh your application');
        return true;
    }
    catch (error) {
        console.error('Error deploying indexes:', error);
        return false;
    }
}
async function main() {
    console.log('🔧 Firestore Index Deployment Script');
    console.log('==================================');
    // Check Firebase setup
    if (!(await checkFirebaseSetup())) {
        process.exit(1);
    }
    console.log('\nThis script will deploy the updated indexes defined in firestore.indexes.json');
    try {
        console.log('\n--- Deploying indexes ---');
        if (!(await deployIndexes())) {
            console.error('❌ Failed to deploy indexes');
            process.exit(1);
        }
        console.log('\n✅ Index deployment process completed!');
        console.log('\n⚠️  If you still see "query requires an index" errors:');
        console.log('1. Check Firebase Console for any remaining stuck indexes');
        console.log('2. Delete stuck indexes manually from the Firebase Console');
        console.log('3. Run this script again');
    }
    catch (error) {
        console.error('Error during index deployment:', error);
        process.exit(1);
    }
}
// Run the script if called directly
if (require.main === module) {
    main().catch(console.error);
}
