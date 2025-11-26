@echo off
echo ========================================
echo Firebase SSR Deployment Script
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    exit /b 1
)

REM Check if Firebase CLI is installed
where firebase >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Firebase CLI is not installed
    echo Please install it using: npm install -g firebase-tools
    exit /b 1
)

echo [1/7] Cleaning previous builds...
if exist .next rmdir /s /q .next
if exist functions\.next rmdir /s /q functions\.next
if exist functions\lib rmdir /s /q functions\lib
if exist out rmdir /s /q out

echo.
echo [2/7] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install main dependencies
    exit /b 1
)

echo.
echo [3/7] Building Next.js application...
set NODE_OPTIONS=--max-old-space-size=8192
set NEXT_TELEMETRY_DISABLED=1
call npx next build
if %errorlevel% neq 0 (
    echo ERROR: Next.js build failed
    exit /b 1
)

echo.
echo [4/7] Copying Next.js build to functions...
xcopy /E /I /Y .next functions\.next >nul
xcopy /E /I /Y public functions\public >nul
copy /Y next.config.js functions\next.config.js >nul
copy /Y package.json functions\package-next.json >nul

echo.
echo [5/7] Installing functions dependencies...
cd functions
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install functions dependencies
    cd ..
    exit /b 1
)

echo.
echo [6/7] Building TypeScript functions...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: TypeScript build failed
    cd ..
    exit /b 1
)
cd ..

echo.
echo [7/7] Deploying to Firebase...
call firebase deploy --only functions:nextjs,hosting
if %errorlevel% neq 0 (
    echo ERROR: Firebase deployment failed
    exit /b 1
)

echo.
echo ========================================
echo Deployment completed successfully!
echo ========================================
echo.
echo Your website is now live with SSR support.
echo All dynamic routes should work properly.
echo.
echo To view logs: firebase functions:log
echo.
pause
