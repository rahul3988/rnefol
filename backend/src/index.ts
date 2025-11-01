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
import { authenticateToken, requireRole, requirePermission, sendError, sendSuccess } from './utils/apiHelpers'
import { createUserActivityTables } from './utils/userActivitySchema'
import * as productRoutes from './routes/products'
import * as variantRoutes from './routes/variants'
import * as inventoryRoutes from './routes/inventory'
import * as shiprocketRoutes from './routes/shiprocket'
import * as amazonRoutes from './routes/amazon'
import * as flipkartRoutes from './routes/flipkart'
import * as facebookRoutes from './routes/facebook'
import * as bulkRoutes from './routes/bulk'
import * as staffRoutes from './routes/staff'
import * as warehouseRoutes from './routes/warehouses'
import * as returnRoutes from './routes/returns'
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
import * as notificationRoutes from './routes/notifications'
import { seedCMSContent } from './utils/seedCMS'
import { updateAllProductsWithPricing } from './utils/updateAllProducts'
import cron from 'node-cron'
import { registerExtendedRoutes } from './routes/extended'
import { registerDashboardAnalyticsRoutes } from './routes/dashboardAnalytics'
import { registerCommunicationsRoutes } from './routes/communications'
import { registerIntegrationsRoutes } from './routes/integrations'
import { registerLiveChatRoutes } from './routes/liveChat'
import * as recommendationRoutes from './routes/recommendations'
import * as newsletterRoutes from './routes/newsletter'

// Extend Request interface to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string
      userRole?: string
      userPermissions?: string[]
      io?: any
    }
  }
}

const app = express()
app.use(express.json())

// Serve uploaded files
app.use('/uploads', express.static('uploads'))

// Serve user panel images
app.use('/IMAGES', express.static(path.join(__dirname, '../../user-panel/public/IMAGES')))

// Debug: Log the path being used
console.log('Serving IMAGES from:', path.join(__dirname, '../../user-panel/public/IMAGES'))
console.log('Path exists:', fs.existsSync(path.join(__dirname, '../../user-panel/public/IMAGES')))

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://192.168.1.66:5173'
app.use(cors({ origin: true, credentials: true }))

// Basic in-memory rate limiting (IP-based)
// Default: 100,000 requests per minute. Set env to override, e.g. RATE_LIMIT_MAX_REQUESTS=1000
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000) // 1 minute default
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100000) // Very high default to avoid 429 errors
const ipToHits: Map<string, { count: number; resetAt: number }> = new Map()

// Cleanup expired rate limit entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of ipToHits.entries()) {
    if (now > entry.resetAt) {
      ipToHits.delete(ip)
    }
  }
}, 5 * 60 * 1000)

// Exclude static files and socket.io from rate limiting
app.use((req, res, next) => {
  // If disabled, skip rate limiting entirely
  if (!Number.isFinite(RATE_LIMIT_MAX_REQUESTS) || RATE_LIMIT_MAX_REQUESTS <= 0) {
    return next()
  }
  // Skip rate limiting for static files, socket.io, and uploads
  if (
    req.path.startsWith('/uploads/') ||
    req.path.startsWith('/IMAGES/') ||
    req.path.startsWith('/socket.io/') ||
    req.path.match(/\.(css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/i)
  ) {
    return next()
  }

  try {
    // Try multiple methods to get the client IP
    const forwardedFor = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    const ip = forwardedFor || (req as any).ip || req.socket.remoteAddress || req.connection?.remoteAddress || 'unknown'
    const now = Date.now()
    const entry = ipToHits.get(ip)
    if (!entry || now > entry.resetAt) {
      ipToHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
      return next()
    }
    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000))
      return res.status(429).json({ error: 'Too many requests. Please try again later.' })
    }
    entry.count += 1
    return next()
  } catch {
    return next()
  }
})

