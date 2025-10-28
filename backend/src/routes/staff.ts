import { Request, Response } from 'express'
import { Pool } from 'pg'
import { sendError, sendSuccess, validateRequired } from '../utils/apiHelpers'

export async function createRole(pool: Pool, req: Request, res: Response) {
  try {
    const { name, description } = req.body || {}
    const validationError = validateRequired({ name }, ['name'])
    if (validationError) return sendError(res, 400, validationError)
    const { rows } = await pool.query(
      `insert into roles (name, description, created_at, updated_at) values ($1, $2, now(), now()) returning *`,
      [name, description || null]
    )
    sendSuccess(res, rows[0], 201)
  } catch (err) {
    sendError(res, 500, 'Failed to create role', err)
  }
}

export async function listRoles(pool: Pool, req: Request, res: Response) {
  try {
    const { rows } = await pool.query('select * from roles order by name asc')
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to list roles', err)
  }
}

export async function createPermission(pool: Pool, req: Request, res: Response) {
  try {
    const { code, description } = req.body || {}
    const validationError = validateRequired({ code }, ['code'])
    if (validationError) return sendError(res, 400, validationError)
    const { rows } = await pool.query(
      `insert into permissions (code, description) values ($1, $2) returning *`,
      [code, description || null]
    )
    sendSuccess(res, rows[0], 201)
  } catch (err) {
    sendError(res, 500, 'Failed to create permission', err)
  }
}

export async function assignPermissionToRole(pool: Pool, req: Request, res: Response) {
  try {
    const { roleId, permissionId } = req.body || {}
    const validationError = validateRequired({ roleId, permissionId }, ['roleId', 'permissionId'])
    if (validationError) return sendError(res, 400, validationError)
    await pool.query(
      `insert into role_permissions (role_id, permission_id) values ($1, $2) on conflict do nothing`,
      [roleId, permissionId]
    )
    sendSuccess(res, { roleId, permissionId }, 201)
  } catch (err) {
    sendError(res, 500, 'Failed to assign permission', err)
  }
}

export async function createStaff(pool: Pool, req: Request, res: Response) {
  try {
    const { name, email, password } = req.body || {}
    const validationError = validateRequired({ name, email, password }, ['name', 'email', 'password'])
    if (validationError) return sendError(res, 400, validationError)
    const { rows } = await pool.query(
      `insert into staff_users (name, email, password, created_at, updated_at) values ($1, $2, $3, now(), now()) returning *`,
      [name, email, password]
    )
    sendSuccess(res, rows[0], 201)
  } catch (err) {
    sendError(res, 500, 'Failed to create staff user', err)
  }
}

export async function assignRoleToStaff(pool: Pool, req: Request, res: Response) {
  try {
    const { staffId, roleId } = req.body || {}
    const validationError = validateRequired({ staffId, roleId }, ['staffId', 'roleId'])
    if (validationError) return sendError(res, 400, validationError)
    await pool.query(
      `insert into staff_roles (staff_id, role_id) values ($1, $2) on conflict do nothing`,
      [staffId, roleId]
    )
    sendSuccess(res, { staffId, roleId }, 201)
  } catch (err) {
    sendError(res, 500, 'Failed to assign role to staff', err)
  }
}

export async function listStaff(pool: Pool, req: Request, res: Response) {
  try {
    const { rows } = await pool.query(
      `select su.*, coalesce(json_agg(r.*) filter (where r.id is not null), '[]'::json) as roles
       from staff_users su
       left join staff_roles sr on sr.staff_id = su.id
       left join roles r on r.id = sr.role_id
       group by su.id
       order by su.created_at desc`
    )
    sendSuccess(res, rows)
  } catch (err) {
    sendError(res, 500, 'Failed to list staff users', err)
  }
}


