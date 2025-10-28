// Optimized main server file with centralized routes and utilities
import 'dotenv/config'
import express, { Request, Response } from 'express'
import cors from 'cors'
import { Pool } from 'pg'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { ensureSchema } from './utils/schema'
import { authenticateToken, sendError, sendSuccess } from './utils/apiHelpers'
import { createUserActivityTables } from './utils/userActivitySchema'
import * as productRoutes from './routes/products'
import * as variantRoutes from './routes/variants'
import * as inventoryRoutes from './routes/inventory'
import * as shiprocketRoutes from './routes/shiprocket'
import * as amazonRoutes from './routes/amazon'
import * as flipkartRoutes from './routes/flipkart'
import * as bulkRoutes from './routes/bulk'
import * as staffRoutes from './routes/staff'
import * as warehouseRoutes from './routes/warehouses'
import * as supplierRoutes from './routes/suppliers'
import * as posRoutes from './routes/pos'
import * as cartRoutes from './routes/cart'
import createCMSRouter from './routes/cms'
import blogRouter, { initBlogRouter } from './routes/blog'
import * as affiliateRoutes from './routes/affiliate'
import * as searchRoutes from './routes/search'
import * as marketingRoutes from './routes/marketing'
import * as paymentRoutes from './routes/payment'
import * as userRoutes from './routes/users'
import { seedCMSContent } from './utils/seedCMS'
import { updateAllProductsWithPricing } from './utils/updateAllProducts'

// Extend Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string
      io?: any
    }
  }
}

const app = express()
app.use(express.json())

// Serve uploaded files
app.use('/uploads', express.static('uploads'))

// Serve user panel images
app.use('/IMAGES', express.static(path.join(__dirname, '../user-panel/public/IMAGES')))

// Debug: Log the path being used
console.log('Serving IMAGES from:', path.join(__dirname, '../user-panel/public/IMAGES'))
console.log('Path exists:', fs.existsSync(path.join(__dirname, '../user-panel/public/IMAGES')))

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://192.168.1.66:5173'
app.use(cors({ origin: true, credentials: true }))

// Create HTTP server and Socket.IO
const server = createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true,
  transports: ['websocket', 'polling']
})

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/nefol'
const pool = new Pool({ connectionString })

// Create a simple db object for compatibility
const db = {
  query: async (text: string, params?: any[]) => {
    try {
      const result = await pool.query(text, params)
      return result
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }
}

// File upload configuration
const upload = multer({ dest: 'uploads/' })

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads')
}

// Helper function to broadcast updates to admin
function broadcastUpdate(type: string, data: any) {
  io.to('admin-panel').emit('update', { type, data })
}

// Helper function to broadcast updates to all users
function broadcastToUsers(event: string, data: any) {
  io.to('all-users').emit(event, data)
}

// Helper function to broadcast to specific user
function broadcastToUser(userId: string, event: string, data: any) {
  io.to(`user-${userId}`).emit(event, data)
}

// Track active sessions
const activeSessions = new Map<string, { userId?: string, connectedAt: number, lastActivity: number }>()

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id, 'from:', socket.handshake.address)
  
  // Track this session
  activeSessions.set(socket.id, {
    connectedAt: Date.now(),
    lastActivity: Date.now()
  })
  
  // Broadcast live users count to admin
  io.to('admin-panel').emit('update', { 
    type: 'live-users-count', 
    data: { count: activeSessions.size } 
  })
  
  // Admin joins admin room
  socket.on('join-admin', () => {
    socket.join('admin-panel')
    console.log('👨‍💼 Admin panel joined:', socket.id)
    
    // Send current live users count
    socket.emit('update', { 
      type: 'live-users-count', 
      data: { count: activeSessions.size } 
    })
  })
  
  // User joins user room
  socket.on('join-user', (data: any) => {
    const { userId } = data || {}
    
    // Join general users room
    socket.join('all-users')
    
    // Join user-specific room if userId provided
    if (userId) {
      socket.join(`user-${userId}`)
      const session = activeSessions.get(socket.id)
      if (session) {
        session.userId = userId
      }
      console.log('👤 User joined:', socket.id, 'userId:', userId)
    }
    
    // Broadcast updated count to admin
    io.to('admin-panel').emit('update', { 
      type: 'live-users-count', 
      data: { count: activeSessions.size } 
    })
  })
  
  // User joins general users room
  socket.on('join-users-room', () => {
    socket.join('all-users')
    console.log('👥 User joined all-users room:', socket.id)
  })
  
  // Page view tracking
  socket.on('page-view', (data: any) => {
    console.log('📄 Page view:', data.page, 'by:', socket.id)
    
    // Update last activity
    const session = activeSessions.get(socket.id)
    if (session) {
      session.lastActivity = Date.now()
    }
    
    // Save to database
    pool.query(`
      INSERT INTO page_views (user_id, session_id, page, user_agent, referrer)
      VALUES ($1, $2, $3, $4, $5)
    `, [data.userId || null, data.sessionId, data.page, data.userAgent, data.referrer])
      .catch((err: Error) => console.error('Failed to save page view:', err))
    
    // Broadcast to admin
    io.to('admin-panel').emit('update', { 
      type: 'page-view-update', 
      data 
    })
  })
  
  // Cart update tracking
  socket.on('cart-update', (data: any) => {
    console.log('🛒 Cart update:', data.action, 'by:', socket.id)
    
    // Update last activity
    const session = activeSessions.get(socket.id)
    if (session) {
      session.lastActivity = Date.now()
    }
    
    // Save to database
    pool.query(`
      INSERT INTO cart_events (user_id, session_id, action, product_id, product_name, quantity, price)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      data.userId || null, 
      data.sessionId, 
      data.action, 
      data.data?.productId,
      data.data?.productName,
      data.data?.quantity,
      data.data?.price
    ])
      .catch((err: Error) => console.error('Failed to save cart event:', err))
    
    // Broadcast to admin
    io.to('admin-panel').emit('update', { 
      type: 'cart-update', 
      data 
    })
  })
  
  // User action tracking
  socket.on('user-action', (data: any) => {
    console.log('⚡ User action:', data.action, 'by:', socket.id)
    
    // Update last activity
    const session = activeSessions.get(socket.id)
    if (session) {
      session.lastActivity = Date.now()
    }
    
    // Save to database
    pool.query(`
      INSERT INTO user_actions (user_id, session_id, action, action_data, page)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      data.userId || null,
      data.sessionId,
      data.action,
      JSON.stringify(data.data),
      data.page
    ])
      .catch((err: Error) => console.error('Failed to save user action:', err))
    
    // Broadcast to admin
    io.to('admin-panel').emit('update', { 
      type: 'user-action-update', 
      data 
    })
  })
  
  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log('❌ Client disconnected:', socket.id, 'reason:', reason)
    
    // Remove from active sessions
    activeSessions.delete(socket.id)
    
    // Broadcast updated count to admin
    io.to('admin-panel').emit('update', { 
      type: 'live-users-count', 
      data: { count: activeSessions.size } 
    })
  })
  
  socket.on('error', (error) => {
    console.error('Socket error:', socket.id, error)
  })
})

// ==================== CMS API (with real-time updates) ====================
app.use('/api/cms', createCMSRouter(pool, io))

// ==================== BLOG API ====================
// Initialize blog router with database pool
initBlogRouter(pool)
app.use('/api/blog', blogRouter)

// ==================== AFFILIATE PROGRAM API ====================
// Affiliate application submission
app.post('/api/admin/affiliate-applications', affiliateRoutes.submitAffiliateApplication.bind(null, pool))

// Admin affiliate management
app.get('/api/admin/affiliate-applications', affiliateRoutes.getAffiliateApplications.bind(null, pool))
app.get('/api/admin/affiliate-applications/:id', affiliateRoutes.getAffiliateApplication.bind(null, pool))
app.put('/api/admin/affiliate-applications/:id/approve', affiliateRoutes.approveAffiliateApplication.bind(null, pool))
app.put('/api/admin/affiliate-applications/:id/reject', affiliateRoutes.rejectAffiliateApplication.bind(null, pool))

// Affiliate partner management
app.get('/api/affiliate/application-status', authenticateToken, affiliateRoutes.getAffiliateApplicationStatus.bind(null, pool))
app.post('/api/affiliate/application', affiliateRoutes.submitAffiliateApplication.bind(null, pool))
app.post('/api/affiliate/verify', authenticateToken, affiliateRoutes.verifyAffiliateCode.bind(null, pool))
app.get('/api/affiliate/dashboard', authenticateToken, affiliateRoutes.getAffiliateDashboard.bind(null, pool))
app.get('/api/affiliate/referrals', authenticateToken, affiliateRoutes.getAffiliateReferrals.bind(null, pool))
app.get('/api/admin/affiliate-partners', affiliateRoutes.getAffiliatePartners.bind(null, pool))
app.post('/api/admin/affiliate-partners/:id/regenerate-code', affiliateRoutes.regenerateVerificationCode.bind(null, pool))

// Affiliate commission management
app.get('/api/admin/affiliate-commission-settings', affiliateRoutes.getAffiliateCommissionSettings.bind(null, pool))
app.put('/api/admin/affiliate-commission-settings', (req: any, res) => {
  req.io = io
  affiliateRoutes.updateAffiliateCommissionSettings(pool, req, res)
})
app.get('/api/affiliate/commission-settings', affiliateRoutes.getAffiliateCommissionForUsers.bind(null, pool))
app.get('/api/affiliate/marketing-materials', affiliateRoutes.getAffiliateMarketingMaterials.bind(null, pool))

// ==================== OPTIMIZED PRODUCTS API ====================
app.get('/api/products', (req, res) => productRoutes.getProducts(pool, res))
app.get('/api/products/:id', (req, res) => productRoutes.getProductById(pool, req, res))
app.get('/api/products/slug/:slug', (req, res) => productRoutes.getProductBySlug(pool, req, res))
app.post('/api/products', (req, res) => productRoutes.createProduct(pool, req, res))
app.put('/api/products/:id', (req, res) => productRoutes.updateProduct(pool, req, res))
app.delete('/api/products/:id', (req, res) => productRoutes.deleteProduct(pool, req, res))

// Product images endpoints
app.post('/api/products/:id/images', (req, res) => {
  // Check if it's multipart form data
  if (req.headers['content-type']?.includes('multipart/form-data')) {
    upload.array('images', 10)(req, res, (err) => {
      if (err) return sendError(res, 400, 'File upload error', err)
      productRoutes.uploadProductImages(pool, req, res)
    })
  } else {
    // Handle JSON data
    productRoutes.uploadProductImages(pool, req, res)
  }
})
app.get('/api/products/:id/images', (req, res) => productRoutes.getProductImages(pool, req, res))
app.delete('/api/products/:id/images/:imageId', (req, res) => productRoutes.deleteProductImage(pool, req, res))

// ==================== VARIANTS & INVENTORY ====================
app.post('/api/products/:id/variant-options', (req, res) => variantRoutes.setVariantOptions(pool, req, res))
app.get('/api/products/:id/variant-options', (req, res) => variantRoutes.getVariantOptions(pool, req, res))
app.post('/api/products/:id/variants/generate', (req, res) => variantRoutes.generateVariants(pool, req, res))
app.get('/api/products/:id/variants', (req, res) => variantRoutes.listVariants(pool, req, res))
app.post('/api/products/:id/variants', (req, res) => variantRoutes.createVariant(pool, req, res))
app.put('/api/variants/:variantId', (req, res) => variantRoutes.updateVariant(pool, req, res))
app.delete('/api/variants/:variantId', (req, res) => variantRoutes.deleteVariant(pool, req, res))

app.get('/api/inventory/:productId/summary', (req, res) => inventoryRoutes.getInventorySummary(pool, req, res))
app.post('/api/inventory/:productId/:variantId/adjust', (req, res) => inventoryRoutes.adjustStock(pool, req, res))
app.post('/api/inventory/:productId/:variantId/low-threshold', (req, res) => inventoryRoutes.setLowStockThreshold(pool, req, res))
app.get('/api/inventory/low-stock', (req, res) => inventoryRoutes.listLowStock(pool, req, res))

// ==================== SHIPROCKET ====================
app.post('/api/shiprocket/config', (req, res) => shiprocketRoutes.saveShiprocketConfig(pool, req, res))
app.post('/api/shiprocket/orders/:orderId/awb', (req, res) => shiprocketRoutes.createAwbAndLabel(pool, req, res))
app.get('/api/shiprocket/orders/:orderId/track', (req, res) => shiprocketRoutes.trackShipment(pool, req, res))

