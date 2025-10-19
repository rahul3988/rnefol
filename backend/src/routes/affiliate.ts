// Affiliate Program Routes
import { Request, Response } from 'express'
import { Pool } from 'pg'
import { sendSuccess, sendError } from '../utils/apiHelpers'
import crypto from 'crypto'

// Generate 20-digit verification code
function generateVerificationCode(): string {
  return crypto.randomBytes(10).toString('hex').slice(0, 20)
}

// Submit affiliate application
export async function submitAffiliateApplication(pool: Pool, req: Request, res: Response) {
  try {
    const {
      name,
      email,
      phone,
      instagram,
      snapchat,
      youtube,
      facebook,
      followers,
      platform,
      experience,
      whyJoin,
      expectedSales,
      houseNumber,
      street,
      building,
      apartment,
      road,
      city,
      pincode,
      state,
      agreeTerms
    } = req.body

    // Validate required fields
    if (!name || !email || !phone || !agreeTerms) {
      return sendError(res, 400, 'Missing required fields')
    }

    // Check if at least one social media handle is provided
    const hasSocialMedia = instagram?.trim() || youtube?.trim() || snapchat?.trim() || facebook?.trim()
    if (!hasSocialMedia) {
      return sendError(res, 400, 'At least one social media profile is required')
    }

    // Check if application already exists
    const existingApp = await pool.query(
      'SELECT id FROM affiliate_applications WHERE email = $1',
      [email]
    )

    if (existingApp.rows.length > 0) {
      return sendError(res, 409, 'Application already exists for this email')
    }

    // Create application
    const { rows } = await pool.query(`
      INSERT INTO affiliate_applications (
        name, email, phone, instagram, snapchat, youtube, facebook,
        followers, platform, experience, why_join, expected_sales,
        house_number, street, building, apartment, road, city, pincode, state,
        agree_terms, status, application_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *
    `, [
      name, email, phone, instagram || null, snapchat || null, youtube || null, facebook || null,
      followers, platform, experience, whyJoin, expectedSales,
      houseNumber, street, building || null, apartment || null, road, city, pincode, state,
      agreeTerms, 'pending', new Date()
    ])

    sendSuccess(res, rows[0], 201)
  } catch (err: any) {
    console.error('Error submitting affiliate application:', err)
    sendError(res, 500, 'Failed to submit application', err)
  }
}

