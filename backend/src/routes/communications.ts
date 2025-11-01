import express from 'express'
import { Pool } from 'pg'
import { sendError, sendSuccess } from '../utils/apiHelpers'

export function registerCommunicationsRoutes(app: express.Express, pool: Pool, io: any) {
  // Forms
  app.get('/api/forms', async (_req, res) => {
    try {
      const { rows } = await pool.query(`SELECT * FROM forms ORDER BY created_at DESC`)
      sendSuccess(res, rows)
    } catch (err) {
      sendError(res, 500, 'Failed to fetch forms', err)
    }
  })

  app.get('/api/forms/submissions', async (_req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT fs.*, f.name as form_name
        FROM form_submissions fs JOIN forms f ON fs.form_id = f.id
        ORDER BY fs.created_at DESC
      `)
      sendSuccess(res, rows)
    } catch (err) {
      sendError(res, 500, 'Failed to fetch form submissions', err)
    }
  })

  // Contact
  app.post('/api/contact/submit', async (req, res) => {
    try {
      const { name, email, phone, message } = req.body
      if (!name || !email || !message) return sendError(res, 400, 'Name, email and message are required')
      const { rows } = await pool.query(`
        INSERT INTO contact_messages (name, email, phone, message)
        VALUES ($1, $2, $3, $4) RETURNING *
      `, [name, email, phone || null, message])
      io.to('admin-panel').emit('update', { type: 'contact_message_created', data: rows[0] })
      try {
        await pool.query(`
          INSERT INTO admin_notifications (user_id, notification_type, title, message, link, icon, priority, metadata)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `, [null, 'contact', 'New Contact Message', `Message from ${name} (${email})`, `/admin/contact-messages`, '📧', 'medium', JSON.stringify({ message_id: rows[0].id, name, email })])
        io.to('admin-panel').emit('new-notification', { notification_type: 'contact' })
      } catch {}
      try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email])
        const userId = userResult.rows.length > 0 ? userResult.rows[0].id : null
        await pool.query(`
          INSERT INTO user_activities (user_id, activity_type, activity_subtype, form_type, form_data, page_url, user_agent, ip_address)
          VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8)
        `, [userId, 'form_submit', 'contact', 'Contact Form', JSON.stringify({ name, email, phone, message }), req.headers.referer || '/contact', req.headers['user-agent'], (req as any).ip || (req as any).connection?.remoteAddress])
      } catch {}
      sendSuccess(res, rows[0], 201)
    } catch (err) {
      sendError(res, 500, 'Failed to submit contact message', err)
    }
  })

  app.get('/api/contact/messages', async (req, res) => {
    try {
      const { status } = req.query as any
      let query = 'SELECT * FROM contact_messages'
      const values: any[] = []
      if (status) { query += ' WHERE status = $1'; values.push(status) }
      query += ' ORDER BY created_at DESC'
      const { rows } = await pool.query(query, values)
      sendSuccess(res, rows)
    } catch (err) {
      sendError(res, 500, 'Failed to fetch contact messages', err)
    }
  })

  app.put('/api/contact/messages/:id', async (req, res) => {
    try {
      const { id } = req.params as any
      const { status } = req.body || {}
      if (!status) return sendError(res, 400, 'Status is required')
      const { rows } = await pool.query(`
        UPDATE contact_messages SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *
      `, [status, id])
      if (rows.length === 0) return sendError(res, 404, 'Contact message not found')
      io.to('admin-panel').emit('update', { type: 'contact_message_updated', data: rows[0] })
      sendSuccess(res, rows[0])
    } catch (err) {
      sendError(res, 500, 'Failed to update contact message', err)
    }
  })
}


