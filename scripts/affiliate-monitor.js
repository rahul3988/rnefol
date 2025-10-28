#!/usr/bin/env node

/**
 * Real-time Affiliate Program Monitor
 * Monitors all components of the affiliate system and provides live status updates
 */

const https = require('https');
const http = require('http');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Backend API
  BACKEND_URL: 'http://192.168.1.66:4000',
  
  // Frontend URLs
  USER_PANEL_URL: 'http://192.168.1.66:5173',
  ADMIN_PANEL_URL: 'http://192.168.1.66:5174',
  
  // Database
  DB_CONFIG: {
    host: 'localhost',
    port: 5432,
    database: 'nefol',
    user: 'nofol_users',
    password: 'Jhx82ndc9g@j'
  },
  
  // Monitoring intervals (in milliseconds)
  CHECK_INTERVAL: 5000, // 5 seconds
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  
  // Test user credentials
  TEST_USER: {
    email: 'rahulseth3988@gmail.com',
    token: 'user_token_4'
  }
};

// Colors for console output
const COLORS = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m'
};

// Status tracking
let status = {
  database: { connected: false, lastCheck: null, error: null },
  backend: { running: false, lastCheck: null, error: null },
  userPanel: { accessible: false, lastCheck: null, error: null },
  adminPanel: { accessible: false, lastCheck: null, error: null },
  affiliateAPI: { working: false, lastCheck: null, error: null },
  affiliateDashboard: { accessible: false, lastCheck: null, error: null },
  affiliateReferrals: { working: false, lastCheck: null, error: null }
};

// Database connection
let dbPool = null;

// Utility functions
function log(message, color = COLORS.WHITE) {
  const timestamp = new Date().toISOString();
  console.log(`${COLORS.CYAN}[${timestamp}]${COLORS.RESET} ${color}${message}${COLORS.RESET}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, COLORS.GREEN);
}

function logError(message) {
  log(`❌ ${message}`, COLORS.RED);
}

function logWarning(message) {
  log(`⚠️  ${message}`, COLORS.YELLOW);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, COLORS.BLUE);
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 10000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Database connectivity check
async function checkDatabase() {
  try {
    if (!dbPool) {
      dbPool = new Pool(CONFIG.DB_CONFIG);
    }
    
    const client = await dbPool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    client.release();
    
    status.database.connected = true;
    status.database.lastCheck = new Date();
    status.database.error = null;
    
    logSuccess(`Database connected - PostgreSQL ${result.rows[0].version.split(' ')[1]}`);
    return true;
  } catch (error) {
    status.database.connected = false;
    status.database.lastCheck = new Date();
    status.database.error = error.message;
    
    logError(`Database connection failed: ${error.message}`);
    return false;
  }
}

// Backend API health check
async function checkBackend() {
  try {
    const response = await makeRequest(`${CONFIG.BACKEND_URL}/api/products`, {
      timeout: 5000
    });
    
    if (response.statusCode === 200) {
      status.backend.running = true;
      status.backend.lastCheck = new Date();
      status.backend.error = null;
      
      logSuccess(`Backend API responding (${response.statusCode})`);
      return true;
    } else {
      throw new Error(`HTTP ${response.statusCode}`);
    }
  } catch (error) {
    status.backend.running = false;
    status.backend.lastCheck = new Date();
    status.backend.error = error.message;
    
    logError(`Backend API failed: ${error.message}`);
    return false;
  }
}

// Frontend accessibility check
async function checkUserPanel() {
  try {
    const response = await makeRequest(CONFIG.USER_PANEL_URL, {
      timeout: 5000
    });
    
    if (response.statusCode === 200) {
      status.userPanel.accessible = true;
      status.userPanel.lastCheck = new Date();
      status.userPanel.error = null;
      
      logSuccess(`User Panel accessible (${response.statusCode})`);
      return true;
    } else {
      throw new Error(`HTTP ${response.statusCode}`);
    }
  } catch (error) {
    status.userPanel.accessible = false;
    status.userPanel.lastCheck = new Date();
    status.userPanel.error = error.message;
    
    logError(`User Panel failed: ${error.message}`);
    return false;
  }
}

async function checkAdminPanel() {
  try {
    const response = await makeRequest(CONFIG.ADMIN_PANEL_URL, {
      timeout: 5000
    });
    
    if (response.statusCode === 200) {
      status.adminPanel.accessible = true;
      status.adminPanel.lastCheck = new Date();
      status.adminPanel.error = null;
      
      logSuccess(`Admin Panel accessible (${response.statusCode})`);
      return true;
    } else {
      throw new Error(`HTTP ${response.statusCode}`);
    }
  } catch (error) {
    status.adminPanel.accessible = false;
    status.adminPanel.lastCheck = new Date();
    status.adminPanel.error = error.message;
    
    logError(`Admin Panel failed: ${error.message}`);
    return false;
  }
}

// Affiliate API checks
async function checkAffiliateAPI() {
  try {
    const response = await makeRequest(`${CONFIG.BACKEND_URL}/api/affiliate/dashboard`, {
      headers: {
        'Authorization': `Bearer ${CONFIG.TEST_USER.token}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    if (response.statusCode === 200) {
      status.affiliateAPI.working = true;
      status.affiliateAPI.lastCheck = new Date();
      status.affiliateAPI.error = null;
      
      const data = JSON.parse(response.data);
      logSuccess(`Affiliate API working - User: ${data.name}, Status: ${data.status}`);
      return true;
    } else {
      throw new Error(`HTTP ${response.statusCode}`);
    }
  } catch (error) {
    status.affiliateAPI.working = false;
    status.affiliateAPI.lastCheck = new Date();
    status.affiliateAPI.error = error.message;
    
    logError(`Affiliate API failed: ${error.message}`);
    return false;
  }
}

