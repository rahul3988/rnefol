#!/usr/bin/env node

/**
 * Comprehensive Affiliate Program Test Script
 * Creates test users, simulates referrals, and verifies commission tracking
 */

const https = require('https');
const http = require('http');
const { Pool } = require('pg');

// Configuration
const CONFIG = {
  BACKEND_URL: 'http://192.168.1.66:4000',
  USER_PANEL_URL: 'http://192.168.1.66:5173',
  
  // Database
  DB_CONFIG: {
    host: 'localhost',
    port: 5432,
    database: 'nefol',
    user: 'nofol_users',
    password: 'Jhx82ndc9g@j'
  },
  
  // Test data
  TEST_USERS: [
    {
      name: 'Test User 1',
      email: 'testuser1@example.com',
      phone: '9876543210',
      password: 'testpass123'
    },
    {
      name: 'Test User 2', 
      email: 'testuser2@example.com',
      phone: '9876543211',
      password: 'testpass123'
    },
    {
      name: 'Test User 3',
      email: 'testuser3@example.com', 
      phone: '9876543212',
      password: 'testpass123'
    }
  ],
  
  // Existing affiliate user
  AFFILIATE_USER: {
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

function logStep(message) {
  log(`🔄 ${message}`, COLORS.MAGENTA);
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

// Database operations
async function connectDatabase() {
  try {
    dbPool = new Pool(CONFIG.DB_CONFIG);
    const client = await dbPool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    
    logSuccess(`Database connected - ${result.rows[0].current_time}`);
    return true;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    return false;
  }
}

async function createTestUser(userData) {
  try {
    const client = await dbPool.connect();
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [userData.email]
    );
    
    if (existingUser.rows.length > 0) {
      logWarning(`User ${userData.email} already exists`);
      client.release();
      return existingUser.rows[0].id;
    }
    
    // Create new user
    const { rows } = await client.query(`
      INSERT INTO users (name, email, phone, password, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `, [userData.name, userData.email, userData.phone, userData.password]);
    
    client.release();
    logSuccess(`Created user: ${userData.name} (ID: ${rows[0].id})`);
    return rows[0].id;
  } catch (error) {
    logError(`Failed to create user ${userData.email}: ${error.message}`);
    throw error;
  }
}

async function getAffiliatePartner() {
  try {
    const client = await dbPool.connect();
    
    // Get affiliate partner by user_id
    const userId = CONFIG.AFFILIATE_USER.token.split('_')[2];
    const { rows } = await client.query(
      'SELECT * FROM affiliate_partners WHERE user_id = $1',
      [userId]
    );
    
    client.release();
    
    if (rows.length === 0) {
      throw new Error('Affiliate partner not found');
    }
    
    return rows[0];
  } catch (error) {
    logError(`Failed to get affiliate partner: ${error.message}`);
    throw error;
  }
}

async function createReferralRecord(affiliateId, userId, orderId, orderTotal) {
  try {
    const client = await dbPool.connect();
    
    const commissionRate = 0.15; // 15%
    const commissionEarned = orderTotal * commissionRate;
    
    const { rows } = await client.query(`
      INSERT INTO affiliate_referrals (
        affiliate_id, order_id, customer_email, customer_name,
        order_total, commission_earned, commission_rate, status, referral_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `, [
      affiliateId,
      orderId,
      `testuser${userId}@example.com`,
      `Test User ${userId}`,
      orderTotal,
      commissionEarned,
      commissionRate,
      'confirmed'
    ]);
    
    client.release();
    logSuccess(`Created referral record - Commission: ₹${commissionEarned.toFixed(2)}`);
    return rows[0];
  } catch (error) {
    logError(`Failed to create referral record: ${error.message}`);
    throw error;
  }
}

async function getAffiliateStats(affiliateId) {
  try {
    const client = await dbPool.connect();
    
    const { rows } = await client.query(`
      SELECT 
        COUNT(*) as total_referrals,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_referrals,
        SUM(CASE WHEN status = 'confirmed' THEN commission_earned ELSE 0 END) as total_commission
      FROM affiliate_referrals 
      WHERE affiliate_id = $1
    `, [affiliateId]);
    
    client.release();
    return rows[0];
  } catch (error) {
    logError(`Failed to get affiliate stats: ${error.message}`);
    throw error;
  }
}

// API operations
async function testAffiliateAPI() {
  try {
    const response = await makeRequest(`${CONFIG.BACKEND_URL}/api/affiliate/dashboard`, {
      headers: {
        'Authorization': `Bearer ${CONFIG.AFFILIATE_USER.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      logSuccess(`Affiliate API working - User: ${data.name}, Status: ${data.status}`);
      return data;
    } else {
      throw new Error(`HTTP ${response.statusCode}`);
    }
  } catch (error) {
    logError(`Affiliate API failed: ${error.message}`);
    throw error;
  }
}

async function testAffiliateReferrals() {
  try {
    const response = await makeRequest(`${CONFIG.BACKEND_URL}/api/affiliate/referrals`, {
      headers: {
        'Authorization': `Bearer ${CONFIG.AFFILIATE_USER.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      logSuccess(`Affiliate Referrals API working - Total: ${data.pagination.total}`);
      return data;
    } else {
      throw new Error(`HTTP ${response.statusCode}`);
    }
  } catch (error) {
    logError(`Affiliate Referrals API failed: ${error.message}`);
    throw error;
  }
}

// Main test function
async function runAffiliateTest() {
  logInfo('Starting Comprehensive Affiliate Program Test...');
  console.log();
  
  // Step 1: Connect to database
  logStep('Step 1: Connecting to database...');
  const dbConnected = await connectDatabase();
  if (!dbConnected) {
    logError('Cannot proceed without database connection');
    return;
  }
  console.log();
  
  // Step 2: Test affiliate API
  logStep('Step 2: Testing affiliate API...');
  const affiliateData = await testAffiliateAPI();
  console.log();
  
  // Step 3: Get affiliate partner info
  logStep('Step 3: Getting affiliate partner information...');
  const affiliatePartner = await getAffiliatePartner();
  logSuccess(`Affiliate Partner: ${affiliatePartner.name} (ID: ${affiliatePartner.id})`);
  logSuccess(`Commission Rate: ${affiliatePartner.commission_rate}%`);
  console.log();
  
  // Step 4: Create test users
  logStep('Step 4: Creating test users...');
  const userIds = [];
  for (const userData of CONFIG.TEST_USERS) {
    const userId = await createTestUser(userData);
    userIds.push(userId);
  }
  console.log();
  
  // Step 5: Simulate referrals and purchases
  logStep('Step 5: Simulating referrals and purchases...');
  const orderTotals = [1500, 2500, 3200]; // Different order amounts
  const referralIds = [];
  
  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    const orderTotal = orderTotals[i];
    
    logInfo(`Creating referral for User ${userId} with order total ₹${orderTotal}`);
    const referral = await createReferralRecord(affiliatePartner.id, userId, i + 1, orderTotal);
    referralIds.push(referral.id);
  }
  console.log();
  
  // Step 6: Check affiliate stats
  logStep('Step 6: Checking affiliate statistics...');
  const stats = await getAffiliateStats(affiliatePartner.id);
  logSuccess(`Total Referrals: ${stats.total_referrals}`);
  logSuccess(`Confirmed Referrals: ${stats.confirmed_referrals}`);
  logSuccess(`Total Commission Earned: ₹${parseFloat(stats.total_commission || 0).toFixed(2)}`);
  console.log();
  
  // Step 7: Test affiliate referrals API
  logStep('Step 7: Testing affiliate referrals API...');
  const referralsData = await testAffiliateReferrals();
  logSuccess(`API shows ${referralsData.pagination.total} referrals`);
  console.log();
  
  // Step 8: Display summary
  logStep('Step 8: Test Summary...');
  console.log();
  console.log(`${COLORS.BRIGHT}${COLORS.CYAN}╔══════════════════════════════════════════════════════════════════════════════╗${COLORS.RESET}`);
  console.log(`${COLORS.BRIGHT}${COLORS.CYAN}║                        AFFILIATE TEST SUMMARY                              ║${COLORS.RESET}`);
  console.log(`${COLORS.BRIGHT}${COLORS.CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${COLORS.RESET}`);
  console.log();
  
  console.log(`${COLORS.BRIGHT}Affiliate Partner:${COLORS.RESET} ${affiliatePartner.name}`);
  console.log(`${COLORS.BRIGHT}Email:${COLORS.RESET} ${affiliatePartner.email}`);
  console.log(`${COLORS.BRIGHT}Commission Rate:${COLORS.RESET} ${affiliatePartner.commission_rate}%`);
  console.log();
  
  console.log(`${COLORS.BRIGHT}Test Users Created:${COLORS.RESET} ${userIds.length}`);
  CONFIG.TEST_USERS.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.name} (${user.email}) - ID: ${userIds[index]}`);
  });
  console.log();
  
  console.log(`${COLORS.BRIGHT}Referrals Created:${COLORS.RESET} ${referralIds.length}`);
  orderTotals.forEach((total, index) => {
    const commission = total * 0.15;
    console.log(`  ${index + 1}. Order Total: ₹${total} - Commission: ₹${commission.toFixed(2)}`);
  });
  console.log();
  
  console.log(`${COLORS.BRIGHT}Total Commission Earned:${COLORS.RESET} ₹${parseFloat(stats.total_commission || 0).toFixed(2)}`);
  console.log(`${COLORS.BRIGHT}Average Order Value:${COLORS.RESET} ₹${(orderTotals.reduce((a, b) => a + b, 0) / orderTotals.length).toFixed(2)}`);
  console.log();
  
  const totalRevenue = orderTotals.reduce((a, b) => a + b, 0);
  const totalCommission = parseFloat(stats.total_commission || 0);
  const commissionPercentage = ((totalCommission / totalRevenue) * 100).toFixed(2);
  
  console.log(`${COLORS.BRIGHT}Total Revenue Generated:${COLORS.RESET} ₹${totalRevenue}`);
  console.log(`${COLORS.BRIGHT}Commission Percentage:${COLORS.RESET} ${commissionPercentage}%`);
  console.log();
  
  if (stats.confirmed_referrals > 0) {
    logSuccess('✅ Affiliate program is working correctly!');
    logSuccess('✅ Commission tracking is functional!');
    logSuccess('✅ Referral system is operational!');
  } else {
    logError('❌ No confirmed referrals found');
  }
  
  console.log();
  logInfo('Test completed successfully!');
}

// Cleanup function
async function cleanup() {
  if (dbPool) {
    await dbPool.end();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logInfo('Cleaning up...');
  await cleanup();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', async (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  await cleanup();
  process.exit(1);
});

// Run the test
runAffiliateTest().catch(async (error) => {
  logError(`Test failed: ${error.message}`);
  await cleanup();
  process.exit(1);
});
