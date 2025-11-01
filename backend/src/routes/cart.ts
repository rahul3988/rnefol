// Optimized Cart and Authentication APIs
import { Request, Response } from 'express'
import { Pool } from 'pg'
import { sendError, sendSuccess, validateRequired } from '../utils/apiHelpers'
import { logUserActivity } from '../utils/userActivitySchema'

// Optimized GET /api/cart
export async function getCart(pool: Pool, req: Request, res: Response) {
  try {
    const userId = req.userId // Set by authenticateToken middleware
    
    const { rows } = await pool.query(`
      SELECT c.*, p.title, p.price, p.list_image, p.slug, p.details, p.category
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `, [userId])
    
    // Transform the data to match frontend expectations
    const transformedRows = rows.map((row: any) => {
      const details = row.details || {}
      let finalPrice = row.price
      
      // Use discounted price if available
      if (details.mrp && details.websitePrice) {
        finalPrice = details.websitePrice
      }
      
      // Ensure MRP is properly extracted and converted to string
      const mrpValue = details.mrp || null
      
      return {
        id: row.id,
        product_id: row.product_id,
        slug: row.slug,
        title: row.title,
        price: String(finalPrice), // Convert to string as frontend expects (this is websitePrice)
        image: row.list_image, // Rename list_image to image
        quantity: row.quantity,
        category: row.category,
        mrp: mrpValue ? String(mrpValue) : null, // Ensure MRP is string and not null if exists
        discounted_price: details.websitePrice ? String(details.websitePrice) : null,
        original_price: String(row.price),
        details: details, // Include full details object for frontend access
        csvProduct: details,
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    })
    
    sendSuccess(res, transformedRows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch cart', err)
  }
}

// Optimized POST /api/cart
export async function addToCart(pool: Pool, req: Request, res: Response) {
  try {
    const userId = req.userId
    const { product_id, quantity = 1 } = req.body
    
    // Validate required fields
    const validationError = validateRequired(req.body, ['product_id'])
    if (validationError) {
      return sendError(res, 400, validationError)
    }
    
    // Check if product exists
    const productCheck = await pool.query('SELECT id FROM products WHERE id = $1', [product_id])
    if (productCheck.rows.length === 0) {
      return sendError(res, 404, 'Product not found')
    }
    
    // Check if item already exists in cart
    const existingItem = await pool.query(
      'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2',
      [userId, product_id]
    )
    
    if (existingItem.rows.length > 0) {
      // Update quantity
      const { rows } = await pool.query(`
        UPDATE cart 
        SET quantity = quantity + $1, updated_at = NOW()
        WHERE user_id = $2 AND product_id = $3
        RETURNING *
      `, [quantity, userId, product_id])
      
      sendSuccess(res, rows[0])
    } else {
      // Add new item
      const { rows } = await pool.query(`
        INSERT INTO cart (user_id, product_id, quantity)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [userId, product_id, quantity])
      
      sendSuccess(res, rows[0], 201)
    }
    // Log cart activity
    const productData = await pool.query('SELECT title, price FROM products WHERE id = $1', [product_id])
    if (productData.rows.length > 0) {
      await logUserActivity(pool, {
        user_id: parseInt(userId as string),
        activity_type: 'cart',
        activity_subtype: 'add',
        product_id,
        product_name: productData.rows[0].title,
        product_price: productData.rows[0].price,
        quantity,
        user_agent: req.headers['user-agent'],
        ip_address: req.ip || req.connection.remoteAddress
      })
    }
  } catch (err) {
    sendError(res, 500, 'Failed to add to cart', err)
  }
}

// Optimized PUT /api/cart/:cartItemId
export async function updateCartItem(pool: Pool, req: Request, res: Response) {
  try {
    const { cartItemId } = req.params
    const { quantity } = req.body
    const userId = req.userId
    
    if (quantity === undefined || quantity < 0) {
      return sendError(res, 400, 'Valid quantity is required')
    }
    
    if (quantity === 0) {
      // Remove item from cart
      const { rows } = await pool.query(`
        DELETE FROM cart 
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `, [cartItemId, userId])
      
      if (rows.length === 0) {
        return sendError(res, 404, 'Cart item not found')
      }
      
      sendSuccess(res, { message: 'Item removed from cart' })
    } else {
      // Update quantity
      const { rows } = await pool.query(`
        UPDATE cart 
        SET quantity = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3
        RETURNING *
      `, [quantity, cartItemId, userId])
      
      if (rows.length === 0) {
        return sendError(res, 404, 'Cart item not found')
      }
      
      sendSuccess(res, rows[0])
    }
  } catch (err) {
    sendError(res, 500, 'Failed to update cart item', err)
  }
}

// Optimized DELETE /api/cart/:cartItemId
export async function removeFromCart(pool: Pool, req: Request, res: Response) {
  try {
    const { cartItemId } = req.params
    const userId = req.userId
    
    // Get item details before deletion for logging
    const itemData = await pool.query(`
      SELECT c.*, p.title, p.price 
      FROM cart c 
      JOIN products p ON c.product_id = p.id
      WHERE c.id = $1 AND c.user_id = $2
    `, [cartItemId, userId])
    
    const { rows } = await pool.query(`
      DELETE FROM cart 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [cartItemId, userId])
    
    if (rows.length === 0) {
      return sendError(res, 404, 'Cart item not found')
    }
    
    sendSuccess(res, { message: 'Item removed from cart' })
    
    // Log cart removal activity
    if (itemData.rows.length > 0) {
      await logUserActivity(pool, {
        user_id: parseInt(userId as string),
        activity_type: 'cart',
        activity_subtype: 'remove',
        product_id: itemData.rows[0].product_id,
        product_name: itemData.rows[0].title,
        product_price: itemData.rows[0].price,
        quantity: itemData.rows[0].quantity,
        user_agent: req.headers['user-agent'],
        ip_address: req.ip || req.connection.remoteAddress
      })
    }
  } catch (err) {
    sendError(res, 500, 'Failed to remove cart item', err)
  }
}

// Clear entire cart
export async function clearCart(pool: Pool, req: Request, res: Response) {
  try {
    const userId = req.userId
    
    const { rows } = await pool.query(`
      DELETE FROM cart 
      WHERE user_id = $1
      RETURNING *
    `, [userId])
    
    sendSuccess(res, { message: 'Cart cleared successfully', removedItems: rows.length })
  } catch (err) {
    sendError(res, 500, 'Failed to clear cart', err)
  }
}

// Optimized authentication endpoints
export async function login(pool: Pool, req: Request, res: Response) {
  try {
    const { email, password } = req.body
    
    // Validate required fields
    const validationError = validateRequired(req.body, ['email', 'password'])
    if (validationError) {
      return sendError(res, 400, validationError)
    }
    
    // Find user by email
    const { rows } = await pool.query(
      'SELECT id, name, email, password FROM users WHERE email = $1',
      [email]
    )
    
    if (rows.length === 0) {
      return sendError(res, 401, 'Invalid credentials')
    }
    
    const user = rows[0]
    
    // Simple password check (in production, use bcrypt)
    if (user.password !== password) {
      return sendError(res, 401, 'Invalid credentials')
    }
    
    // Generate token
    const token = `user_token_${user.id}_${Date.now()}`
    
    // Update last login
    await pool.query(
      'UPDATE users SET updated_at = NOW() WHERE id = $1',
      [user.id]
    )
    
    sendSuccess(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
    
    // Log login activity
    await logUserActivity(pool, {
      user_id: user.id,
      activity_type: 'auth',
      activity_subtype: 'login',
      user_agent: req.headers['user-agent'],
      ip_address: req.ip || req.connection.remoteAddress
    })
  } catch (err) {
    sendError(res, 500, 'Login failed', err)
  }
}

export async function register(pool: Pool, req: Request, res: Response) {
  try {
    const { name, email, password, phone } = req.body
    
    console.log('🔍 User registration attempt:', { name, email, phone })
    
    // Validate required fields
    const validationError = validateRequired(req.body, ['name', 'email', 'password'])
    if (validationError) {
      console.log('❌ Validation error:', validationError)
      return sendError(res, 400, validationError)
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )
    
    if (existingUser.rows.length > 0) {
      console.log('❌ User already exists:', email)
      return sendError(res, 409, 'User already exists')
    }
    
    console.log('✅ Creating new user...')
    
    // Create new user
    const { rows } = await pool.query(`
      INSERT INTO users (name, email, password, phone)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, phone, created_at
    `, [name, email, password, phone])
    
    const user = rows[0]
    const token = `user_token_${user.id}_${Date.now()}`
    
    console.log('✅ User created successfully:', user.email)
    
    sendSuccess(res, {
      token,
      user
    }, 201)
    
    // Log registration activity
    await logUserActivity(pool, {
      user_id: user.id,
      activity_type: 'auth',
      activity_subtype: 'register',
      user_agent: req.headers['user-agent'],
      ip_address: req.ip || req.connection.remoteAddress
    })
  } catch (err: any) {
    console.error('❌ Registration error:', err)
    if (err?.code === '23505') {
      sendError(res, 409, 'User already exists')
    } else {
      sendError(res, 500, 'Registration failed', err)
    }
  }
}

// Optimized user profile endpoints
export async function getUserProfile(pool: Pool, req: Request, res: Response) {
  try {
    const userId = req.userId
    
    console.log('🔍 Getting user profile for userId:', userId)
    
    const { rows } = await pool.query(`
      SELECT id, name, email, phone, address, profile_photo, 
             loyalty_points, total_orders, member_since, is_verified
      FROM users 
      WHERE id = $1
    `, [userId])
    
    console.log('📊 User profile query result:', rows.length, 'rows')
    
    if (rows.length === 0) {
      console.log('❌ User not found for ID:', userId)
      return sendError(res, 404, 'User not found')
    }
    
    console.log('✅ User profile found:', rows[0].email)
    sendSuccess(res, rows[0])
  } catch (err) {
    console.error('❌ Error fetching user profile:', err)
    sendError(res, 500, 'Failed to fetch user profile', err)
  }
}

export async function updateUserProfile(pool: Pool, req: Request, res: Response) {
  try {
    const userId = req.userId
    const { name, phone, address, profile_photo } = req.body
    
    const updates: Record<string, any> = {}
    if (name !== undefined) updates.name = name
    if (phone !== undefined) updates.phone = phone
    if (address !== undefined) updates.address = JSON.stringify(address)
    if (profile_photo !== undefined) updates.profile_photo = profile_photo
    
    const fields = Object.keys(updates)
    if (fields.length === 0) {
      return sendError(res, 400, 'No fields to update')
    }
    
    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ')
    const values = [userId, ...fields.map(field => updates[field])]
    
    const { rows } = await pool.query(`
      UPDATE users 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, email, phone, address, profile_photo, 
                loyalty_points, total_orders, member_since, is_verified
    `, values)
    
    if (rows.length === 0) {
      return sendError(res, 404, 'User not found')
    }
    
    sendSuccess(res, rows[0])
  } catch (err) {
    sendError(res, 500, 'Failed to update user profile', err)
  }
}