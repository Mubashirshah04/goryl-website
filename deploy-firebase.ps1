# Firebase Deployment Script with NextAuth Support
Write-Host "🚀 Starting Firebase Deployment with NextAuth..." -ForegroundColor Cyan

# Step 1: Build
Write-Host "`n📦 Building Next.js app..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Copy .next to functions
Write-Host "`n📂 Copying build to functions..." -ForegroundColor Yellow
if (Test-Path "functions\.next") {
    Remove-Item -Path "functions\.next" -Recurse -Force
}
Copy-Item -Path ".next" -Destination "functions\.next" -Recurse -Force
Write-Host "✅ Build copied to functions" -ForegroundColor Green

# Step 3: Install functions dependencies (including NextAuth deps)
Write-Host "`n📦 Installing functions dependencies..." -ForegroundColor Yellow
Write-Host "   Installing: AWS SDK, jsonwebtoken, and other dependencies..." -ForegroundColor Gray
Push-Location functions
npm install
Pop-Location
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Step 4: Verify NextAuth function exists
Write-Host "`n🔐 Verifying NextAuth function..." -ForegroundColor Yellow
if (Test-Path "functions\nextauth-api.js") {
    Write-Host "✅ NextAuth function found" -ForegroundColor Green
} else {
    Write-Host "❌ NextAuth function missing!" -ForegroundColor Red
    exit 1
}

# Step 5: Deploy
Write-Host "`n🚀 Deploying to Firebase..." -ForegroundColor Yellow
Write-Host "   Deploying functions: nextjs, nextauth" -ForegroundColor Gray
Write-Host "   Deploying hosting: static files + rewrites" -ForegroundColor Gray
firebase deploy --only "functions,hosting"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Your site: https://zaillisy.com" -ForegroundColor Cyan
    Write-Host "🔐 Test login at: https://zaillisy.com/auth-login" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
