-- ============================================================
--  Maharashtra Local Government Directory - Supabase Migration
--  State Code: 27
--  Generated: 2026-03-26
--  Tables: mh_districts, mh_subdistricts, mh_villages
-- ============================================================

-- DISTRICTS TABLE
CREATE TABLE IF NOT EXISTS mh_districts (
    id SERIAL PRIMARY KEY,
    district_code INTEGER NOT NULL UNIQUE,
    district_version INTEGER,
    district_name TEXT NOT NULL,
    state_code INTEGER NOT NULL DEFAULT 27,
    state_name TEXT NOT NULL DEFAULT 'Maharashtra',
    census_2001_code INTEGER,
    census_2011_code INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBDISTRICTS TABLE
CREATE TABLE IF NOT EXISTS mh_subdistricts (
    id SERIAL PRIMARY KEY,
    subdistrict_code INTEGER NOT NULL UNIQUE,
    subdistrict_version INTEGER,
    subdistrict_name TEXT NOT NULL,
    district_code INTEGER NOT NULL REFERENCES mh_districts(district_code),
    district_name TEXT NOT NULL,
    census_2011_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VILLAGES TABLE
CREATE TABLE IF NOT EXISTS mh_villages (
    id SERIAL PRIMARY KEY,
    village_code BIGINT NOT NULL UNIQUE,
    village_version INTEGER,
    village_name TEXT NOT NULL,
    subdistrict_code INTEGER NOT NULL REFERENCES mh_subdistricts(subdistrict_code),
    district_code INTEGER NOT NULL REFERENCES mh_districts(district_code),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_mh_subdistricts_district ON mh_subdistricts(district_code);
CREATE INDEX IF NOT EXISTS idx_mh_villages_subdistrict ON mh_villages(subdistrict_code);
CREATE INDEX IF NOT EXISTS idx_mh_villages_district ON mh_villages(district_code);
CREATE INDEX IF NOT EXISTS idx_mh_villages_name ON mh_villages(village_name);

-- RLS (Row Level Security) Policies
ALTER TABLE mh_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mh_subdistricts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mh_villages ENABLE ROW LEVEL SECURITY;

-- Public read access for regional data
CREATE POLICY "Public read access for districts" ON mh_districts
    FOR SELECT USING (true);

CREATE POLICY "Public read access for sub-districts" ON mh_subdistricts
    FOR SELECT USING (true);

CREATE POLICY "Public read access for villages" ON mh_villages
    FOR SELECT USING (true);

-- Function to auto-update updated_at timestamp (if needed in future)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