// Basic admin audit log middleware (logs method, path, userId if present)
app.use(async (req, _res, next) => {
  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id SERIAL PRIMARY KEY,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        user_id TEXT,
        ip TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`
    )
    // Only log admin and API routes to reduce noise
    if (req.path.startsWith('/api/')) {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || null
      await pool.query(
        `INSERT INTO admin_audit_logs (method, path, user_id, ip) VALUES ($1, $2, $3, $4)`,
        [req.method, req.path, req.userId || null, ip]
      )
    }
  } catch (e) {
    console.error('Audit log error:', e)
  } finally {
    next()
  }
})

// RBAC context attach middleware creator
async function attachRBACContext(req: express.Request) {
  try {
    if (!req.userId) return
    // Fetch roles and permissions for staff user
    const rolesRes = await pool.query(
      `select r.name as role_name, r.id as role_id
       from staff_users su
       left join staff_roles sr on sr.staff_id = su.id
       left join roles r on r.id = sr.role_id
       where su.id = $1`,
      [req.userId]
    )
    const roleNames = rolesRes.rows.map((r: any) => r.role_name).filter(Boolean)
    const roleIds = rolesRes.rows.map((r: any) => r.role_id).filter(Boolean)
    let perms: string[] = []
    if (roleIds.length > 0) {
      const permsRes = await pool.query(
        `select distinct p.code as code
         from role_permissions rp
         join permissions p on p.id = rp.permission_id
         where rp.role_id = any($1::int[])`,
        [roleIds]
      )
      perms = permsRes.rows.map((p: any) => p.code)
    }
    ;(req as any).userRole = roleNames.includes('admin') ? 'admin' : (roleNames[0] || undefined)
    ;(req as any).userPermissions = perms
  } catch (e) {
    console.error('RBAC attach failed:', e)
  }
}

// Combined authenticate + RBAC attach middleware
function authenticateAndAttach(req: express.Request, res: express.Response, next: Function) {
  authenticateToken(req, res, async () => {
    await attachRBACContext(req)
    next()
  })
}

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

// Middleware to allow staff with permissions OR regular authenticated users to create orders
function allowOrderCreation(req: express.Request, res: express.Response, next: Function) {
  authenticateToken(req, res, async () => {
    await attachRBACContext(req)
    
    // Check if user is staff with orders:create permission
    const attached = (req as any).userPermissions as string[] | undefined
    const userPerms = attached && Array.isArray(attached)
      ? attached
      : ((req.headers['x-user-permissions'] as string) || '').split(',').map(s => s.trim()).filter(Boolean)
    
    const hasPermission = userPerms.includes('orders:create')
    
    if (hasPermission) {
      // Staff user with permission - allow
      return next()
    }
    
    // Check if user is a regular user from users table
    if (req.userId) {
      try {
        const userResult = await pool.query(
          'SELECT id, email FROM users WHERE id = $1',
          [req.userId]
        )
        
        if (userResult.rows.length > 0) {
          // Regular user - allow them to create orders (for themselves)
          return next()
        }
      } catch (e) {
        console.error('Error checking regular user:', e)
      }
    }
    
    // Neither staff with permission nor regular user - deny
    return sendError(res, 403, 'Forbidden')
  })
}

// Middleware to allow staff with permissions OR regular authenticated users to view their own orders
function allowOrderView(req: express.Request, res: express.Response, next: Function) {
  authenticateToken(req, res, async () => {
    await attachRBACContext(req)
    
    // Check if user is staff with orders:read permission
    const attached = (req as any).userPermissions as string[] | undefined
    const userPerms = attached && Array.isArray(attached)
      ? attached
      : ((req.headers['x-user-permissions'] as string) || '').split(',').map(s => s.trim()).filter(Boolean)
    
    const hasPermission = userPerms.includes('orders:read')
    
    if (hasPermission) {
      // Staff user with permission - allow viewing any order
      return next()
    }
    
    // Check if user is a regular user viewing their own order
    if (req.userId) {
      try {
        // Get user's email
        const userResult = await pool.query(
          'SELECT id, email FROM users WHERE id = $1',
          [req.userId]
        )
        
        if (userResult.rows.length > 0) {
          const userEmail = userResult.rows[0].email
          const { orderNumber } = req.params
          
          // Check if the order belongs to this user
          let orderResult = await pool.query(
            'SELECT customer_email FROM orders WHERE order_number = $1',
            [orderNumber]
          )
          
          // Also check by ID if orderNumber is numeric
          if (orderResult.rows.length === 0 && /^\d+$/.test(orderNumber)) {
            orderResult = await pool.query(
              'SELECT customer_email FROM orders WHERE id = $1',
              [orderNumber]
            )
          }
          
          if (orderResult.rows.length > 0 && orderResult.rows[0].customer_email === userEmail) {
            // Regular user viewing their own order - allow
            return next()
          }
        }
      } catch (e) {
        console.error('Error checking order ownership:', e)
      }
    }
    
    // Neither staff with permission nor regular user viewing own order - deny
    return sendError(res, 403, 'Forbidden')
  })
}

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

  // Live chat: join a specific session room so both panels receive realtime events
  socket.on('live-chat:join-session', (data: any) => {
    const { sessionId } = data || {}
    if (!sessionId) return
    const room = `live-chat-session-${sessionId}`
    socket.join(room)
    console.log('💬 Joined live chat session room:', room, 'socket:', socket.id)
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

  socket.on('live-chat:typing', (data: any) => {
    const { sessionId, sender, isTyping } = data || {}
    if (sessionId) {
      io.to(`live-chat-session-${sessionId}`).emit('live-chat:typing', { sessionId, sender, isTyping: !!isTyping })
    }
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
app.put('/api/products/:id', (req, res) => productRoutes.updateProduct(pool, req, res, io))
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
app.get('/api/shiprocket/config', authenticateAndAttach as any, requireRole(['admin']), (req, res) => shiprocketRoutes.getShiprocketConfig(pool, req, res))
app.post('/api/shiprocket/config', authenticateAndAttach as any, requireRole(['admin']), (req, res) => shiprocketRoutes.saveShiprocketConfig(pool, req, res))
app.post('/api/shiprocket/orders/:orderId/awb', authenticateAndAttach as any, requirePermission(['orders:update']), (req, res) => shiprocketRoutes.createAwbAndLabel(pool, req, res))
app.get('/api/shiprocket/orders/:orderId/track', authenticateAndAttach as any, requirePermission(['orders:read']), (req, res) => shiprocketRoutes.trackShipment(pool, req, res))
app.get('/api/shiprocket/serviceability', authenticateAndAttach as any, requirePermission(['shipping:read']), (req, res) => shiprocketRoutes.checkPincodeServiceability(pool, req, res))
app.post('/api/shiprocket/manifest', authenticateAndAttach as any, requirePermission(['shipping:update']), (req, res) => shiprocketRoutes.createManifest(pool, req, res))
app.post('/api/shiprocket/pickup', authenticateAndAttach as any, requirePermission(['shipping:update']), (req, res) => shiprocketRoutes.schedulePickup(pool, req, res))
app.get('/api/shiprocket/ndr', authenticateAndAttach as any, requirePermission(['shipping:read']), (req, res) => shiprocketRoutes.listNdr(pool, req, res))
app.post('/api/shiprocket/ndr/:awb/action', authenticateAndAttach as any, requirePermission(['shipping:update']), (req, res) => shiprocketRoutes.actOnNdr(pool, req, res))
app.post('/api/shiprocket/rto/:orderId', authenticateAndAttach as any, requirePermission(['shipping:update']), (req, res) => shiprocketRoutes.markRto(pool, req, res))

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
app.post('/api/bulk/orders/status', authenticateAndAttach as any, requirePermission(['orders:update']), (req, res) => bulkRoutes.bulkUpdateOrderStatus(pool, req, res))
app.post('/api/bulk/shipping/labels', authenticateAndAttach as any, requirePermission(['shipping:update']), (req, res) => bulkRoutes.bulkGenerateShippingLabels(pool, req, res))
app.post('/api/bulk/invoices/download', authenticateAndAttach as any, requirePermission(['invoices:read']), (req, res) => bulkRoutes.bulkDownloadInvoices(pool, req, res))
app.post('/api/bulk/products/prices', authenticateAndAttach as any, requirePermission(['products:update']), (req, res) => bulkRoutes.bulkUpdateProductPrices(pool, req, res))

// ==================== STAFF & PERMISSIONS ====================
// ==================== RETURNS & REFUNDS ====================
// ==================== FACEBOOK / INSTAGRAM SHOP ====================
app.post('/api/fb-shop/config', (req, res) => facebookRoutes.saveConfig(pool, req, res))
app.get('/api/facebook/catalog.csv', (req, res) => facebookRoutes.catalogCSV(pool, req, res))
app.post('/api/facebook/sync-products', (req, res) => facebookRoutes.syncAllProducts(pool, req, res))
app.post('/api/facebook/sync-stock-price', (req, res) => facebookRoutes.syncStockPrice(pool, req, res))
app.get('/api/facebook/sync/status/:id', (req, res) => facebookRoutes.jobStatus(pool, req, res))
app.get('/api/facebook/sync-errors', (req, res) => facebookRoutes.listErrors(pool, req, res))
app.post('/api/facebook/sync-errors/clear', (req, res) => facebookRoutes.clearErrors(pool, req, res))
app.post('/api/facebook/field-mapping', (req, res) => facebookRoutes.saveFieldMapping(pool, req, res))
app.get('/api/facebook/field-mapping', (req, res) => facebookRoutes.getFieldMapping(pool, req, res))
app.post('/api/facebook/webhook', (req, res) => facebookRoutes.webhook(pool, req, res))

// ==================== NOTIFICATIONS (WhatsApp + SMTP) ====================
app.get('/api/alerts/config', (req, res) => notificationRoutes.getConfig(pool, req, res))
app.post('/api/alerts/config', (req, res) => notificationRoutes.saveConfig(pool, req, res))
app.post('/api/alerts/test/whatsapp', (req, res) => notificationRoutes.testWhatsApp(pool, req, res))
app.post('/api/alerts/test/email', (req, res) => notificationRoutes.testEmail(pool, req, res))
app.get('/api/returns', authenticateAndAttach as any, requirePermission(['returns:read']), (req, res) => returnRoutes.listReturns(pool, req, res))
app.post('/api/returns', authenticateAndAttach as any, requirePermission(['returns:create']), (req, res) => returnRoutes.createReturn(pool, req, res))
app.put('/api/returns/:id/status', authenticateAndAttach as any, requirePermission(['returns:update']), (req, res) => returnRoutes.updateReturnStatus(pool, req, res))
app.post('/api/returns/:id/label', authenticateAndAttach as any, requirePermission(['returns:update']), (req, res) => returnRoutes.generateReturnLabel(pool, req, res))

app.post('/api/staff/roles', (req, res) => staffRoutes.createRole(pool, req, res))
app.get('/api/staff/roles', (req, res) => staffRoutes.listRoles(pool, req, res))
app.post('/api/staff/permissions', (req, res) => staffRoutes.createPermission(pool, req, res))
app.post('/api/staff/role-permissions', (req, res) => staffRoutes.assignPermissionToRole(pool, req, res))
app.post('/api/staff/users', (req, res) => staffRoutes.createStaff(pool, req, res))
app.post('/api/staff/user-roles', (req, res) => staffRoutes.assignRoleToStaff(pool, req, res))
app.get('/api/staff/users', (req, res) => staffRoutes.listStaff(pool, req, res))
app.get('/api/staff/permissions', (req, res) => staffRoutes.listPermissions(pool, req, res))
app.get('/api/staff/role-permissions', (req, res) => staffRoutes.getRolePermissions(pool, req, res))
app.post('/api/staff/role-permissions/set', (req, res) => staffRoutes.setRolePermissions(pool, req, res))
app.get('/api/staff/activity', (req, res) => staffRoutes.listStaffActivity(pool, req, res))
app.post('/api/staff/users/reset-password', (req, res) => staffRoutes.resetPassword(pool, req, res))
app.post('/api/staff/users/disable', (req, res) => staffRoutes.disableStaff(pool, req, res))
app.post('/api/staff/seed-standard', (req, res) => staffRoutes.seedStandardRolesAndPermissions(pool, req, res))

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
app.post('/api/search/track', (req, res) => recommendationRoutes.trackSearch(pool, req, res))
app.get('/api/search/popular', (req, res) => recommendationRoutes.getPopularSearches(pool, req, res))

// ==================== RECOMMENDATIONS & RECENTLY VIEWED ====================
app.post('/api/products/:productId/view', (req, res) => recommendationRoutes.trackProductView(pool, req, res))
app.get('/api/recommendations/recently-viewed', (req, res) => recommendationRoutes.getRecentlyViewed(pool, req, res))
app.get('/api/recommendations/related/:productId', (req, res) => recommendationRoutes.getRelatedProducts(pool, req, res))
app.get('/api/recommendations', (req, res) => recommendationRoutes.getRecommendedProducts(pool, req, res))

// ==================== NEWSLETTER & WHATSAPP ====================
app.post('/api/newsletter/subscribe', (req, res) => {
  (req as any).io = io
  newsletterRoutes.subscribeNewsletter(pool, req, res)
})
app.post('/api/newsletter/unsubscribe', (req, res) => newsletterRoutes.unsubscribeNewsletter(pool, req, res))
app.post('/api/whatsapp/subscribe', (req, res) => {
  (req as any).io = io
  newsletterRoutes.subscribeWhatsApp(pool, req, res)
})
app.post('/api/whatsapp/unsubscribe', (req, res) => newsletterRoutes.unsubscribeWhatsApp(pool, req, res))
app.get('/api/whatsapp/subscriptions', authenticateAndAttach as any, requireRole(['admin']), (req, res) => newsletterRoutes.getWhatsAppSubscriptions(pool, req, res))
app.get('/api/whatsapp/stats', authenticateAndAttach as any, requireRole(['admin']), (req, res) => newsletterRoutes.getWhatsAppStats(pool, req, res))
app.get('/api/newsletter/stats', authenticateAndAttach as any, requireRole(['admin']), (req, res) => newsletterRoutes.getNewsletterStats(pool, req, res))

// Register extended modular routes (extracted from this file)
registerExtendedRoutes(app, pool, io)
registerDashboardAnalyticsRoutes(app, pool)
registerCommunicationsRoutes(app, pool, io)
registerIntegrationsRoutes(app, pool)
registerLiveChatRoutes(app, pool, io)

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
// moved to routes/extended.ts: /api/cashback/balance

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
// moved to routes/extended.ts: /api/nefol-coins

// Get user's coin transaction history
// moved to routes/extended.ts: /api/coin-transactions

// ==================== COIN WITHDRAWAL API ====================
// Get user's withdrawal history
// moved to routes/extended.ts: /api/coin-withdrawals (GET, POST) and admin processing

// Create withdrawal request

// Get all withdrawal requests (admin only)

// Process withdrawal (admin only)
 

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

// Apply discount code endpoint
app.post('/api/discounts/apply', async (req, res) => {
  try {
    const { code, amount } = req.body || {}
    
    if (!code || !amount) {
      return sendError(res, 400, 'Discount code and order amount are required')
    }

    // Find the discount by code
    const discountResult = await pool.query(
      `SELECT * FROM discounts WHERE code = $1 AND is_active = true`,
      [code.toUpperCase()]
    )

    if (discountResult.rows.length === 0) {
      return sendError(res, 404, 'Invalid or inactive discount code')
    }

    const discount = discountResult.rows[0]
    const now = new Date()

    // Check if discount is within validity period
    if (discount.valid_from && new Date(discount.valid_from) > now) {
      return sendError(res, 400, 'Discount code is not yet valid')
    }

    if (discount.valid_until && new Date(discount.valid_until) < now) {
      return sendError(res, 400, 'Discount code has expired')
    }

    // Check minimum purchase amount
    if (discount.min_purchase && amount < parseFloat(discount.min_purchase)) {
      return sendError(res, 400, `Minimum purchase amount of ₹${discount.min_purchase} required`)
    }

    // Check usage limit
    if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
      return sendError(res, 400, 'Discount code usage limit reached')
    }

    // Calculate discount amount
    let discountAmount = 0
    if (discount.type === 'percentage') {
      discountAmount = (amount * parseFloat(discount.value)) / 100
      // Apply max discount limit if set
      if (discount.max_discount && discountAmount > parseFloat(discount.max_discount)) {
        discountAmount = parseFloat(discount.max_discount)
      }
    } else if (discount.type === 'fixed') {
      discountAmount = parseFloat(discount.value)
      // Don't allow discount to exceed order amount
      if (discountAmount > amount) {
        discountAmount = amount
      }
    }

    // Return discount details
    sendSuccess(res, {
      id: discount.id,
      code: discount.code,
      name: discount.name,
      type: discount.type,
      value: parseFloat(discount.value),
      discountAmount: Math.round(discountAmount * 100) / 100,
      maxDiscount: discount.max_discount ? parseFloat(discount.max_discount) : null
    })
  } catch (err) {
    console.error('Error applying discount:', err)
    sendError(res, 500, 'Failed to apply discount code', err)
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

// Create loyalty program
app.post('/api/loyalty-program', async (req, res) => {
  try {
    const { name, description, points_per_rupee, referral_bonus, vip_threshold, status } = req.body || {}
    if (!name) {
      return sendError(res, 400, 'name is required')
    }
    const { rows } = await pool.query(
      `INSERT INTO loyalty_program (name, description, points_per_rupee, referral_bonus, vip_threshold, status)
       VALUES ($1, $2, COALESCE($3, 1), COALESCE($4, 0), COALESCE($5, 0), COALESCE($6, 'active'))
       RETURNING *`,
      [name, description || null, points_per_rupee, referral_bonus, vip_threshold, status]
    )
    sendSuccess(res, rows[0], 201)
  } catch (err) {
    sendError(res, 500, 'Failed to create loyalty program', err)
  }
})

// Update loyalty program
app.put('/api/loyalty-program/:id', async (req, res) => {
  try {
    const { id } = req.params as any
    const { name, description, points_per_rupee, referral_bonus, vip_threshold, status } = req.body || {}
    const { rows } = await pool.query(
      `UPDATE loyalty_program
       SET 
         name = COALESCE($2, name),
         description = COALESCE($3, description),
         points_per_rupee = COALESCE($4, points_per_rupee),
         referral_bonus = COALESCE($5, referral_bonus),
         vip_threshold = COALESCE($6, vip_threshold),
         status = COALESCE($7, status),
         updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, name, description, points_per_rupee, referral_bonus, vip_threshold, status]
    )
    if (!rows[0]) return sendError(res, 404, 'Loyalty program not found')
    sendSuccess(res, rows[0])
  } catch (err) {
    sendError(res, 500, 'Failed to update loyalty program', err)
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
// CSV upload endpoint (FIXED PATH)
app.post('/api/products-csv/upload', upload.single('file'), async (req, res) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined
    if (!file) return sendError(res, 400, 'No file uploaded')
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
app.get('/api/orders', authenticateAndAttach as any, requirePermission(['orders:read']), async (req, res) => {
  try {
    const { status, q, from, to, customer, page = '1', limit = '50', payment_status, cod } = req.query as Record<string, string>
    const where: string[] = []
    const params: any[] = []
    if (status) {
      params.push(status)
      where.push(`status = $${params.length}`)
    }
    if (payment_status) {
      params.push(payment_status)
      where.push(`payment_status = $${params.length}`)
    }
    if (typeof cod !== 'undefined') {
      params.push(cod === 'true')
      where.push(`coalesce(cod, false) = $${params.length}`)
    }
    if (customer) {
      params.push(`%${customer}%`)
      where.push(`(customer_name ILIKE $${params.length} OR customer_email ILIKE $${params.length})`)
    }
    if (q) {
      params.push(`%${q}%`)
      where.push(`(order_number ILIKE $${params.length})`)
    }
    if (from) {
      params.push(from)
      where.push(`created_at >= $${params.length}`)
    }
    if (to) {
      params.push(to)
      where.push(`created_at <= $${params.length}`)
    }
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50))
    const offset = (pageNum - 1) * limitNum
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const { rows } = await pool.query(
      `SELECT * FROM orders ${whereSql} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset]
    )
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch orders', err)
  }
})

// Orders CSV export
app.get('/api/orders/export', authenticateAndAttach as any, requirePermission(['orders:read']), async (req, res) => {
  try {
    const { status, q, from, to, customer } = req.query as Record<string, string>
    const where: string[] = []
    const params: any[] = []
    if (status) { params.push(status); where.push(`status = $${params.length}`) }
    if (customer) { params.push(`%${customer}%`); where.push(`(customer_name ILIKE $${params.length} OR customer_email ILIKE $${params.length})`) }
    if (q) { params.push(`%${q}%`); where.push(`(order_number ILIKE $${params.length})`) }
    if (from) { params.push(from); where.push(`created_at >= $${params.length}`) }
    if (to) { params.push(to); where.push(`created_at <= $${params.length}`) }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const { rows } = await pool.query(`SELECT * FROM orders ${whereSql} ORDER BY created_at DESC`, params)
    const headers = ['order_number','customer_name','customer_email','status','subtotal','shipping','tax','total','created_at']
    const csv = [headers.join(',')].concat(
      rows.map(r => headers.map(h => {
        const v = r[h]
        if (v == null) return ''
        const s = String(v).replace(/"/g, '""')
        return /[,"]/.test(s) ? `"${s}"` : s
      }).join(','))
    ).join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"')
    res.send(csv)
  } catch (err) {
    sendError(res, 500, 'Failed to export orders', err)
  }
})

app.get('/api/orders/:orderNumber', allowOrderView as any, async (req, res) => {
  try {
    const { orderNumber } = req.params
    let rowsRes = await pool.query('SELECT * FROM orders WHERE order_number = $1', [orderNumber])
    if (rowsRes.rows.length === 0 && /^\d+$/.test(orderNumber)) {
      rowsRes = await pool.query('SELECT * FROM orders WHERE id = $1', [orderNumber])
    }
    const rows = rowsRes.rows
    
    if (rows.length === 0) {
      return sendError(res, 404, 'Order not found')
    }
    // Include items and status history if available
    let history: any[] = []
    try {
      const h = await pool.query('SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC', [rows[0].id])
      history = h.rows
    } catch (_) {}
    sendSuccess(res, { ...rows[0], history })
  } catch (err) {
    sendError(res, 500, 'Failed to fetch order details', err)
  }
})

// Order tags/labels
app.post('/api/orders/:id/tags', authenticateAndAttach as any, requirePermission(['orders:update']), async (req, res) => {
  try {
    const { id } = req.params
    const { tags } = req.body || {}
    if (!Array.isArray(tags)) return sendError(res, 400, 'tags must be an array')
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tags TEXT[]`)
    const { rows } = await pool.query(`UPDATE orders SET tags = $2, updated_at = NOW() WHERE id = $1 RETURNING id, tags`, [id, tags])
    if (rows.length === 0) return sendError(res, 404, 'Order not found')
    sendSuccess(res, rows[0])
  } catch (err) {
    sendError(res, 500, 'Failed to update tags', err)
  }
})

