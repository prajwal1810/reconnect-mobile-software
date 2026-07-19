const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Reconnectmobile%401810@db.rcdgwmgazvgexqkrgijp.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const sql = `
  -- Add location column to inventory
  ALTER TABLE inventory ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Main Stock';

  -- Drop the old unique constraint on part_number
  ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_part_number_key;

  -- Add a unique constraint on (part_number, location)
  ALTER TABLE inventory ADD CONSTRAINT inventory_part_number_location_key UNIQUE (part_number, location);

  -- Create inventory_movements table
  CREATE TABLE IF NOT EXISTS inventory_movements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      from_location TEXT NOT NULL,
      to_location TEXT NOT NULL,
      reason TEXT NOT NULL,
      notes TEXT,
      performed_by TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

async function run() {
  try {
    console.log('Connecting to remote Supabase database...');
    await client.connect();
    console.log('Connected! Running SQL statements to update inventory schema...');
    await client.query(sql);
    console.log('Schema updated successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
