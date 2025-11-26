const { exec } = require('child_process');

console.log('🚀 Deploying Firestore rules...');

exec('firebase deploy --only firestore:rules', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error deploying rules:', error);
    console.log('💡 Make sure you have Firebase CLI installed and are logged in');
    console.log('💡 Run: npm install -g firebase-tools && firebase login');
    return;
  }
  
  if (stderr) {
    console.error('⚠️ Warnings:', stderr);
  }
  
  console.log('✅ Firestore rules deployed successfully!');
  console.log(stdout);
});