// Split order (basic): split by item indexes into a new order
app.post('/api/orders/:id/split', authenticateAndAttach as any, requirePermission(['orders:update']), async (req, res) => {
  try {
    const { id } = req.params
    const { itemIndexes = [] } = req.body || {}
    if (!Array.isArray(itemIndexes) || itemIndexes.length === 0) return sendError(res, 400, 'itemIndexes required')
    const oRes = await pool.query('SELECT * FROM orders WHERE id = $1', [id])
    if (oRes.rows.length === 0) return sendError(res, 404, 'Order not found')
    const order = oRes.rows[0]
    const items: any[] = Array.isArray(order.items) ? order.items : (order.items ? JSON.parse(order.items) : [])
    const keep: any[] = []
    const move: any[] = []
    items.forEach((it, idx) => (itemIndexes.includes(idx) ? move : keep).push(it))
    if (move.length === 0) return sendError(res, 400, 'No items to move')
    const calcTotal = (arr: any[]) => arr.reduce((sum, it) => sum + (Number(it.price||0) * Number(it.qty||1)), 0)
    const subtotalNew = calcTotal(move)
    const subtotalOld = calcTotal(keep)
    const shippingSplit = Number(order.shipping||0) * (subtotalNew / Math.max(1,(subtotalNew + subtotalOld)))
    const taxSplit = Number(order.tax||0) * (subtotalNew / Math.max(1,(subtotalNew + subtotalOld)))
    const totalNew = subtotalNew + shippingSplit + taxSplit
    const totalOld = subtotalOld + (Number(order.shipping||0) - shippingSplit) + (Number(order.tax||0) - taxSplit)

    // Update original order
    await pool.query(
      `UPDATE orders SET items = $2::jsonb, subtotal = $3, total = $4, updated_at = NOW() WHERE id = $1`,
      [id, JSON.stringify(keep), subtotalOld, totalOld]
    )

    // Create new order number
    const newOrderNumber = `${order.order_number}-S${Date.now().toString().slice(-4)}`
    const ins = await pool.query(
      `INSERT INTO orders (order_number, customer_name, customer_email, shipping_address, items, subtotal, shipping, tax, total, payment_method, payment_type, payment_status, cod, status)
       VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        newOrderNumber,
        order.customer_name,
        order.customer_email,
        order.shipping_address,
        JSON.stringify(move),
        subtotalNew,
        shippingSplit,
        taxSplit,
        totalNew,
        order.payment_method,
        order.payment_type,
        order.payment_status || 'unpaid',
        order.cod || false,
        order.status || 'pending'
      ]
    )
    sendSuccess(res, { original: { id, items: keep, total: totalOld }, split: ins.rows[0] }, 201)
  } catch (err) {
    sendError(res, 500, 'Failed to split order', err)
  }
})

app.post('/api/orders', allowOrderCreation as any, async (req, res) => {
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
      payment_status = 'unpaid',
      cod = false,
      affiliate_id, // Add affiliate tracking
      discount_code, // Discount code if applied
      discount_amount = 0 // Discount amount applied
    } = req.body || {}
    
    if (!order_number || !customer_name || !customer_email || !shipping_address || !items || !total) {
      return sendError(res, 400, 'Missing required fields')
    }
    
    // Ensure columns exist
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT`)
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod BOOLEAN DEFAULT false`)
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tags TEXT[]`)
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT`)
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0`)

    const { rows } = await pool.query(`
      INSERT INTO orders (order_number, customer_name, customer_email, shipping_address, items, subtotal, shipping, tax, total, payment_method, payment_type, payment_status, cod, affiliate_id, discount_code, discount_amount)
      VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [order_number, customer_name, customer_email, JSON.stringify(shipping_address), JSON.stringify(items), subtotal, shipping, tax, total, payment_method, payment_type, payment_status, cod, affiliate_id || null, discount_code || null, discount_amount || 0])
    
    const order = rows[0]

    // Track discount usage if discount code was applied
    if (discount_code && discount_amount > 0) {
      try {
        const discountResult = await pool.query(
          `SELECT id FROM discounts WHERE code = $1`,
          [discount_code.toUpperCase()]
        )
        
        if (discountResult.rows.length > 0) {
          const discountId = discountResult.rows[0].id
          
          // Record discount usage
          await pool.query(`
            INSERT INTO discount_usage (discount_id, order_id, customer_email, discount_amount)
            VALUES ($1, $2, $3, $4)
          `, [discountId, order.id, customer_email, discount_amount])
          
          // Increment usage count
          await pool.query(`
            UPDATE discounts 
            SET usage_count = usage_count + 1,
                updated_at = NOW()
            WHERE id = $1
          `, [discountId])
          
          console.log(`✅ Discount usage tracked: ${discount_code} for order ${order_number}`)
        }
      } catch (discountErr) {
        console.error('Error tracking discount usage:', discountErr)
        // Don't fail the order if discount tracking fails
      }
    }
    
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
app.put('/api/orders/:id', authenticateAndAttach as any, requirePermission(['orders:update']), async (req, res) => {
  try {
    const { id } = req.params
    const body = req.body || {}
    const fields = Object.keys(body).filter(key => body[key] !== undefined)
    
    if (fields.length === 0) {
      return sendError(res, 400, 'No fields to update')
    }
    
    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ')
    const values = [id, ...fields.map(field => body[field])]
    
    // Ensure columns exist for updates
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT`)
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod BOOLEAN DEFAULT false`)
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tags TEXT[]`)

    const { rows } = await pool.query(
      `UPDATE orders SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    )
    
    if (rows.length === 0) {
      return sendError(res, 404, 'Order not found')
    }
    
    // Record status change history
    try {
      if (Object.prototype.hasOwnProperty.call(body, 'status')) {
        await pool.query(
          `CREATE TABLE IF NOT EXISTS order_status_history (
            id SERIAL PRIMARY KEY,
            order_id INT NOT NULL,
            old_status TEXT,
            new_status TEXT NOT NULL,
            note TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          )`
        )
        await pool.query(
          `INSERT INTO order_status_history (order_id, old_status, new_status, note)
           VALUES ($1, $2, $3, $4)`,
          [rows[0].id, rows[0].status === body.status ? null : rows[0].status, body.status, body.note || null]
        )
      }
    } catch (e) {
      console.error('Failed to write order status history:', e)
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


// ==================== CUSTOMER SEGMENTS AGGREGATOR ====================

// Dashboard action items endpoint

// Dashboard live visitors endpoint

// ==================== JOURNEY TRACKING API ENDPOINTS ====================
app.get('/api/journey-tracking', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d'
    const eventFilter = req.query.eventFilter || 'all'
    
    // Calculate date filter based on timeRange
    const now = new Date()
    let dateFilter = new Date()
    switch (timeRange) {
      case '1d':
        dateFilter.setDate(dateFilter.getDate() - 1)
        break
      case '7d':
        dateFilter.setDate(dateFilter.getDate() - 7)
        break
      case '30d':
        dateFilter.setDate(dateFilter.getDate() - 30)
        break
      case '90d':
        dateFilter.setDate(dateFilter.getDate() - 90)
        break
      default:
        dateFilter.setDate(dateFilter.getDate() - 7)
    }
    
    // Get all customers with activities in the time range
    const { rows: customerRows } = await pool.query(`
      SELECT DISTINCT u.id, u.name, u.email, u.created_at
      FROM users u
      INNER JOIN user_activities ua ON u.id = ua.user_id
      WHERE ua.created_at >= $1
      UNION
      SELECT DISTINCT u.id, u.name, u.email, u.created_at
      FROM users u
      INNER JOIN orders o ON o.customer_email = u.email
      WHERE o.created_at >= $1
    `, [dateFilter])
    
    const journeys = await Promise.all(customerRows.map(async (customer: any) => {
      // Get all activities for this customer
      let activityQuery = `
        SELECT 
          ua.*,
          ua.created_at as timestamp
        FROM user_activities ua
        WHERE ua.user_id = $1 AND ua.created_at >= $2
      `
      const params: any[] = [customer.id, dateFilter]
      
      if (eventFilter !== 'all') {
        if (eventFilter === 'purchase') {
          activityQuery += ` AND (ua.activity_type = 'order_placed' OR ua.activity_subtype = 'order_placed')`
        } else {
          activityQuery += ` AND ua.activity_type = $${params.length + 1}`
          params.push(eventFilter)
        }
      }
      
      activityQuery += ` ORDER BY ua.created_at DESC`
      
      const { rows: activities } = await pool.query(activityQuery, params).catch(() => ({ rows: [] }))
      
      // Get orders for this customer
      const { rows: orders } = await pool.query(`
        SELECT * FROM orders
        WHERE customer_email = $1 AND created_at >= $2
        ORDER BY created_at DESC
      `, [customer.email, dateFilter]).catch(() => ({ rows: [] }))
      
      // Map activities to journey events
      const events: any[] = activities.map((act: any) => {
        let eventType = act.activity_type
        let eventName = act.activity_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
        
        // Map activity types to journey event types
        if (eventType === 'page_view') {
          eventName = 'Page View'
          if (act.page_title) eventName = act.page_title
        } else if (eventType === 'cart' && act.activity_subtype === 'add') {
          eventType = 'add_to_cart'
          eventName = 'Added to Cart'
        } else if (eventType === 'order_placed' || act.activity_subtype === 'order_placed') {
          eventType = 'purchase'
          eventName = 'Order Completed'
        } else if (eventType === 'product_view' || act.product_name) {
          eventType = 'product_view'
          eventName = 'Product Viewed'
        }
        
        return {
          id: `act_${act.id}`,
          customerId: String(customer.id),
          customerName: customer.name,
          eventType,
          eventName,
          timestamp: act.timestamp || act.created_at,
          details: {
            page: act.page_url,
            product: act.product_name,
            value: act.payment_amount || act.product_price,
            source: act.referrer || 'direct',
            device: act.metadata?.device || 'unknown'
          },
          sessionId: act.session_id || 'unknown'
        }
      })
      
      // Add purchase events from orders
      orders.forEach((order: any) => {
        events.push({
          id: `order_${order.id}`,
          customerId: String(customer.id),
          customerName: customer.name,
          eventType: 'purchase',
          eventName: 'Order Completed',
          timestamp: order.created_at,
          details: {
            value: parseFloat(order.total || 0),
            product: `Order #${order.id}`,
            orderId: order.id
          },
          sessionId: 'order'
        })
      })
      
      // Sort events by timestamp
      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      
      // Calculate stats
      const firstSeen = events.length > 0 ? events[0].timestamp : customer.created_at
      const lastSeen = events.length > 0 ? events[events.length - 1].timestamp : customer.created_at
      const totalValue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.total || 0), 0)
      
      // Determine status
      const daysSinceLastSeen = (new Date().getTime() - new Date(lastSeen).getTime()) / (1000 * 60 * 60 * 24)
      let status: 'active' | 'inactive' | 'at-risk' | 'churned' = 'active'
      if (daysSinceLastSeen > 90) status = 'churned'
      else if (daysSinceLastSeen > 60) status = 'at-risk'
      else if (daysSinceLastSeen > 30) status = 'inactive'
      
      // Calculate touchpoints
      const touchpoints = {
        website: activities.filter((a: any) => a.activity_type === 'page_view').length,
        email: 0, // Can be added if email tracking exists
        sms: 0, // Can be added if SMS tracking exists
        push: 0, // Can be added if push tracking exists
        chat: activities.filter((a: any) => a.activity_type === 'chat' || a.activity_subtype === 'chat').length
      }
      
      return {
        customerId: String(customer.id),
        customerName: customer.name,
        email: customer.email,
        totalEvents: events.length,
        firstSeen,
        lastSeen,
        totalValue,
        status,
        events,
        touchpoints
      }
    }))
    
    sendSuccess(res, journeys)
  } catch (err) {
    console.error('Journey tracking error:', err)
    sendError(res, 500, 'Failed to fetch journey tracking data', err)
  }
})