// Get all affiliate applications (admin only)
export async function getAffiliateApplications(pool: Pool, req: Request, res: Response) {
  try {
    const { status, page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    let query = 'SELECT * FROM affiliate_applications'
    let params: any[] = []
    let paramCount = 0

    if (status) {
      query += ` WHERE status = $${++paramCount}`
      params.push(status)
    }

    query += ` ORDER BY application_date DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`
    params.push(Number(limit), offset)

    const { rows } = await pool.query(query, params)

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM affiliate_applications'
    let countParams: any[] = []
    if (status) {
      countQuery += ' WHERE status = $1'
      countParams.push(status)
    }

    const countResult = await pool.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].count)

    sendSuccess(res, {
      applications: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (err) {
    sendError(res, 500, 'Failed to fetch applications', err)
  }
}

// Get single affiliate application (admin only)
export async function getAffiliateApplication(pool: Pool, req: Request, res: Response) {
  try {
    const { id } = req.params
    const { rows } = await pool.query('SELECT * FROM affiliate_applications WHERE id = $1', [id])

    if (rows.length === 0) {
      return sendError(res, 404, 'Application not found')
    }

    sendSuccess(res, rows[0])
  } catch (err) {
    sendError(res, 500, 'Failed to fetch application', err)
  }
}

// Approve affiliate application (admin only)
export async function approveAffiliateApplication(pool: Pool, req: Request, res: Response) {
  try {
    const { id } = req.params
    const { adminNotes } = req.body

    // Get application
    const appResult = await pool.query('SELECT * FROM affiliate_applications WHERE id = $1', [id])
    if (appResult.rows.length === 0) {
      return sendError(res, 404, 'Application not found')
    }

    const application = appResult.rows[0]

    // Generate verification code
    const verificationCode = generateVerificationCode()

    // Update application status
    const { rows } = await pool.query(`
      UPDATE affiliate_applications 
      SET status = 'approved', verification_code = $1, admin_notes = $2, approved_at = $3
      WHERE id = $4
      RETURNING *
    `, [verificationCode, adminNotes || null, new Date(), id])

    // Create affiliate partner record
    await pool.query(`
      INSERT INTO affiliate_partners (
        application_id, name, email, phone, verification_code, status, commission_rate,
        total_earnings, total_referrals, pending_earnings, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      id, application.name, application.email, application.phone, verificationCode,
      'unverified', 15.0, 0, 0, 0, new Date()
    ])

    sendSuccess(res, {
      application: rows[0],
      verificationCode,
      message: 'Application approved successfully'
    })
  } catch (err) {
    sendError(res, 500, 'Failed to approve application', err)
  }
}

// Reject affiliate application (admin only)
export async function rejectAffiliateApplication(pool: Pool, req: Request, res: Response) {
  try {
    const { id } = req.params
    const { rejectionReason } = req.body

    if (!rejectionReason) {
      return sendError(res, 400, 'Rejection reason is required')
    }

    const { rows } = await pool.query(`
      UPDATE affiliate_applications 
      SET status = 'rejected', rejection_reason = $1, rejected_at = $2
      WHERE id = $3
      RETURNING *
    `, [rejectionReason, new Date(), id])

    if (rows.length === 0) {
      return sendError(res, 404, 'Application not found')
    }

    sendSuccess(res, rows[0])
  } catch (err) {
    sendError(res, 500, 'Failed to reject application', err)
  }
}

// Verify affiliate code
export async function verifyAffiliateCode(pool: Pool, req: Request, res: Response) {
  try {
    const { verificationCode } = req.body
    const userId = req.userId // From auth middleware

    console.log('Verification attempt:', { verificationCode, userId })

    if (!verificationCode || verificationCode.length !== 20) {
      return sendError(res, 400, 'Invalid verification code format')
    }

    if (!userId) {
      return sendError(res, 401, 'Authentication required')
    }

    // Find affiliate partner with this code
    const { rows } = await pool.query(
      'SELECT * FROM affiliate_partners WHERE verification_code = $1',
      [verificationCode]
    )

    console.log('Found affiliate partner:', rows.length)

    if (rows.length === 0) {
      return sendError(res, 404, 'Invalid verification code')
    }

    const affiliate = rows[0]

    // Check if already verified
    if (affiliate.status === 'active') {
      // Check if this user is already linked to this affiliate
      if (affiliate.user_id === userId) {
        // User is already verified and linked
        const affiliateLink = `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}?ref=${affiliate.id}`
        return sendSuccess(res, {
          message: 'Account already verified',
          affiliateLink,
          commissionRate: affiliate.commission_rate
        })
      } else {
        // Affiliate is verified but linked to different user
        return sendError(res, 400, 'This verification code has already been used by another account')
      }
    }

    // Update affiliate status to verified
    await pool.query(`
      UPDATE affiliate_partners 
      SET status = 'active', verified_at = $1, user_id = $2
      WHERE id = $3
    `, [new Date(), userId, affiliate.id])

    // Generate affiliate link
    const affiliateLink = `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}?ref=${affiliate.id}`

    sendSuccess(res, {
      message: 'Account verified successfully',
      affiliateLink,
      commissionRate: affiliate.commission_rate
    })
  } catch (err) {
    console.error('Error in verifyAffiliateCode:', err)
    sendError(res, 500, 'Failed to verify code', err)
  }
}

// Get affiliate application status
export async function getAffiliateApplicationStatus(pool: Pool, req: Request, res: Response) {
  try {
    const userId = req.userId // From auth middleware

    if (!userId) {
      return sendError(res, 401, 'Authentication required')
    }

    // Get user's email
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId])
    if (userResult.rows.length === 0) {
      return sendError(res, 404, 'User not found')
    }

    const userEmail = userResult.rows[0].email

    // Check if there's an application for this user's email
    const appResult = await pool.query(
      'SELECT id, status, created_at FROM affiliate_applications WHERE email = $1 ORDER BY created_at DESC LIMIT 1',
      [userEmail]
    )

    if (appResult.rows.length === 0) {
      return sendSuccess(res, { status: 'not_submitted' })
    }

    const application = appResult.rows[0]
    return sendSuccess(res, {
      status: application.status,
      applicationId: application.id,
      submittedAt: application.created_at
    })
  } catch (err) {
    sendError(res, 500, 'Failed to get application status', err)
  }
}

// Get affiliate dashboard data
export async function getAffiliateDashboard(pool: Pool, req: Request, res: Response) {
  try {
    const userId = req.userId

    if (!userId) {
      return sendError(res, 401, 'Authentication required')
    }

    // First, try to get affiliate partner data by user_id (for verified partners)
    let { rows } = await pool.query(
      'SELECT * FROM affiliate_partners WHERE user_id = $1',
      [userId]
    )

    // If no verified partner found, check if there's an unverified partner for this user's email
    if (rows.length === 0) {
      // Get user's email
      const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId])
      if (userResult.rows.length > 0) {
        const userEmail = userResult.rows[0].email
        
        // Check for unverified affiliate partner with this email
        const unverifiedResult = await pool.query(
          'SELECT * FROM affiliate_partners WHERE email = $1 AND status = $2',
          [userEmail, 'unverified']
        )
        
        if (unverifiedResult.rows.length > 0) {
          rows = unverifiedResult.rows
        }
      }
    }

    if (rows.length === 0) {
      return sendError(res, 404, 'Affiliate account not found')
    }

    const affiliate = rows[0]

    // If affiliate is unverified, return basic info with verification code
    if (affiliate.status === 'unverified') {
      return sendSuccess(res, {
        ...affiliate,
        total_referrals: 0,
        completed_referrals: 0,
        total_earnings: 0,
        pending_earnings: 0,
        recent_referrals: []
      })
    }

    // Get referral statistics for verified affiliates from affiliate_referrals table
    const referralStats = await pool.query(`
      SELECT 
        COUNT(*) as total_referrals,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as completed_referrals,
        SUM(CASE WHEN status = 'confirmed' THEN order_total ELSE 0 END) as total_revenue,
        SUM(CASE WHEN status = 'confirmed' THEN commission_earned ELSE 0 END) as total_earnings
      FROM affiliate_referrals 
      WHERE affiliate_id = $1
    `, [affiliate.id])

    const stats = referralStats.rows[0]

    // Get recent referrals from affiliate_referrals table
    const recentReferrals = await pool.query(`
      SELECT 
        ar.*, o.order_number, o.status as order_status
      FROM affiliate_referrals ar
      LEFT JOIN orders o ON ar.order_id = o.id
      WHERE ar.affiliate_id = $1
      ORDER BY ar.referral_date DESC
      LIMIT 10
    `, [affiliate.id])

    sendSuccess(res, {
      ...affiliate,
      total_referrals: parseInt(stats.total_referrals || 0),
      completed_referrals: parseInt(stats.completed_referrals || 0),
      total_earnings: parseFloat(stats.total_earnings || 0),
      pending_earnings: parseFloat(stats.total_earnings || 0) * 0.8, // 80% available for payout
      recent_referrals: recentReferrals.rows
    })
  } catch (err) {
    console.error('Error in getAffiliateDashboard:', err)
    sendError(res, 500, 'Failed to fetch affiliate data', err)
  }
}

// Get affiliate referrals
export async function getAffiliateReferrals(pool: Pool, req: Request, res: Response) {
  try {
    const userId = req.userId
    const { page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    // Get affiliate partner
    const affiliateResult = await pool.query(
      'SELECT id FROM affiliate_partners WHERE user_id = $1',
      [userId]
    )

    if (affiliateResult.rows.length === 0) {
      return sendError(res, 404, 'Affiliate account not found')
    }

    const affiliateId = affiliateResult.rows[0].id

    // Get referrals from affiliate_referrals table
    const { rows } = await pool.query(`
      SELECT 
        ar.*, o.order_number, o.status as order_status
      FROM affiliate_referrals ar
      LEFT JOIN orders o ON ar.order_id = o.id
      WHERE ar.affiliate_id = $1
      ORDER BY ar.referral_date DESC
      LIMIT $2 OFFSET $3
    `, [affiliateId, Number(limit), offset])

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM affiliate_referrals WHERE affiliate_id = $1',
      [affiliateId]
    )
    const total = parseInt(countResult.rows[0].count)

    sendSuccess(res, {
      referrals: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (err) {
    console.error('Error in getAffiliateReferrals:', err)
    sendError(res, 500, 'Failed to fetch referrals', err)
  }
}

// Generate new verification code (admin only)
export async function regenerateVerificationCode(pool: Pool, req: Request, res: Response) {
  try {
    const { id } = req.params
    const newCode = generateVerificationCode()

    const { rows } = await pool.query(`
      UPDATE affiliate_partners 
      SET verification_code = $1, status = $2, verified_at = NULL
      WHERE id = $3
      RETURNING *
    `, [newCode, 'unverified', id])

    if (rows.length === 0) {
      return sendError(res, 404, 'Affiliate partner not found')
    }

    sendSuccess(res, {
      verificationCode: newCode,
      message: 'New verification code generated'
    })
  } catch (err) {
    sendError(res, 500, 'Failed to regenerate code', err)
  }
}
