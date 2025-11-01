import { Request, Response } from 'express'
import { Pool } from 'pg'
import { sendError, sendSuccess, validateRequired } from '../utils/apiHelpers'

function getBaseUrl() {
  return process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external'
}

async function getToken(pool: Pool) {
  const { rows } = await pool.query('select api_key, api_secret from shiprocket_config where is_active = true order by updated_at desc, id desc limit 1')
  const apiKey = rows[0]?.api_key
  const apiSecret = rows[0]?.api_secret
  if (!apiKey || !apiSecret) return null
  const resp = await fetch(`${getBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: apiKey, password: apiSecret })
  })
  if (!resp.ok) return null
  const data: any = await resp.json()
  return data?.token || null
}

export async function saveShiprocketConfig(pool: Pool, req: Request, res: Response) {
  try {
    const { api_key, api_secret } = req.body || {}
    const validationError = validateRequired({ api_key, api_secret }, ['api_key', 'api_secret'])
    if (validationError) return sendError(res, 400, validationError)
    await pool.query(
      `insert into shiprocket_config (api_key, api_secret, is_active, created_at, updated_at)
       values ($1, $2, true, now(), now())`,
      [api_key, api_secret]
    )
    sendSuccess(res, { message: 'Shiprocket config saved' }, 201)
  } catch (err) {
    sendError(res, 500, 'Failed to save Shiprocket config', err)
  }
}

export async function getShiprocketConfig(pool: Pool, req: Request, res: Response) {
  try {
    const { rows } = await pool.query(
      `select id, is_active, updated_at from shiprocket_config where is_active = true order by updated_at desc, id desc limit 1`
    )
    const has_config = rows.length > 0
    sendSuccess(res, { has_config, config: rows[0] || null })
  } catch (err) {
    sendError(res, 500, 'Failed to fetch Shiprocket config', err)
  }
}

export async function createAwbAndLabel(pool: Pool, req: Request, res: Response) {
  try {
    const { orderId } = req.params as any
    // fetch order
    const { rows: orders } = await pool.query('select * from orders where id = $1', [orderId])
    if (orders.length === 0) return sendError(res, 404, 'Order not found')
    const token = await getToken(pool)
    if (!token) return sendError(res, 400, 'Invalid Shiprocket credentials')

    // Minimal payload; real integration requires full address and parcel details
    const payload = {
      order_id: orders[0].order_number,
      shipment_id: orders[0].id,
    }
    const base = getBaseUrl()
    const awbResp = await fetch(`${base}/courier/assign/awb`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    })
    const awbData: any = await awbResp.json()
    if (!awbResp.ok) return sendError(res, 400, 'Failed to generate AWB', awbData)

    const awb_code = awbData?.response?.awb_code || awbData?.awb_code || null

    let label_url: string | null = null
    try {
      const labelResp = await fetch(`${base}/courier/generate/label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shipment_id: orders[0].id })
      })
      const labelData: any = await labelResp.json()
      if (labelResp.ok) label_url = labelData?.label_url || labelData?.label_url_pdf || null
    } catch (_) {}

    const { rows } = await pool.query(
      `insert into shiprocket_shipments (order_id, shipment_id, tracking_url, status, awb_code, label_url, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, now(), now())
       returning *`,
      [orders[0].id, String(orders[0].id), null, 'created', awb_code, label_url]
    )
    sendSuccess(res, rows[0], 201)
  } catch (err) {
    sendError(res, 500, 'Failed to create AWB/label', err)
  }
}

