-- RepairOS PostgreSQL Schema DDL
-- Run this script inside your Supabase project SQL Editor to initialize all tables

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    city TEXT DEFAULT 'Raipur, Chhattisgarh',
    is_vip BOOLEAN DEFAULT FALSE,
    total_spent NUMERIC DEFAULT 0,
    pending_amount NUMERIC DEFAULT 0,
    total_jobs INTEGER DEFAULT 0,
    last_visit TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    part_number TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    reserved INTEGER DEFAULT 0,
    available INTEGER DEFAULT 0,
    cost_price NUMERIC DEFAULT 0,
    sale_price NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'In Stock',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Repairs Table
CREATE TABLE IF NOT EXISTS repairs (
    id TEXT PRIMARY KEY, -- e.g. R-23910
    type TEXT NOT NULL CHECK (type IN ('CS', 'DS')),
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    device_brand TEXT NOT NULL,
    device_model TEXT NOT NULL,
    device_color TEXT,
    device_imei TEXT,
    device_serial TEXT,
    complaint TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Received',
    technician TEXT,
    received_at TEXT NOT NULL,
    expected_delivery TEXT,
    time TEXT NOT NULL,
    estimated_cost NUMERIC DEFAULT 0,
    advance_paid NUMERIC DEFAULT 0,
    remaining_balance NUMERIC DEFAULT 0,
    accessories TEXT[] DEFAULT '{}',
    scratches TEXT DEFAULT 'None',
    dents TEXT DEFAULT 'None',
    display_condition TEXT DEFAULT 'Working',
    back_glass_condition TEXT DEFAULT 'Clean',
    tests JSONB DEFAULT '[]'::jsonb,
    diagnosis_issue TEXT,
    diagnosis_cause TEXT,
    diagnosis_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Billing Items Table (Spare parts & services logged on job)
CREATE TABLE IF NOT EXISTS billing_items (
    id TEXT PRIMARY KEY,
    repair_id TEXT REFERENCES repairs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repair_id TEXT REFERENCES repairs(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    method TEXT NOT NULL,
    time TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Timeline Events Table
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repair_id TEXT REFERENCES repairs(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    time TEXT NOT NULL,
    date TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    time TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- End of Schema definition (Seed data removed for production deployment)
