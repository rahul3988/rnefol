import { Pool } from 'pg'
import { Request, Response } from 'express'
import { sendSuccess, sendError } from '../utils/apiHelpers'

// ==================== CASHBACK SYSTEM ====================

export const getCashbackWallet = async (pool: Pool, req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string || '0'
    
    // Get cashback wallet balance from orders (5% of total spent)
    const walletResult = await pool.query(`
      SELECT 
        COALESCE(SUM(total * 0.05), 0) as balance,
        COALESCE(SUM(total), 0) as total_spent
      FROM orders 
      WHERE customer_email = (
        SELECT email FROM users WHERE id = $1
      )
    `, [userId])
    
    const balance = walletResult.rows[0]?.balance || 0
    const totalSpent = walletResult.rows[0]?.total_spent || 0
    
    // Get recent transactions
    const transactionsResult = await pool.query(`
      SELECT * FROM cashback_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [userId])
    
    sendSuccess(res, {
      balance,
      totalSpent,
      transactions: transactionsResult.rows
    })
  } catch (err) {
    sendError(res, 500, 'Failed to fetch cashback wallet', err)
  }
}

export const getCashbackOffers = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM cashback_offers
      WHERE is_active = true
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch cashback offers', err)
  }
}

export const getCashbackTransactions = async (pool: Pool, req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string || '0'
    
    const { rows } = await pool.query(`
      SELECT * FROM cashback_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId])
    
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch cashback transactions', err)
  }
}

export const redeemCashback = async (pool: Pool, req: Request, res: Response) => {
  try {
    const userId = req.headers['user-id'] as string || '0'
    const { amount } = req.body
    
    if (!amount || amount <= 0) {
      return sendError(res, 400, 'Invalid amount')
    }
    
    // Get current balance
    const walletResult = await pool.query(`
      SELECT COALESCE(SUM(total * 0.05), 0) as balance
      FROM orders 
      WHERE customer_email = (
        SELECT email FROM users WHERE id = $1
      )
    `, [userId])
    
    const balance = walletResult.rows[0]?.balance || 0
    
    if (amount > balance) {
      return sendError(res, 400, 'Insufficient cashback balance')
    }
    
    // Create transaction record
    const { rows } = await pool.query(`
      INSERT INTO cashback_transactions (user_id, amount, transaction_type, status)
      VALUES ($1, $2, 'redeem', 'pending')
      RETURNING *
    `, [userId, amount])
    
    sendSuccess(res, rows[0], 201)
  } catch (err) {
    sendError(res, 500, 'Failed to redeem cashback', err)
  }
}

// ==================== EMAIL MARKETING ====================

export const getEmailCampaigns = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM email_campaigns
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch email campaigns', err)
  }
}

export const updateEmailCampaign = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { id } = req.params
    const body = req.body
    
    const { rows } = await pool.query(`
      UPDATE email_campaigns 
      SET ${Object.keys(body).map((key, i) => `${key} = $${i + 2}`).join(', ')}
      WHERE id = $1
      RETURNING *
    `, [id, ...Object.values(body)])
    
    if (rows.length === 0) {
      return sendError(res, 404, 'Campaign not found')
    }
    
    sendSuccess(res, rows[0])
  } catch (err) {
    sendError(res, 500, 'Failed to update email campaign', err)
  }
}

export const deleteEmailCampaign = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const { rows } = await pool.query(`
      DELETE FROM email_campaigns
      WHERE id = $1
      RETURNING *
    `, [id])
    
    if (rows.length === 0) {
      return sendError(res, 404, 'Campaign not found')
    }
    
    sendSuccess(res, { message: 'Campaign deleted successfully' })
  } catch (err) {
    sendError(res, 500, 'Failed to delete email campaign', err)
  }
}

export const getEmailTemplates = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM email_templates
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch email templates', err)
  }
}

export const getEmailAutomations = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM email_automations
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch email automations', err)
  }
}

