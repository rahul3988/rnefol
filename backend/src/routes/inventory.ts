import { Request, Response } from 'express'
import { Pool } from 'pg'
import { sendError, sendSuccess, validateRequired } from '../utils/apiHelpers'

export async function getInventorySummary(pool: Pool, req: Request, res: Response) {
  try {
    const { productId } = req.params as any
    const { rows } = await pool.query(
      `select p.id as product_id, p.title,
              coalesce(sum(i.quantity - i.reserved), 0) as available,
              coalesce(sum(i.quantity), 0) as total,
              count(*) filter (where (i.quantity - i.reserved) <= coalesce(i.low_stock_threshold, 0)) as low_variants
       from products p
       left join product_variants pv on pv.product_id = p.id
       left join inventory i on i.variant_id = pv.id
       where p.id = $1
       group by p.id`,
      [productId]
    )
    sendSuccess(res, rows[0] || { product_id: Number(productId), available: 0, total: 0, low_variants: 0 })
  } catch (err) {
    sendError(res, 500, 'Failed to fetch inventory summary', err)
  }
}

export async function adjustStock(pool: Pool, req: Request, res: Response) {
  try {
    const { productId, variantId } = req.params as any
    const { delta, reason = 'manual_adjustment', metadata } = req.body || {}
    const validationError = validateRequired({ delta }, ['delta'])
    if (validationError) return sendError(res, 400, validationError)

    // Ensure row exists
    await pool.query(
      `insert into inventory (product_id, variant_id, quantity, reserved, low_stock_threshold)
       values ($1, $2, 0, 0, 0)
       on conflict (product_id, variant_id) do nothing`,
      [productId, variantId]
    )

    const { rows } = await pool.query(
      `update inventory set quantity = quantity + $3, updated_at = now()
       where product_id = $1 and variant_id = $2
       returning *`,
      [productId, variantId, Number(delta)]
    )

    await pool.query(
      `insert into inventory_logs (product_id, variant_id, change, reason, metadata)
       values ($1, $2, $3, $4, $5)`,
      [productId, variantId, Number(delta), reason, metadata ? JSON.stringify(metadata) : null]
    )

    sendSuccess(res, rows[0])
  } catch (err) {
    sendError(res, 500, 'Failed to adjust stock', err)
  }
}

export async function setLowStockThreshold(pool: Pool, req: Request, res: Response) {
  try {
    const { productId, variantId } = req.params as any
    const { threshold } = req.body || {}
    const validationError = validateRequired({ threshold }, ['threshold'])
    if (validationError) return sendError(res, 400, validationError)
    const { rows } = await pool.query(
      `update inventory set low_stock_threshold = $3, updated_at = now()
       where product_id = $1 and variant_id = $2
       returning *`,
      [productId, variantId, Number(threshold)]
    )
    sendSuccess(res, rows[0] || null)
  } catch (err) {
    sendError(res, 500, 'Failed to set low stock threshold', err)
  }
}

export async function listLowStock(pool: Pool, req: Request, res: Response) {
  try {
    const { rows } = await pool.query(
      `select pv.id as variant_id, pv.product_id, pv.sku, pv.attributes,
              i.quantity, i.reserved, i.low_stock_threshold
       from product_variants pv
       join inventory i on i.variant_id = pv.id
       where (i.quantity - i.reserved) <= coalesce(i.low_stock_threshold, 0)
       order by (i.quantity - i.reserved) asc`
    )
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to list low stock variants', err)
  }
}


