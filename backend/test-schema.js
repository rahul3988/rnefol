// Test schema initialization
require('dotenv/config');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/nefol';
const pool = new Pool({ connectionString });

// Import the ensureSchema function
const { ensureSchema } = require('./dist/utils/schema.js');

console.log('🧪 Testing schema initialization...');

ensureSchema(pool)
  .then(() => {
    console.log('✅ Schema initialized successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Schema initialization failed:');
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    console.error('Detail:', err.detail);
    process.exit(1);
  });

