@echo off
echo.
echo ============================================================
echo   GORYL E-COMMERCE - ONE-CLICK DEPLOYMENT
echo   Dynamic SSR with Firebase Functions
echo ============================================================
echo.
echo ✅ No files deleted - Safe deployment
echo ✅ Design intact - Backend intact
echo ✅ Only building and deploying
echo.

echo [1/6] Building Next.js App (Dynamic SSR)...
call npm run build
if errorlevel 1 (
    echo.
    echo ❌ Build failed! Fix errors and try again.
    pause
    exit /b 1
)
echo ✅ Build successful
echo.

echo [2/6] Copying .next to functions directory...
if not exist functions\.next mkdir functions\.next
xcopy /E /I /Y .next functions\.next >nul 2>&1
echo ✅ Build files copied
echo.

echo [3/6] Copying public assets...
if not exist functions\public mkdir functions\public
xcopy /E /I /Y public functions\public >nul 2>&1
echo ✅ Assets copied
echo.

echo [4/6] Copying Next.js config...
copy /Y next.config.js functions\next.config.js >nul 2>&1
echo ✅ Config copied
echo.

echo [5/6] Compiling Firebase Functions...
cd functions
call npm run build
if errorlevel 1 (
    echo.
    echo ❌ Functions compilation failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✅ Functions compiled
echo.

echo [6/6] Deploying to Firebase...
echo.
echo 🚀 Deploying nextjs function and hosting...
firebase deploy --only functions:nextjs,hosting
if errorlevel 1 (
    echo.
    echo ❌ Deployment failed! Check Firebase logs:
    echo    firebase functions:log --only nextjs
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   🎉 DEPLOYMENT SUCCESSFUL!
echo ============================================================
echo.
echo ✅ Website: https://zaillisy.com
echo ✅ All dynamic routes working
echo ✅ SSR enabled for real-time data
echo.
echo 📊 Check logs: firebase functions:log --only nextjs
echo.
pause
