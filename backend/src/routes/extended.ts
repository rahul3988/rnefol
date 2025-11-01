import express from 'express'
import { Pool } from 'pg'
import path from 'path'
import fs from 'fs'
import { Server as SocketIOServer } from 'socket.io'
import { sendError, sendSuccess } from '../utils/apiHelpers'

export function registerExtendedRoutes(app: express.Express, pool: Pool, io: SocketIOServer) {
  // ==================== CSV endpoints (FIXED PATH) ====================
  app.get('/api/products-csv', async (req, res) => {
    try {
      const csvPath = path.resolve(process.cwd(), '..', 'product description page.csv')

      if (!fs.existsSync(csvPath)) {
        return sendSuccess(res, [])
      }

      const raw = fs.readFileSync(csvPath, 'utf8')
      const lines = raw.split(/\r?\n/).filter((l: string) => l.trim().length > 0)
      if (lines.length === 0) {
        return sendSuccess(res, [])
      }

      const parseCSVLine = (line: string): string[] => {
        const result: string[] = []
        let current = ''
        let inQuotes = false
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++ } else { inQuotes = !inQuotes }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim()); current = ''
          } else { current += char }
        }
        result.push(current.trim())
        return result
      }

      const headers = parseCSVLine(lines[0])
      const rows: any[] = []
      for (let i = 1; i < lines.length; i++) {
        const parts = parseCSVLine(lines[i])
        if (parts.every(p => p.trim() === '')) continue
        const obj: any = {}
        for (let j = 0; j < headers.length; j++) obj[headers[j]] = (parts[j] ?? '').trim()
        rows.push(obj)
      }
      sendSuccess(res, rows)
    } catch (err) {
      sendError(res, 500, 'Failed to read products CSV', err)
    }
  })

  // CSV upload remains defined in index to reuse existing multer instance

  // ==================== Cashback, Coins & Withdrawals ====================
  app.get('/api/cashback/balance', async (req: any, res) => {
    try {
      const userId = req.userId
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

  app.get('/api/nefol-coins', async (req: any, res) => {
    try {
      const userId = req.userId
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

  app.get('/api/coin-transactions', async (req: any, res) => {
    try {
      const userId = req.userId
      const { limit = 50 } = req.query as any
      const { rows } = await pool.query(`
        SELECT 
          id, amount, type, description, status, order_id, withdrawal_id, metadata, created_at
        FROM coin_transactions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [userId, limit])
      sendSuccess(res, { data: rows })
    } catch (err) {
      sendError(res, 500, 'Failed to fetch coin transactions', err)
    }
  })

  app.get('/api/coin-withdrawals', async (req: any, res) => {
    try {
      const userId = req.userId
      const { rows } = await pool.query(`
        SELECT 
          id, amount, withdrawal_method, account_holder_name, account_number,
          ifsc_code, bank_name, upi_id, status, transaction_id, admin_notes,
          rejection_reason, created_at, processed_at
        FROM coin_withdrawals
        WHERE user_id = $1
        ORDER BY created_at DESC
      `, [userId])
      sendSuccess(res, rows)
    } catch (err) {
      sendError(res, 500, 'Failed to fetch withdrawal history', err)
    }
  })

  app.post('/api/coin-withdrawals', async (req: any, res) => {
    try {
      const userId = req.userId
      if (!userId) return sendError(res, 401, 'User ID not found')
      const { amount, withdrawal_method, account_holder_name, account_number, ifsc_code, bank_name, upi_id } = req.body
      if (!amount || amount <= 0) return sendError(res, 400, 'Valid amount is required')
      if (!withdrawal_method || !['bank','upi'].includes(withdrawal_method)) return sendError(res, 400, 'Valid withdrawal method is required')
      if (withdrawal_method === 'bank' && (!account_number || !ifsc_code || !bank_name)) return sendError(res, 400, 'Bank details are required for bank transfer')
      if (withdrawal_method === 'upi' && !upi_id) return sendError(res, 400, 'UPI ID is required for UPI transfer')
      if (!account_holder_name) return sendError(res, 400, 'Account holder name is required')

      const userResult = await pool.query(`SELECT loyalty_points FROM users WHERE id = $1`, [userId])
      const availableCoins = userResult.rows[0]?.loyalty_points || 0
      if (availableCoins < amount) return sendError(res, 400, 'Insufficient coins. You have ' + availableCoins + ' coins available.')

      const insertValues: any[] = [userId, amount, withdrawal_method, account_holder_name]
      if (withdrawal_method === 'bank') insertValues.push(account_number, ifsc_code, bank_name, null)
      else insertValues.push(null, null, null, upi_id)

      const { rows } = await pool.query(`
        INSERT INTO coin_withdrawals (
          user_id, amount, withdrawal_method, account_holder_name,
          account_number, ifsc_code, bank_name, upi_id, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
        RETURNING *
      `, insertValues)

      await pool.query(`UPDATE users SET loyalty_points = loyalty_points - $1 WHERE id = $2`, [amount, userId])
      await pool.query(`
        INSERT INTO coin_transactions (user_id, amount, type, description, status, order_id, withdrawal_id, metadata)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `, [userId, amount, 'withdrawal_pending', `Withdrawal requested via ${withdrawal_method === 'bank' ? 'Bank Transfer' : 'UPI'}`, 'pending', null, rows[0].id, null])

      sendSuccess(res, rows[0], 201)
    } catch (err) {
      sendError(res, 500, 'Failed to create withdrawal request', err)
    }
  })

  app.get('/api/admin/coin-withdrawals', async (req, res) => {
    try {
      const { status } = req.query as any
      let query = `
        SELECT w.*, u.name as user_name, u.email as user_email, u.phone as user_phone
        FROM coin_withdrawals w
        JOIN users u ON w.user_id = u.id
        WHERE 1=1
      `
      const values: any[] = []
      if (status) { query += ` AND w.status = $${values.length + 1}`; values.push(status) }
      query += ` ORDER BY w.created_at DESC`
      const { rows } = await pool.query(query, values)
      sendSuccess(res, rows)
    } catch (err) {
      sendError(res, 500, 'Failed to fetch withdrawal requests', err)
    }
  })

  app.put('/api/admin/coin-withdrawals/:id/process', async (req, res) => {
    try {
      const withdrawalId = req.params.id
      const { status, transaction_id, admin_notes, rejection_reason } = req.body
      if (!status || !['processing','completed','rejected','failed'].includes(status)) return sendError(res, 400, 'Valid status is required')

      const updateFields: string[] = []
      const values: any[] = []
      updateFields.push(`status = $${values.length + 1}`); values.push(status)
      if (transaction_id) { updateFields.push(`transaction_id = $${values.length + 1}`); values.push(transaction_id) }
      if (admin_notes) { updateFields.push(`admin_notes = $${values.length + 1}`); values.push(admin_notes) }
      if (rejection_reason) { updateFields.push(`rejection_reason = $${values.length + 1}`); values.push(rejection_reason) }
      if (['completed','rejected','failed'].includes(status)) { updateFields.push(`processed_at = NOW()`) }
      values.push(withdrawalId)

      const { rows } = await pool.query(`
        UPDATE coin_withdrawals
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING *
      `, values)
      if (rows.length === 0) return sendError(res, 404, 'Withdrawal request not found')
      if (['rejected','failed'].includes(status)) {
        await pool.query(`UPDATE users SET loyalty_points = loyalty_points + $1 WHERE id = $2`, [rows[0].amount, rows[0].user_id])
      }
      let transactionType = 'withdrawal_pending'
      if (status === 'processing') transactionType = 'withdrawal_processing'
      else if (status === 'completed') transactionType = 'withdrawal_completed'
      else if (status === 'rejected' || status === 'failed') transactionType = 'withdrawal_rejected'
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

  // ==================== Invoices (settings + download) ====================
  app.get('/api/invoice-settings/company-details', async (_req, res) => {
    try {
      const result = await pool.query(`SELECT setting_value FROM store_settings WHERE setting_key = 'invoice_company_details'`)
      if (result.rows.length > 0 && result.rows[0].setting_value) {
        const details = typeof result.rows[0].setting_value === 'string' ? JSON.parse(result.rows[0].setting_value) : result.rows[0].setting_value
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

  app.get('/api/invoice-settings/all', async (_req, res) => {
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

  app.put('/api/invoice-settings/all', async (req, res) => {
    try {
      const { colors, tax, terms, signatureText, currency } = req.body
      if (colors) await pool.query(`
        INSERT INTO store_settings (setting_key, setting_value)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = $2::jsonb, updated_at = NOW()
      `, ['invoice_colors', JSON.stringify(colors)])
      if (tax) await pool.query(`
        INSERT INTO store_settings (setting_key, setting_value)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = $2::jsonb, updated_at = NOW()
      `, ['invoice_tax', JSON.stringify(tax)])
      if (terms) await pool.query(`
        INSERT INTO store_settings (setting_key, setting_value)
        VALUES ($1, $2::text)
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = $2, updated_at = NOW()
      `, ['invoice_terms', terms])
      if (signatureText) await pool.query(`
        INSERT INTO store_settings (setting_key, setting_value)
        VALUES ($1, $2::text)
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = $2, updated_at = NOW()
      `, ['invoice_signature', signatureText])
      if (currency) await pool.query(`
        INSERT INTO store_settings (setting_key, setting_value)
        VALUES ($1, $2::text)
        ON CONFLICT (setting_key) 
        DO UPDATE SET setting_value = $2, updated_at = NOW()
      `, ['invoice_currency', currency])
      sendSuccess(res, { message: 'All settings saved successfully' })
    } catch (err) {
      sendError(res, 500, 'Failed to save settings', err)
    }
  })

  app.get('/api/invoices/:id/download', async (req, res) => {
    try {
      const { id } = req.params
      const isNumeric = /^\d+$/.test(id)
      let result
      if (isNumeric) result = await pool.query('SELECT * FROM orders WHERE id = $1', [parseInt(id)])
      else result = await pool.query('SELECT * FROM orders WHERE order_number = $1', [id])
      if (result.rows.length === 0 && isNumeric) {
        result = await pool.query('SELECT * FROM orders WHERE order_number = $1', [id])
      }
      if (result.rows.length === 0) return sendError(res, 404, 'Invoice not found')
      const order = result.rows[0]

      const companyDetailsResult = await pool.query(`SELECT setting_value FROM store_settings WHERE setting_key = 'invoice_company_details'`)
      const colorsResult = await pool.query(`SELECT setting_value FROM store_settings WHERE setting_key = 'invoice_colors'`)
      const taxResult = await pool.query(`SELECT setting_value FROM store_settings WHERE setting_key = 'invoice_tax'`)
      const termsResult = await pool.query(`SELECT setting_value FROM store_settings WHERE setting_key = 'invoice_terms'`)
      const signatureResult = await pool.query(`SELECT setting_value FROM store_settings WHERE setting_key = 'invoice_signature'`)
      const currencyResult = await pool.query(`SELECT setting_value FROM store_settings WHERE setting_key = 'invoice_currency'`)

      let companyDetails: any = { companyName: 'Nefol', companyAddress: '', companyPhone: '7355384939', companyEmail: 'info@nefol.com', gstNumber: '', panNumber: '' }
      let colors: any = { primaryStart: '#667eea', primaryEnd: '#764ba2', accentStart: '#667eea', accentEnd: '#764ba2' }
      let taxSettings: any = { rate: 18, type: 'IGST' }
      let terms: any = 'Thank you for doing business with us.'
      let signature: any = 'Authorized Signatory'
      let currency: any = '₹'

      if (companyDetailsResult.rows.length > 0 && companyDetailsResult.rows[0].setting_value) companyDetails = { ...companyDetails, ...(typeof companyDetailsResult.rows[0].setting_value === 'string' ? JSON.parse(companyDetailsResult.rows[0].setting_value) : companyDetailsResult.rows[0].setting_value) }
      if (colorsResult.rows.length > 0 && colorsResult.rows[0].setting_value) colors = { ...colors, ...(typeof colorsResult.rows[0].setting_value === 'string' ? JSON.parse(colorsResult.rows[0].setting_value) : colorsResult.rows[0].setting_value) }
      if (taxResult.rows.length > 0 && taxResult.rows[0].setting_value) taxSettings = { ...taxSettings, ...(typeof taxResult.rows[0].setting_value === 'string' ? JSON.parse(taxResult.rows[0].setting_value) : taxResult.rows[0].setting_value) }
      if (termsResult.rows.length > 0 && termsResult.rows[0].setting_value) terms = termsResult.rows[0].setting_value
      if (signatureResult.rows.length > 0 && signatureResult.rows[0].setting_value) signature = signatureResult.rows[0].setting_value
      if (currencyResult.rows.length > 0 && currencyResult.rows[0].setting_value) currency = currencyResult.rows[0].setting_value

      const invoiceHtml = generateInvoiceHTML(order, companyDetails, colors, taxSettings, terms, signature, currency)
      res.setHeader('Content-Type', 'text/html')
      res.send(invoiceHtml)
    } catch (err) {
      sendError(res, 500, 'Failed to generate invoice', err)
    }
  })

  function generateInvoiceHTML(order: any, companyDetails: any, colors: any, taxSettings: any, terms: string, signature: string, currency: string): string {
    try {
      const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]')
      let subtotal = 0
      let totalDiscount = 0
      let totalTax = 0
      const invoiceItems = items.map((item: any, index: number) => {
        const unitPrice = parseFloat(item.price || item.unitPrice || item.mrp || 0)
        const quantity = parseInt(item.quantity || 1)
        const discount = parseFloat(item.discount || 0)
        const gstFromCSV = item.csvProduct?.['GST %']
        const taxRate = gstFromCSV ? (parseFloat(gstFromCSV) / 100) : (parseFloat(item.taxRate || taxSettings.rate) / 100)
        const itemSubtotal = unitPrice * quantity
        const itemDiscount = discount
        
        // MRP is tax-inclusive, so extract tax from MRP
        // basePrice = taxInclusivePrice / (1 + taxRate)
        // tax = taxInclusivePrice - basePrice
        const basePricePerUnit = unitPrice / (1 + taxRate)
        const taxPerUnit = unitPrice - basePricePerUnit
        const itemTax = taxPerUnit * quantity
        
        // Item total after discount (MRP already includes tax)
        const itemTotalAfterDiscount = itemSubtotal - itemDiscount
        
        subtotal += itemSubtotal
        totalDiscount += itemDiscount
        totalTax += itemTax
        const hsnCode = item.csvProduct?.['HSN Code'] || item.hsn || '-'
        const sku = item.csvProduct?.['SKU'] || item.code || item.sku || item.id || 'N/A'
        const brand = item.csvProduct?.['Brand Name'] || 'NEFOL'
        const gstPercent = gstFromCSV || (taxRate * 100) // Convert back to percentage for display
        const discountPercent = itemSubtotal > 0 ? ((itemDiscount / itemSubtotal) * 100).toFixed(0) : 0
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${index + 1}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
              <div style="margin-bottom: 4px;"><strong>${item.name || item.productName || item.title || 'Product'}</strong></div>
              <div style="font-size: 11px; color: #6b7280;">Code: ${sku}</div>
              ${brand !== 'NEFOL' ? `<div style="font-size: 11px; color: #6b7280;">Brand: ${brand}</div>` : ''}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 13px;"><strong>${hsnCode}</strong></td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 14px;"><strong>${quantity}</strong></td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px;">
              <div>${currency}${unitPrice.toFixed(2)}</div>
              ${itemDiscount > 0 ? `<div style="color: #dc2626; font-size: 11px; margin-top: 2px;">Discount: ${discountPercent}% (${currency}${itemDiscount.toFixed(2)})</div>` : ''}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 14px;">
              <strong>${currency}${itemTotalAfterDiscount.toFixed(2)}</strong>
              <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                <div>GST ${gstPercent}% (Inclusive): ${currency}${itemTax.toFixed(2)}</div>
                <div style="font-size: 10px; margin-top: 2px;">HSN: ${hsnCode}</div>
              </div>
            </td>
          </tr>
        `
      }).join('')
      const finalSubtotal = subtotal - totalDiscount
      // Use order.total if available (already calculated with tax-inclusive pricing), otherwise calculate
      const orderTotalNum = Number(order.total)
      const finalTotal = (!isNaN(orderTotalNum) && order.total != null && order.total !== '') ? orderTotalNum : finalSubtotal
      const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tax Invoice - ${order.order_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background: linear-gradient(135deg, ${colors.primaryStart} 0%, ${colors.primaryEnd} 100%); padding: 20px; }
            .invoice-container { max-width: 210mm; margin: 0 auto; background: white; padding: 30px; }
            .header-section { margin-bottom: 30px; position: relative; }
            .logo-box { background: linear-gradient(135deg, ${colors.primaryStart} 0%, ${colors.primaryEnd} 100%); color: white; padding: 20px; width: 120px; height: 80px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-radius: 8px; }
            .company-name { font-size: 14px; color: #4a5568; font-weight: 600; margin-bottom: 5px; }
            .phone-bar { background: linear-gradient(135deg, ${colors.primaryStart} 0%, ${colors.primaryEnd} 100%); color: white; padding: 8px 15px; border-radius: 6px; display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; margin-bottom: 20px; }
            .invoice-title { font-size: 32px; font-weight: bold; color: #4a5568; margin: 20px 0 15px 0; }
            .invoice-details { display: flex; justify-content: space-between; color: #4a5568; margin-bottom: 20px; }
            .table-container { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; }
            thead tr { background: linear-gradient(135deg, ${colors.primaryStart} 0%, ${colors.primaryEnd} 100%); color: white; }
            th { padding: 12px; text-align: left; }
            tbody td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #4a5568; }
            tfoot tr { background: linear-gradient(135deg, ${colors.primaryStart} 0%, ${colors.primaryEnd} 100%); color: white; font-weight: bold; }
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
                <tbody>${invoiceItems}</tbody>
                <tfoot>
                  <tr><td colspan="4" style="text-align: right; padding: 12px;"><strong>Subtotal (MRP):</strong></td><td colspan="2" style="text-align: right; padding: 12px;">${currency}${subtotal.toFixed(2)}</td></tr>
                  ${totalDiscount > 0 ? `<tr><td colspan="4" style="text-align: right; padding: 12px;"><strong>Discount:</strong></td><td colspan="2" style="text-align: right; padding: 12px;">-${currency}${totalDiscount.toFixed(2)}</td></tr>` : ''}
                  <tr><td colspan="4" style="text-align: right; padding: 12px;"><strong>${taxSettings.type} (${taxSettings.rate}% - Inclusive):</strong></td><td colspan="2" style="text-align: right; padding: 12px;">${currency}${totalTax.toFixed(2)}</td></tr>
                  <tr style="background: linear-gradient(135deg, ${colors.primaryStart} 0%, ${colors.primaryEnd} 100%); color: white; font-weight: bold;"><td colspan="4" style="text-align: right; padding: 12px;"><strong>Total Amount:</strong></td><td colspan="2" style="text-align: right; padding: 12px;">${currency}${finalTotal.toFixed(2)}</td></tr>
                </tfoot>
              </table>
            </div>
          </div>
        </body>
        </html>
      `
    } catch (error) {
      return `<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Invoice Generation Error</h1><p>Failed to generate invoice. Please try again.</p><p>Error: ${error}</p></body></html>`
    }
  }

  // ==================== Admin Notifications ====================
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
    const { rows } = await pool.query(`
      INSERT INTO admin_notifications (user_id, notification_type, title, message, link, icon, priority, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [userId || null, type, title, message, link || null, icon || null, priority, metadata ? JSON.stringify(metadata) : '{}'])
    io.to('admin-panel').emit('new-notification', rows[0])
    return rows[0]
  }

  app.get('/api/admin/notifications', async (req, res) => {
    try {
      const { status = 'unread', limit = 50 } = req.query as any
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

  app.get('/api/admin/notifications/unread-count', async (_req, res) => {
    try {
      const { rows } = await pool.query(`SELECT COUNT(*) as count FROM admin_notifications WHERE status = 'unread'`)
      sendSuccess(res, { count: parseInt(rows[0].count) })
    } catch (err) {
      sendError(res, 500, 'Failed to fetch unread count', err)
    }
  })

  app.put('/api/admin/notifications/:id/read', async (req, res) => {
    try {
      const { id } = req.params
      await pool.query(`UPDATE admin_notifications SET status = 'read', read_at = NOW() WHERE id = $1`, [id])
      sendSuccess(res, { message: 'Notification marked as read' })
    } catch (err) {
      sendError(res, 500, 'Failed to mark notification as read', err)
    }
  })

  app.put('/api/admin/notifications/read-all', async (_req, res) => {
    try {
      await pool.query(`UPDATE admin_notifications SET status = 'read', read_at = NOW() WHERE status = 'unread'`)
      sendSuccess(res, { message: 'All notifications marked as read' })
    } catch (err) {
      sendError(res, 500, 'Failed to mark all notifications as read', err)
    }
  })

  app.delete('/api/admin/notifications/:id', async (req, res) => {
    try {
      const { id } = req.params
      await pool.query(`DELETE FROM admin_notifications WHERE id = $1`, [id])
      sendSuccess(res, { message: 'Notification deleted' })
    } catch (err) {
      sendError(res, 500, 'Failed to delete notification', err)
    }
  })
}


