# NEFOL SERVER RESTART SCRIPT
# PowerShell script to kill existing processes and start servers

Write-Host "========================================" -ForegroundColor Blue
Write-Host "    NEFOL SERVER RESTART SCRIPT" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

Write-Host "[INFO] Starting server cleanup and restart process..." -ForegroundColor Yellow
Write-Host ""

# Check if ngrok is available
Write-Host "[INFO] Checking for ngrok availability..." -ForegroundColor Yellow
try {
    ngrok version 2>$null
    $ngrokAvailable = $true
    Write-Host "[SUCCESS] ngrok is available" -ForegroundColor Green
} catch {
    $ngrokAvailable = $false
    Write-Host "[INFO] ngrok not found - port forwarding will be skipped" -ForegroundColor Yellow
}
Write-Host ""

# Step 1: Kill all Node.js processes
Write-Host "[STEP 1] Killing all Node.js processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "[SUCCESS] Node.js processes killed successfully" -ForegroundColor Green
} catch {
    Write-Host "[INFO] No Node.js processes found to kill" -ForegroundColor Green
}
Write-Host ""

# Step 2: Kill processes on common ports
Write-Host "[STEP 2] Killing processes on common ports..." -ForegroundColor Yellow
$ports = @(3000, 3001, 4000, 5173, 5174, 5000, 8000, 8080, 9000)

foreach ($port in $ports) {
    Write-Host "Checking port $port..." -ForegroundColor Yellow
    
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($connection in $connections) {
                $pid = $connection.OwningProcess
                if ($pid -and $pid -ne 0) {
                    Write-Host "Killing process $pid on port $port..." -ForegroundColor Yellow
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            }
        }
        Write-Host "[SUCCESS] Port $port cleanup completed" -ForegroundColor Green
    } catch {
        Write-Host "[INFO] No process found on port $port" -ForegroundColor Green
    }
}
Write-Host ""

# Step 3: Wait for processes to terminate
Write-Host "[STEP 3] Waiting for processes to terminate..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Write-Host "[SUCCESS] Wait completed" -ForegroundColor Green
Write-Host ""

# Step 4: Clear npm cache
Write-Host "[STEP 4] Clearing npm cache..." -ForegroundColor Yellow
try {
    npm cache clean --force 2>$null
    Write-Host "[SUCCESS] NPM cache cleared" -ForegroundColor Green
} catch {
    Write-Host "[INFO] NPM cache clear failed (this is usually fine)" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Install dependencies if needed
Write-Host "[STEP 5] Installing dependencies..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    try {
        npm install
        Write-Host "[SUCCESS] Dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "[INFO] No package.json found, skipping dependency installation" -ForegroundColor Green
}
Write-Host ""

# Step 6: Start the server
Write-Host "[STEP 6] Starting the server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "    STARTING NEFOL SERVER" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Check for backend directory
if (Test-Path "backend") {
    Write-Host "[INFO] Found backend directory, starting backend server..." -ForegroundColor Green
    if (Test-Path "backend/package.json") {
        Write-Host "Starting backend server on port 4000..." -ForegroundColor Yellow
        Start-Process -FilePath "cmd" -ArgumentList "/k", "cd backend && npm run dev" -WindowStyle Normal
    } else {
        Write-Host "[ERROR] No package.json found in backend directory" -ForegroundColor Red
    }
}

# Check for user-panel directory
if (Test-Path "user-panel") {
    Write-Host "[INFO] Found user-panel directory, starting user panel..." -ForegroundColor Green
    if (Test-Path "user-panel/package.json") {
        Write-Host "Starting user panel on port 5173..." -ForegroundColor Yellow
        Start-Process -FilePath "cmd" -ArgumentList "/k", "cd user-panel && npm run dev" -WindowStyle Normal
    } else {
        Write-Host "[ERROR] No package.json found in user-panel directory" -ForegroundColor Red
    }
}

# Check for admin-panel directory
if (Test-Path "admin-panel") {
    Write-Host "[INFO] Found admin-panel directory, starting admin panel..." -ForegroundColor Green
    if (Test-Path "admin-panel/package.json") {
        Write-Host "Starting admin panel on port 5174..." -ForegroundColor Yellow
        Start-Process -FilePath "cmd" -ArgumentList "/k", "cd admin-panel && npm run dev" -WindowStyle Normal
    } else {
        Write-Host "[ERROR] No package.json found in admin-panel directory" -ForegroundColor Red
    }
}

# Check if we're in a single project directory
if (Test-Path "package.json") {
    Write-Host "[INFO] Starting single project server..." -ForegroundColor Green
    Write-Host "Starting server..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd" -ArgumentList "/k", "npm run dev" -WindowStyle Normal
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "    SERVER STARTUP COMPLETED" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""
Write-Host "[SUCCESS] All servers should be starting now!" -ForegroundColor Green
Write-Host ""
Write-Host "Server URLs:" -ForegroundColor Yellow
Write-Host "- Backend API: http://localhost:4000" -ForegroundColor Blue
Write-Host "- User Panel: http://localhost:5173" -ForegroundColor Blue
Write-Host "- Admin Panel: http://localhost:5174" -ForegroundColor Blue
# Step 7: Start ngrok tunnels (if available)
if ($ngrokAvailable) {
    Write-Host ""
    Write-Host "[STEP 7] Starting ngrok tunnels..." -ForegroundColor Yellow
    
    $startNgrok = Read-Host "Do you want to start ngrok tunnels? (y/n)"
    if ($startNgrok -eq "y" -or $startNgrok -eq "Y") {
        Write-Host "Starting ngrok tunnels..." -ForegroundColor Yellow
        
        # Start ngrok for backend
        Write-Host "Starting ngrok tunnel for backend (port 4000)..." -ForegroundColor Yellow
        Start-Process -FilePath "cmd" -ArgumentList "/k", "ngrok http 4000" -WindowStyle Normal
        
        # Start ngrok for user panel
        Write-Host "Starting ngrok tunnel for user panel (port 5173)..." -ForegroundColor Yellow
        Start-Process -FilePath "cmd" -ArgumentList "/k", "ngrok http 5173" -WindowStyle Normal
        
        # Start ngrok for admin panel
        Write-Host "Starting ngrok tunnel for admin panel (port 5174)..." -ForegroundColor Yellow
        Start-Process -FilePath "cmd" -ArgumentList "/k", "ngrok http 5174" -WindowStyle Normal
        
        Write-Host "[SUCCESS] ngrok tunnels started" -ForegroundColor Green
        Write-Host ""
        Write-Host "ngrok Dashboard: http://localhost:4040" -ForegroundColor Cyan
        Write-Host "Check the ngrok windows for public URLs" -ForegroundColor Cyan
    } else {
        Write-Host "[INFO] Skipping ngrok tunnels" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "[INFO] To enable ngrok port forwarding:" -ForegroundColor Yellow
    Write-Host "1. Download ngrok from https://ngrok.com/" -ForegroundColor Yellow
    Write-Host "2. Add ngrok to your PATH" -ForegroundColor Yellow
    Write-Host "3. Run this script again" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Green
Read-Host
