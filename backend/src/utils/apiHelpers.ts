// Centralized API utilities to eliminate duplicate code
import { Request, Response } from 'express'
import { Pool } from 'pg'

// Standardized error response
export function sendError(res: Response, status: number, message: string, error?: any) {
  console.error(`API Error [${status}]:`, message, error)
  res.status(status).json({ error: message })
}

// Standardized success response
export function sendSuccess(res: Response, data: any, status: number = 200) {
  res.status(status).json(data)
}

// Generic GET handler for simple table queries
export async function handleGetAll(
  pool: Pool, 
  res: Response, 
  tableName: string, 
  orderBy: string = 'created_at DESC',
  additionalQuery?: string
) {
  try {
    const query = additionalQuery || `SELECT * FROM ${tableName} ORDER BY ${orderBy}`
    const { rows } = await pool.query(query)
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, `Failed to fetch ${tableName}`, err)
  }
}

// Generic POST handler for table creation
export async function handleCreate(
  pool: Pool,
  res: Response,
  tableName: string,
  fields: string[],
  values: any[],
  broadcastEvent?: string,
  broadcastData?: any
) {
  try {
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ')
    const query = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`
    const { rows } = await pool.query(query, values)
    
    if (broadcastEvent && broadcastData) {
      // Broadcast update if needed
      console.log(`Broadcasting ${broadcastEvent}:`, broadcastData)
    }
    
    sendSuccess(res, rows[0], 201)
  } catch (err: any) {
    if (err?.code === '23505') {
      sendError(res, 409, `${tableName} already exists`)
    } else {
      sendError(res, 500, `Failed to create ${tableName}`, err)
    }
  }
}

// Generic UPDATE handler
export async function handleUpdate(
  pool: Pool,
  res: Response,
  tableName: string,
  id: string,
  updates: Record<string, any>,
  idField: string = 'id'
) {
  try {
    const fields = Object.keys(updates).filter(key => updates[key] !== undefined)
    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ')
    const values = [id, ...fields.map(field => updates[field])]
    
    const query = `UPDATE ${tableName} SET ${setClause}, updated_at = NOW() WHERE ${idField} = $1 RETURNING *`
    const { rows } = await pool.query(query, values)
    
    if (rows.length === 0) {
      return sendError(res, 404, `${tableName} not found`)
    }
    
    sendSuccess(res, rows[0])
  } catch (err) {
    sendError(res, 500, `Failed to update ${tableName}`, err)
  }
}

// Authentication middleware
export function authenticateToken(req: Request, res: Response, next: Function) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return sendError(res, 401, 'No token provided')
  }
  
  const tokenParts = token.split('_')
  if (tokenParts.length < 3 || tokenParts[0] !== 'user' || tokenParts[1] !== 'token') {
    return sendError(res, 401, 'Invalid token format')
  }
  
  req.userId = tokenParts[2]
  next()
}

// CSV parsing utility
export function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // Skip next quote
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

// Validation helpers
export function validateRequired(body: any, fields: string[]): string | null {
  for (const field of fields) {
    if (!body[field]) {
      return `${field} is required`
    }
  }
  return null
}

// Database transaction helper
export async function withTransaction<T>(
  pool: Pool, 
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}