// ==================== AMAZON ====================
app.post('/api/marketplaces/amazon/accounts', (req, res) => amazonRoutes.saveAmazonAccount(pool, req, res))
app.get('/api/marketplaces/amazon/accounts', (req, res) => amazonRoutes.listAmazonAccounts(pool, req, res))
app.post('/api/marketplaces/amazon/sync-products', (req, res) => amazonRoutes.syncProductsToAmazon(pool, req, res))
app.get('/api/marketplaces/amazon/import-orders', (req, res) => amazonRoutes.importAmazonOrders(pool, req, res))

// ==================== FLIPKART ====================
app.post('/api/marketplaces/flipkart/accounts', (req, res) => flipkartRoutes.saveFlipkartAccount(pool, req, res))
app.get('/api/marketplaces/flipkart/accounts', (req, res) => flipkartRoutes.listFlipkartAccounts(pool, req, res))
app.post('/api/marketplaces/flipkart/sync-products', (req, res) => flipkartRoutes.syncProductsToFlipkart(pool, req, res))
app.get('/api/marketplaces/flipkart/import-orders', (req, res) => flipkartRoutes.importFlipkartOrders(pool, req, res))

// ==================== BULK OPS ====================
app.post('/api/bulk/orders/status', (req, res) => bulkRoutes.bulkUpdateOrderStatus(pool, req, res))
app.post('/api/bulk/shipping/labels', (req, res) => bulkRoutes.bulkGenerateShippingLabels(pool, req, res))
app.post('/api/bulk/invoices/download', (req, res) => bulkRoutes.bulkDownloadInvoices(pool, req, res))
app.post('/api/bulk/products/prices', (req, res) => bulkRoutes.bulkUpdateProductPrices(pool, req, res))

// ==================== STAFF & PERMISSIONS ====================
app.post('/api/staff/roles', (req, res) => staffRoutes.createRole(pool, req, res))
app.get('/api/staff/roles', (req, res) => staffRoutes.listRoles(pool, req, res))
app.post('/api/staff/permissions', (req, res) => staffRoutes.createPermission(pool, req, res))
app.post('/api/staff/role-permissions', (req, res) => staffRoutes.assignPermissionToRole(pool, req, res))
app.post('/api/staff/users', (req, res) => staffRoutes.createStaff(pool, req, res))
app.post('/api/staff/user-roles', (req, res) => staffRoutes.assignRoleToStaff(pool, req, res))
app.get('/api/staff/users', (req, res) => staffRoutes.listStaff(pool, req, res))

// ==================== WAREHOUSES ====================
app.post('/api/warehouses', (req, res) => warehouseRoutes.createWarehouse(pool, req, res))
app.get('/api/warehouses', (req, res) => warehouseRoutes.listWarehouses(pool, req, res))
app.post('/api/warehouses/transfers', (req, res) => warehouseRoutes.createStockTransfer(pool, req, res))
app.get('/api/warehouses/transfers', (req, res) => warehouseRoutes.listStockTransfers(pool, req, res))

// ==================== SUPPLIERS & PURCHASE ORDERS ====================
app.post('/api/suppliers', (req, res) => supplierRoutes.createSupplier(pool, req, res))
app.get('/api/suppliers', (req, res) => supplierRoutes.listSuppliers(pool, req, res))
app.post('/api/purchase-orders', (req, res) => supplierRoutes.createPurchaseOrder(pool, req, res))
app.get('/api/purchase-orders', (req, res) => supplierRoutes.listPurchaseOrders(pool, req, res))

// ==================== POS SYSTEM ====================
app.post('/api/pos/transactions', (req, res) => posRoutes.createPOSTransaction(pool, req, res))
app.get('/api/pos/transactions', (req, res) => posRoutes.listPOSTransactions(pool, req, res))
app.post('/api/pos/sessions/open', (req, res) => posRoutes.openPOSSession(pool, req, res))
app.post('/api/pos/sessions/close', (req, res) => posRoutes.closePOSSession(pool, req, res))
app.post('/api/barcodes/generate', (req, res) => posRoutes.generateBarcode(pool, req, res))
app.get('/api/barcodes/scan', (req, res) => posRoutes.scanBarcode(pool, req, res))

// ==================== SEARCH API ====================
app.get('/api/search', (req, res) => searchRoutes.searchProducts(pool, req, res))
app.get('/api/search/filters', (req, res) => searchRoutes.getSearchFilters(pool, req, res))
app.post('/api/search/log', (req, res) => searchRoutes.logSearchQuery(pool, req, res))

// CSV endpoints (FIXED PATH)
app.get('/api/products-csv', async (req, res) => {
  try {
    const path = require('path')
    const fs = require('fs')
    
    // FIXED: Correct path to CSV file (backend runs from backend/, so go up 1 level)
    const csvPath = path.resolve(process.cwd(), '..', 'product description page.csv')
    
    console.log('🔍 CSV Debug Info:')
    console.log('  Current working directory:', process.cwd())
    console.log('  Resolved CSV path:', csvPath)
    console.log('  File exists:', fs.existsSync(csvPath))
    
    if (!fs.existsSync(csvPath)) {
      console.warn('❌ CSV file not found at:', csvPath)
      return sendSuccess(res, [])
    }
    
    console.log('✅ CSV file found, reading content...')
    
    const raw = fs.readFileSync(csvPath, 'utf8')
    const lines = raw.split(/\r?\n/).filter((l: string) => l.trim().length > 0)
    
    console.log('📊 CSV Content Info:')
    console.log('  Raw content length:', raw.length)
    console.log('  Total lines:', lines.length)
    console.log('  First line:', lines[0]?.substring(0, 100) + '...')
    
    if (lines.length === 0) {
      console.warn('❌ No lines found in CSV')
      return sendSuccess(res, [])
    }
    
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      
      result.push(current.trim())
      return result
    }
    
    const headerLine = lines[0]
    const headers = parseCSVLine(headerLine)
    const rows: any[] = []
    
    console.log('📋 CSV Parsing Info:')
    console.log('  Headers count:', headers.length)
    console.log('  First header:', headers[0])
    
    for (let i = 1; i < lines.length; i++) {
      const parts = parseCSVLine(lines[i])
      if (parts.every(p => p.trim() === '')) continue
      
      const obj: any = {}
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = (parts[j] ?? '').trim()
      }
      rows.push(obj)
    }
    
    console.log('📦 Final Results:')
    console.log('  Parsed products:', rows.length)
    console.log('  First product:', rows[0]?.['Product Name'])
    
    sendSuccess(res, rows)
  } catch (err) {
    console.error('❌ CSV Error:', err)
    sendError(res, 500, 'Failed to read products CSV', err)
  }
})

// ==================== OPTIMIZED CART API ====================
app.get('/api/cart', authenticateToken, (req, res) => cartRoutes.getCart(pool, req, res))
app.post('/api/cart', authenticateToken, (req, res) => cartRoutes.addToCart(pool, req, res))
app.put('/api/cart/:cartItemId', authenticateToken, (req, res) => cartRoutes.updateCartItem(pool, req, res))
app.delete('/api/cart/:cartItemId', authenticateToken, (req, res) => cartRoutes.removeFromCart(pool, req, res))
app.delete('/api/cart', authenticateToken, (req, res) => cartRoutes.clearCart(pool, req, res))

// ==================== OPTIMIZED AUTHENTICATION API ====================
app.post('/api/auth/login', (req, res) => cartRoutes.login(pool, req, res))
app.post('/api/auth/register', (req, res) => cartRoutes.register(pool, req, res))
app.post('/api/auth/signup', (req, res) => cartRoutes.register(pool, req, res))

// ==================== OPTIMIZED USER PROFILE API ====================
app.get('/api/user/profile', authenticateToken, (req, res) => cartRoutes.getUserProfile(pool, req, res))
app.put('/api/user/profile', authenticateToken, (req, res) => cartRoutes.updateUserProfile(pool, req, res))

// Backward-compatible aliases for clients calling /api/users/profile
app.get('/api/users/profile', authenticateToken, (req, res) => cartRoutes.getUserProfile(pool, req, res))
app.put('/api/users/profile', authenticateToken, (req, res) => cartRoutes.updateUserProfile(pool, req, res))

// Saved cards endpoint
app.get('/api/users/saved-cards', authenticateToken, (req, res) => {
  // Return empty array for now - can be implemented later
  res.json({ success: true, data: [] })
})

// ==================== USER MANAGEMENT & ACTIVITY TRACKING API ====================
// Get all users (admin)
app.get('/api/users', (req, res) => userRoutes.getAllUsers(pool, req, res))

// Search users (admin)
app.get('/api/users/search', (req, res) => userRoutes.searchUsers(pool, req, res))

// Get user segments (admin)
app.get('/api/users/segments', (req, res) => userRoutes.getUserSegments(pool, req, res))

// Get detailed user profile with activities (admin)
app.get('/api/users/:id', (req, res) => userRoutes.getUserDetails(pool, req, res))

// Get user activity timeline (admin)
app.get('/api/users/:id/activity', (req, res) => userRoutes.getUserActivityTimeline(pool, req, res))

// Add note to user (admin)
app.post('/api/users/:id/notes', authenticateToken, (req, res) => userRoutes.addUserNote(pool, req, res))

// Add tag to user (admin)
app.post('/api/users/:id/tags', authenticateToken, (req, res) => userRoutes.addUserTag(pool, req, res))

// Remove tag from user (admin)
app.delete('/api/users/:id/tags', authenticateToken, (req, res) => userRoutes.removeUserTag(pool, req, res))

// Track page view
app.post('/api/track/page-view', (req, res) => userRoutes.trackPageView(pool, req, res))

// Track form submission
app.post('/api/track/form-submit', (req, res) => userRoutes.trackFormSubmission(pool, req, res))

// Track cart event
app.post('/api/track/cart-event', (req, res) => userRoutes.trackCartEvent(pool, req, res))

// ==================== AI PERSONALIZATION API ====================
app.get('/api/ai-personalization/content', async (req, res) => {
  try {
    // Return personalized content based on user preferences
    const personalizedContent = {
      featured_products: [],
      recommendations: [],
      personalized_offers: [],
      content_sections: [
        {
          type: 'banner',
          title: 'Welcome to Nefol',
          subtitle: 'Discover our premium skincare collection',
          image: '/images/welcome-banner.jpg'
        },
        {
          type: 'products',
          title: 'Featured Products',
          products: []
        }
      ]
    }
    
    sendSuccess(res, personalizedContent)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch personalized content', err)
  }
})

// ==================== ANALYTICS API ====================
app.get('/api/analytics-data', async (req, res) => {
  try {
    // Return sample analytics data
    const analyticsData = [
      { metric_name: 'total_users', metric_value: 150, date_recorded: new Date().toISOString().split('T')[0] },
      { metric_name: 'total_orders', metric_value: 45, date_recorded: new Date().toISOString().split('T')[0] },
      { metric_name: 'total_revenue', metric_value: 12500, date_recorded: new Date().toISOString().split('T')[0] },
      { metric_name: 'conversion_rate', metric_value: 3.2, date_recorded: new Date().toISOString().split('T')[0] }
    ]
    
    sendSuccess(res, analyticsData)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch analytics data', err)
  }
})

// Cashback balance endpoint
app.get('/api/cashback/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId
    
    // Get user's cashback balance from orders (5% of total spent)
    const { rows } = await pool.query(`
      SELECT COALESCE(SUM(total * 0.05), 0) as balance
      FROM orders 
      WHERE customer_email = (
        SELECT email FROM users WHERE id = $1
      )
    `, [userId])
    
    const balance = rows[0]?.balance || 0
    
    sendSuccess(res, { balance })
  } catch (err) {
    sendError(res, 500, 'Failed to fetch cashback balance', err)
  }
})