async function checkAffiliateReferrals() {
  try {
    const response = await makeRequest(`${CONFIG.BACKEND_URL}/api/affiliate/referrals`, {
      headers: {
        'Authorization': `Bearer ${CONFIG.TEST_USER.token}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    if (response.statusCode === 200) {
      status.affiliateReferrals.working = true;
      status.affiliateReferrals.lastCheck = new Date();
      status.affiliateReferrals.error = null;
      
      const data = JSON.parse(response.data);
      logSuccess(`Affiliate Referrals API working - Total: ${data.pagination.total}`);
      return true;
    } else {
      throw new Error(`HTTP ${response.statusCode}`);
    }
  } catch (error) {
    status.affiliateReferrals.working = false;
    status.affiliateReferrals.lastCheck = new Date();
    status.affiliateReferrals.error = error.message;
    
    logError(`Affiliate Referrals API failed: ${error.message}`);
    return false;
  }
}

// Database schema check
async function checkAffiliateSchema() {
  try {
    if (!dbPool) {
      throw new Error('Database not connected');
    }
    
    const client = await dbPool.connect();
    
    // Check if affiliate tables exist
    const tables = [
      'affiliate_applications',
      'affiliate_partners', 
      'affiliate_referrals',
      'affiliate_payouts'
    ];
    
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (!result.rows[0].exists) {
        throw new Error(`Table ${table} does not exist`);
      }
    }
    
    // Check affiliate partner data
    const partnerResult = await client.query(`
      SELECT COUNT(*) as count FROM affiliate_partners WHERE user_id = $1
    `, [CONFIG.TEST_USER.token.split('_')[2]]);
    
    client.release();
    
    logSuccess(`Affiliate schema valid - Partner records: ${partnerResult.rows[0].count}`);
    return true;
  } catch (error) {
    logError(`Affiliate schema check failed: ${error.message}`);
    return false;
  }
}

// Display status dashboard
function displayStatus() {
  console.clear();
  console.log(`${COLORS.BRIGHT}${COLORS.CYAN}╔══════════════════════════════════════════════════════════════════════════════╗${COLORS.RESET}`);
  console.log(`${COLORS.BRIGHT}${COLORS.CYAN}║                    NEFOL AFFILIATE PROGRAM MONITOR                        ║${COLORS.RESET}`);
  console.log(`${COLORS.BRIGHT}${COLORS.CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${COLORS.RESET}`);
  console.log();
  
  // Database Status
  const dbStatus = status.database.connected ? '✅ CONNECTED' : '❌ DISCONNECTED';
  const dbTime = status.database.lastCheck ? status.database.lastCheck.toLocaleTimeString() : 'Never';
  console.log(`${COLORS.BRIGHT}Database:${COLORS.RESET} ${dbStatus} (Last check: ${dbTime})`);
  if (status.database.error) {
    console.log(`  ${COLORS.RED}Error: ${status.database.error}${COLORS.RESET}`);
  }
  console.log();
  
  // Backend Status
  const backendStatus = status.backend.running ? '✅ RUNNING' : '❌ DOWN';
  const backendTime = status.backend.lastCheck ? status.backend.lastCheck.toLocaleTimeString() : 'Never';
  console.log(`${COLORS.BRIGHT}Backend API:${COLORS.RESET} ${backendStatus} (Last check: ${backendTime})`);
  if (status.backend.error) {
    console.log(`  ${COLORS.RED}Error: ${status.backend.error}${COLORS.RESET}`);
  }
  console.log();
  
  // Frontend Status
  const userPanelStatus = status.userPanel.accessible ? '✅ ACCESSIBLE' : '❌ INACCESSIBLE';
  const userPanelTime = status.userPanel.lastCheck ? status.userPanel.lastCheck.toLocaleTimeString() : 'Never';
  console.log(`${COLORS.BRIGHT}User Panel:${COLORS.RESET} ${userPanelStatus} (Last check: ${userPanelTime})`);
  if (status.userPanel.error) {
    console.log(`  ${COLORS.RED}Error: ${status.userPanel.error}${COLORS.RESET}`);
  }
  
  const adminPanelStatus = status.adminPanel.accessible ? '✅ ACCESSIBLE' : '❌ INACCESSIBLE';
  const adminPanelTime = status.adminPanel.lastCheck ? status.adminPanel.lastCheck.toLocaleTimeString() : 'Never';
  console.log(`${COLORS.BRIGHT}Admin Panel:${COLORS.RESET} ${adminPanelStatus} (Last check: ${adminPanelTime})`);
  if (status.adminPanel.error) {
    console.log(`  ${COLORS.RED}Error: ${status.adminPanel.error}${COLORS.RESET}`);
  }
  console.log();
  
  // Affiliate API Status
  const affiliateAPIStatus = status.affiliateAPI.working ? '✅ WORKING' : '❌ FAILED';
  const affiliateAPITime = status.affiliateAPI.lastCheck ? status.affiliateAPI.lastCheck.toLocaleTimeString() : 'Never';
  console.log(`${COLORS.BRIGHT}Affiliate Dashboard API:${COLORS.RESET} ${affiliateAPIStatus} (Last check: ${affiliateAPITime})`);
  if (status.affiliateAPI.error) {
    console.log(`  ${COLORS.RED}Error: ${status.affiliateAPI.error}${COLORS.RESET}`);
  }
  
  const referralsAPIStatus = status.affiliateReferrals.working ? '✅ WORKING' : '❌ FAILED';
  const referralsAPITime = status.affiliateReferrals.lastCheck ? status.affiliateReferrals.lastCheck.toLocaleTimeString() : 'Never';
  console.log(`${COLORS.BRIGHT}Affiliate Referrals API:${COLORS.RESET} ${referralsAPIStatus} (Last check: ${referralsAPITime})`);
  if (status.affiliateReferrals.error) {
    console.log(`  ${COLORS.RED}Error: ${status.affiliateReferrals.error}${COLORS.RESET}`);
  }
  console.log();
  
  // Overall Status
  const allSystemsUp = status.database.connected && 
                      status.backend.running && 
                      status.userPanel.accessible && 
                      status.adminPanel.accessible && 
                      status.affiliateAPI.working && 
                      status.affiliateReferrals.working;
  
  const overallStatus = allSystemsUp ? '🟢 ALL SYSTEMS OPERATIONAL' : '🔴 ISSUES DETECTED';
  console.log(`${COLORS.BRIGHT}Overall Status:${COLORS.RESET} ${overallStatus}`);
  console.log();
  
  // URLs
  console.log(`${COLORS.BRIGHT}URLs:${COLORS.RESET}`);
  console.log(`  Backend API: ${CONFIG.BACKEND_URL}`);
  console.log(`  User Panel: ${CONFIG.USER_PANEL_URL}`);
  console.log(`  Admin Panel: ${CONFIG.ADMIN_PANEL_URL}`);
  console.log();
  
  // Test User Info
  console.log(`${COLORS.BRIGHT}Test User:${COLORS.RESET} ${CONFIG.TEST_USER.email}`);
  console.log();
  
  console.log(`${COLORS.YELLOW}Press Ctrl+C to stop monitoring${COLORS.RESET}`);
}

// Main monitoring loop
async function startMonitoring() {
  logInfo('Starting Nefol Affiliate Program Monitor...');
  logInfo(`Monitoring interval: ${CONFIG.CHECK_INTERVAL / 1000} seconds`);
  logInfo(`Health check interval: ${CONFIG.HEALTH_CHECK_INTERVAL / 1000} seconds`);
  console.log();
  
  // Initial checks
  await checkDatabase();
  await checkBackend();
  await checkUserPanel();
  await checkAdminPanel();
  await checkAffiliateAPI();
  await checkAffiliateReferrals();
  await checkAffiliateSchema();
  
  displayStatus();
  
  // Set up monitoring intervals
  setInterval(async () => {
    await checkDatabase();
    await checkBackend();
    await checkUserPanel();
    await checkAdminPanel();
    await checkAffiliateAPI();
    await checkAffiliateReferrals();
    displayStatus();
  }, CONFIG.CHECK_INTERVAL);
  
  // Detailed health checks every 30 seconds
  setInterval(async () => {
    await checkAffiliateSchema();
  }, CONFIG.HEALTH_CHECK_INTERVAL);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logInfo('Shutting down monitor...');
  if (dbPool) {
    await dbPool.end();
  }
  process.exit(0);
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Start monitoring
startMonitoring().catch(error => {
  logError(`Failed to start monitoring: ${error.message}`);
  process.exit(1);
});
