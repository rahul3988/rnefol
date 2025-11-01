// Newsletter & WhatsApp Subscription API
import { Request, Response } from 'express'
import { Pool } from 'pg'
import { sendError, sendSuccess, validateRequired } from '../utils/apiHelpers'
import crypto from 'crypto'

// Subscribe to newsletter
export async function subscribeNewsletter(pool: Pool, req: Request, res: Response) {
  try {
    const { email, name, source, metadata } = req.body

    const validationError = validateRequired(req.body, ['email'])
    if (validationError) {
      return sendError(res, 400, validationError)
    }

    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Check if already subscribed
    const existing = await pool.query(
      'SELECT * FROM newsletter_subscriptions WHERE email = $1',
      [email]
    )

    if (existing.rows.length > 0) {
      const subscription = existing.rows[0]
      
      if (subscription.is_active) {
        return sendError(res, 400, 'Email already subscribed to newsletter')
      } else {
        // Reactivate subscription
        await pool.query(`
          UPDATE newsletter_subscriptions
          SET is_active = true,
              subscribed_at = NOW(),
              unsubscribed_at = NULL,
              verification_token = $1,
              name = COALESCE($2, name),
              source = COALESCE($3, source)
          WHERE email = $4
        `, [verificationToken, name, source, email])
      }
    } else {
      // New subscription
      await pool.query(`
        INSERT INTO newsletter_subscriptions (email, name, source, metadata, verification_token)
        VALUES ($1, $2, $3, $4, $5)
      `, [email, name, source || 'website', metadata || {}, verificationToken])
    }

    // TODO: Send verification email here

    sendSuccess(res, { 
      message: 'Successfully subscribed to newsletter',
      verificationToken // In production, don't send this
    })
  } catch (err: any) {
    console.error('Error subscribing to newsletter:', err)
    sendError(res, 500, 'Failed to subscribe to newsletter', err)
  }
}

// Unsubscribe from newsletter
export async function unsubscribeNewsletter(pool: Pool, req: Request, res: Response) {
  try {
    const { email, token } = req.body

    const validationError = validateRequired(req.body, ['email'])
    if (validationError) {
      return sendError(res, 400, validationError)
    }

    let query = 'UPDATE newsletter_subscriptions SET is_active = false, unsubscribed_at = NOW() WHERE email = $1'
    const params: any[] = [email]

    if (token) {
      query += ' AND verification_token = $2'
      params.push(token)
    }

    const { rowCount } = await pool.query(query, params)

    if (rowCount === 0) {
      return sendError(res, 404, 'Subscription not found')
    }

    sendSuccess(res, { message: 'Successfully unsubscribed from newsletter' })
  } catch (err: any) {
    console.error('Error unsubscribing from newsletter:', err)
    sendError(res, 500, 'Failed to unsubscribe from newsletter', err)
  }
}

// Subscribe to WhatsApp
export async function subscribeWhatsApp(pool: Pool, req: Request, res: Response) {
  try {
    const { phone, name, source, metadata } = req.body

    const validationError = validateRequired(req.body, ['phone'])
    if (validationError) {
      return sendError(res, 400, validationError)
    }

    // Normalize phone number (remove spaces, +, etc.)
    const normalizedPhone = phone.replace(/[\s+\-()]/g, '')

    // Check if already subscribed
    const existing = await pool.query(
      'SELECT * FROM whatsapp_subscriptions WHERE phone = $1',
      [normalizedPhone]
    )

    if (existing.rows.length > 0) {
      const subscription = existing.rows[0]
      
      if (subscription.is_active) {
        return sendSuccess(res, { 
          message: 'Already subscribed to WhatsApp updates',
          subscribed: true
        })
      } else {
        // Reactivate subscription
        await pool.query(`
          UPDATE whatsapp_subscriptions
          SET is_active = true,
              subscribed_at = NOW(),
              unsubscribed_at = NULL,
              name = COALESCE($1, name),
              source = COALESCE($2, source)
          WHERE phone = $3
        `, [name, source, normalizedPhone])
      }
    } else {
      // New subscription
      await pool.query(`
        INSERT INTO whatsapp_subscriptions (phone, name, source, metadata)
        VALUES ($1, $2, $3, $4)
      `, [normalizedPhone, name, source || 'popup', metadata || {}])
    }

    // Get the subscription details for notification
    const { rows: subscriptionRows } = await pool.query(
      'SELECT * FROM whatsapp_subscriptions WHERE phone = $1',
      [normalizedPhone]
    )
    const subscription = subscriptionRows[0]

    // Emit real-time notification to admin panel via Socket.IO
    const io = (req as any).io
    if (io) {
      io.to('admin-panel').emit('update', {
        type: 'whatsapp-subscription',
        data: {
          subscription: {
            id: subscription.id,
            phone: subscription.phone,
            name: subscription.name,
            source: subscription.source,
            subscribed_at: subscription.subscribed_at
          },
          message: `New WhatsApp subscription: ${normalizedPhone}`
        }
      })
      console.log('📱 Emitted WhatsApp subscription notification to admin panel')
    }

    // TODO: Send welcome WhatsApp message here

    sendSuccess(res, { 
      message: 'Successfully subscribed to WhatsApp updates',
      subscribed: true
    })
  } catch (err: any) {
    console.error('Error subscribing to WhatsApp:', err)
    sendError(res, 500, 'Failed to subscribe to WhatsApp', err)
  }
}

