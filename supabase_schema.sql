-- SQL Schema for TR Moreira Logistics
-- Copy and paste this into your Supabase SQL Editor

-- 1. Create Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    truck_id UUID, -- Fixed Truck (Cavalo)
    current_trailer_id UUID, -- Dynamic Trailer (Carreta)
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Trucks Table
CREATE TABLE IF NOT EXISTS trucks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plate TEXT NOT NULL UNIQUE,
    model TEXT,
    type TEXT CHECK (type IN ('cavalo', 'carreta')),
    status TEXT DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Trips Table
CREATE TABLE IF NOT EXISTS trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID REFERENCES drivers(id),
    truck_id UUID REFERENCES trucks(id),
    type TEXT CHECK (type IN ('ida', 'volta')),
    origin TEXT,
    destination TEXT,
    loading_date DATE,
    freight_value DECIMAL(12,2),
    advance_value DECIMAL(12,2),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Debts Table
CREATE TABLE IF NOT EXISTS debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    total_value DECIMAL(12,2),
    due_date DATE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Add Foreign Key for drivers -> trucks (Fixed Truck)
ALTER TABLE drivers 
ADD CONSTRAINT fk_driver_truck FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE SET NULL;

-- 6. Add Foreign Key for drivers -> trucks (Current Trailer)
ALTER TABLE drivers 
ADD CONSTRAINT fk_driver_trailer FOREIGN KEY (current_trailer_id) REFERENCES trucks(id) ON DELETE SET NULL;

-- Enable RLS (Optional but recommended for production)
-- For now, we'll keep it simple. If you enable RLS, you need to add policies.
-- ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Simple "Allow All" policies for development (NOT FOR PRODUCTION)
-- CREATE POLICY "Allow all" ON drivers FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON trucks FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON trips FOR ALL USING (true);
-- CREATE POLICY "Allow all" ON debts FOR ALL USING (true);
