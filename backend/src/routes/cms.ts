import { Router, Request, Response } from 'express'
import { Pool } from 'pg'
import { Server as SocketIOServer } from 'socket.io'

export function createCMSRouter(pool: Pool, io?: SocketIOServer) {
  const router = Router()
  
  // Helper function to broadcast CMS updates
  const broadcastCMSUpdate = (event: string, data: any) => {
    if (io) {
      io.emit('cms-update', { event, data, timestamp: Date.now() })
      console.log('📡 Broadcasting CMS update:', event)
    }
  }

  // Initialize CMS tables
  const initTables = async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cms_pages (
        id SERIAL PRIMARY KEY,
        page_name VARCHAR(255) UNIQUE NOT NULL,
        page_title TEXT,
        page_subtitle TEXT,
        meta_description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cms_sections (
        id SERIAL PRIMARY KEY,
        page_name VARCHAR(255) NOT NULL,
        section_key VARCHAR(255) NOT NULL,
        section_title TEXT,
        section_type VARCHAR(50) NOT NULL,
        content JSONB,
        order_index INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(page_name, section_key)
      );

      CREATE TABLE IF NOT EXISTS cms_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(255) UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
  }

  initTables().catch(console.error)

  // GET all pages
  router.get('/pages', async (req: Request, res: Response) => {
    try {
      const { rows } = await pool.query('SELECT * FROM cms_pages ORDER BY page_name')
      res.json(rows)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  // GET single page with all sections
  router.get('/pages/:pageName', async (req: Request, res: Response) => {
    try {
      const { pageName } = req.params
      const pageResult = await pool.query('SELECT * FROM cms_pages WHERE page_name = $1', [pageName])
      const sectionsResult = await pool.query(
        'SELECT * FROM cms_sections WHERE page_name = $1 AND is_active = true ORDER BY order_index',
        [pageName]
      )
      
      res.json({
        page: pageResult.rows[0] || null,
        sections: sectionsResult.rows
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  // CREATE or UPDATE page
  router.post('/pages', async (req: Request, res: Response) => {
    try {
      const { page_name, page_title, page_subtitle, meta_description } = req.body
      
      const existingResult = await pool.query('SELECT id FROM cms_pages WHERE page_name = $1', [page_name])
      
      if (existingResult.rows.length > 0) {
        await pool.query(
          `UPDATE cms_pages 
           SET page_title = $1, page_subtitle = $2, meta_description = $3, updated_at = CURRENT_TIMESTAMP
           WHERE page_name = $4`,
          [page_title, page_subtitle, meta_description, page_name]
        )
        
        broadcastCMSUpdate('page_updated', { page_name, page_title, page_subtitle })
        res.json({ message: 'Page updated successfully', id: existingResult.rows[0].id })
      } else {
        const result = await pool.query(
          `INSERT INTO cms_pages (page_name, page_title, page_subtitle, meta_description)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [page_name, page_title, page_subtitle, meta_description]
        )
        
        broadcastCMSUpdate('page_created', { page_name, page_title, page_subtitle })
        res.json({ message: 'Page created successfully', id: result.rows[0].id })
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  // DELETE page
  router.delete('/pages/:pageName', async (req: Request, res: Response) => {
    try {
      const { pageName } = req.params
      
      // Delete all sections for this page
      await pool.query('DELETE FROM cms_sections WHERE page_name = $1', [pageName])
      
      // Delete the page
      await pool.query('DELETE FROM cms_pages WHERE page_name = $1', [pageName])
      
      broadcastCMSUpdate('page_deleted', { page_name: pageName })
      res.json({ message: 'Page and all sections deleted successfully' })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  // GET all sections for a page
  router.get('/sections/:pageName', async (req: Request, res: Response) => {
    try {
      const { pageName } = req.params
      const { rows } = await pool.query(
        'SELECT * FROM cms_sections WHERE page_name = $1 ORDER BY order_index',
        [pageName]
      )
      
      res.json(rows)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  // CREATE or UPDATE section
  router.post('/sections', async (req: Request, res: Response) => {
    try {
      const { page_name, section_key, section_title, section_type, content, order_index, is_active } = req.body
      
      const existingResult = await pool.query(
        'SELECT id FROM cms_sections WHERE page_name = $1 AND section_key = $2',
        [page_name, section_key]
      )
      
      if (existingResult.rows.length > 0) {
        await pool.query(
          `UPDATE cms_sections 
           SET section_title = $1, section_type = $2, content = $3, order_index = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
           WHERE page_name = $6 AND section_key = $7`,
          [section_title, section_type, content, order_index || 0, is_active !== false, page_name, section_key]
        )
        
        broadcastCMSUpdate('section_updated', { page_name, section_key, section_title, content })
        res.json({ message: 'Section updated successfully', id: existingResult.rows[0].id })
      } else {
        const result = await pool.query(
          `INSERT INTO cms_sections (page_name, section_key, section_title, section_type, content, order_index, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [page_name, section_key, section_title, section_type, content, order_index || 0, is_active !== false]
        )
        
        broadcastCMSUpdate('section_created', { page_name, section_key, section_title, content })
        res.json({ message: 'Section created successfully', id: result.rows[0].id })
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  // DELETE section
  router.delete('/sections/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      
      // Get section info before deleting for broadcast
      const sectionResult = await pool.query('SELECT page_name, section_key FROM cms_sections WHERE id = $1', [id])
      
      await pool.query('DELETE FROM cms_sections WHERE id = $1', [id])
      
      if (sectionResult.rows.length > 0) {
        broadcastCMSUpdate('section_deleted', { 
          id, 
          page_name: sectionResult.rows[0].page_name,
          section_key: sectionResult.rows[0].section_key
        })
      }
      
      res.json({ message: 'Section deleted successfully' })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  // GET all settings
  router.get('/settings', async (req: Request, res: Response) => {
    try {
      const { rows } = await pool.query('SELECT * FROM cms_settings')
      const settingsObj = rows.reduce((acc: any, setting: any) => {
        let value = setting.setting_value
        if (setting.setting_type === 'json' && value) {
          try {
            value = JSON.parse(value)
          } catch (e) {
            // Keep as string if parse fails
          }
        } else if (setting.setting_type === 'number' && value) {
          value = parseFloat(value)
        } else if (setting.setting_type === 'boolean') {
          value = value === 'true' || value === '1'
        }
        acc[setting.setting_key] = value
        return acc
      }, {})
      res.json(settingsObj)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  // CREATE or UPDATE setting
  router.post('/settings', async (req: Request, res: Response) => {
    try {
      const { setting_key, setting_value, setting_type } = req.body
      
      let valueString = setting_value
      if (setting_type === 'json' && typeof setting_value !== 'string') {
        valueString = JSON.stringify(setting_value)
      } else if (setting_type === 'boolean') {
        valueString = setting_value ? 'true' : 'false'
      } else if (setting_type === 'number') {
        valueString = String(setting_value)
      }
      
      const existingResult = await pool.query('SELECT id FROM cms_settings WHERE setting_key = $1', [setting_key])
      
      if (existingResult.rows.length > 0) {
        await pool.query(
          `UPDATE cms_settings 
           SET setting_value = $1, setting_type = $2, updated_at = CURRENT_TIMESTAMP
           WHERE setting_key = $3`,
          [valueString, setting_type || 'text', setting_key]
        )
        
        broadcastCMSUpdate('setting_updated', { setting_key, setting_value: valueString })
        res.json({ message: 'Setting updated successfully' })
      } else {
        await pool.query(
          `INSERT INTO cms_settings (setting_key, setting_value, setting_type)
           VALUES ($1, $2, $3)`,
          [setting_key, valueString, setting_type || 'text']
        )
        
        broadcastCMSUpdate('setting_created', { setting_key, setting_value: valueString })
        res.json({ message: 'Setting created successfully' })
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  // DELETE setting
  router.delete('/settings/:key', async (req: Request, res: Response) => {
    try {
      const { key } = req.params
      await pool.query('DELETE FROM cms_settings WHERE setting_key = $1', [key])
      res.json({ message: 'Setting deleted successfully' })
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  })

  return router
}

export default createCMSRouter

