@echo off
echo ========================================
echo Fixing Clerk Environment Variables
echo ========================================
echo.

echo [1/3] Stopping dev server...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 >nul

echo [2/3] Deleting .next folder...
if exist .next (
    rmdir /s /q .next
    echo ✅ .next folder deleted
) else (
    echo ℹ️  .next folder not found
)

echo [3/3] Verifying Clerk keys...
if exist .env.local (
    findstr /C:"NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" .env.local >nul
    if %errorlevel% equ 0 (
        echo ✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY found
    ) else (
        echo ❌ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY NOT found
    )
    
    findstr /C:"CLERK_SECRET_KEY" .env.local >nul
    if %errorlevel% equ 0 (
        echo ✅ CLERK_SECRET_KEY found
    ) else (
        echo ❌ CLERK_SECRET_KEY NOT found
    )
) else (
    echo ❌ .env.local file NOT found!
    pause
    exit /b 1
)

echo.
echo ✅ Ready! Starting server...
echo.
npm run dev