// Unsubscribe from WhatsApp
export async function unsubscribeWhatsApp(pool: Pool, req: Request, res: Response) {
  try {
    const { phone } = req.body

    const validationError = validateRequired(req.body, ['phone'])
    if (validationError) {
      return sendError(res, 400, validationError)
    }

    const normalizedPhone = phone.replace(/[\s+\-()]/g, '')

    const { rowCount } = await pool.query(
      'UPDATE whatsapp_subscriptions SET is_active = false, unsubscribed_at = NOW() WHERE phone = $1',
      [normalizedPhone]
    )

    if (rowCount === 0) {
      return sendError(res, 404, 'Subscription not found')
    }

    sendSuccess(res, { message: 'Successfully unsubscribed from WhatsApp updates' })
  } catch (err: any) {
    console.error('Error unsubscribing from WhatsApp:', err)
    sendError(res, 500, 'Failed to unsubscribe from WhatsApp', err)
  }
}

// Get WhatsApp subscriptions (admin only)
export async function getWhatsAppSubscriptions(pool: Pool, req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const offset = (page - 1) * limit
    const search = req.query.search as string

    let query = `
      SELECT id, phone, name, source, subscribed_at, unsubscribed_at, is_active, metadata
      FROM whatsapp_subscriptions
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (search) {
      query += ` AND (phone LIKE $${paramIndex} OR name LIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    query += ` ORDER BY subscribed_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const { rows } = await pool.query(query, params)

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM whatsapp_subscriptions WHERE 1=1'
    const countParams: any[] = []
    if (search) {
      countQuery += ` AND (phone LIKE $1 OR name LIKE $1)`
      countParams.push(`%${search}%`)
    }
    const { rows: countRows } = await pool.query(countQuery, countParams)
    const total = parseInt(countRows[0].total)

    sendSuccess(res, {
      subscriptions: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (err: any) {
    console.error('Error fetching WhatsApp subscriptions:', err)
    sendError(res, 500, 'Failed to fetch WhatsApp subscriptions', err)
  }
}

// Get WhatsApp subscription stats (admin only)
export async function getWhatsAppStats(pool: Pool, req: Request, res: Response) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true) as active_subscribers,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_subscribers,
        COUNT(*) as total_subscribers,
        COUNT(*) FILTER (WHERE subscribed_at > NOW() - INTERVAL '7 days') as new_last_7_days,
        COUNT(*) FILTER (WHERE subscribed_at > NOW() - INTERVAL '30 days') as new_last_30_days,
        COUNT(*) FILTER (WHERE subscribed_at > NOW() - INTERVAL '24 hours') as new_last_24_hours
      FROM whatsapp_subscriptions
    `)

    sendSuccess(res, rows[0])
  } catch (err: any) {
    console.error('Error fetching WhatsApp stats:', err)
    sendError(res, 500, 'Failed to fetch WhatsApp stats', err)
  }
}

// Get newsletter stats (admin only)
export async function getNewsletterStats(pool: Pool, req: Request, res: Response) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true) as active_subscribers,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_subscribers,
        COUNT(*) as total_subscribers,
        COUNT(*) FILTER (WHERE subscribed_at > NOW() - INTERVAL '7 days') as new_last_7_days,
        COUNT(*) FILTER (WHERE subscribed_at > NOW() - INTERVAL '30 days') as new_last_30_days
      FROM newsletter_subscriptions
    `)

    sendSuccess(res, rows[0])
  } catch (err: any) {
    console.error('Error fetching newsletter stats:', err)
    sendError(res, 500, 'Failed to fetch newsletter stats', err)
  }
}