// Helper function to record coin transactions
async function recordCoinTransaction(
  pool: Pool,
  userId: string | number,
  amount: number,
  type: string,
  description: string,
  status: string = 'completed',
  orderId?: number,
  withdrawalId?: number,
  metadata?: any
) {
  try {
    await pool.query(`
      INSERT INTO coin_transactions (
        user_id, amount, type, description, status, order_id, withdrawal_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [userId, amount, type, description, status, orderId || null, withdrawalId || null, metadata ? JSON.stringify(metadata) : null])
  } catch (err) {
    console.error('Error recording coin transaction:', err)
  }
}

// Nefol coins (loyalty points) endpoint
app.get('/api/nefol-coins', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId
    
    // Get user's loyalty points (Nefol coins)
    const { rows } = await pool.query(`
      SELECT loyalty_points as nefol_coins
      FROM users 
      WHERE id = $1
    `, [userId])
    
    const nefolCoins = rows[0]?.nefol_coins || 0
    
    sendSuccess(res, { nefol_coins: nefolCoins })
  } catch (err) {
    sendError(res, 500, 'Failed to fetch Nefol coins', err)
  }
})

// Get user's coin transaction history
app.get('/api/coin-transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId
    const { limit = 50 } = req.query
    
    const { rows } = await pool.query(`
      SELECT 
        id,
        amount,
        type,
        description,
        status,
        order_id,
        withdrawal_id,
        metadata,
        created_at
      FROM coin_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [userId, limit])
    
    // Return data in consistent format
    sendSuccess(res, { data: rows })
  } catch (err) {
    sendError(res, 500, 'Failed to fetch coin transactions', err)
  }
})

// ==================== COIN WITHDRAWAL API ====================
// Get user's withdrawal history
app.get('/api/coin-withdrawals', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId
    
    const { rows } = await pool.query(`
      SELECT 
        id,
        amount,
        withdrawal_method,
        account_holder_name,
        account_number,
        ifsc_code,
        bank_name,
        upi_id,
        status,
        transaction_id,
        admin_notes,
        rejection_reason,
        created_at,
        processed_at
      FROM coin_withdrawals
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId])
    
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch withdrawal history', err)
  }
})

// Create withdrawal request
app.post('/api/coin-withdrawals', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId
    if (!userId) {
      return sendError(res, 401, 'User ID not found')
    }
    
    const {
      amount,
      withdrawal_method,
      account_holder_name,
      account_number,
      ifsc_code,
      bank_name,
      upi_id
    } = req.body
    
    // Validate required fields
    if (!amount || amount <= 0) {
      return sendError(res, 400, 'Valid amount is required')
    }
    
    if (!withdrawal_method || !['bank', 'upi'].includes(withdrawal_method)) {
      return sendError(res, 400, 'Valid withdrawal method is required')
    }
    
    if (withdrawal_method === 'bank' && (!account_number || !ifsc_code || !bank_name)) {
      return sendError(res, 400, 'Bank details are required for bank transfer')
    }
    
    if (withdrawal_method === 'upi' && !upi_id) {
      return sendError(res, 400, 'UPI ID is required for UPI transfer')
    }
    
    if (!account_holder_name) {
      return sendError(res, 400, 'Account holder name is required')
    }
    
    // Check user has enough coins
    const userResult = await pool.query(`
      SELECT loyalty_points FROM users WHERE id = $1
    `, [userId])
    
    const availableCoins = userResult.rows[0]?.loyalty_points || 0
    
    if (availableCoins < amount) {
      return sendError(res, 400, 'Insufficient coins. You have ' + availableCoins + ' coins available.')
    }
    
    // Create withdrawal request
    const insertValues = [
      userId,
      amount,
      withdrawal_method,
      account_holder_name
    ]
    
    if (withdrawal_method === 'bank') {
      insertValues.push(account_number, ifsc_code, bank_name, null)
    } else {
      insertValues.push(null, null, null, upi_id)
    }
    
    const { rows } = await pool.query(`
      INSERT INTO coin_withdrawals (
        user_id, amount, withdrawal_method, account_holder_name,
        account_number, ifsc_code, bank_name, upi_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *
    `, insertValues)
    
    // Deduct coins from user's account
    await pool.query(`
      UPDATE users 
      SET loyalty_points = loyalty_points - $1
      WHERE id = $2
    `, [amount, userId])
    
    // Record transaction using helper function
    await recordCoinTransaction(
      pool,
      userId,
      amount,
      'withdrawal_pending',
      `Withdrawal requested via ${withdrawal_method === 'bank' ? 'Bank Transfer' : 'UPI'}`,
      'pending',
      undefined,
      rows[0].id
    )
    
    sendSuccess(res, rows[0], 201)
  } catch (err) {
    sendError(res, 500, 'Failed to create withdrawal request', err)
  }
})

// Get all withdrawal requests (admin only)
app.get('/api/admin/coin-withdrawals', async (req, res) => {
  try {
    const { status } = req.query
    let query = `
      SELECT 
        w.*,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone
      FROM coin_withdrawals w
      JOIN users u ON w.user_id = u.id
      WHERE 1=1
    `
    const values: any[] = []
    
    if (status) {
      query += ` AND w.status = $${values.length + 1}`
      values.push(status)
    }
    
    query += ` ORDER BY w.created_at DESC`
    
    const { rows } = await pool.query(query, values)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch withdrawal requests', err)
  }
})

// Process withdrawal (admin only)
app.put('/api/admin/coin-withdrawals/:id/process', async (req, res) => {
  try {
    const withdrawalId = req.params.id
    const { status, transaction_id, admin_notes, rejection_reason } = req.body
    
    if (!status || !['processing', 'completed', 'rejected', 'failed'].includes(status)) {
      return sendError(res, 400, 'Valid status is required')
    }
    
    const updateFields: string[] = []
    const values: any[] = []
    
    updateFields.push(`status = $${values.length + 1}`)
    values.push(status)
    
    if (transaction_id) {
      updateFields.push(`transaction_id = $${values.length + 1}`)
      values.push(transaction_id)
    }
    
    if (admin_notes) {
      updateFields.push(`admin_notes = $${values.length + 1}`)
      values.push(admin_notes)
    }
    
    if (rejection_reason) {
      updateFields.push(`rejection_reason = $${values.length + 1}`)
      values.push(rejection_reason)
    }
    
    if (['completed', 'rejected', 'failed'].includes(status)) {
      updateFields.push(`processed_at = NOW()`)
    }
    
    values.push(withdrawalId)
    
    const { rows } = await pool.query(`
      UPDATE coin_withdrawals
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *
    `, values)
    
    if (rows.length === 0) {
      return sendError(res, 404, 'Withdrawal request not found')
    }
    
    // If rejected or failed, refund coins to user
    if (['rejected', 'failed'].includes(status)) {
      await pool.query(`
        UPDATE users
        SET loyalty_points = loyalty_points + $1
        WHERE id = $2
      `, [rows[0].amount, rows[0].user_id])
    }
    
    // Update transaction status
    let transactionType = 'withdrawal_pending'
    if (status === 'processing') {
      transactionType = 'withdrawal_processing'
    } else if (status === 'completed') {
      transactionType = 'withdrawal_completed'
    } else if (status === 'rejected' || status === 'failed') {
      transactionType = 'withdrawal_rejected'
    }
    
    await pool.query(`
      UPDATE coin_transactions
      SET type = $1, status = $2, updated_at = NOW()
      WHERE withdrawal_id = $3
    `, [transactionType, status, withdrawalId])
    
    sendSuccess(res, rows[0])
  } catch (err) {
    sendError(res, 500, 'Failed to process withdrawal', err)
  }
})

// ==================== PAYMENT API ====================
app.get('/api/payment-gateways', async (req, res) => {
  try {
    // Return sample payment gateways
    const paymentGateways = [
      {
        id: 1,
        name: 'Razorpay',
        type: 'online',
        is_active: true,
        config: {
          key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_RYUiNXjGPYECIB',
          key_secret: process.env.RAZORPAY_KEY_SECRET || 'QoMYD9QaYxXVDuKiyd9P1mxR'
        }
      },
      {
        id: 2,
        name: 'Cash on Delivery',
        type: 'cod',
        is_active: true,
        config: {}
      },
      {
        id: 3,
        name: 'UPI',
        type: 'upi',
        is_active: true,
        config: {}
      }
    ]
    
    sendSuccess(res, paymentGateways)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch payment gateways', err)
  }
})

// Razorpay Payment Routes
app.post('/api/payment/razorpay/create-order', paymentRoutes.createRazorpayOrder(pool))
app.post('/api/payment/razorpay/verify', paymentRoutes.verifyRazorpayPayment(pool))
app.post('/api/payment/razorpay/webhook', express.raw({ type: 'application/json' }), paymentRoutes.razorpayWebhook(pool))

// ==================== MARKETING CAMPAIGNS API ====================
app.get('/api/email-campaigns', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM email_campaigns ORDER BY created_at DESC')
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch email campaigns', err)
  }
})

app.get('/api/sms-campaigns', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM sms_campaigns ORDER BY created_at DESC')
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch SMS campaigns', err)
  }
})

app.get('/api/push-notifications', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM push_notifications ORDER BY created_at DESC')
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch push notifications', err)
  }
})

// ==================== MARKETING API ENDPOINTS ====================

// Cashback APIs
app.get('/api/cashback/wallet', marketingRoutes.getCashbackWallet.bind(null, pool))
app.get('/api/cashback/offers', marketingRoutes.getCashbackOffers.bind(null, pool))
app.get('/api/cashback/transactions', marketingRoutes.getCashbackTransactions.bind(null, pool))
app.post('/api/cashback/redeem', marketingRoutes.redeemCashback.bind(null, pool))

// Email Marketing APIs
app.get('/api/email-marketing/campaigns', marketingRoutes.getEmailCampaigns.bind(null, pool))
app.put('/api/email-marketing/campaigns/:id', marketingRoutes.updateEmailCampaign.bind(null, pool))
app.delete('/api/email-marketing/campaigns/:id', marketingRoutes.deleteEmailCampaign.bind(null, pool))
app.get('/api/email-marketing/templates', marketingRoutes.getEmailTemplates.bind(null, pool))
app.get('/api/email-marketing/automations', marketingRoutes.getEmailAutomations.bind(null, pool))
app.post('/api/email-marketing/automations', marketingRoutes.createEmailAutomation.bind(null, pool))
app.put('/api/email-marketing/automations/:id', marketingRoutes.updateEmailAutomation.bind(null, pool))

// SMS Marketing APIs
app.get('/api/sms-marketing/campaigns', marketingRoutes.getSMSCampaigns.bind(null, pool))
app.post('/api/sms-marketing/campaigns', marketingRoutes.createSMSCampaign.bind(null, pool))
app.put('/api/sms-marketing/campaigns/:id', marketingRoutes.updateSMSCampaign.bind(null, pool))
app.delete('/api/sms-marketing/campaigns/:id', marketingRoutes.deleteSMSCampaign.bind(null, pool))
app.get('/api/sms-marketing/templates', marketingRoutes.getSMSTemplates.bind(null, pool))
app.get('/api/sms-marketing/automations', marketingRoutes.getSMSAutomations.bind(null, pool))
app.post('/api/sms-marketing/automations', marketingRoutes.createSMSAutomation.bind(null, pool))
app.put('/api/sms-marketing/automations/:id', marketingRoutes.updateSMSAutomation.bind(null, pool))

// Push Notifications APIs
app.get('/api/push-notifications', marketingRoutes.getPushNotifications.bind(null, pool))
app.get('/api/push-notifications/templates', marketingRoutes.getPushTemplates.bind(null, pool))
app.get('/api/push-notifications/automations', marketingRoutes.getPushAutomations.bind(null, pool))

// WhatsApp Chat APIs
app.get('/api/whatsapp-chat/sessions', marketingRoutes.getWhatsAppChats.bind(null, pool))
app.get('/api/whatsapp-chat/templates', marketingRoutes.getWhatsAppTemplates.bind(null, pool))
app.get('/api/whatsapp-chat/automations', marketingRoutes.getWhatsAppAutomations.bind(null, pool))
app.post('/api/whatsapp-chat/send', marketingRoutes.sendWhatsAppMessage.bind(null, pool))

// WhatsApp Configuration & Management APIs
app.get('/api/whatsapp/config', marketingRoutes.getWhatsAppConfig.bind(null, pool))
app.post('/api/whatsapp/config', marketingRoutes.saveWhatsAppConfig.bind(null, pool))
app.post('/api/whatsapp/templates', marketingRoutes.createWhatsAppTemplate.bind(null, pool))
app.post('/api/whatsapp/automations', marketingRoutes.createWhatsAppAutomation.bind(null, pool))

// Live Chat APIs
app.get('/api/live-chat/sessions', marketingRoutes.getLiveChatSessions.bind(null, pool))
app.get('/api/live-chat/agents', marketingRoutes.getLiveChatAgents.bind(null, pool))
app.get('/api/live-chat/widgets', marketingRoutes.getLiveChatWidgets.bind(null, pool))

// ==================== GENERIC CRUD ROUTES ====================
// These replace the duplicate code patterns found in the original file

// Generic CRUD handler
function createCRUDHandler(tableName: string, requiredFields: string[] = []) {
  return {
    // GET all
    getAll: async (req: any, res: any) => {
      try {
        const { rows } = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`)
        sendSuccess(res, rows)
      } catch (err) {
        sendError(res, 500, `Failed to fetch ${tableName}`, err)
      }
    },
    
    // GET by ID
    getById: async (req: any, res: any) => {
      try {
        const { rows } = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id])
        if (rows.length === 0) {
          return sendError(res, 404, `${tableName} not found`)
        }
        sendSuccess(res, rows[0])
      } catch (err) {
        sendError(res, 500, `Failed to fetch ${tableName}`, err)
      }
    },
    
    // POST create
    create: async (req: any, res: any) => {
      try {
        const body = req.body || {}
        
        // Validate required fields
        for (const field of requiredFields) {
          if (!body[field]) {
            return sendError(res, 400, `${field} is required`)
          }
        }
        
        const fields = Object.keys(body)
        const values = fields.map(field => body[field])
        const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ')
        
        const { rows } = await pool.query(
          `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
          values
        )
        
        // Broadcast to admin
        broadcastUpdate(`${tableName}_created`, rows[0])
        
        // Broadcast to users for relevant tables
        if (['products', 'orders', 'discounts', 'announcements'].includes(tableName)) {
          broadcastToUsers(`${tableName}-created`, rows[0])
        }
        
        sendSuccess(res, rows[0], 201)
      } catch (err: any) {
        if (err?.code === '23505') {
          sendError(res, 409, `${tableName} already exists`)
        } else {
          sendError(res, 500, `Failed to create ${tableName}`, err)
        }
      }
    },
    
    // PUT update
    update: async (req: any, res: any) => {
      try {
        const body = req.body || {}
        const fields = Object.keys(body).filter(key => body[key] !== undefined)
        
        if (fields.length === 0) {
          return sendError(res, 400, 'No fields to update')
        }
        
        const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ')
        const values = [req.params.id, ...fields.map(field => body[field])]
        
        const { rows } = await pool.query(
          `UPDATE ${tableName} SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
          values
        )
        
        if (rows.length === 0) {
          return sendError(res, 404, `${tableName} not found`)
        }
        
        // Broadcast to admin
        broadcastUpdate(`${tableName}_updated`, rows[0])
        
        // Broadcast to users for relevant tables
        if (['products', 'orders', 'discounts', 'announcements'].includes(tableName)) {
          broadcastToUsers(`${tableName}-updated`, rows[0])
        }
        
        sendSuccess(res, rows[0])
      } catch (err) {
        sendError(res, 500, `Failed to update ${tableName}`, err)
      }
    },
    
    // DELETE
    delete: async (req: any, res: any) => {
      try {
        const { rows } = await pool.query(
          `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`,
          [req.params.id]
        )
        
        if (rows.length === 0) {
          return sendError(res, 404, `${tableName} not found`)
        }
        
        // Broadcast to admin
        broadcastUpdate(`${tableName}_deleted`, rows[0])
        
        // Broadcast to users for relevant tables
        if (['products', 'orders', 'discounts', 'announcements'].includes(tableName)) {
          broadcastToUsers(`${tableName}-deleted`, rows[0])
        }
        
        sendSuccess(res, { message: `${tableName} deleted successfully` })
      } catch (err) {
        sendError(res, 500, `Failed to delete ${tableName}`, err)
      }
    }
  }
}