export const createEmailAutomation = async (pool: Pool, req: Request, res: Response) => {
  try {
    const body = req.body
    const { name, trigger, condition, action, is_active } = body
    
    const { rows } = await pool.query(`
      INSERT INTO email_automations (name, trigger, condition, action, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, trigger, condition, action, is_active || false])
    
    sendSuccess(res, rows[0], 201)
  } catch (err) {
    sendError(res, 500, 'Failed to create email automation', err)
  }
}

export const updateEmailAutomation = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { id } = req.params
    const body = req.body
    
    const { rows } = await pool.query(`
      UPDATE email_automations
      SET ${Object.keys(body).map((key, i) => `${key} = $${i + 2}`).join(', ')}
      WHERE id = $1
      RETURNING *
    `, [id, ...Object.values(body)])
    
    if (rows.length === 0) {
      return sendError(res, 404, 'Automation not found')
    }
    
    sendSuccess(res, rows[0])
  } catch (err) {
    sendError(res, 500, 'Failed to update email automation', err)
  }
}

// ==================== SMS MARKETING ====================

export const getSMSCampaigns = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM sms_campaigns
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch SMS campaigns', err)
  }
}

export const createSMSCampaign = async (pool: Pool, req: Request, res: Response) => {
  try {
    const body = req.body
    const { name, message, audience, scheduled_date } = body
    
    const { rows } = await pool.query(`
      INSERT INTO sms_campaigns (name, message, audience, scheduled_date, status)
      VALUES ($1, $2, $3, $4, 'draft')
      RETURNING *
    `, [name, message, audience, scheduled_date])
    
    sendSuccess(res, rows[0], 201)
  } catch (err) {
    sendError(res, 500, 'Failed to create SMS campaign', err)
  }
}

export const updateSMSCampaign = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { id } = req.params
    const body = req.body
    
    const { rows } = await pool.query(`
      UPDATE sms_campaigns
      SET ${Object.keys(body).map((key, i) => `${key} = $${i + 2}`).join(', ')}
      WHERE id = $1
      RETURNING *
    `, [id, ...Object.values(body)])
    
    if (rows.length === 0) {
      return sendError(res, 404, 'Campaign not found')
    }
    
    sendSuccess(res, rows[0])
  } catch (err) {
    sendError(res, 500, 'Failed to update SMS campaign', err)
  }
}

export const deleteSMSCampaign = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const { rows } = await pool.query(`
      DELETE FROM sms_campaigns
      WHERE id = $1
      RETURNING *
    `, [id])
    
    if (rows.length === 0) {
      return sendError(res, 404, 'Campaign not found')
    }
    
    sendSuccess(res, { message: 'Campaign deleted successfully' })
  } catch (err) {
    sendError(res, 500, 'Failed to delete SMS campaign', err)
  }
}

export const getSMSTemplates = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM sms_templates
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch SMS templates', err)
  }
}

export const getSMSAutomations = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM sms_automations
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch SMS automations', err)
  }
}

export const createSMSAutomation = async (pool: Pool, req: Request, res: Response) => {
  try {
    const body = req.body
    const { name, trigger, condition, action, is_active } = body
    
    const { rows } = await pool.query(`
      INSERT INTO sms_automations (name, trigger, condition, action, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, trigger, condition, action, is_active || false])
    
    sendSuccess(res, rows[0], 201)
  } catch (err) {
    sendError(res, 500, 'Failed to create SMS automation', err)
  }
}

export const updateSMSAutomation = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { id } = req.params
    const body = req.body
    
    const { rows } = await pool.query(`
      UPDATE sms_automations
      SET ${Object.keys(body).map((key, i) => `${key} = $${i + 2}`).join(', ')}
      WHERE id = $1
      RETURNING *
    `, [id, ...Object.values(body)])
    
    if (rows.length === 0) {
      return sendError(res, 404, 'Automation not found')
    }
    
    sendSuccess(res, rows[0])
  } catch (err) {
    sendError(res, 500, 'Failed to update SMS automation', err)
  }
}

// ==================== PUSH NOTIFICATIONS ====================

export const getPushNotifications = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM push_notifications
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch push notifications', err)
  }
}

export const getPushTemplates = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM push_templates
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch push templates', err)
  }
}

export const getPushAutomations = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM push_automations
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch push automations', err)
  }
}

// ==================== WHATSAPP CHAT ====================

export const getWhatsAppChats = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM whatsapp_chat_sessions
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch WhatsApp chats', err)
  }
}

export const getWhatsAppTemplates = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM whatsapp_templates
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch WhatsApp templates', err)
  }
}

export const getWhatsAppAutomations = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM whatsapp_automations
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch WhatsApp automations', err)
  }
}

