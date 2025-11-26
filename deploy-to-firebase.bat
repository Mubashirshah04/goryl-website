@echo off
echo.
echo ========================================
echo   Firebase Deployment Script
echo   Next.js SSR with Firebase Functions
echo ========================================
echo.

REM Step 1: Clean old builds
echo Step 1: Cleaning old build files...
if exist .next rmdir /s /q .next
if exist functions\.next rmdir /s /q functions\.next
if exist functions\lib rmdir /s /q functions\lib
echo    ✅ Old builds removed
echo.

REM Step 2: Build Next.js
echo Step 2: Building Next.js app...
call npm run build
if errorlevel 1 (
    echo    ❌ Build failed!
    pause
    exit /b 1
)
echo    ✅ Next.js build complete
echo.

REM Step 3: Copy .next to functions
echo Step 3: Copying .next to functions directory...
call npm run copy:next
if errorlevel 1 (
    echo    ❌ Copy failed!
    pause
    exit /b 1
)
echo    ✅ Files copied successfully
echo.

REM Step 4: Build TypeScript functions
echo Step 4: Building TypeScript functions...
cd functions
call npm run build
if errorlevel 1 (
    echo    ❌ Functions build failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo    ✅ Functions compiled successfully
echo.

REM Step 5: Deploy to Firebase
echo Step 5: Deploying to Firebase...
call firebase deploy --only functions,hosting
if errorlevel 1 (
    echo    ❌ Deployment failed!
    pause
    exit /b 1
)
echo.
echo ========================================
echo   🎉 Deployment Complete!
echo ========================================
echo.
echo Your site is now live with SSR support!
echo Check Firebase Console for details.
echo.
pause
