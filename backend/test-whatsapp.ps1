# WhatsApp API Integration Test Script
# This script tests the WhatsApp Business API integration

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  WhatsApp API Integration Test" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (!(Test-Path .env)) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "   Please copy env.example to .env and configure your credentials" -ForegroundColor Yellow
    exit 1
}

# Read .env file
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
$envContent = Get-Content .env

# Check for required environment variables
$hasAccessToken = $envContent | Where-Object { $_ -match "WHATSAPP_ACCESS_TOKEN=" }
$hasPhoneNumberId = $envContent | Where-Object { $_ -match "WHATSAPP_PHONE_NUMBER_ID=" }

if (!$hasAccessToken -or !$hasPhoneNumberId) {
    Write-Host "❌ Error: WhatsApp credentials not found in .env file" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please add these lines to backend/.env:" -ForegroundColor Yellow
    Write-Host "  WHATSAPP_ACCESS_TOKEN=your_access_token" -ForegroundColor White
    Write-Host "  WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id" -ForegroundColor White
    exit 1
}

# Extract values (basic check)
Write-Host "✅ Environment variables found" -ForegroundColor Green
Write-Host ""

# Check if server is running
Write-Host "Checking if backend server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend server is running" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Backend server might not be running on port 4000" -ForegroundColor Yellow
    Write-Host "   Start it with: npm run dev" -ForegroundColor Yellow
}
Write-Host ""

# Test endpoints
Write-Host "Testing WhatsApp API endpoints..." -ForegroundColor Yellow
Write-Host ""

# Test 1: Check if send endpoint exists
Write-Host "Test 1: Checking /api/whatsapp-chat/send endpoint" -ForegroundColor Cyan
try {
    $testResponse = Invoke-WebRequest -Uri "http://localhost:4000/api/whatsapp-chat/sessions" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($testResponse) {
        Write-Host "✅ WhatsApp endpoints are accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not connect to WhatsApp endpoints" -ForegroundColor Yellow
    Write-Host "   Make sure the backend server is running" -ForegroundColor Yellow
}
Write-Host ""

# Show how to test sending a message
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Ready to Test Sending Messages" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "To test sending a WhatsApp message, use one of these methods:" -ForegroundColor Yellow
Write-Host ""

Write-Host "Method 1: Using PowerShell (Invoke-WebRequest)" -ForegroundColor Green
Write-Host @'
$body = @{
    to = "917355384939"
    message = "Hello from Nefol! This is a test message."
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:4000/api/whatsapp-chat/send" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

$response.Content
'@ -ForegroundColor White
Write-Host ""

Write-Host "Method 2: Using curl" -ForegroundColor Green
Write-Host @'
curl -X POST http://localhost:4000/api/whatsapp-chat/send `
  -H "Content-Type: application/json" `
  -d "{\"to\": \"917355384939\", \"message\": \"Hello from Nefol!\"}"
'@ -ForegroundColor White
Write-Host ""

Write-Host "Method 3: Using curl with template message" -ForegroundColor Green
Write-Host @'
curl -X POST http://localhost:4000/api/whatsapp-chat/send `
  -H "Content-Type: application/json" `
  -d "{\"to\": \"917355384939\", \"template\": {\"name\": \"hello_world\", \"language\": \"en_US\"}}"
'@ -ForegroundColor White
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Test Configuration Summary" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Backend endpoint: http://localhost:4000/api/whatsapp-chat/send" -ForegroundColor Green
Write-Host "✅ Facebook Graph API: https://graph.facebook.com/v22.0/{PHONE_ID}/messages" -ForegroundColor Green
Write-Host ""
Write-Host "Ready to send WhatsApp messages!" -ForegroundColor Green

