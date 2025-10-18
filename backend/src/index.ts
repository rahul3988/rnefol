// Optimized main server file with centralized routes and utilities
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { Pool } from 'pg'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { ensureSchema } from './utils/schema'
import { authenticateToken, sendError, sendSuccess } from './utils/apiHelpers'
import * as productRoutes from './routes/products'
import * as cartRoutes from './routes/cart'
import createCMSRouter from './routes/cms'
import blogRouter from './routes/blog'
import { seedCMSContent } from './utils/seedCMS'
import { updateAllProductsWithPricing, addSampleProducts } from './utils/updateAllProducts'

const app = express()
app.use(express.json())

// Serve uploaded files
app.use('/uploads', express.static('uploads'))

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
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
app.use('/api/blog', blogRouter)

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

// ==================== OPTIMIZED USER PROFILE API ====================
app.get('/api/user/profile', authenticateToken, (req, res) => cartRoutes.getUserProfile(pool, req, res))
app.put('/api/user/profile', authenticateToken, (req, res) => cartRoutes.updateUserProfile(pool, req, res))

// Backward-compatible aliases for clients calling /api/users/profile
app.get('/api/users/profile', authenticateToken, (req, res) => cartRoutes.getUserProfile(pool, req, res))
app.put('/api/users/profile', authenticateToken, (req, res) => cartRoutes.updateUserProfile(pool, req, res))

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
          key_id: 'rzp_test_1234567890',
          key_secret: 'secret_key_here'
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
      SELECT w.*, p.title, p.price, p.list_image, p.slug
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
      payment_type
    } = req.body || {}
    
    if (!order_number || !customer_name || !customer_email || !shipping_address || !items || !total) {
      return sendError(res, 400, 'Missing required fields')
    }
    
    const { rows } = await pool.query(`
      INSERT INTO orders (order_number, customer_name, customer_email, shipping_address, items, subtotal, shipping, tax, total, payment_method, payment_type)
      VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [order_number, customer_name, customer_email, JSON.stringify(shipping_address), JSON.stringify(items), subtotal, shipping, tax, total, payment_method, payment_type])
    
    // Broadcast to admin
    broadcastUpdate('order_created', rows[0])
    
    // Broadcast to the specific user about their order
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      const tokenParts = token.split('_')
      if (tokenParts.length >= 3) {
        const userId = tokenParts[2]
        broadcastToUser(userId, 'order-update', {
          type: 'created',
          order: rows[0]
        })
      }
    }
    
    sendSuccess(res, rows[0], 201)
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

// Start server
const port = Number(process.env.PORT || 4000)
ensureSchema(pool)
  .then(async () => {
    // Seed CMS content
    await seedCMSContent(pool)
    
    // Update all products with pricing data
    await updateAllProductsWithPricing(pool)
    
    // Add sample products if none exist
    await addSampleProducts(pool)
    
    server.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Nefol API running on http://0.0.0.0:${port}`)
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