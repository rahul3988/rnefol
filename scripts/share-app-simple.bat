@echo off
echo ========================================
echo   Nefol Application Sharing Tool
echo ========================================
echo.

REM Check if ngrok is available via npx
echo Checking ngrok availability...
npx ngrok version >nul 2>&1
if %errorlevel% neq 0 (
    echo ngrok not found via npx. Installing...
    npm install -g ngrok
)

echo.
echo Starting user panel...
start "User Panel" cmd /k "cd /d %~dp0.. && pnpm dev:user"

echo Waiting for application to start...
timeout /t 8 /nobreak >nul

echo.
echo Creating public tunnel...
echo.
echo ========================================
echo   Your application is now accessible!
echo ========================================
echo.
echo Next Steps:
echo 1. Check the ngrok window for your public URL
echo 2. Share the HTTPS URL with your client
echo 3. The URL will look like: https://abc123.ngrok.io
echo.
echo Tips:
echo - Free ngrok URLs change each time you restart
echo - For permanent URLs, consider ngrok paid plans
echo - Keep this terminal open while sharing
echo.

REM Start ngrok using npx to avoid PowerShell script issues
start "ngrok Tunnel" cmd /k "npx ngrok http 5173"

echo.
echo Press any key to stop sharing...
pause >nul
