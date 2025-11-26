@echo off
echo 🚀 Deploying Goryl with Performance Optimizations...

echo.
echo 📦 Building optimized production bundle...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo 🔥 Deploying to Firebase with performance optimizations...
call firebase deploy --only hosting,firestore:rules,storage

if %ERRORLEVEL% neq 0 (
    echo ❌ Deployment failed!
    pause
    exit /b 1
)

echo.
echo ✅ Performance-optimized deployment complete!
echo.
echo 🎯 Performance Features Enabled:
echo   - WebP image conversion
echo   - Video compression
echo   - Cloudflare CDN integration
echo   - Service Worker caching
echo   - Database query optimization
echo   - Lazy loading
echo   - PWA capabilities
echo.
echo 🌐 Your app is now live with enterprise-level performance!
echo.
pause