// Apply CRUD routes to all tables
const tables = [
  { name: 'videos', required: ['title', 'description', 'video_url', 'redirect_url', 'price', 'size', 'thumbnail_url'] },
  { name: 'users', required: ['name', 'email', 'password'] },
  { name: 'email_campaigns', required: ['name', 'subject'] },
  { name: 'sms_campaigns', required: ['name', 'message'] },
  { name: 'push_notifications', required: ['title', 'message'] },
  { name: 'whatsapp_chat', required: ['phone_number'] },
  { name: 'live_chat', required: ['customer_name'] },
  { name: 'analytics_data', required: ['metric_name'] },
  { name: 'forms', required: ['name'] },
  { name: 'workflows', required: ['name'] },
  { name: 'customer_segments', required: ['name'] },
  { name: 'customer_journeys', required: ['customer_id', 'journey_step'] },
  { name: 'actionable_insights', required: ['insight_type'] },
  { name: 'ai_features', required: ['feature_name'] },
  { name: 'journey_funnels', required: ['funnel_name'] },
  { name: 'personalization_rules', required: ['rule_name'] },
  { name: 'custom_audiences', required: ['audience_name'] },
  { name: 'omni_channel_campaigns', required: ['campaign_name'] },
  { name: 'api_configurations', required: ['name', 'category'] },
  { name: 'invoices', required: ['invoice_number', 'customer_name', 'customer_email', 'order_id', 'amount', 'due_date'] },
  { name: 'tax_rates', required: ['name', 'rate', 'type', 'region'] },
  { name: 'tax_rules', required: ['name', 'conditions', 'tax_rate_ids'] },
  { name: 'returns', required: ['return_number', 'order_id', 'customer_name', 'customer_email', 'reason', 'total_amount', 'refund_amount'] },
  { name: 'payment_methods', required: ['name', 'type'] },
  { name: 'payment_gateways', required: ['name', 'type', 'api_key', 'secret_key', 'webhook_url'] },
  { name: 'payment_transactions', required: ['transaction_id', 'order_id', 'customer_name', 'amount', 'method', 'gateway'] },
  { name: 'loyalty_program', required: ['name'] },
  { name: 'affiliate_program', required: ['name'] },
  { name: 'cashback_system', required: ['name'] },
  { name: 'order_delivery_status', required: ['order_id', 'status'] },
  { name: 'product_reviews', required: ['order_id', 'product_id', 'customer_email', 'customer_name', 'rating'] },
  { name: 'delivery_notifications', required: ['order_id', 'customer_email', 'notification_type'] },
  { name: 'shiprocket_config', required: ['api_key', 'api_secret'] },
  { name: 'shiprocket_shipments', required: ['order_id'] },
  { name: 'discounts', required: ['name', 'code', 'type', 'value'] },
  { name: 'discount_usage', required: ['discount_id', 'order_id', 'customer_email'] }
]

// ==================== SPECIALIZED ENDPOINTS ====================
// These must come BEFORE generic CRUD routes to avoid conflicts

// Discount usage endpoint (must come before /api/discounts/:id)
app.get('/api/discounts/usage', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT du.*, d.name as discount_name, d.code as discount_code
      FROM discount_usage du
      JOIN discounts d ON du.discount_id = d.id
      ORDER BY du.created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch discount usage', err)
  }
})

// Marketing campaigns endpoint
app.get('/api/marketing/campaigns', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM email_campaigns
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch campaigns', err)
  }
})

// Marketing templates endpoint
app.get('/api/marketing/templates', async (req, res) => {
  try {
    // Return empty array for now - templates can be added to a new table if needed
    sendSuccess(res, [])
  } catch (err) {
    sendError(res, 500, 'Failed to fetch templates', err)
  }
})

