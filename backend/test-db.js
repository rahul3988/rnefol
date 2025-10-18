// Quick test to check database connection
require('dotenv/config');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/nefol';
console.log('Trying to connect to:', connectionString.replace(/:[^:@]+@/, ':****@'));

const pool = new Pool({ connectionString });

pool.query('SELECT NOW()').then((result) => {
  console.log('✅ Database connection successful!');
  console.log('Server time:', result.rows[0].now);
  process.exit(0);
}).catch((err) => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});

