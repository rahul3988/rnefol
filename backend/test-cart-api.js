// Test cart API
require('dotenv').config()
const { Pool } = require('pg')

const connectionString = 'postgresql://nofol_users:Jhx82ndc9g@j@localhost:5432/nefol'
const pool = new Pool({ connectionString })

async function testCartAPI() {
  try {
    console.log('🔍 Testing cart API response...\n')
    
    // Get user with cart items
    const usersWithCart = await pool.query(`
      SELECT DISTINCT u.id, u.name, u.email
      FROM users u
      INNER JOIN cart c ON u.id = c.user_id
      LIMIT 1
    `)
    
    if (usersWithCart.rows.length === 0) {
      console.log('❌ No users with cart items found')
      return
    }
    
    const testUser = usersWithCart.rows[0]
    console.log(`✅ Testing with user: ${testUser.name} (ID: ${testUser.id})`)
    console.log(`   Email: ${testUser.email}\n`)
    
    // Simulate backend getCart response
    const cartResponse = await pool.query(`
      SELECT c.*, p.title, p.price, p.list_image, p.slug, p.details
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `, [testUser.id])
    
    console.log('📦 Cart items from database:')
    console.log('─'.repeat(70))
    
    if (cartResponse.rows.length === 0) {
      console.log('  (No items)')
    } else {
      cartResponse.rows.forEach((item, index) => {
        console.log(`\nItem ${index + 1}:`)
        console.log(`  ID: ${item.id}`)
        console.log(`  Product ID: ${item.product_id}`)
        console.log(`  Title: ${item.title}`)
        console.log(`  Slug: ${item.slug}`)
        console.log(`  Price: ${item.price}`)
        console.log(`  List Image: ${item.list_image ? 'Yes' : 'No'}`)
        console.log(`  Quantity: ${item.quantity}`)
        console.log(`  Created: ${item.created_at}`)
        
        // Check details for discounted price
        if (item.details) {
          const details = typeof item.details === 'string' ? JSON.parse(item.details) : item.details
          if (details.mrp && details.websitePrice) {
            console.log(`  MRP: ${details.mrp}`)
            console.log(`  Website Price: ${details.websitePrice}`)
            console.log(`  Discount: ${details.discountPercent}%`)
          }
        }
      })
    }
    
    console.log('\n' + '─'.repeat(70))
    console.log(`\nTotal items: ${cartResponse.rows.length}`)
    
    // Check if response matches frontend expectations
    console.log('\n🔍 Frontend expects these fields:')
    console.log('  - id (cart item ID)')
    console.log('  - product_id')
    console.log('  - slug')
    console.log('  - title')
    console.log('  - price')
    console.log('  - image (list_image)')
    console.log('  - quantity')
    console.log('  - category (optional)')
    console.log('  - mrp (optional)')
    console.log('  - discounted_price (optional)')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await pool.end()
  }
}

testCartAPI()