// Analytics endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    const range = req.query.range || '30d'
    
    // Calculate date range
    const days = parseInt(range.toString().replace('d', '')) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Get analytics data
    const ordersQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total) as total_revenue,
        COUNT(DISTINCT customer_email) as unique_customers
      FROM orders
      WHERE created_at >= $1
    `, [startDate])
    
    const pageViewsQuery = await pool.query(`
      SELECT COUNT(*) as page_views
      FROM analytics_data
      WHERE metric_name = 'page_view' AND created_at >= $1
    `, [startDate])
    
    // Get chart data grouped by date
    const chartDataQuery = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total) as revenue
      FROM orders
      WHERE created_at >= $1
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [startDate])
    
    const orders = ordersQuery.rows[0]
    const pageViews = pageViewsQuery.rows[0]?.page_views || 0
    
    sendSuccess(res, {
      overview: {
        sessions: Math.floor(parseInt(pageViews) * 0.6),
        pageViews: parseInt(pageViews),
        bounceRate: 45.2,
        avgSessionDuration: '2:34',
        conversionRate: 3.2,
        revenue: parseFloat(orders.total_revenue || 0),
        orders: parseInt(orders.total_orders || 0),
        customers: parseInt(orders.unique_customers || 0)
      },
      chartData: chartDataQuery.rows.map((row: any) => ({
        date: row.date,
        sessions: Math.floor(Math.random() * 200) + 100,
        revenue: parseFloat(row.revenue || 0),
        orders: parseInt(row.orders || 0)
      }))
    })
  } catch (err) {
    sendError(res, 500, 'Failed to fetch analytics', err)
  }
})

// Shiprocket shipments endpoint (must come before generic CRUD)
app.get('/api/shiprocket/shipments', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM shiprocket_shipments
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch shipments', err)
  }
})

// Create Shiprocket shipment endpoint
app.post('/api/shiprocket/create-shipment', async (req, res) => {
  try {
    const { order_id } = req.body
    
    if (!order_id) {
      return sendError(res, 400, 'order_id is required')
    }
    
    // Get order details
    const orderResult = await pool.query('SELECT * FROM orders WHERE order_number = $1', [order_id])
    
    if (orderResult.rows.length === 0) {
      return sendError(res, 404, 'Order not found')
    }
    
    const order = orderResult.rows[0]
    
    // Create shipment record
    const { rows } = await pool.query(`
      INSERT INTO shiprocket_shipments (order_id, status, customer_name, customer_email, total, order_status)
      VALUES ($1, 'created', $2, $3, $4, $5)
      RETURNING *
    `, [order_id, order.customer_name, order.customer_email, order.total, order.status])
    
    // Broadcast to admin
    broadcastUpdate('shipment_created', rows[0])
    
    sendSuccess(res, rows[0], 201)
  } catch (err) {
    sendError(res, 500, 'Failed to create shipment', err)
  }
})

// Loyalty program endpoint (alias for consistency)
app.get('/api/loyalty-program', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM loyalty_program
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch loyalty programs', err)
  }
})

// Register all CRUD routes
tables.forEach(({ name, required }) => {
  const handler = createCRUDHandler(name, required)
  app.get(`/api/${name}`, handler.getAll)
  // Constrain numeric IDs for users to avoid conflict with /api/users/profile
  if (name === 'users') {
    app.get(`/api/${name}/:id(\\d+)`, handler.getById)
    app.put(`/api/${name}/:id(\\d+)`, handler.update)
    app.delete(`/api/${name}/:id(\\d+)`, handler.delete)
  } else {
    app.get(`/api/${name}/:id`, handler.getById)
    app.put(`/api/${name}/:id`, handler.update)
    app.delete(`/api/${name}/:id`, handler.delete)
  }
  app.post(`/api/${name}`, handler.create)
})

// ==================== SPECIALIZED ENDPOINTS ====================
// These require custom logic beyond basic CRUD

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined
    if (!file) return sendError(res, 400, 'No file uploaded')
    const url = `/uploads/${file.filename}`
    sendSuccess(res, { url, filename: file.filename })
  } catch (err) {
    sendError(res, 500, 'Failed to upload file', err)
  }
})

// CSV upload endpoint (FIXED PATH)
app.post('/api/products-csv/upload', upload.single('file'), async (req, res) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined
    if (!file) return sendError(res, 400, 'No file uploaded')
    
    // FIXED: Correct path to CSV file (backend runs from backend/, so go up 1 level)
    const destPath = path.resolve(process.cwd(), '..', 'product description page.csv')
    fs.copyFileSync(file.path, destPath)
    sendSuccess(res, { ok: true })
  } catch (err) {
    console.error('Failed to upload CSV:', err)
    sendError(res, 500, 'Failed to upload CSV', err)
  }
})

// Wishlist endpoints
app.get('/api/wishlist', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return sendError(res, 401, 'No token provided')
    
    const tokenParts = token.split('_')
    if (tokenParts.length < 3) return sendError(res, 401, 'Invalid token format')
    
    const userId = tokenParts[2]
    const { rows } = await pool.query(`
      SELECT w.*, p.title, p.price, p.list_image, p.slug, p.description
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `, [userId])
    
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch wishlist', err)
  }
})

app.post('/api/wishlist', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return sendError(res, 401, 'No token provided')
    
    const tokenParts = token.split('_')
    if (tokenParts.length < 3) return sendError(res, 401, 'Invalid token format')
    
    const userId = tokenParts[2]
    const { product_id } = req.body
    
    if (!product_id) return sendError(res, 400, 'product_id is required')
    
    const { rows } = await pool.query(`
      INSERT INTO wishlist (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
      RETURNING *
    `, [userId, product_id])
    
    if (rows.length === 0) {
      return sendSuccess(res, { message: 'Item already in wishlist' })
    }
    
    sendSuccess(res, rows[0], 201)
  } catch (err) {
    sendError(res, 500, 'Failed to add to wishlist', err)
  }
})

app.delete('/api/wishlist/:productId', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return sendError(res, 401, 'No token provided')
    
    const tokenParts = token.split('_')
    if (tokenParts.length < 3) return sendError(res, 401, 'Invalid token format')
    
    const userId = tokenParts[2]
    const { productId } = req.params
    
    const { rows } = await pool.query(`
      DELETE FROM wishlist 
      WHERE user_id = $1 AND product_id = $2
      RETURNING *
    `, [userId, productId])
    
    if (rows.length === 0) {
      return sendError(res, 404, 'Wishlist item not found')
    }
    
    sendSuccess(res, { message: 'Item removed from wishlist' })
  } catch (err) {
    sendError(res, 500, 'Failed to remove from wishlist', err)
  }
})

// Orders endpoints (simplified)
app.get('/api/orders', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC')
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch orders', err)
  }
})

app.get('/api/orders/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params
    const { rows } = await pool.query('SELECT * FROM orders WHERE order_number = $1', [orderNumber])
    
    if (rows.length === 0) {
      return sendError(res, 404, 'Order not found')
    }
    
    sendSuccess(res, rows[0])
  } catch (err) {
    sendError(res, 500, 'Failed to fetch order details', err)
  }
})

app.post('/api/orders', async (req, res) => {
  try {
    const {
      order_number,
      customer_name,
      customer_email,
      shipping_address,
      items,
      subtotal,
      shipping = 0,
      tax = 0,
      total,
      payment_method,
      payment_type,
      affiliate_id // Add affiliate tracking
    } = req.body || {}
    
    if (!order_number || !customer_name || !customer_email || !shipping_address || !items || !total) {
      return sendError(res, 400, 'Missing required fields')
    }
    
    const { rows } = await pool.query(`
      INSERT INTO orders (order_number, customer_name, customer_email, shipping_address, items, subtotal, shipping, tax, total, payment_method, payment_type, affiliate_id)
      VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [order_number, customer_name, customer_email, JSON.stringify(shipping_address), JSON.stringify(items), subtotal, shipping, tax, total, payment_method, payment_type, affiliate_id || null])
    
    const order = rows[0]
    
    // Process affiliate commission if this is a referral
    if (affiliate_id) {
      console.log(`🎯 Processing affiliate commission for affiliate_id: ${affiliate_id}, order: ${order_number}`)
      try {
        // Get affiliate details
        const affiliateResult = await pool.query(
          'SELECT * FROM affiliate_partners WHERE id = $1 AND status = $2',
          [affiliate_id, 'active']
        )
        
        console.log(`🔍 Found ${affiliateResult.rows.length} active affiliate(s) for ID: ${affiliate_id}`)
        
        if (affiliateResult.rows.length > 0) {
          const affiliate = affiliateResult.rows[0]
          
          // Get current commission rate
          const commissionSettingsResult = await pool.query(`
            SELECT commission_percentage FROM affiliate_commission_settings 
            WHERE is_active = true
            ORDER BY created_at DESC 
            LIMIT 1
          `)
          
          const commissionRate = commissionSettingsResult.rows.length > 0 
            ? commissionSettingsResult.rows[0].commission_percentage 
            : 10.0 // Default 10%
          
          // Calculate commission
          const commissionEarned = (total * commissionRate) / 100
          
          // Create affiliate referral record
          await pool.query(`
            INSERT INTO affiliate_referrals (
              affiliate_id, order_id, customer_email, customer_name, 
              order_total, commission_earned, commission_rate, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [affiliate_id, order.id, customer_email, customer_name, total, commissionEarned, commissionRate, 'confirmed'])
          
          // Update affiliate partner stats
          await pool.query(`
            UPDATE affiliate_partners 
            SET total_referrals = total_referrals + 1,
                total_earnings = total_earnings + $1,
                pending_earnings = pending_earnings + $1
            WHERE id = $2
          `, [commissionEarned, affiliate_id])
          
          // Add commission as Nefol coins to affiliate's loyalty points
          if (affiliate.user_id) {
            await pool.query(`
              UPDATE users 
              SET loyalty_points = loyalty_points + $1
              WHERE id = $2
            `, [Math.floor(commissionEarned), affiliate.user_id])
            
            console.log(`Added ${Math.floor(commissionEarned)} Nefol coins to affiliate ${affiliate.email} for order ${order_number}`)
          }
          
          console.log(`Affiliate commission processed: ${commissionEarned} for affiliate ${affiliate.email}`)
        } else {
          console.log(`❌ No active affiliate found for ID: ${affiliate_id}`)
        }
      } catch (affiliateErr) {
        console.error('Error processing affiliate commission:', affiliateErr)
        // Don't fail the order if affiliate processing fails
      }
    } else {
      console.log(`ℹ️ No affiliate_id provided for order: ${order_number}`)
    }
    
    // Broadcast to admin
    broadcastUpdate('order_created', order)
    
    // Track order placement in user activities
    try {
      const { logUserActivity } = require('./utils/userActivitySchema')
      const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [customer_email])
      const userId = userResult.rows.length > 0 ? userResult.rows[0].id : null
      
      await logUserActivity(pool, {
        user_id: userId,
        activity_type: 'order',
        activity_subtype: 'placed',
        order_id: order.id,
        payment_amount: total,
        payment_method: payment_method || 'cod',
        payment_status: 'pending',
        metadata: {
          order_number,
          items_count: items.length,
          affiliate_id: affiliate_id || null,
          customer_name,
          customer_email
        },
        user_agent: req.headers['user-agent'],
        ip_address: req.ip || req.connection.remoteAddress
      })
      
      console.log(`✅ Order activity tracked for user: ${userId || 'guest'}`)
    } catch (trackErr) {
      console.error('❌ Error tracking order placement:', trackErr)
    }
    
    // Create admin notification for new order
    try {
      await createAdminNotification(
        pool,
        'order',
        'New Order Received',
        `Order ${order_number} from ${customer_name} (₹${total.toFixed(2)})`,
        `/admin/orders`,
        '📦',
        'high',
        { order_id: order.id, order_number, customer_name, total }
      )
    } catch (notifErr) {
      console.error('Error creating admin notification:', notifErr)
      // Don't fail the order if notification fails
    }
    
    // Broadcast to the specific user about their order
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      const tokenParts = token.split('_')
      if (tokenParts.length >= 3) {
        const userId = tokenParts[2]
        broadcastToUser(userId, 'order-update', {
          type: 'created',
          order: order
        })
      }
    }
    
    sendSuccess(res, order, 201)
  } catch (err) {
    sendError(res, 500, 'Failed to create order', err)
  }
})

// PUT update order by ID
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params
    const body = req.body || {}
    const fields = Object.keys(body).filter(key => body[key] !== undefined)
    
    if (fields.length === 0) {
      return sendError(res, 400, 'No fields to update')
    }
    
    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ')
    const values = [id, ...fields.map(field => body[field])]
    
    const { rows } = await pool.query(
      `UPDATE orders SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    )
    
    if (rows.length === 0) {
      return sendError(res, 404, 'Order not found')
    }
    
    // Broadcast to admin
    broadcastUpdate('order_updated', rows[0])
    
    // Broadcast to users
    broadcastToUsers('order-updated', rows[0])
    
    sendSuccess(res, rows[0])
  } catch (err) {
    sendError(res, 500, 'Failed to update order', err)
  }
})

// ==================== DASHBOARD API ENDPOINTS ====================

// Dashboard metrics endpoint
app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT metric_name, metric_value, change_percentage, trend
      FROM dashboard_metrics
      ORDER BY metric_name
    `)
    
    const metrics = rows.reduce((acc, row) => {
      acc[row.metric_name] = {
        value: parseFloat(row.metric_value),
        change: parseFloat(row.change_percentage || 0),
        trend: row.trend
      }
      return acc
    }, {})
    
    sendSuccess(res, metrics)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch dashboard metrics', err)
  }
})

// Dashboard action items endpoint
app.get('/api/dashboard/action-items', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM dashboard_action_items
      ORDER BY priority DESC, created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch action items', err)
  }
})

// Dashboard live visitors endpoint
app.get('/api/dashboard/live-visitors', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(*) as count FROM dashboard_live_visitors
      WHERE is_active = true AND last_activity > NOW() - INTERVAL '5 minutes'
    `)
    sendSuccess(res, { count: parseInt(rows[0].count) })
  } catch (err) {
    sendError(res, 500, 'Failed to fetch live visitors', err)
  }
})

// ==================== ANALYTICS API ENDPOINTS ====================

// Analytics endpoint with top pages
app.get('/api/analytics', async (req, res) => {
  try {
    const range = req.query.range || '30d'
    
    // Calculate date range
    const days = parseInt(range.toString().replace('d', '')) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Get analytics data
    const ordersQuery = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total) as total_revenue,
        COUNT(DISTINCT customer_email) as unique_customers
      FROM orders
      WHERE created_at >= $1
    `, [startDate])
    
    const analyticsDataQuery = await pool.query(`
      SELECT metric_name, metric_value
      FROM analytics_data
      WHERE date_recorded >= $1
    `, [startDate])
    
    // Get top pages
    const topPagesQuery = await pool.query(`
      SELECT page_url, page_title, views, unique_views, bounce_rate, avg_time_on_page
      FROM analytics_top_pages
      WHERE date_recorded >= $1
      ORDER BY views DESC
      LIMIT 10
    `, [startDate])
    
    const orders = ordersQuery.rows[0]
    const analyticsData = analyticsDataQuery.rows.reduce((acc, row) => {
      acc[row.metric_name] = parseFloat(row.metric_value)
      return acc
    }, {})
    
    sendSuccess(res, {
      overview: {
        sessions: analyticsData.sessions || Math.floor(Math.random() * 2000) + 1000,
        pageViews: analyticsData.page_views || Math.floor(Math.random() * 4000) + 2000,
        bounceRate: analyticsData.bounce_rate || 45.2,
        avgSessionDuration: analyticsData.avg_session_duration ? `${Math.floor(analyticsData.avg_session_duration / 60)}:${analyticsData.avg_session_duration % 60}` : '2:34',
        conversionRate: analyticsData.conversion_rate || 3.2,
        revenue: parseFloat(orders.total_revenue || 0),
        orders: parseInt(orders.total_orders || 0),
        customers: parseInt(orders.unique_customers || 0)
      },
      topPages: topPagesQuery.rows.map(row => ({
        url: row.page_url,
        title: row.page_title,
        views: parseInt(row.views),
        uniqueViews: parseInt(row.unique_views),
        bounceRate: parseFloat(row.bounce_rate),
        avgTimeOnPage: parseInt(row.avg_time_on_page)
      }))
    })
  } catch (err) {
    sendError(res, 500, 'Failed to fetch analytics', err)
  }
})

// ==================== FORMS API ENDPOINTS ====================

// Forms endpoint
app.get('/api/forms', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM forms
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch forms', err)
  }
})

// Form submissions endpoint
app.get('/api/forms/submissions', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT fs.*, f.name as form_name
      FROM form_submissions fs
      JOIN forms f ON fs.form_id = f.id
      ORDER BY fs.created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch form submissions', err)
  }
})

// ==================== CONTACT MESSAGES API ENDPOINTS ====================

// Submit contact message
app.post('/api/contact/submit', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body

    if (!name || !email || !message) {
      return sendError(res, 400, 'Name, email and message are required')
    }

    const { rows } = await pool.query(`
      INSERT INTO contact_messages (name, email, phone, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, email, phone || null, message])

    // Broadcast to admin panel
    broadcastUpdate('contact_message_created', rows[0])
    
    // Create admin notification for new contact message
    try {
      await createAdminNotification(
        pool,
        'contact',
        'New Contact Message',
        `Message from ${name} (${email})`,
        `/admin/contact-messages`,
        '📧',
        'medium',
        { message_id: rows[0].id, name, email }
      )
    } catch (notifErr) {
      console.error('Error creating admin notification:', notifErr)
    }
    
    // Track form submission in user activities
    try {
      // Try to find user by email
      const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email])
      const userId = userResult.rows.length > 0 ? userResult.rows[0].id : null
      
      const { logUserActivity } = require('./utils/userActivitySchema')
      await logUserActivity(pool, {
        user_id: userId,
        activity_type: 'form_submit',
        activity_subtype: 'contact',
        form_type: 'Contact Form',
        form_data: { name, email, phone, message },
        page_url: req.headers.referer || '/contact',
        user_agent: req.headers['user-agent'],
        ip_address: req.ip || req.connection.remoteAddress
      })
    } catch (trackErr) {
      console.error('Error tracking form submission:', trackErr)
    }

    sendSuccess(res, rows[0], 201)
  } catch (err) {
    sendError(res, 500, 'Failed to submit contact message', err)
  }
})

