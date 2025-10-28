# Quick Test Script for Affiliate Monitor
# This script runs a single check cycle to verify everything is working

Write-Host "Testing Nefol Affiliate Program Components..." -ForegroundColor Cyan
Write-Host ""

# Test Backend API
try {
    $response = Invoke-WebRequest -Uri "http://192.168.1.66:4000/api/products" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend API: Working" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend API: Failed (HTTP $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend API: Failed ($($_.Exception.Message))" -ForegroundColor Red
}

# Test User Panel
try {
    $response = Invoke-WebRequest -Uri "http://192.168.1.66:5173" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ User Panel: Accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ User Panel: Failed (HTTP $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ User Panel: Failed ($($_.Exception.Message))" -ForegroundColor Red
}

# Test Admin Panel
try {
    $response = Invoke-WebRequest -Uri "http://192.168.1.66:5174" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Admin Panel: Accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Admin Panel: Failed (HTTP $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Admin Panel: Failed ($($_.Exception.Message))" -ForegroundColor Red
}

# Test Affiliate Dashboard API
try {
    $headers = @{
        "Authorization" = "Bearer user_token_4"
        "Content-Type" = "application/json"
    }
    $response = Invoke-WebRequest -Uri "http://192.168.1.66:4000/api/affiliate/dashboard" -Headers $headers -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        Write-Host "✅ Affiliate Dashboard: Working (User: $($data.name), Status: $($data.status))" -ForegroundColor Green
    } else {
        Write-Host "❌ Affiliate Dashboard: Failed (HTTP $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Affiliate Dashboard: Failed ($($_.Exception.Message))" -ForegroundColor Red
}

# Test Affiliate Referrals API
try {
    $headers = @{
        "Authorization" = "Bearer user_token_4"
        "Content-Type" = "application/json"
    }
    $response = Invoke-WebRequest -Uri "http://192.168.1.66:4000/api/affiliate/referrals" -Headers $headers -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        $data = $response.Content | ConvertFrom-Json
        Write-Host "✅ Affiliate Referrals: Working (Total: $($data.pagination.total))" -ForegroundColor Green
    } else {
        Write-Host "❌ Affiliate Referrals: Failed (HTTP $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Affiliate Referrals: Failed ($($_.Exception.Message))" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test completed! Run 'start-monitor.bat' for continuous monitoring." -ForegroundColor Yellow
Write-Host ""
