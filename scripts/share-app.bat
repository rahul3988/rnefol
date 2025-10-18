@echo off
echo 🚀 Nefol Application Sharing Tool
echo =================================
echo.

REM Check if ngrok is installed
ngrok version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ngrok is not installed. Please install it first:
    echo    npm install -g ngrok
    pause
    exit /b 1
)

echo ✅ ngrok is installed
echo.

REM Start the user panel
echo 🔄 Starting user panel...
start "User Panel" cmd /k "cd /d %~dp0.. && pnpm dev:user"
timeout /t 5 /nobreak >nul

REM Create ngrok tunnel
echo 🌐 Creating public tunnel for user panel (Port 5173)...
echo.
echo 🎉 Application is now accessible!
echo =================================
echo.
echo 📋 Next Steps:
echo 1. Check the ngrok window for your public URL
echo 2. Share the HTTPS URL with your client
echo 3. The URL will look like: https://abc123.ngrok.io
echo.
echo 💡 Tips:
echo - Free ngrok URLs change each time you restart
echo - For permanent URLs, consider ngrok paid plans
echo - Keep this terminal open while sharing
echo.
echo Press any key to stop sharing...
pause >nul

REM Start ngrok
start "ngrok Tunnel" ngrok http 5173
