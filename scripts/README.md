# Nefol Affiliate Program Monitor

Real-time monitoring script that checks all components of the affiliate system and provides live status updates.

## Features

- ✅ **Database Connectivity Check** - Monitors PostgreSQL connection
- ✅ **Backend API Health** - Checks if backend server is responding
- ✅ **Frontend Accessibility** - Monitors User Panel and Admin Panel
- ✅ **Affiliate API Testing** - Tests affiliate dashboard and referrals endpoints
- ✅ **Real-time Status Dashboard** - Live updates every 5 seconds
- ✅ **Error Logging** - Detailed error messages and timestamps
- ✅ **Cross-platform Support** - Available for Windows (PowerShell) and Node.js

## Quick Start

### Option 1: PowerShell (Windows) - Recommended

1. **Run the batch file:**
   ```bash
   scripts\start-monitor.bat
   ```

2. **Or run PowerShell directly:**
   ```powershell
   cd scripts
   powershell -ExecutionPolicy Bypass -File affiliate-monitor.ps1
   ```

### Option 2: Node.js (Cross-platform)

1. **Install dependencies:**
   ```bash
   cd scripts
   npm install
   ```

2. **Run the monitor:**
   ```bash
   npm start
   ```

## Configuration

You can customize the monitoring by editing the configuration in the script files:

### PowerShell Version (`affiliate-monitor.ps1`)
```powershell
param(
    [int]$CheckInterval = 5,  # seconds
    [int]$HealthCheckInterval = 30,  # seconds
    [string]$BackendUrl = "http://192.168.1.66:4000",
    [string]$UserPanelUrl = "http://192.168.1.66:5173",
    [string]$AdminPanelUrl = "http://192.168.1.66:5174",
    [string]$TestUserEmail = "rahulseth3988@gmail.com",
    [string]$TestUserToken = "user_token_4"
)
```

### Node.js Version (`affiliate-monitor.js`)
```javascript
const CONFIG = {
  BACKEND_URL: 'http://192.168.1.66:4000',
  USER_PANEL_URL: 'http://192.168.1.66:5173',
  ADMIN_PANEL_URL: 'http://192.168.1.66:5174',
  CHECK_INTERVAL: 5000, // 5 seconds
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  TEST_USER: {
    email: 'rahulseth3988@gmail.com',
    token: 'user_token_4'
  }
};
```

## What It Monitors

### 1. Database Connection
- Tests PostgreSQL connectivity
- Checks if affiliate tables exist
- Verifies schema integrity

### 2. Backend API
- Health check on `/api/products` endpoint
- Tests affiliate-specific endpoints:
  - `/api/affiliate/dashboard`
  - `/api/affiliate/referrals`
  - `/api/affiliate/application-status`
  - `/api/affiliate/verify`

### 3. Frontend Applications
- User Panel accessibility (`http://192.168.1.66:5173`)
- Admin Panel accessibility (`http://192.168.1.66:5174`)

### 4. Authentication
- Tests with real user token
- Verifies affiliate user permissions
- Checks API authentication flow

## Status Indicators

- 🟢 **ALL SYSTEMS OPERATIONAL** - Everything is working correctly
- 🔴 **ISSUES DETECTED** - One or more components have problems
- ✅ **WORKING** - Component is functioning properly
- ❌ **FAILED** - Component has issues

## Sample Output

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    NEFOL AFFILIATE PROGRAM MONITOR                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

Database: ✅ CONNECTED (Last check: 14:30:25)

Backend API: ✅ RUNNING (Last check: 14:30:26)

User Panel: ✅ ACCESSIBLE (Last check: 14:30:27)
Admin Panel: ✅ ACCESSIBLE (Last check: 14:30:28)

Affiliate Dashboard API: ✅ WORKING (Last check: 14:30:29)
Affiliate Referrals API: ✅ WORKING (Last check: 14:30:30)

Overall Status: 🟢 ALL SYSTEMS OPERATIONAL

URLs:
  Backend API: http://192.168.1.66:4000
  User Panel: http://192.168.1.66:5173
  Admin Panel: http://192.168.1.66:5174

Test User: rahulseth3988@gmail.com

Press Ctrl+C to stop monitoring
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if PostgreSQL is running
   - Verify database credentials
   - Ensure database `nefol_db` exists

2. **Backend API Failed**
   - Check if backend server is running on port 4000
   - Verify backend URL configuration
   - Check server logs for errors

3. **Frontend Panels Inaccessible**
   - Ensure development servers are running
   - Check if ports 5173 and 5174 are available
   - Verify frontend URLs in configuration

4. **Affiliate API Failed**
   - Check if test user token is valid
   - Verify affiliate tables exist in database
   - Check backend affiliate routes are registered

### Debug Mode

For more detailed logging, you can modify the script to include debug information:

```powershell
# Add -Verbose parameter to PowerShell version
powershell -ExecutionPolicy Bypass -File affiliate-monitor.ps1 -Verbose
```

## Requirements

### PowerShell Version
- Windows PowerShell 5.1+ or PowerShell Core 6+
- Internet connectivity for API tests
- PostgreSQL client tools (psql) for database checks

### Node.js Version
- Node.js 14.0.0 or higher
- npm package manager
- PostgreSQL client library (pg)

## Support

If you encounter issues with the monitoring script:

1. Check the error messages in the console output
2. Verify all URLs and credentials in the configuration
3. Ensure all required services are running
4. Check network connectivity between components

For additional help, check the backend logs and database connection status.