// moved to routes/communications.ts: forms endpoints

// moved to routes/communications.ts: contact endpoints

// moved to routes/integrations.ts: google & social endpoints

// moved to routes/integrations.ts: settings & themes

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
// moved to routes/extended.ts: /api/invoice-settings/company-details

// moved to routes/extended.ts: /api/invoice-settings/company-details (PUT)

// Get all invoice settings
// moved to routes/extended.ts: /api/invoice-settings/all

// Save all invoice settings
// moved to routes/extended.ts: /api/invoice-settings/all (PUT)

// Invoice download endpoint with Arctic Blue gradient
// moved to routes/extended.ts: /api/invoices/:id/download

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

// (removed duplicate mock loyalty-program route)

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

// Update product GST rate
app.patch('/api/products/:id/gst', async (req, res) => {
  try {
    const { id } = req.params
    const { gstRate } = req.body
    
    if (gstRate === undefined || gstRate === null) {
      return sendError(res, 400, 'GST rate is required')
    }
    
    // Validate GST rate (should be between 0 and 100 for percentage)
    const rate = parseFloat(gstRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return sendError(res, 400, 'GST rate must be between 0 and 100')
    }
    
    // Get current product details
    const { rows: productRows } = await pool.query('SELECT details FROM products WHERE id = $1', [id])
    
    if (productRows.length === 0) {
      return sendError(res, 404, 'Product not found')
    }
    
    // Update details JSONB field to include GST rate
    const currentDetails = productRows[0].details || {}
    const updatedDetails = {
      ...currentDetails,
      gst: rate.toString(),
      gstPercent: rate.toString(),
      'GST %': rate.toString()
    }
    
    // Update product with new GST rate
    const { rows } = await pool.query(
      'UPDATE products SET details = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [JSON.stringify(updatedDetails), id]
    )
    
    sendSuccess(res, rows[0])
  } catch (err) {
    sendError(res, 500, 'Failed to update product GST rate', err)
  }
})