// Send WhatsApp message via Facebook Graph API
export const sendWhatsAppMessage = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { to, template, message } = req.body
    
    // Get WhatsApp credentials from environment
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    
    if (!accessToken || !phoneNumberId) {
      return sendError(res, 400, 'WhatsApp credentials not configured')
    }
    
    if (!to) {
      return sendError(res, 400, 'Recipient phone number is required')
    }
    
    // Prepare the request body
    let requestBody: any
    
    // If template is provided, use template message format
    if (template && template.name) {
      requestBody = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: template.name,
          language: {
            code: template.language || 'en_US'
          }
        }
      }
    } else if (message) {
      // Use text message
      requestBody = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      }
    } else {
      return sendError(res, 400, 'Either template or message is required')
    }
    
    // Make request to Facebook Graph API
    const facebookUrl = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`
    
    const response = await fetch(facebookUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    const responseData = await response.json() as any
    
    if (!response.ok) {
      console.error('WhatsApp API error:', responseData)
      return sendError(res, response.status, responseData.error?.message || 'Failed to send WhatsApp message', responseData)
    }
    
    // Log the message to database if chat_sessions table exists
    try {
      await pool.query(`
        INSERT INTO whatsapp_chat_sessions (customer_name, customer_phone, last_message, last_message_time, status)
        VALUES ($1, $2, $3, NOW(), 'active')
      `, [`Customer_${to}`, to, message || JSON.stringify(template)])
    } catch (dbErr) {
      console.error('Failed to log WhatsApp message:', dbErr)
    }
    
    sendSuccess(res, {
      message: 'WhatsApp message sent successfully',
      whatsappResponse: responseData
    })
  } catch (err) {
    console.error('WhatsApp send error:', err)
    sendError(res, 500, 'Failed to send WhatsApp message', err)
  }
}

// ==================== WHATSAPP CONFIGURATION ====================

export const getWhatsAppConfig = async (pool: Pool, req: Request, res: Response) => {
  try {
    const config = {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      webhookUrl: process.env.WHATSAPP_WEBHOOK_URL || '',
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || ''
    }
    sendSuccess(res, config)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch WhatsApp config', err)
  }
}

export const saveWhatsAppConfig = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { accessToken, phoneNumberId, businessAccountId, webhookUrl, verifyToken } = req.body
    
    // In production, you would save these to a secure configuration store
    // For now, we'll just validate and return success
    // You should update the .env file or use a secure config management system
    
    if (!accessToken || !phoneNumberId) {
      return sendError(res, 400, 'Access token and phone number ID are required')
    }
    
    // Store in database for persistence
    await pool.query(`
      INSERT INTO whatsapp_config (access_token, phone_number_id, business_account_id, webhook_url, verify_token, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (id) DO UPDATE SET
        access_token = $1,
        phone_number_id = $2,
        business_account_id = $3,
        webhook_url = $4,
        verify_token = $5,
        updated_at = NOW()
    `, [accessToken, phoneNumberId, businessAccountId || null, webhookUrl || null, verifyToken || null])
    
    sendSuccess(res, { message: 'Configuration saved successfully' })
  } catch (err) {
    sendError(res, 500, 'Failed to save WhatsApp config', err)
  }
}

export const createWhatsAppTemplate = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { name, content, category, language } = req.body
    
    if (!name || !content) {
      return sendError(res, 400, 'Name and content are required')
    }
    
    const { rows } = await pool.query(`
      INSERT INTO whatsapp_templates (name, category, content, is_approved, created_at)
      VALUES ($1, $2, $3, false, NOW())
      RETURNING *
    `, [name, category || 'Custom', content])
    
    sendSuccess(res, rows[0], 201)
  } catch (err) {
    sendError(res, 500, 'Failed to create template', err)
  }
}

export const createWhatsAppAutomation = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { name, trigger, action, template } = req.body
    
    if (!name || !trigger) {
      return sendError(res, 400, 'Name and trigger are required')
    }
    
    const { rows } = await pool.query(`
      INSERT INTO whatsapp_automations (name, trigger, condition, action, is_active, created_at)
      VALUES ($1, $2, $3, $4, false, NOW())
      RETURNING *
    `, [name, trigger, 'Always', action || 'Send WhatsApp Message'])
    
    sendSuccess(res, rows[0], 201)
  } catch (err) {
    sendError(res, 500, 'Failed to create automation', err)
  }
}

// ==================== LIVE CHAT ====================

export const getLiveChatSessions = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        s.*,
        COALESCE(NULLIF(s.customer_name, ''), NULLIF(u.name, ''), 'User') as customer_name,
        COALESCE(NULLIF(s.customer_email, ''), NULLIF(u.email, ''), '') as customer_email
      FROM live_chat_sessions s
      LEFT JOIN users u ON s.user_id::text = u.id::text
      ORDER BY s.last_message_time DESC NULLS LAST, s.created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch live chat sessions', err)
  }
}

export const getLiveChatAgents = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM live_chat_agents
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch live chat agents', err)
  }
}

export const getLiveChatWidgets = async (pool: Pool, req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM live_chat_widgets
      ORDER BY created_at DESC
    `)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch live chat widgets', err)
  }
}

