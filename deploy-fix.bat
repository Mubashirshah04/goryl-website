@echo off
echo.
echo ========================================
echo   FIXING FIREBASE DEPLOYMENT
echo   Complete Next.js SSR Setup
echo ========================================
echo.

REM Step 1: Clean everything
echo Step 1: Cleaning old builds...
if exist .next rmdir /s /q .next
if exist functions\.next rmdir /s /q functions\.next
if exist functions\lib rmdir /s /q functions\lib
if exist out rmdir /s /q out
echo    ✅ Clean complete
echo.

REM Step 2: Build Next.js
echo Step 2: Building Next.js with SSR...
call npm run build
if errorlevel 1 (
    echo    ❌ Build failed!
    pause
    exit /b 1
)
echo    ✅ Next.js build complete
echo.

REM Step 3: Verify .next exists
if not exist .next (
    echo    ❌ .next folder not found!
    pause
    exit /b 1
)
echo    ✅ .next folder verified
echo.

REM Step 4: Copy to functions
echo Step 3: Copying build to functions...
echo    Copying .next folder...
xcopy /E /I /Y .next functions\.next
if errorlevel 1 (
    echo    ❌ Copy .next failed!
    pause
    exit /b 1
)

echo    Copying public folder...
xcopy /E /I /Y public functions\public
if errorlevel 1 (
    echo    ⚠️ No public folder or copy failed
)

echo    Copying next.config.js...
copy /Y next.config.js functions\next.config.js
if errorlevel 1 (
    echo    ⚠️ next.config.js copy failed
)

echo    ✅ All files copied
echo.

REM Step 5: Build TypeScript functions
echo Step 4: Building Firebase Functions...
cd functions
call npm run build
if errorlevel 1 (
    echo    ❌ Functions build failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo    ✅ Functions compiled
echo.

REM Step 6: Verify functions/lib exists
if not exist functions\lib\index.js (
    echo    ❌ Compiled functions not found!
    pause
    exit /b 1
)
echo    ✅ Functions verified
echo.

REM Step 7: Delete old function
echo Step 5: Deleting old nextjs function...
firebase functions:delete nextjs --force
echo    ✅ Old function removed
echo.

REM Step 8: Deploy
echo Step 6: Deploying to Firebase...
firebase deploy --only functions:nextjs,hosting
if errorlevel 1 (
    echo    ❌ Deployment failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   🎉 DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Your site should now work at: https://zaillisy.com
echo.
echo If still loading, check logs:
echo firebase functions:log --only nextjs
echo.
pause
