// Test fetching orders for user 16
require('dotenv').config()
const { Pool } = require('pg')

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/nefol'
const pool = new Pool({ connectionString })

async function testUserOrders() {
  try {
    console.log('🔍 Testing order fetch for user 16...\n')
    
    // Get user 16 info
    const user = await pool.query('SELECT id, name, email FROM users WHERE id = 16')
    if (user.rows.length === 0) {
      console.log('❌ User 16 not found')
      return
    }
    
    console.log('👤 User 16:')
    console.log(`   Name: ${user.rows[0].name}`)
    console.log(`   Email: ${user.rows[0].email}`)
    console.log()
    
    const userEmail = user.rows[0].email
    
    // Method 1: Check by customer_email
    console.log('📧 Method 1: Finding orders by customer_email...')
    const ordersByEmail = await pool.query(`
      SELECT order_number, customer_name, customer_email, total, status, created_at
      FROM orders 
      WHERE customer_email = $1
      ORDER BY created_at DESC
    `, [userEmail])
    
    if (ordersByEmail.rows.length > 0) {
      console.log(`✅ Found ${ordersByEmail.rows.length} order(s) by email:`)
      ordersByEmail.rows.forEach(order => {
        console.log(`   - ${order.order_number} | ${order.status} | ₹${order.total} | ${order.created_at}`)
      })
    } else {
      console.log('   ❌ No orders found by email')
      
      // Method 2: Check by user_id in items array
      console.log('\n📦 Method 2: Finding orders by user_id in items...')
      const ordersByUserId = await pool.query(`
        SELECT order_number, customer_name, customer_email, total, status, created_at
        FROM orders o
        WHERE EXISTS (
          SELECT 1 
          FROM jsonb_array_elements(o.items) as item
          WHERE (item->>'user_id')::int = 16
        )
        ORDER BY created_at DESC
      `)
      
      if (ordersByUserId.rows.length > 0) {
        console.log(`✅ Found ${ordersByUserId.rows.length} order(s) by user_id in items:`)
        ordersByUserId.rows.forEach(order => {
          console.log(`   - ${order.order_number} | ${order.status} | ₹${order.total}`)
        })
      } else {
        console.log('   ❌ No orders found by user_id in items')
      }
    }
    
    console.log('\n🎯 Checking specific order NEFOL-1761643493899...')
    const specificOrder = await pool.query(`
      SELECT order_number, customer_email, items
      FROM orders 
      WHERE order_number = 'NEFOL-1761643493899'
    `)
    
    if (specificOrder.rows.length > 0) {
      const order = specificOrder.rows[0]
      console.log(`   Order found: ${order.order_number}`)
      console.log(`   Customer email: ${order.customer_email}`)
      console.log(`   User 16 email: ${userEmail}`)
      console.log(`   Emails match: ${order.customer_email === userEmail ? '✅ YES' : '❌ NO'}`)
      
      // Check user_id in items
      const items = order.items
      const userIds = items.map(item => item.user_id).filter(Boolean)
      console.log(`   User IDs in items: ${userIds.join(', ') || 'none'}`)
      console.log(`   Contains user 16: ${userIds.includes(16) ? '✅ YES' : '❌ NO'}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

testUserOrders()

