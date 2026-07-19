const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const sqlPath = path.join(__dirname, 'supabase_schema.sql');
console.log('Reading schema file:', sqlPath);
const sql = fs.readFileSync(sqlPath, 'utf8');

// Connection string
const connectionString = 'postgresql://postgres:Reconnectmobile%401810@db.rcdgwmgazvgexqkrgijp.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    console.log('Connecting to remote Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected! Executing schema SQL script...');
    await client.query(sql);
    console.log('Database tables and seed data initialized successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