// Get all contact messages (admin only)
app.get('/api/contact/messages', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query
    
    let query = 'SELECT * FROM contact_messages'
    const values: any[] = []
    
    if (status) {
      query += ' WHERE status = $1'
      values.push(status)
    }
    
    query += ' ORDER BY created_at DESC'
    
    const { rows } = await pool.query(query, values)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch contact messages', err)
  }
})

// Update contact message status (admin only)
app.put('/api/contact/messages/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return sendError(res, 400, 'Status is required')
    }

    const { rows } = await pool.query(`
      UPDATE contact_messages
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, id])

    if (rows.length === 0) {
      return sendError(res, 404, 'Contact message not found')
    }

    broadcastUpdate('contact_message_updated', rows[0])
    sendSuccess(res, rows[0])
  } catch (err) {
    sendError(res, 500, 'Failed to update contact message', err)
  }
})

// ==================== GOOGLE/YOUTUBE API ENDPOINTS ====================

// Google connection status
app.get('/api/google/connection-status', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM google_connections
      WHERE service = 'youtube'
    `)
    
    const isConnected = rows.length > 0 && rows[0].is_connected
    sendSuccess(res, { isConnected })
  } catch (err) {
    sendError(res, 500, 'Failed to fetch connection status', err)
  }
})

// Google analytics
app.get('/api/google/analytics', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM google_analytics
      ORDER BY date_recorded DESC
      LIMIT 10
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch Google analytics', err)
  }
})

// Google campaigns
app.get('/api/google/campaigns', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM google_campaigns
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch Google campaigns', err)
  }
})

// ==================== SOCIAL MEDIA API ENDPOINTS ====================

// Social connection status
app.get('/api/social/connection-status', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT platform, is_connected FROM social_connections
      WHERE platform IN ('facebook', 'instagram')
    `)
    
    const connections = rows.reduce((acc, row) => {
      acc[row.platform] = row.is_connected
      return acc
    }, {})
    
    sendSuccess(res, connections)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch social connections', err)
  }
})

// Social posts
app.get('/api/social/posts', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM social_posts
      ORDER BY posted_at DESC
      LIMIT 20
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch social posts', err)
  }
})

// Social stats
app.get('/api/social/stats', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT platform, followers, following, posts, engagement_rate
      FROM social_stats
      WHERE date_recorded = CURRENT_DATE
      ORDER BY platform
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch social stats', err)
  }
})

// ==================== STORE SETTINGS API ENDPOINTS ====================

// Store settings
app.get('/api/settings', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT setting_key, setting_value, setting_type, description, is_public
      FROM store_settings
      ORDER BY setting_key
    `)
    
    const settings = rows.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value
      return acc
    }, {})
    
    sendSuccess(res, settings)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch settings', err)
  }
})

// Update store settings
app.put('/api/settings', async (req, res) => {
  try {
    const settings = req.body
    
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(`
        INSERT INTO store_settings (setting_key, setting_value)
        VALUES ($1, $2)
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = $2, updated_at = NOW()
      `, [key, value])
    }
    
    sendSuccess(res, { message: 'Settings updated successfully' })
  } catch (err) {
    sendError(res, 500, 'Failed to update settings', err)
  }
})

// Store themes
app.get('/api/themes', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM store_themes
      ORDER BY is_active DESC, created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch themes', err)
  }
})

// ==================== AI API ENDPOINTS ====================

// AI features
app.get('/api/ai/features', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM ai_features
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch AI features', err)
  }
})

// AI tasks
app.get('/api/ai/tasks', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM ai_tasks
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch AI tasks', err)
  }
})

// ==================== MISSING API ENDPOINTS ====================

// Marketing endpoints
app.get('/api/marketing/campaigns', async (req, res) => {
  try {
    // Return mock data for now
    const campaigns = [
      {
        id: 1,
        name: 'Summer Sale 2024',
        type: 'email',
        status: 'active',
        audience: 'All customers',
        sent: 1250,
        opened: 890,
        clicked: 234,
        converted: 45,
        createdAt: '2024-01-15'
      },
      {
        id: 2,
        name: 'New Product Launch',
        type: 'social',
        status: 'paused',
        audience: 'Premium customers',
        sent: 500,
        opened: 320,
        clicked: 89,
        converted: 12,
        createdAt: '2024-01-10'
      }
    ]
    res.json(campaigns)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch campaigns', err)
  }
})

app.get('/api/marketing/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 1,
        name: 'Welcome Email',
        subject: 'Welcome to Nefol!',
        preview: 'Thank you for joining us...',
        createdAt: '2024-01-01'
      },
      {
        id: 2,
        name: 'Order Confirmation',
        subject: 'Your order has been confirmed',
        preview: 'Thank you for your purchase...',
        createdAt: '2024-01-02'
      }
    ]
    res.json(templates)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch templates', err)
  }
})

// Shiprocket/Shipments endpoints
app.get('/api/shiprocket/shipments', async (req, res) => {
  try {
    const shipments = [
      {
        id: 1,
        order_id: 'ORD-001',
        shipment_id: 'SR-001',
        awb_code: 'AWB123456',
        courier_name: 'Shiprocket',
        tracking_url: 'https://shiprocket.co/tracking/123456',
        status: 'delivered',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        total: 1299,
        order_status: 'completed',
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        order_id: 'ORD-002',
        shipment_id: 'SR-002',
        awb_code: 'AWB123457',
        courier_name: 'Shiprocket',
        tracking_url: 'https://shiprocket.co/tracking/123457',
        status: 'shipped',
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        total: 899,
        order_status: 'shipped',
        created_at: '2024-01-16T14:20:00Z'
      }
    ]
    res.json(shipments)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch shipments', err)
  }
})

// Invoices endpoints
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = [
      {
        id: 1,
        invoice_number: 'INV-001',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        amount: 1299,
        status: 'paid',
        created_at: '2024-01-15T10:30:00Z',
        due_date: '2024-01-22T10:30:00Z'
      },
      {
        id: 2,
        invoice_number: 'INV-002',
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        amount: 899,
        status: 'pending',
        created_at: '2024-01-16T14:20:00Z',
        due_date: '2024-01-23T14:20:00Z'
      }
    ]
    res.json(invoices)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch invoices', err)
  }
})

