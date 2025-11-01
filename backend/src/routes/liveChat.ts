import express from 'express'
import { Pool } from 'pg'
import { sendError, sendSuccess } from '../utils/apiHelpers'

export function registerLiveChatRoutes(app: express.Express, pool: Pool, io: any) {
  async function ensureLiveChatTables() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS live_chat_sessions (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        status TEXT DEFAULT 'active',
        priority TEXT DEFAULT 'low',
        assigned_agent TEXT,
        last_message TEXT,
        last_message_time TIMESTAMP,
        message_count INT DEFAULT 0,
        tags TEXT[],
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `)
    await pool.query(`ALTER TABLE live_chat_sessions ADD COLUMN IF NOT EXISTS user_id TEXT`)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS live_chat_messages (
        id SERIAL PRIMARY KEY,
        session_id INT NOT NULL REFERENCES live_chat_sessions(id) ON DELETE CASCADE,
        sender TEXT NOT NULL,
        sender_name TEXT,
        message TEXT,
        type TEXT DEFAULT 'text',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `)
  }

  app.post('/api/live-chat/sessions', async (req, res) => {
    try {
      await ensureLiveChatTables()
      const { userId, customerName, customerEmail, customerPhone } = req.body || {}
      if (!userId && !customerEmail && !customerPhone) return sendError(res, 400, 'userId, customerEmail, or customerPhone required')
      const findRes = await pool.query(`
        SELECT * FROM live_chat_sessions 
        WHERE (($1::text IS NOT NULL AND user_id = $1::text) OR ($2::text IS NOT NULL AND customer_email = $2::text) OR ($3::text IS NOT NULL AND customer_phone = $3::text))
        AND status IN ('active','waiting') ORDER BY created_at DESC LIMIT 1
      `, [userId ?? null, customerEmail ?? null, customerPhone ?? null])
      if (findRes.rows.length > 0) return sendSuccess(res, findRes.rows[0])
      
      // If user_id is provided but name/email are missing, try to get from users table
      let finalName = customerName
      let finalEmail = customerEmail
      if (userId && (!customerName || !customerEmail)) {
        try {
          const userRes = await pool.query(`SELECT name, email FROM users WHERE id::text = $1`, [userId])
          if (userRes.rows.length > 0) {
            finalName = customerName || userRes.rows[0].name || null
            finalEmail = customerEmail || userRes.rows[0].email || null
          }
        } catch (e) {
          console.error('Failed to fetch user data:', e)
        }
      }
      
      const insertRes = await pool.query(`
        INSERT INTO live_chat_sessions (user_id, customer_name, customer_email, customer_phone, status, priority)
        VALUES ($1,$2,$3,$4,'active','low') RETURNING *
      `, [userId || null, finalName || null, finalEmail || null, customerPhone || null])
      return sendSuccess(res, insertRes.rows[0], 201)
    } catch (err) { return sendError(res, 500, 'Failed to create live chat session', err) }
  })

  app.get('/api/live-chat/messages', async (req, res) => {
    try {
      await ensureLiveChatTables()
      const sessionId = req.query.sessionId as string
      if (!sessionId) return sendError(res, 400, 'sessionId is required')
      const { rows } = await pool.query(`
        SELECT id, session_id, sender, sender_name, message, type, is_read, created_at
        FROM live_chat_messages WHERE session_id = $1 ORDER BY created_at ASC
      `, [sessionId])
      return sendSuccess(res, rows)
    } catch (err) { return sendError(res, 500, 'Failed to fetch messages', err) }
  })

  app.post('/api/live-chat/messages', async (req, res) => {
    try {
      await ensureLiveChatTables()
      const { sessionId, sender, senderName, message, type } = req.body || {}
      if (!sessionId || !sender || !message) return sendError(res, 400, 'sessionId, sender, and message are required')
      const insert = await pool.query(`
        INSERT INTO live_chat_messages (session_id, sender, sender_name, message, type)
        VALUES ($1,$2,$3,$4,$5) RETURNING id, session_id, sender, sender_name, message, type, is_read, created_at
      `, [sessionId, sender, senderName || null, message, type || 'text'])
      const msg = insert.rows[0]
      
      // Update session: set last message and increment count, also update customer_name if missing and sender is customer
      if (sender === 'customer' && senderName) {
        // Try to update customer_name if it's missing, also try to get email from users table if user_id exists
        const sessionRes = await pool.query(`SELECT user_id FROM live_chat_sessions WHERE id = $1`, [sessionId])
        if (sessionRes.rows.length > 0) {
          const userId = sessionRes.rows[0].user_id
          if (userId) {
            // Try to get email from users table
            const userRes = await pool.query(`SELECT email, name FROM users WHERE id::text = $1`, [userId])
            if (userRes.rows.length > 0) {
              await pool.query(`
                UPDATE live_chat_sessions 
                SET last_message = $1, 
                    last_message_time = NOW(), 
                    message_count = COALESCE(message_count,0) + 1,
                    customer_name = COALESCE(NULLIF(customer_name, ''), $2, $3),
                    customer_email = COALESCE(NULLIF(customer_email, ''), $4)
                WHERE id = $5
              `, [message, senderName, userRes.rows[0].name, userRes.rows[0].email, sessionId])
            } else {
              await pool.query(`
                UPDATE live_chat_sessions 
                SET last_message = $1, 
                    last_message_time = NOW(), 
                    message_count = COALESCE(message_count,0) + 1,
                    customer_name = COALESCE(NULLIF(customer_name, ''), $2)
                WHERE id = $3
              `, [message, senderName, sessionId])
            }
          } else {
            await pool.query(`
              UPDATE live_chat_sessions 
              SET last_message = $1, 
                  last_message_time = NOW(), 
                  message_count = COALESCE(message_count,0) + 1,
                  customer_name = COALESCE(NULLIF(customer_name, ''), $2)
              WHERE id = $3
            `, [message, senderName, sessionId])
          }
        }
      } else {
        await pool.query(`
          UPDATE live_chat_sessions SET last_message = $1, last_message_time = NOW(), message_count = COALESCE(message_count,0) + 1 WHERE id = $2
        `, [message, sessionId])
      }
      
      io.to(`live-chat-session-${sessionId}`).emit('live-chat:message', msg)
      io.to('admin-panel').emit('live-chat:message', msg)
      return sendSuccess(res, msg, 201)
    } catch (err) { return sendError(res, 500, 'Failed to send message', err) }
  })
}


