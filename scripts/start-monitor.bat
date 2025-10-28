@echo off
echo Starting Nefol Affiliate Program Monitor...
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: PowerShell is not available on this system.
    echo Please install PowerShell or use the Node.js version instead.
    pause
    exit /b 1
)

REM Run the PowerShell monitoring script
powershell -ExecutionPolicy Bypass -File "%~dp0affiliate-monitor.ps1"

pause