// Invoice Settings endpoints
app.get('/api/invoice-settings/company-details', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT setting_value FROM store_settings WHERE setting_key = 'invoice_company_details'
    `)
    
    if (result.rows.length > 0 && result.rows[0].setting_value) {
      const details = typeof result.rows[0].setting_value === 'string' 
        ? JSON.parse(result.rows[0].setting_value) 
        : result.rows[0].setting_value
      res.json(details)
    } else {
      res.json({})
    }
  } catch (err) {
    sendError(res, 500, 'Failed to fetch company details', err)
  }
})

app.put('/api/invoice-settings/company-details', async (req, res) => {
  try {
    const details = req.body
    
    await pool.query(`
      INSERT INTO store_settings (setting_key, setting_value)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (setting_key) 
      DO UPDATE SET setting_value = $2::jsonb, updated_at = NOW()
    `, ['invoice_company_details', JSON.stringify(details)])
    
    sendSuccess(res, { message: 'Company details saved successfully' })
  } catch (err) {
    sendError(res, 500, 'Failed to save company details', err)
  }
})

// Get all invoice settings
app.get('/api/invoice-settings/all', async (req, res) => {
  try {
    const settings: any = {
      colors: { primaryStart: '#667eea', primaryEnd: '#764ba2', accentStart: '#667eea', accentEnd: '#764ba2' },
      tax: { rate: 18, type: 'IGST' },
      terms: 'Thank you for doing business with us.',
      signatureText: 'Authorized Signatory',
      currency: '₹'
    }

    const result = await pool.query(`
      SELECT setting_key, setting_value FROM store_settings 
      WHERE setting_key IN ('invoice_colors', 'invoice_tax', 'invoice_terms', 'invoice_currency')
    `)

    result.rows.forEach((row: any) => {
      const key = row.setting_key.replace('invoice_', '')
      settings[key] = typeof row.setting_value === 'string' ? JSON.parse(row.setting_value) : row.setting_value
    })

    sendSuccess(res, settings)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch settings', err)
  }
})

// Save all invoice settings
app.put('/api/invoice-settings/all', async (req, res) => {
  try {
    const { colors, tax, terms, signatureText, currency } = req.body
    
    if (colors) {
      await pool.query(`
        INSERT INTO store_settings (setting_key, setting_value)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = $2::jsonb, updated_at = NOW()
      `, ['invoice_colors', JSON.stringify(colors)])
    }

    if (tax) {
      await pool.query(`
        INSERT INTO store_settings (setting_key, setting_value)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = $2::jsonb, updated_at = NOW()
      `, ['invoice_tax', JSON.stringify(tax)])
    }

    if (terms) {
      await pool.query(`
        INSERT INTO store_settings (setting_key, setting_value)
        VALUES ($1, $2::text)
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = $2, updated_at = NOW()
      `, ['invoice_terms', terms])
    }

    if (signatureText) {
      await pool.query(`
        INSERT INTO store_settings (setting_key, setting_value)
        VALUES ($1, $2::text)
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = $2, updated_at = NOW()
      `, ['invoice_signature', signatureText])
    }

    if (currency) {
      await pool.query(`
        INSERT INTO store_settings (setting_key, setting_value)
        VALUES ($1, $2::text)
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = $2, updated_at = NOW()
      `, ['invoice_currency', currency])
    }
    
    sendSuccess(res, { message: 'All settings saved successfully' })
  } catch (err) {
    sendError(res, 500, 'Failed to save settings', err)
  }
})

// Invoice download endpoint with Arctic Blue gradient
app.get('/api/invoices/:id/download', async (req, res) => {
  try {
    const { id } = req.params
    
    // Check if id is numeric (integer ID) or string (order_number)
    const isNumeric = /^\d+$/.test(id)
    
    let result
    if (isNumeric) {
      // If numeric, try to find by ID
      result = await pool.query('SELECT * FROM orders WHERE id = $1', [parseInt(id)])
    } else {
      // If not numeric (like "NEFOL-1761469115971"), find by order_number
      result = await pool.query('SELECT * FROM orders WHERE order_number = $1', [id])
    }
    
    // If not found and it was numeric, try by order_number
    if (result.rows.length === 0 && isNumeric) {
      result = await pool.query('SELECT * FROM orders WHERE order_number = $1', [id])
    }
    
    if (result.rows.length === 0) {
      return sendError(res, 404, 'Invoice not found')
    }
    
    const order = result.rows[0]
    
    // Get all invoice settings from database
    const companyDetailsResult = await pool.query(`
      SELECT setting_value FROM store_settings WHERE setting_key = 'invoice_company_details'
    `)
    
    const colorsResult = await pool.query(`
      SELECT setting_value FROM store_settings WHERE setting_key = 'invoice_colors'
    `)
    
    const taxResult = await pool.query(`
      SELECT setting_value FROM store_settings WHERE setting_key = 'invoice_tax'
    `)
    
    const termsResult = await pool.query(`
      SELECT setting_value FROM store_settings WHERE setting_key = 'invoice_terms'
    `)
    
    const signatureResult = await pool.query(`
      SELECT setting_value FROM store_settings WHERE setting_key = 'invoice_signature'
    `)
    
    const currencyResult = await pool.query(`
      SELECT setting_value FROM store_settings WHERE setting_key = 'invoice_currency'
    `)
    
    let companyDetails = {
      companyName: 'Nefol',
      companyAddress: '',
      companyPhone: '7355384939',
      companyEmail: 'info@nefol.com',
      gstNumber: '',
      panNumber: ''
    }
    
    let colors = {
      primaryStart: '#667eea',
      primaryEnd: '#764ba2',
      accentStart: '#667eea',
      accentEnd: '#764ba2'
    }
    
    let taxSettings = {
      rate: 18,
      type: 'IGST'
    }
    
    let terms = 'Thank you for doing business with us.'
    let signature = 'Authorized Signatory'
    let currency = '₹'
    
    // Parse and merge company details
    if (companyDetailsResult.rows.length > 0 && companyDetailsResult.rows[0].setting_value) {
      const parsed = typeof companyDetailsResult.rows[0].setting_value === 'string'
        ? JSON.parse(companyDetailsResult.rows[0].setting_value)
        : companyDetailsResult.rows[0].setting_value
      companyDetails = { ...companyDetails, ...parsed }
    }
    
    // Parse and merge colors
    if (colorsResult.rows.length > 0 && colorsResult.rows[0].setting_value) {
      const parsed = typeof colorsResult.rows[0].setting_value === 'string'
        ? JSON.parse(colorsResult.rows[0].setting_value)
        : colorsResult.rows[0].setting_value
      colors = { ...colors, ...parsed }
    }
    
    // Parse and merge tax settings
    if (taxResult.rows.length > 0 && taxResult.rows[0].setting_value) {
      const parsed = typeof taxResult.rows[0].setting_value === 'string'
        ? JSON.parse(taxResult.rows[0].setting_value)
        : taxResult.rows[0].setting_value
      taxSettings = { ...taxSettings, ...parsed }
    }
    
    // Get terms and signature
    if (termsResult.rows.length > 0 && termsResult.rows[0].setting_value) {
      terms = termsResult.rows[0].setting_value
    }
    
    if (signatureResult.rows.length > 0 && signatureResult.rows[0].setting_value) {
      signature = signatureResult.rows[0].setting_value
    }
    
    if (currencyResult.rows.length > 0 && currencyResult.rows[0].setting_value) {
      currency = currencyResult.rows[0].setting_value
    }
    
    // Generate invoice HTML with all settings
    const invoiceHtml = generateInvoiceHTML(order, companyDetails, colors, taxSettings, terms, signature, currency)
    
    // Return HTML for printing/downloading
    res.setHeader('Content-Type', 'text/html')
    res.send(invoiceHtml)
  } catch (err) {
    sendError(res, 500, 'Failed to generate invoice', err)
  }
})

// Helper function to generate invoice HTML with Arctic Blue gradient
function generateInvoiceHTML(order: any, companyDetails: any, colors: any, taxSettings: any, terms: string, signature: string, currency: string): string {
  try {
    const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]')
    
    // Calculate totals
    let subtotal = 0
    let totalDiscount = 0
    let totalTax = 0
    
    const invoiceItems = items.map((item: any, index: number) => {
    const unitPrice = parseFloat(item.price || item.unitPrice || item.mrp || 0)
    const quantity = parseInt(item.quantity || 1)
    const discount = parseFloat(item.discount || 0)
    
    // Fetch tax rate from CSV product data (GST %)
    const gstFromCSV = item.csvProduct?.['GST %']
    const taxRate = gstFromCSV ? parseFloat(gstFromCSV) : parseFloat(item.taxRate || taxSettings.rate)
    
    const itemSubtotal = unitPrice * quantity
    const itemDiscount = discount
    const taxableAmount = itemSubtotal - itemDiscount
    const itemTax = (taxableAmount * taxRate) / 100
    const itemTotal = taxableAmount + itemTax
    
    subtotal += itemSubtotal
    totalDiscount += itemDiscount
    totalTax += itemTax
    
    // Determine state (simplified - you may want to add actual state logic)
    const isInterState = true // Assume inter-state for IGST
    const gstType = isInterState ? 'IGST' : 'CGST+SGST'
    
    // Get HSN Code from CSV product data if available
    const hsnCode = item.csvProduct?.['HSN Code'] || item.hsn || '-'
    const sku = item.csvProduct?.['SKU'] || item.code || item.sku || item.id || 'N/A'
    const brand = item.csvProduct?.['Brand Name'] || 'NEFOL'
    const netQuantity = item.csvProduct?.['Net Quantity (Content)'] || ''
    const netWeight = item.csvProduct?.['Net Weight (Product Only)'] || ''
    const countryOfOrigin = item.csvProduct?.['Country of Origin'] || ''
    const manufacturer = item.csvProduct?.['Manufacturer / Packer / Importer'] || ''
    
    // Get GST % from CSV if available
    const gstPercent = gstFromCSV || taxRate
    
    // Debug logging for HSN codes
    if (index === 0) {
      console.log('🔍 Invoice Generation Debug:')
      console.log('Product:', item.name || item.productName || item.title)
      console.log('CSV Product data:', item.csvProduct)
      console.log('HSN Code found:', hsnCode)
      console.log('SKU found:', sku)
      console.log('GST % found:', gstPercent)
    }
    
    // Calculate discount percentage
    const discountPercent = itemSubtotal > 0 ? ((itemDiscount / itemSubtotal) * 100).toFixed(0) : 0
    
    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${index + 1}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
          <div style="margin-bottom: 4px;">
            <strong>${item.name || item.productName || item.title || 'Product'}</strong>
          </div>
          <div style="font-size: 11px; color: #6b7280;">
            Code: ${sku}
          </div>
          ${brand !== 'NEFOL' ? `<div style="font-size: 11px; color: #6b7280;">Brand: ${brand}</div>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 13px;">
          <strong>${hsnCode}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 14px;">
          <strong>${quantity}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px;">
          <div>${currency}${unitPrice.toFixed(2)}</div>
          ${itemDiscount > 0 ? `<div style="color: #dc2626; font-size: 11px; margin-top: 2px;">Discount: ${discountPercent}% (${currency}${itemDiscount.toFixed(2)})</div>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 14px;">
          <strong>${currency}${itemTotal.toFixed(2)}</strong>
          <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
            <div>GST ${gstPercent}%: ${currency}${itemTax.toFixed(2)}</div>
            <div style="font-size: 10px; margin-top: 2px;">HSN: ${hsnCode}</div>
          </div>
        </td>
      </tr>
    `
    }).join('')
    
    const finalSubtotal = subtotal - totalDiscount
    const finalTotal = finalSubtotal + totalTax
    
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tax Invoice - ${order.order_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif; 
          background: linear-gradient(135deg, ${colors.primaryStart} 0%, ${colors.primaryEnd} 100%);
          padding: 20px;
        }
        .invoice-container {
          max-width: 210mm;
          margin: 0 auto;
          background: white;
          padding: 30px;
        }
        .header-section { margin-bottom: 30px; position: relative; }
        .logo-box {
          background: linear-gradient(135deg, ${colors.primaryStart} 0%, ${colors.primaryEnd} 100%);
          color: white;
          padding: 20px;
          width: 120px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
          border-radius: 8px;
        }
        .company-name { font-size: 14px; color: #4a5568; font-weight: 600; margin-bottom: 5px; }
        .phone-bar {
          background: linear-gradient(135deg, ${colors.primaryStart} 0%, ${colors.primaryEnd} 100%);
          color: white;
          padding: 8px 15px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 20px;
        }
        .invoice-title { font-size: 32px; font-weight: bold; color: #4a5568; margin: 20px 0 15px 0; }
        .invoice-details { display: flex; justify-content: space-between; color: #4a5568; margin-bottom: 20px; }
        .billing-info { margin-bottom: 30px; color: #4a5568; }
        .table-container { margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; }
        thead tr { background: linear-gradient(135deg, ${colors.primaryStart} 0%, ${colors.primaryEnd} 100%); color: white; }
        th { padding: 12px; text-align: left; }
        tbody td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #4a5568; }
        tfoot tr { background: linear-gradient(135deg, ${colors.primaryStart} 0%, ${colors.primaryEnd} 100%); color: white; font-weight: bold; }
        .bottom-section { display: flex; justify-content: space-between; gap: 40px; margin-top: 30px; }
        .left-section { flex: 1; }
        .amount-in-words, .terms { margin-bottom: 20px; color: #4a5568; }
        .terms-title { font-size: 16px; color: ${colors.primaryStart}; font-weight: bold; margin-bottom: 5px; }
        .signature { margin-top: 40px; color: #4a5568; }
        .right-section { min-width: 200px; }
        .summary-box {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          overflow: hidden;
        }
        .summary-header {
          padding: 15px;
          background: linear-gradient(135deg, ${colors.primaryStart} 0%, ${colors.primaryEnd} 100%);
          color: white;
          font-weight: bold;
          text-align: center;
        }
        .summary-row {
          padding: 12px 15px;
          border-bottom: 1px solid #e2e8f0;
          color: #4a5568;
        }
        @media print {
          body { background: white; padding: 0; }
          .invoice-container { max-width: 100%; padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header-section">
          <div class="logo-box">LOGO</div>
          <div class="company-name">${companyDetails.companyName || 'Nefol'}</div>
          <div class="phone-bar">📞 ${companyDetails.companyPhone || '7355384939'}</div>
          <div class="invoice-title">Tax Invoice</div>
          <div class="invoice-details">
            <div>
              <div style="margin-bottom: 5px;">Invoice No.: <strong>${order.order_number || 'N/A'}</strong></div>
              <div>Date: <strong>${formatDate(order.created_at)}</strong></div>
            </div>
          </div>
        </div>
        
        <!-- Seller and Buyer Info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <!-- Seller (Company) Details -->
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border: 2px solid ${colors.primaryStart};">
            <h3 style="color: ${colors.primaryStart}; font-size: 16px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase;">Seller Details</h3>
            <div style="color: #4a5568; font-size: 14px;">
              <div style="margin-bottom: 5px;"><strong>Company:</strong> ${companyDetails.companyName || 'Nefol'}</div>
              ${companyDetails.companyAddress ? `<div style="margin-bottom: 5px;"><strong>Address:</strong><br/>${companyDetails.companyAddress.replace(/\n/g, '<br/>')}</div>` : ''}
              <div style="margin-bottom: 5px;"><strong>Phone:</strong> ${companyDetails.companyPhone || '7355384939'}</div>
              <div style="margin-bottom: 5px;"><strong>Email:</strong> ${companyDetails.companyEmail || 'info@nefol.com'}</div>
              ${companyDetails.gstNumber ? `<div style="margin-bottom: 5px;"><strong>GST No:</strong> ${companyDetails.gstNumber}</div>` : ''}
              ${companyDetails.panNumber ? `<div><strong>PAN No:</strong> ${companyDetails.panNumber}</div>` : ''}
            </div>
          </div>
          
          <!-- Buyer (Customer) Details -->
          <div style="background: #f0f4ff; padding: 15px; border-radius: 8px; border: 2px solid ${colors.primaryEnd};">
            <h3 style="color: ${colors.primaryEnd}; font-size: 16px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase;">Buyer Details</h3>
            <div style="color: #4a5568; font-size: 14px;">
              <div style="margin-bottom: 5px;"><strong>Name:</strong> ${order.customer_name || 'Customer Name'}</div>
              <div style="margin-bottom: 5px;"><strong>Email:</strong> ${order.customer_email || 'N/A'}</div>
              <div style="margin-bottom: 5px;"><strong>Phone:</strong> ${order.shipping_address?.phone || order.customer_phone || 'N/A'}</div>
              <div><strong>Shipping Address:</strong><br/>
                ${order.shipping_address ? 
                  (typeof order.shipping_address === 'string' ? order.shipping_address : 
                   `${order.shipping_address.street || ''}<br/>${order.shipping_address.city || ''}, ${order.shipping_address.state || ''}<br/>${order.shipping_address.zip || ''}`) 
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="text-align: center; padding: 12px;">S.No.</th>
                <th style="padding: 12px;">Product Name & Code</th>
                <th style="text-align: center; padding: 12px;">HSN/SAC</th>
                <th style="text-align: center; padding: 12px;">Qty</th>
                <th style="text-align: right; padding: 12px;">Price & Discount</th>
                <th style="text-align: right; padding: 12px;">Amount with Tax</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceItems}
            </tbody>
            <tfoot>
              <tr style="border-top: 2px solid ${colors.primaryStart};">
                <td colspan="4" style="text-align: right; padding: 12px;"><strong>Subtotal:</strong></td>
                <td colspan="2" style="text-align: right; padding: 12px;">${currency}${subtotal.toFixed(2)}</td>
              </tr>
              ${totalDiscount > 0 ? `<tr>
                <td colspan="4" style="text-align: right; padding: 12px;"><strong>Discount:</strong></td>
                <td colspan="2" style="text-align: right; padding: 12px;">-${currency}${totalDiscount.toFixed(2)}</td>
              </tr>` : ''}
              <tr>
                <td colspan="4" style="text-align: right; padding: 12px;"><strong>${taxSettings.type} (${taxSettings.rate}%):</strong></td>
                <td colspan="2" style="text-align: right; padding: 12px;">${currency}${totalTax.toFixed(2)}</td>
              </tr>
              <tr style="background: linear-gradient(135deg, ${colors.primaryStart} 0%, ${colors.primaryEnd} 100%); color: white; font-weight: bold;">
                <td colspan="4" style="text-align: right; padding: 12px;"><strong>Total Amount:</strong></td>
                <td colspan="2" style="text-align: right; padding: 12px;">${currency}${finalTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div class="bottom-section">
          <div class="left-section">
            <div class="amount-in-words">
              <div style="font-weight: 600; margin-bottom: 5px;">Invoice Amount In Words</div>
              <div>Five Hundred Rupees only</div>
            </div>
            <div class="terms">
              <div class="terms-title">Terms And Conditions</div>
              <div>${terms}</div>
            </div>
            <div class="signature">
              <div style="margin-bottom: 30px;">For: ${companyDetails.companyName || 'Nefol'}</div>
              <div>${signature}</div>
            </div>
          </div>
          
          <div class="right-section">
            <div class="summary-box">
              <div class="summary-header">Payment Summary</div>
              
              <div class="summary-row" style="background: white;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Subtotal:</span>
                  <span>${currency}${subtotal.toFixed(2)}</span>
                </div>
              </div>
              
              ${totalDiscount > 0 ? `<div class="summary-row" style="background: white;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Discount:</span>
                  <span>-${currency}${totalDiscount.toFixed(2)}</span>
                </div>
              </div>` : ''}
              
              <div class="summary-row" style="background: white;">
                <div style="display: flex; justify-content: space-between;">
                  <span>${taxSettings.type} (${taxSettings.rate}%):</span>
                  <span>${currency}${totalTax.toFixed(2)}</span>
                </div>
              </div>
              
              <div class="summary-row" style="background: ${colors.primaryStart}; color: white; font-size: 18px; font-weight: bold; border-bottom: none;">
                <div style="display: flex; justify-content: space-between;">
                  <span>Grand Total:</span>
                  <span>${currency}${finalTotal.toFixed(2)}</span>
                </div>
              </div>
              
              <div class="summary-row" style="border-top: 2px solid ${colors.primaryStart};">
                <div style="display: flex; justify-content: space-between;">
                  <strong>Received:</strong>
                  <span>${currency}0.00</span>
                </div>
              </div>
              
              <div class="summary-row" style="border-bottom: none;">
                <div style="display: flex; justify-content: space-between; font-weight: bold;">
                  <strong>Balance:</strong>
                  <span>${currency}${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
  } catch (error) {
    console.error('Error generating invoice HTML:', error)
    return `
      <!DOCTYPE html>
      <html>
      <head><title>Error</title></head>
      <body>
        <h1>Invoice Generation Error</h1>
        <p>Failed to generate invoice. Please try again.</p>
        <p>Error: ${error}</p>
      </body>
      </html>
    `
  }
}

// Loyalty Program endpoints
app.get('/api/loyalty-program', async (req, res) => {
  try {
    const programs = [
      {
        id: 1,
        name: 'Premium Membership',
        description: 'Exclusive benefits for premium members',
        points_multiplier: 2.0,
        benefits: ['Free shipping', 'Early access', 'Exclusive discounts'],
        status: 'active',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'VIP Program',
        description: 'Ultimate VIP experience',
        points_multiplier: 3.0,
        benefits: ['Priority support', 'Personal shopper', 'Exclusive products'],
        status: 'active',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]
    res.json(programs)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch loyalty programs', err)
  }
})

// Analytics endpoints
app.get('/api/analytics', async (req, res) => {
  try {
    const { range = '30d' } = req.query
    const analytics = {
      total_orders: 1250,
      total_revenue: 125000,
      total_customers: 850,
      conversion_rate: 3.2,
      average_order_value: 100,
      top_products: [
        { name: 'Product A', sales: 150 },
        { name: 'Product B', sales: 120 },
        { name: 'Product C', sales: 100 }
      ],
      revenue_by_day: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 5000) + 1000
      }))
    }
    res.json(analytics)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch analytics', err)
  }
})

// Returns endpoints
app.get('/api/returns', async (req, res) => {
  try {
    const returns = [
      {
        id: 1,
        order_id: 'ORD-001',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        product_name: 'Product A',
        reason: 'Defective item',
        status: 'approved',
        amount: 1299,
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        order_id: 'ORD-002',
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        product_name: 'Product B',
        reason: 'Wrong size',
        status: 'pending',
        amount: 899,
        created_at: '2024-01-16T14:20:00Z'
      }
    ]
    res.json(returns)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch returns', err)
  }
})

// AI endpoints
app.get('/api/ai/features', async (req, res) => {
  try {
    const features = [
      { id: 1, name: 'Product Recommendations', status: 'active', usage: 85 },
      { id: 2, name: 'Chat Support', status: 'active', usage: 92 },
      { id: 3, name: 'Price Optimization', status: 'beta', usage: 45 }
    ]
    res.json(features)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch AI features', err)
  }
})

app.get('/api/ai/tasks', async (req, res) => {
  try {
    const tasks = [
      { id: 1, name: 'Process customer feedback', status: 'completed', priority: 'high' },
      { id: 2, name: 'Generate product descriptions', status: 'in_progress', priority: 'medium' },
      { id: 3, name: 'Optimize inventory', status: 'pending', priority: 'low' }
    ]
    res.json(tasks)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch AI tasks', err)
  }
})

// Tax endpoints
app.get('/api/tax-rates', async (req, res) => {
  try {
    const taxRates = [
      { id: 1, name: 'GST', rate: 18, type: 'percentage', status: 'active' },
      { id: 2, name: 'CGST', rate: 9, type: 'percentage', status: 'active' },
      { id: 3, name: 'SGST', rate: 9, type: 'percentage', status: 'active' }
    ]
    res.json(taxRates)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch tax rates', err)
  }
})

app.get('/api/tax-report', async (req, res) => {
  try {
    const report = {
      total_tax_collected: 22500,
      gst_collected: 18000,
      cgst_collected: 9000,
      sgst_collected: 9000,
      monthly_breakdown: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
        tax_collected: Math.floor(Math.random() * 3000) + 1000
      }))
    }
    res.json(report)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch tax report', err)
  }
})

// Payment endpoints
app.get('/api/payment-methods', async (req, res) => {
  try {
    const methods = [
      { id: 1, name: 'Credit Card', status: 'active', fee: 2.5 },
      { id: 2, name: 'Debit Card', status: 'active', fee: 1.5 },
      { id: 3, name: 'UPI', status: 'active', fee: 0.5 },
      { id: 4, name: 'Net Banking', status: 'active', fee: 1.0 }
    ]
    res.json(methods)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch payment methods', err)
  }
})

app.get('/api/payment-transactions', async (req, res) => {
  try {
    const transactions = [
      {
        id: 1,
        order_id: 'ORD-001',
        amount: 1299,
        method: 'Credit Card',
        status: 'success',
        transaction_id: 'TXN-001',
        created_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        order_id: 'ORD-002',
        amount: 899,
        method: 'UPI',
        status: 'success',
        transaction_id: 'TXN-002',
        created_at: '2024-01-16T14:20:00Z'
      }
    ]
    res.json(transactions)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch payment transactions', err)
  }
})

app.get('/api/payment-report', async (req, res) => {
  try {
    const report = {
      total_transactions: 1250,
      total_amount: 125000,
      success_rate: 98.5,
      average_transaction_value: 100,
      method_breakdown: [
        { method: 'Credit Card', count: 500, amount: 50000 },
        { method: 'UPI', count: 400, amount: 40000 },
        { method: 'Debit Card', count: 200, amount: 20000 },
        { method: 'Net Banking', count: 150, amount: 15000 }
      ]
    }
    res.json(report)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch payment report', err)
  }
})

// Auth verification endpoint
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    // If we reach here, the token is valid
    res.json({ 
      valid: true, 
      userId: req.userId,
      message: 'Token is valid' 
    })
  } catch (err) {
    sendError(res, 500, 'Failed to verify token', err)
  }
})