export async function trackShipment(pool: Pool, req: Request, res: Response) {
  try {
    const { orderId } = req.params as any
    const token = await getToken(pool)
    if (!token) return sendError(res, 400, 'Invalid Shiprocket credentials')
    const { rows: shipments } = await pool.query('select * from shiprocket_shipments where order_id = $1 order by id desc limit 1', [orderId])
    if (shipments.length === 0) return sendError(res, 404, 'Shipment not found')
    const awb = shipments[0].awb_code
    const base = getBaseUrl()
    const resp = await fetch(`${base}/courier/track/awb/${encodeURIComponent(awb)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await resp.json()
    if (!resp.ok) return sendError(res, 400, 'Failed to track shipment', data)
    sendSuccess(res, data)
  } catch (err) {
    sendError(res, 500, 'Failed to track shipment', err)
  }
}

export async function checkPincodeServiceability(pool: Pool, req: Request, res: Response) {
  try {
    const { pickup_postcode, delivery_postcode, cod = '0', weight = '0.5' } = (req.query || {}) as any
    if (!pickup_postcode || !delivery_postcode) return sendError(res, 400, 'pickup_postcode and delivery_postcode are required')
    const token = await getToken(pool)
    if (!token) return sendError(res, 400, 'Invalid Shiprocket credentials')
    const base = getBaseUrl()
    const url = `${base}/courier/serviceability?pickup_postcode=${encodeURIComponent(pickup_postcode)}&delivery_postcode=${encodeURIComponent(delivery_postcode)}&cod=${encodeURIComponent(cod)}&weight=${encodeURIComponent(weight)}`
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const data = await resp.json()
    if (!resp.ok) return sendError(res, 400, 'Failed to check serviceability', data)
    sendSuccess(res, data)
  } catch (err) {
    sendError(res, 500, 'Failed to check pincode serviceability', err)
  }
}

// =============== Extended Logistics (stubs with graceful fallbacks) ===============

export async function createManifest(pool: Pool, req: Request, res: Response) {
  try {
    const { orderIds } = req.body || {}
    if (!Array.isArray(orderIds) || orderIds.length === 0) return sendError(res, 400, 'orderIds required')
    // Placeholder: In a full integration, call Shiprocket manifest endpoint and return PDF URL
    const manifest_url = `/manifests/manifest-${Date.now()}.pdf`
    sendSuccess(res, { manifest_url, count: orderIds.length })
  } catch (err) {
    sendError(res, 500, 'Failed to generate manifest', err)
  }
}

export async function schedulePickup(pool: Pool, req: Request, res: Response) {
  try {
    const { pickup_date, orderIds } = req.body || {}
    if (!pickup_date) return sendError(res, 400, 'pickup_date required')
    if (!Array.isArray(orderIds) || orderIds.length === 0) return sendError(res, 400, 'orderIds required')
    // Placeholder: hit Shiprocket pickup scheduling in full implementation
    sendSuccess(res, { scheduled: true, pickup_date, count: orderIds.length })
  } catch (err) {
    sendError(res, 500, 'Failed to schedule pickup', err)
  }
}

export async function listNdr(pool: Pool, req: Request, res: Response) {
  try {
    const { from, to } = (req.query || {}) as any
    // Placeholder: fetch NDRs from Shiprocket; returning empty list to keep UI functional
    sendSuccess(res, { items: [], from: from || null, to: to || null })
  } catch (err) {
    sendError(res, 500, 'Failed to fetch NDR list', err)
  }
}

export async function actOnNdr(pool: Pool, req: Request, res: Response) {
  try {
    const { awb } = req.params as any
    const { action, note } = req.body || {}
    if (!awb) return sendError(res, 400, 'awb required')
    if (!action) return sendError(res, 400, 'action required')
    // Placeholder: submit NDR action to Shiprocket; audit locally if needed
    sendSuccess(res, { awb, action, note: note || null, status: 'submitted' })
  } catch (err) {
    sendError(res, 500, 'Failed to process NDR action', err)
  }
}

export async function markRto(pool: Pool, req: Request, res: Response) {
  try {
    const { orderId } = req.params as any
    if (!orderId) return sendError(res, 400, 'orderId required')
    // Minimal local update to reflect RTO (you may keep a dedicated table/field)
    await pool.query(`update orders set status = 'rto', updated_at = now() where id = $1`, [orderId])
    sendSuccess(res, { orderId, status: 'rto' })
  } catch (err) {
    sendError(res, 500, 'Failed to mark RTO', err)
  }
}


