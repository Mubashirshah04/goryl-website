const https = require('https');

console.log('🔍 Firebase SSR Deployment Status Check\n');

const projectId = 'zaillisy'; // From .firebaserc
const baseUrl = `https://${projectId}.web.app`;

const routes = [
  { path: '/', name: 'Homepage' },
  { path: '/_health', name: 'Health Check' },
  { path: '/videos', name: 'Reels Page' },
  { path: '/explore', name: 'Explore Page' },
];

let successCount = 0;
let failCount = 0;

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

async function runTests() {
  for (const route of routes) {
    await testRoute(route);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n========================================');
  console.log('📊 Deployment Status Results:');
  console.log(`✅ Successful: ${successCount}/${routes.length}`);
  console.log(`❌ Failed: ${failCount}/${routes.length}`);

  if (failCount === 0) {
    console.log('\n🎉 Your website is successfully deployed with SSR!');
    console.log(`\n🌐 Visit your site: ${baseUrl}`);
    console.log('\n📋 Next Steps:');
    console.log('1. Check Firebase Functions logs: firebase functions:log');
    console.log('2. Monitor performance in Firebase Console');
    console.log('3. Test dynamic routes like /product/[id] and /profile/[username]');
  } else {
    console.log('\n⚠️ Some routes are not working. Check Firebase Functions deployment.');
    console.log('Run: firebase deploy --only functions');
  }
  console.log('========================================\n');
}

runTests();
