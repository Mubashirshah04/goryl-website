const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Zaillisy Social Commerce Platform...\n');

// Function to start Firebase emulators
async function startEmulators() {
  console.log('🔥 Starting Firebase emulators...');
  
  const emulators = spawn('firebase', [
    'emulators:start',
    '--project', 'demo-goryl',
    '--import', './emulator-data',
    '--export-on-exit'
  ], {
    stdio: 'inherit',
    shell: true
  });

  emulators.on('error', (error) => {
    console.log('⚠️  Firebase emulators failed to start. This is normal if not authenticated.');
    console.log('💡 To enable emulators, run: firebase login');
    startNextJS();
  });

  emulators.on('close', (code) => {
    if (code !== 0) {
      console.log('⚠️  Firebase emulators exited. Starting Next.js without emulators...');
      console.log('💡 This is normal - the app will work with production Firebase');
      startNextJS();
    }
  });

  // Wait for emulators to start
  setTimeout(() => {
    console.log('⚡ Starting Next.js development server...');
    startNextJS();
  }, 3000);
}

// Function to start Next.js
function startNextJS() {
  console.log('⚡ Starting Next.js development server...');
  const nextDev = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  nextDev.on('close', (code) => {
    console.log(`\n❌ Next.js server exited with code ${code}`);
  });
}

// Function to check if Firebase CLI is available
function checkFirebaseCLI() {
  return new Promise((resolve) => {
    const check = spawn('firebase', ['--version'], {
      stdio: 'pipe',
      shell: true
    });

    check.on('close', (code) => {
      resolve(code === 0);
    });

    check.on('error', () => {
      resolve(false);
    });
  });
}

// Main startup function
async function main() {
  console.log('🔍 Checking Firebase CLI...');
  const hasFirebaseCLI = await checkFirebaseCLI();
  
  if (hasFirebaseCLI) {
    console.log('✅ Firebase CLI found');
    startEmulators();
  } else {
    console.log('⚠️  Firebase CLI not found. Starting Next.js only...');
    console.log('💡 Install Firebase CLI: npm install -g firebase-tools');
    startNextJS();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Zaillisy development environment...');
  process.exit(0);
});

// Start the application
main().catch(console.error);
