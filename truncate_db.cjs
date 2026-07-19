const { Client } = require('pg');

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
    console.log('Truncating all tables...');
    await client.query('TRUNCATE TABLE activity_logs, timeline_events, payments, billing_items, repairs, inventory, customers, suppliers, inventory_movements CASCADE;');
    console.log('All dummy data successfully erased from remote database!');
  } catch (err) {
    console.error('Truncation failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
