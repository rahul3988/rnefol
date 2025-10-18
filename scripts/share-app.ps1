# Share Application Script
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("user", "admin", "all")]
    [string]$Panel = "user"
)

Write-Host "Nefol Application Sharing Tool" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Check if ngrok is installed
try {
    ngrok version | Out-Null
    Write-Host "ngrok is installed" -ForegroundColor Green
} catch {
    Write-Host "ngrok is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g ngrok" -ForegroundColor Yellow
    exit 1
}

# Start the application
Write-Host "Starting application..." -ForegroundColor Yellow

if ($Panel -eq "user") {
    Write-Host "Starting user panel..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "cd '$PWD'; pnpm dev:user" -WindowStyle Minimized
    Start-Sleep -Seconds 5
    $port = 5173
} elseif ($Panel -eq "admin") {
    Write-Host "Starting admin panel..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "cd '$PWD'; pnpm dev:admin" -WindowStyle Minimized
    Start-Sleep -Seconds 5
    $port = 5174
} else {
    Write-Host "Starting all services..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "cd '$PWD'; pnpm dev" -WindowStyle Minimized
    Start-Sleep -Seconds 10
    $port = 5173
}

Write-Host "Creating public tunnel for port $port..." -ForegroundColor Yellow

# Create ngrok tunnel
if ($Panel -eq "all") {
    Write-Host "Creating tunnels for both panels..." -ForegroundColor Yellow
    Write-Host "User Panel (Port 5173):" -ForegroundColor Cyan
    Start-Process ngrok -ArgumentList "http", "5173" -WindowStyle Normal
    Write-Host "Admin Panel (Port 5174):" -ForegroundColor Cyan
    Start-Process ngrok -ArgumentList "http", "5174" -WindowStyle Normal
} else {
    Write-Host "Creating tunnel for $Panel panel (Port $port)..." -ForegroundColor Yellow
    Start-Process ngrok -ArgumentList "http", $port -WindowStyle Normal
}

Write-Host ""
Write-Host "Application is now accessible!" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Check the ngrok window for your public URLs" -ForegroundColor White
Write-Host "2. Share the HTTPS URL with your client" -ForegroundColor White
Write-Host "3. The URL will look like: https://abc123.ngrok.io" -ForegroundColor White
Write-Host ""
Write-Host "Tips:" -ForegroundColor Yellow
Write-Host "- Free ngrok URLs change each time you restart" -ForegroundColor White
Write-Host "- For permanent URLs, consider ngrok paid plans" -ForegroundColor White
Write-Host "- Keep this terminal open while sharing" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to stop sharing..." -ForegroundColor Red
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")