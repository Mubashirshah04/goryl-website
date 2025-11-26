const https = require('https');
const fs = require('fs');

console.log('🔍 Firebase SSR Deployment Verification\n');

// Read Firebase project ID from .firebaserc
let projectId;
try {
  const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
  projectId = firebaserc.projects?.default;
  if (!projectId) {
    console.error('❌ No default project found in .firebaserc');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Could not read .firebaserc:', error.message);
  process.exit(1);
}

const baseUrl = `https://${projectId}.web.app`;
console.log(`📍 Testing deployment at: ${baseUrl}\n`);

// Routes to test
const routes = [
  { path: '/', name: 'Homepage' },
  { path: '/_health', name: 'Health Check' },
  { path: '/videos', name: 'Reels Page' },
  { path: '/explore', name: 'Explore Page' },
  { path: '/cart', name: 'Cart Page' },
  { path: '/profile', name: 'Profile Page' },
  { path: '/categories', name: 'Categories Page' },
];

let successCount = 0;
let failCount = 0;

// Function to test a single route
function testRoute(route) {
  return new Promise((resolve) => {
    const url = `${baseUrl}${route.path}`;
    console.log(`Testing ${route.name}...`);
    
    https.get(url, (res) => {
      if (res.statusCode === 200 || res.statusCode === 304) {
        console.log(`✅ ${route.name}: OK (${res.statusCode})`);
        successCount++;
      } else if (res.statusCode === 302 || res.statusCode === 301) {
        console.log(`↪️ ${route.name}: Redirect (${res.statusCode})`);
        successCount++;
      } else {
        console.log(`❌ ${route.name}: Failed (${res.statusCode})`);
        failCount++;
      }
      resolve();
    }).on('error', (err) => {
      console.log(`❌ ${route.name}: Error - ${err.message}`);
      failCount++;
      resolve();
    });
  });
}

// Test all routes sequentially
async function runTests() {
  for (const route of routes) {
    await testRoute(route);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n========================================');
  console.log('📊 Deployment Verification Results:');
  console.log(`✅ Successful: ${successCount}/${routes.length}`);
  console.log(`❌ Failed: ${failCount}/${routes.length}`);
  
  if (failCount === 0) {
    console.log('\n🎉 All routes are working! Your SSR deployment is successful.');
  } else if (successCount > 0) {
    console.log('\n⚠️ Some routes are not working. Check Firebase Functions logs.');
    console.log('Run: firebase functions:log');
  } else {
    console.log('\n❌ Deployment appears to be failing. Please check:');
    console.log('1. Firebase Functions are deployed: firebase deploy --only functions');
    console.log('2. Hosting is configured: firebase deploy --only hosting');
    console.log('3. Check logs: firebase functions:log');
  }
  console.log('========================================\n');
}

// Run the tests
runTests();
