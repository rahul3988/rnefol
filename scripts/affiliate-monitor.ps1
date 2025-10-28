# Nefol Affiliate Program Monitor - PowerShell Version
# Real-time monitoring script for affiliate system components

param(
    [int]$CheckInterval = 5,  # seconds
    [int]$HealthCheckInterval = 30,  # seconds
    [string]$BackendUrl = "http://192.168.1.66:4000",
    [string]$UserPanelUrl = "http://192.168.1.66:5173",
    [string]$AdminPanelUrl = "http://192.168.1.66:5174",
    [string]$TestUserEmail = "rahulseth3988@gmail.com",
    [string]$TestUserToken = "user_token_4"
)

# Configuration
$Config = @{
    BackendUrl = $BackendUrl
    UserPanelUrl = $UserPanelUrl
    AdminPanelUrl = $AdminPanelUrl
    TestUser = @{
        Email = $TestUserEmail
        Token = $TestUserToken
    }
    CheckInterval = $CheckInterval * 1000  # Convert to milliseconds
    HealthCheckInterval = $HealthCheckInterval * 1000
}

# Status tracking
$Status = @{
    Database = @{ Connected = $false; LastCheck = $null; Error = $null }
    Backend = @{ Running = $false; LastCheck = $null; Error = $null }
    UserPanel = @{ Accessible = $false; LastCheck = $null; Error = $null }
    AdminPanel = @{ Accessible = $false; LastCheck = $null; Error = $null }
    AffiliateAPI = @{ Working = $false; LastCheck = $null; Error = $null }
    AffiliateReferrals = @{ Working = $false; LastCheck = $null; Error = $null }
}

# Database connection
$DbConnection = $null

# Utility functions
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        "INFO" { "Blue" }
        default { "White" }
    }
    
    Write-Host "[$timestamp] $Message" -ForegroundColor $color
}

function Write-Success { param([string]$Message) Write-Log "✅ $Message" "SUCCESS" }
function Write-Error { param([string]$Message) Write-Log "❌ $Message" "ERROR" }
function Write-Warning { param([string]$Message) Write-Log "⚠️  $Message" "WARNING" }
function Write-Info { param([string]$Message) Write-Log "ℹ️  $Message" "INFO" }

# HTTP request helper
function Invoke-ApiRequest {
    param(
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Method = "GET",
        [string]$Body = $null,
        [int]$TimeoutSeconds = 10
    )
    
    try {
        $requestParams = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            TimeoutSec = $TimeoutSeconds
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $requestParams.Body = $Body
            $requestParams.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @requestParams
        return @{
            StatusCode = $response.StatusCode
            Content = $response.Content
            Headers = $response.Headers
        }
    }
    catch {
        throw "Request failed: $($_.Exception.Message)"
    }
}

# Database connectivity check
function Test-DatabaseConnection {
    try {
        # Try to connect to PostgreSQL using psql command
        $psqlPath = "psql"
        $connectionString = "postgresql://postgres:password@localhost:5432/nefol_db"
        
        $result = & $psqlPath -c "SELECT NOW() as current_time, version() as version;" $connectionString 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $Status.Database.Connected = $true
            $Status.Database.LastCheck = Get-Date
            $Status.Database.Error = $null
            
            Write-Success "Database connected - PostgreSQL"
            return $true
        }
        else {
            throw "psql command failed with exit code $LASTEXITCODE"
        }
    }
    catch {
        $Status.Database.Connected = $false
        $Status.Database.LastCheck = Get-Date
        $Status.Database.Error = $_.Exception.Message
        
        Write-Error "Database connection failed: $($_.Exception.Message)"
        return $false
    }
}

# Backend API health check
function Test-BackendAPI {
    try {
        $response = Invoke-ApiRequest -Url "$($Config.BackendUrl)/api/products" -TimeoutSeconds 5
        
        if ($response.StatusCode -eq 200) {
            $Status.Backend.Running = $true
            $Status.Backend.LastCheck = Get-Date
            $Status.Backend.Error = $null
            
            Write-Success "Backend API responding ($($response.StatusCode))"
            return $true
        }
        else {
            throw "HTTP $($response.StatusCode)"
        }
    }
    catch {
        $Status.Backend.Running = $false
        $Status.Backend.LastCheck = Get-Date
        $Status.Backend.Error = $_.Exception.Message
        
        Write-Error "Backend API failed: $($_.Exception.Message)"
        return $false
    }
}

