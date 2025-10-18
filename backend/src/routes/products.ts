// Optimized Products API endpoints
import { Request, Response } from 'express'
import { Pool } from 'pg'
import { handleGetAll, handleCreate, handleUpdate, sendError, sendSuccess, validateRequired } from '../utils/apiHelpers'

// Optimized GET /api/products
export async function getProducts(pool: Pool, res: Response) {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, 
             COALESCE(
               json_agg(
                 json_build_object('url', pi.url)
               ) FILTER (WHERE pi.url IS NOT NULL), 
               '[]'::json
             ) as pdp_images
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `)
    
    // Transform the data to match expected format
    const products = rows.map((product: any) => ({
      ...product,
      pdp_images: product.pdp_images.filter((img: any) => img.url)
    }))
    
    sendSuccess(res, products)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch products', err)
  }
}

// Optimized GET /api/products/:id
export async function getProductById(pool: Pool, req: Request, res: Response) {
  try {
    const { id } = req.params
    
    const { rows } = await pool.query(`
      SELECT p.*, 
             COALESCE(
               json_agg(
                 json_build_object('url', pi.url)
               ) FILTER (WHERE pi.url IS NOT NULL), 
               '[]'::json
             ) as pdp_images
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [id])
    
    if (rows.length === 0) {
      return sendError(res, 404, 'Product not found')
    }
    
    const product = {
      ...rows[0],
      pdp_images: rows[0].pdp_images.filter((img: any) => img.url)
    }
    
    sendSuccess(res, product)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch product', err)
  }
}

// Optimized GET /api/products/slug/:slug
export async function getProductBySlug(pool: Pool, req: Request, res: Response) {
  try {
    const { slug } = req.params
    
    const { rows } = await pool.query(`
      SELECT p.*, 
             COALESCE(
               json_agg(
                 json_build_object('url', pi.url)
               ) FILTER (WHERE pi.url IS NOT NULL), 
               '[]'::json
             ) as pdp_images
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.slug = $1
      GROUP BY p.id
    `, [slug])
    
    if (rows.length === 0) {
      return sendError(res, 404, 'Product not found')
    }
    
    const product = {
      ...rows[0],
      pdp_images: rows[0].pdp_images.filter((img: any) => img.url)
    }
    
    sendSuccess(res, product)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch product', err)
  }
}

// Optimized POST /api/products
export async function createProduct(pool: Pool, req: Request, res: Response) {
  try {
    const { slug, title, category = '', price = '', listImage = '', description = '', details = {} } = req.body || {}
    
    // Validate required fields
    const validationError = validateRequired(req.body, ['slug', 'title'])
    if (validationError) {
      return sendError(res, 400, validationError)
    }
    
    const { rows } = await pool.query(`
      INSERT INTO products (slug, title, category, price, list_image, description, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [slug, title, category, price, listImage, description, JSON.stringify(details)])
    
    sendSuccess(res, rows[0], 201)
  } catch (err: any) {
    if (err?.code === '23505') {
      sendError(res, 409, 'Product slug must be unique')
    } else {
      sendError(res, 500, 'Failed to create product', err)
    }
  }
}

// Optimized PUT /api/products/:id
export async function updateProduct(pool: Pool, req: Request, res: Response) {
  try {
    const { id } = req.params
    const { slug, title, category, price, listImage, description, details } = req.body || {}
    
    const updates: Record<string, any> = {}
    if (slug !== undefined) updates.slug = slug
    if (title !== undefined) updates.title = title
    if (category !== undefined) updates.category = category
    if (price !== undefined) updates.price = price
    if (listImage !== undefined) updates.list_image = listImage
    if (description !== undefined) updates.description = description
    if (details !== undefined) updates.details = JSON.stringify(details)
    
    const fields = Object.keys(updates)
    if (fields.length === 0) {
      return sendError(res, 400, 'No fields to update')
    }
    
    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ')
    const values = [id, ...fields.map(field => updates[field])]
    
    const { rows } = await pool.query(`
      UPDATE products 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, values)
    
    if (rows.length === 0) {
      return sendError(res, 404, 'Product not found')
    }
    
    sendSuccess(res, rows[0])
  } catch (err: any) {
    if (err?.code === '23505') {
      sendError(res, 409, 'Product slug must be unique')
    } else {
      sendError(res, 500, 'Failed to update product', err)
    }
  }
}

// Optimized DELETE /api/products/:id
export async function deleteProduct(pool: Pool, req: Request, res: Response) {
  try {
    const { id } = req.params
    
    // First check if product exists
    const { rows: existingRows } = await pool.query('SELECT id FROM products WHERE id = $1', [id])
    if (existingRows.length === 0) {
      return sendError(res, 404, 'Product not found')
    }
    
    // Delete product (cascade will handle product_images)
    const { rows } = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id])
    
    sendSuccess(res, { message: 'Product deleted successfully', deletedProduct: rows[0] })
  } catch (err) {
    sendError(res, 500, 'Failed to delete product', err)
  }
}

// Upload product images
export async function uploadProductImages(pool: Pool, req: Request, res: Response) {
  try {
    const { id } = req.params
    const files = (req as any).files as Express.Multer.File[]
    const body = req.body || {}
    
    // Check if product exists
    const { rows: productRows } = await pool.query('SELECT id FROM products WHERE id = $1', [id])
    if (productRows.length === 0) {
      return sendError(res, 404, 'Product not found')
    }
    
    let imageUrls: string[] = []
    
    // Handle multipart form data (actual file uploads)
    if (files && files.length > 0) {
      imageUrls = files.map(file => `/uploads/${file.filename}`)
    }
    // Handle JSON data (pre-uploaded URLs)
    else if (body.images && Array.isArray(body.images)) {
      imageUrls = body.images
    }
    else {
      return sendError(res, 400, 'No images provided')
    }
    
    // Insert image URLs into database
    const insertedImages = []
    
    for (const url of imageUrls) {
      const { rows } = await pool.query(
        'INSERT INTO product_images (product_id, url) VALUES ($1, $2) RETURNING *',
        [id, url]
      )
      insertedImages.push(rows[0])
    }
    
    sendSuccess(res, insertedImages, 201)
  } catch (err) {
    sendError(res, 500, 'Failed to upload product images', err)
  }
}

// Get product images
export async function getProductImages(pool: Pool, req: Request, res: Response) {
  try {
    const { id } = req.params
    
    const { rows } = await pool.query(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY created_at ASC',
      [id]
    )
    
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to fetch product images', err)
  }
}

// Delete product image
export async function deleteProductImage(pool: Pool, req: Request, res: Response) {
  try {
    const { id, imageId } = req.params
    
    const { rows } = await pool.query(
      'DELETE FROM product_images WHERE id = $1 AND product_id = $2 RETURNING *',
      [imageId, id]
    )
    
    if (rows.length === 0) {
      return sendError(res, 404, 'Product image not found')
    }
    
    sendSuccess(res, { message: 'Product image deleted successfully' })
  } catch (err) {
    sendError(res, 500, 'Failed to delete product image', err)
  }
}

// Optimized CSV endpoint with correct path
export async function getProductsCSV(res: Response) {
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
    sendError(res, 500, 'Failed to read products CSV', err)
  }
}