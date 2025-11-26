@echo off
echo Copying environment variables to functions...

REM Copy .env.local to functions directory
if exist .env.local (
    copy /Y .env.local functions\.env
    echo Environment variables copied successfully!
) else (
    echo WARNING: .env.local not found
    echo Please ensure your environment variables are set
)

pause