# Frontend accessibility check
function Test-UserPanel {
    try {
        $response = Invoke-ApiRequest -Url $Config.UserPanelUrl -TimeoutSeconds 5
        
        if ($response.StatusCode -eq 200) {
            $Status.UserPanel.Accessible = $true
            $Status.UserPanel.LastCheck = Get-Date
            $Status.UserPanel.Error = $null
            
            Write-Success "User Panel accessible ($($response.StatusCode))"
            return $true
        }
        else {
            throw "HTTP $($response.StatusCode)"
        }
    }
    catch {
        $Status.UserPanel.Accessible = $false
        $Status.UserPanel.LastCheck = Get-Date
        $Status.UserPanel.Error = $_.Exception.Message
        
        Write-Error "User Panel failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-AdminPanel {
    try {
        $response = Invoke-ApiRequest -Url $Config.AdminPanelUrl -TimeoutSeconds 5
        
        if ($response.StatusCode -eq 200) {
            $Status.AdminPanel.Accessible = $true
            $Status.AdminPanel.LastCheck = Get-Date
            $Status.AdminPanel.Error = $null
            
            Write-Success "Admin Panel accessible ($($response.StatusCode))"
            return $true
        }
        else {
            throw "HTTP $($response.StatusCode)"
        }
    }
    catch {
        $Status.AdminPanel.Accessible = $false
        $Status.AdminPanel.LastCheck = Get-Date
        $Status.AdminPanel.Error = $_.Exception.Message
        
        Write-Error "Admin Panel failed: $($_.Exception.Message)"
        return $false
    }
}

# Affiliate API checks
function Test-AffiliateAPI {
    try {
        $headers = @{
            "Authorization" = "Bearer $($Config.TestUser.Token)"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-ApiRequest -Url "$($Config.BackendUrl)/api/affiliate/dashboard" -Headers $headers -TimeoutSeconds 5
        
        if ($response.StatusCode -eq 200) {
            $Status.AffiliateAPI.Working = $true
            $Status.AffiliateAPI.LastCheck = Get-Date
            $Status.AffiliateAPI.Error = $null
            
            $data = $response.Content | ConvertFrom-Json
            Write-Success "Affiliate API working - User: $($data.name), Status: $($data.status)"
            return $true
        }
        else {
            throw "HTTP $($response.StatusCode)"
        }
    }
    catch {
        $Status.AffiliateAPI.Working = $false
        $Status.AffiliateAPI.LastCheck = Get-Date
        $Status.AffiliateAPI.Error = $_.Exception.Message
        
        Write-Error "Affiliate API failed: $($_.Exception.Message)"
        return $false
    }
}

function Test-AffiliateReferrals {
    try {
        $headers = @{
            "Authorization" = "Bearer $($Config.TestUser.Token)"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-ApiRequest -Url "$($Config.BackendUrl)/api/affiliate/referrals" -Headers $headers -TimeoutSeconds 5
        
        if ($response.StatusCode -eq 200) {
            $Status.AffiliateReferrals.Working = $true
            $Status.AffiliateReferrals.LastCheck = Get-Date
            $Status.AffiliateReferrals.Error = $null
            
            $data = $response.Content | ConvertFrom-Json
            Write-Success "Affiliate Referrals API working - Total: $($data.pagination.total)"
            return $true
        }
        else {
            throw "HTTP $($response.StatusCode)"
        }
    }
    catch {
        $Status.AffiliateReferrals.Working = $false
        $Status.AffiliateReferrals.LastCheck = Get-Date
        $Status.AffiliateReferrals.Error = $_.Exception.Message
        
        Write-Error "Affiliate Referrals API failed: $($_.Exception.Message)"
        return $false
    }
}

# Display status dashboard
function Show-Status {
    Clear-Host
    
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                    NEFOL AFFILIATE PROGRAM MONITOR                        ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    # Database Status
    $dbStatus = if ($Status.Database.Connected) { "✅ CONNECTED" } else { "❌ DISCONNECTED" }
    $dbTime = if ($Status.Database.LastCheck) { $Status.Database.LastCheck.ToString("HH:mm:ss") } else { "Never" }
    Write-Host "Database: $dbStatus (Last check: $dbTime)" -ForegroundColor White
    if ($Status.Database.Error) {
        Write-Host "  Error: $($Status.Database.Error)" -ForegroundColor Red
    }
    Write-Host ""
    
    # Backend Status
    $backendStatus = if ($Status.Backend.Running) { "✅ RUNNING" } else { "❌ DOWN" }
    $backendTime = if ($Status.Backend.LastCheck) { $Status.Backend.LastCheck.ToString("HH:mm:ss") } else { "Never" }
    Write-Host "Backend API: $backendStatus (Last check: $backendTime)" -ForegroundColor White
    if ($Status.Backend.Error) {
        Write-Host "  Error: $($Status.Backend.Error)" -ForegroundColor Red
    }
    Write-Host ""
    
    # Frontend Status
    $userPanelStatus = if ($Status.UserPanel.Accessible) { "✅ ACCESSIBLE" } else { "❌ INACCESSIBLE" }
    $userPanelTime = if ($Status.UserPanel.LastCheck) { $Status.UserPanel.LastCheck.ToString("HH:mm:ss") } else { "Never" }
    Write-Host "User Panel: $userPanelStatus (Last check: $userPanelTime)" -ForegroundColor White
    if ($Status.UserPanel.Error) {
        Write-Host "  Error: $($Status.UserPanel.Error)" -ForegroundColor Red
    }
    
    $adminPanelStatus = if ($Status.AdminPanel.Accessible) { "✅ ACCESSIBLE" } else { "❌ INACCESSIBLE" }
    $adminPanelTime = if ($Status.AdminPanel.LastCheck) { $Status.AdminPanel.LastCheck.ToString("HH:mm:ss") } else { "Never" }
    Write-Host "Admin Panel: $adminPanelStatus (Last check: $adminPanelTime)" -ForegroundColor White
    if ($Status.AdminPanel.Error) {
        Write-Host "  Error: $($Status.AdminPanel.Error)" -ForegroundColor Red
    }
    Write-Host ""
    
    # Affiliate API Status
    $affiliateAPIStatus = if ($Status.AffiliateAPI.Working) { "✅ WORKING" } else { "❌ FAILED" }
    $affiliateAPITime = if ($Status.AffiliateAPI.LastCheck) { $Status.AffiliateAPI.LastCheck.ToString("HH:mm:ss") } else { "Never" }
    Write-Host "Affiliate Dashboard API: $affiliateAPIStatus (Last check: $affiliateAPITime)" -ForegroundColor White
    if ($Status.AffiliateAPI.Error) {
        Write-Host "  Error: $($Status.AffiliateAPI.Error)" -ForegroundColor Red
    }
    
    $referralsAPIStatus = if ($Status.AffiliateReferrals.Working) { "✅ WORKING" } else { "❌ FAILED" }
    $referralsAPITime = if ($Status.AffiliateReferrals.LastCheck) { $Status.AffiliateReferrals.LastCheck.ToString("HH:mm:ss") } else { "Never" }
    Write-Host "Affiliate Referrals API: $referralsAPIStatus (Last check: $referralsAPITime)" -ForegroundColor White
    if ($Status.AffiliateReferrals.Error) {
        Write-Host "  Error: $($Status.AffiliateReferrals.Error)" -ForegroundColor Red
    }
    Write-Host ""
    
    # Overall Status
    $allSystemsUp = $Status.Database.Connected -and 
                    $Status.Backend.Running -and 
                    $Status.UserPanel.Accessible -and 
                    $Status.AdminPanel.Accessible -and 
                    $Status.AffiliateAPI.Working -and 
                    $Status.AffiliateReferrals.Working
    
    $overallStatus = if ($allSystemsUp) { "🟢 ALL SYSTEMS OPERATIONAL" } else { "🔴 ISSUES DETECTED" }
    Write-Host "Overall Status: $overallStatus" -ForegroundColor White
    Write-Host ""
    
    # URLs
    Write-Host "URLs:" -ForegroundColor White
    Write-Host "  Backend API: $($Config.BackendUrl)" -ForegroundColor Gray
    Write-Host "  User Panel: $($Config.UserPanelUrl)" -ForegroundColor Gray
    Write-Host "  Admin Panel: $($Config.AdminPanelUrl)" -ForegroundColor Gray
    Write-Host ""
    
    # Test User Info
    Write-Host "Test User: $($Config.TestUser.Email)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Yellow
}

# Main monitoring function
function Start-Monitoring {
    Write-Info "Starting Nefol Affiliate Program Monitor..."
    Write-Info "Monitoring interval: $($Config.CheckInterval / 1000) seconds"
    Write-Info "Health check interval: $($Config.HealthCheckInterval / 1000) seconds"
    Write-Host ""
    
    # Initial checks
    Test-DatabaseConnection
    Test-BackendAPI
    Test-UserPanel
    Test-AdminPanel
    Test-AffiliateAPI
    Test-AffiliateReferrals
    
    Show-Status
    
    # Set up monitoring timer
    $timer = [System.Timers.Timer]::new($Config.CheckInterval)
    $timer.AutoReset = $true
    $timer.Add_Elapsed({
        Test-DatabaseConnection
        Test-BackendAPI
        Test-UserPanel
        Test-AdminPanel
        Test-AffiliateAPI
        Test-AffiliateReferrals
        Show-Status
    })
    
    $timer.Start()
    
    # Keep script running
    try {
        while ($true) {
            Start-Sleep -Seconds 1
        }
    }
    finally {
        $timer.Stop()
        $timer.Dispose()
    }
}

# Handle Ctrl+C gracefully
$null = Register-EngineEvent PowerShell.Exiting -Action {
    Write-Info "Shutting down monitor..."
}

# Start monitoring
Start-Monitoring