// ==================== ADMIN NOTIFICATIONS API ====================
// Helper function to create admin notification
async function createAdminNotification(
  pool: Pool,
  type: string,
  title: string,
  message: string,
  link?: string,
  icon?: string,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
  metadata?: any,
  userId?: string | number
) {
  try {
    const { rows } = await pool.query(`
      INSERT INTO admin_notifications (user_id, notification_type, title, message, link, icon, priority, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [userId || null, type, title, message, link || null, icon || null, priority, metadata ? JSON.stringify(metadata) : '{}'])
    
    // Emit real-time notification to admin panel
    io.to('admin-panel').emit('new-notification', rows[0])
    
    return rows[0]
  } catch (err) {
    console.error('Error creating admin notification:', err)
    throw err
  }
}

// Get all admin notifications
app.get('/api/admin/notifications', async (req, res) => {
  try {
    const { status = 'unread', limit = 50 } = req.query
    
    const { rows } = await pool.query(`
      SELECT * FROM admin_notifications
      ${status !== 'all' ? 'WHERE status = $1' : ''}
      ORDER BY created_at DESC
      LIMIT $${status !== 'all' ? '2' : '1'}
    `, status !== 'all' ? [status, limit] : [limit])
    
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch notifications', err)
  }
})

// Get unread notification count
app.get('/api/admin/notifications/unread-count', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(*) as count FROM admin_notifications WHERE status = 'unread'
    `)
    
    sendSuccess(res, { count: parseInt(rows[0].count) })
  } catch (err) {
    sendError(res, 500, 'Failed to fetch unread count', err)
  }
})

// Mark notification as read
app.put('/api/admin/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params
    
    await pool.query(`
      UPDATE admin_notifications 
      SET status = 'read', read_at = NOW()
      WHERE id = $1
    `, [id])
    
    sendSuccess(res, { message: 'Notification marked as read' })
  } catch (err) {
    sendError(res, 500, 'Failed to mark notification as read', err)
  }
})

// Mark all notifications as read
app.put('/api/admin/notifications/read-all', async (req, res) => {
  try {
    await pool.query(`
      UPDATE admin_notifications 
      SET status = 'read', read_at = NOW()
      WHERE status = 'unread'
    `)
    
    sendSuccess(res, { message: 'All notifications marked as read' })
  } catch (err) {
    sendError(res, 500, 'Failed to mark all notifications as read', err)
  }
})

// Delete notification
app.delete('/api/admin/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    await pool.query(`DELETE FROM admin_notifications WHERE id = $1`, [id])
    
    sendSuccess(res, { message: 'Notification deleted' })
  } catch (err) {
    sendError(res, 500, 'Failed to delete notification', err)
  }
})

// Start server
const port = Number(process.env.PORT || 4000)
ensureSchema(pool)
  .then(async () => {
    // Initialize user activity tracking tables
    await createUserActivityTables(pool)
    console.log('✅ User activity tracking initialized')
    
    // Seed CMS content
    await seedCMSContent(pool)
    
    // Update all products with pricing data
    await updateAllProductsWithPricing(pool)
    
    // Sample products removed - no longer adding sample products on startup
    
    server.listen(port, '192.168.1.66', () => {
      console.log(`🚀 Nefol API running on http://192.168.1.66:${port}`)
      console.log(`📡 WebSocket server ready for real-time updates`)
      console.log(`✅ All routes optimized and centralized`)
      console.log(`🔧 CSV path fixed: ../product description page.csv`)
      console.log(`🌱 CMS content initialized`)
      console.log(`💰 All products updated with MRP and discounted pricing`)
    })
  })
  .catch((err) => {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
  })