// Bulk update product GST rates
app.post('/api/products/bulk-update-gst', async (req, res) => {
  try {
    const { updates } = req.body // Array of { productId, gstRate }
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return sendError(res, 400, 'Updates array is required')
    }
    
    const results = []
    
    for (const update of updates) {
      const { productId, gstRate } = update
      
      if (!productId || gstRate === undefined || gstRate === null) {
        results.push({ productId, success: false, error: 'Missing productId or gstRate' })
        continue
      }
      
      const rate = parseFloat(gstRate)
      if (isNaN(rate) || rate < 0 || rate > 100) {
        results.push({ productId, success: false, error: 'Invalid GST rate' })
        continue
      }
      
      try {
        // Get current product details
        const { rows: productRows } = await pool.query('SELECT details FROM products WHERE id = $1', [productId])
        
        if (productRows.length === 0) {
          results.push({ productId, success: false, error: 'Product not found' })
          continue
        }
        
        const currentDetails = productRows[0].details || {}
        const updatedDetails = {
          ...currentDetails,
          gst: rate.toString(),
          gstPercent: rate.toString(),
          'GST %': rate.toString()
        }
        
        await pool.query(
          'UPDATE products SET details = $1, updated_at = NOW() WHERE id = $2',
          [JSON.stringify(updatedDetails), productId]
        )
        
        results.push({ productId, success: true })
      } catch (err: any) {
        results.push({ productId, success: false, error: err.message })
      }
    }
    
    sendSuccess(res, { results, updated: results.filter(r => r.success).length })
  } catch (err) {
    sendError(res, 500, 'Failed to bulk update product GST rates', err)
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
// moved to routes/extended.ts: /api/admin/notifications

// Get unread notification count
// moved to routes/extended.ts: /api/admin/notifications/unread-count

// Mark notification as read
// moved to routes/extended.ts: /api/admin/notifications/:id/read

// Mark all notifications as read
// moved to routes/extended.ts: /api/admin/notifications/read-all

// Delete notification
// moved to routes/extended.ts: /api/admin/notifications/:id (DELETE)

// moved to routes/liveChat.ts

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

let fbSyncLastRun: null | { time: number; result: any } = null

// Schedule Facebook stock/price sync hourly
cron.schedule('0 * * * *', async () => {
  try {
    console.log('[FB] Starting scheduled stock/price sync')
    const result = await facebookRoutes.syncStockPrice(pool, { body: {}, query: {} } as any, {
      json(data: any) { return data },
      status(_s: any) { return this },
      send(_d: any) { }, // dummy
      setHeader(..._args: any[]) { }
    } as any)
    fbSyncLastRun = { time: Date.now(), result }
    console.log('[FB] Stock/price sync complete')
  } catch (err) {
    fbSyncLastRun = { time: Date.now(), result: { error: (err as any)?.message || 'Failed' } }
    console.error('[FB] Scheduled sync failed:', err)
  }
})

app.get('/api/facebook/sync/last', (req, res) => {
  res.json({ lastRun: fbSyncLastRun?.time ? new Date(fbSyncLastRun.time).toISOString() : null, result: fbSyncLastRun?.result })
})

// ... existing code ...
cron.schedule('*/30 * * * *', async () => {
  try {
    const { rows } = await pool.query(`select pv.id as variant_id, pv.product_id, pv.sku, i.quantity, i.reserved, i.low_stock_threshold from product_variants pv join inventory i on i.variant_id = pv.id where (i.quantity - i.reserved) <= coalesce(i.low_stock_threshold, 0) order by (i.quantity - i.reserved) asc limit 20`)
    if (rows.length > 0) {
      const lines = rows.map((r: any)=>`${r.sku || r.variant_id}: qty=${r.quantity - r.reserved} (threshold=${r.low_stock_threshold||0})`).join('\n')
      try { await notificationRoutes.sendAlert(pool as any, { subject: 'Low Stock Alert', text: `Low stock detected for ${rows.length} variants:\n${lines}` }) } catch {}
    }
  } catch (err) {
    console.error('Low stock check failed', err)
  }
})
// ... existing code ...