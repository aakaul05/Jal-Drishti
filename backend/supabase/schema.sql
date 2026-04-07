-- =============================================================================
-- JAL-DRISHTI — Supabase Schema (Simple)
-- Run this in Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================


-- ========================
-- 1. LOCATION HIERARCHY
-- ========================

-- Districts (35 in Maharashtra)
CREATE TABLE IF NOT EXISTS mh_districts (
    id              BIGSERIAL PRIMARY KEY,
    district_code   INTEGER NOT NULL UNIQUE,
    district_name   VARCHAR(100) NOT NULL,
    state_name      VARCHAR(50) NOT NULL DEFAULT 'Maharashtra',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sub-districts / Talukas (358 in Maharashtra)
CREATE TABLE IF NOT EXISTS mh_subdistricts (
    id                  BIGSERIAL PRIMARY KEY,
    subdistrict_code    INTEGER NOT NULL UNIQUE,
    subdistrict_name    VARCHAR(100) NOT NULL,
    district_code       INTEGER NOT NULL REFERENCES mh_districts(district_code) ON DELETE CASCADE,
    district_name       VARCHAR(100) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Villages (44,801 in Maharashtra)
CREATE TABLE IF NOT EXISTS mh_villages (
    id                  BIGSERIAL PRIMARY KEY,
    village_code        BIGINT NOT NULL UNIQUE,
    village_name        VARCHAR(150) NOT NULL,
    subdistrict_code    INTEGER NOT NULL REFERENCES mh_subdistricts(subdistrict_code) ON DELETE CASCADE,
    district_code       INTEGER NOT NULL REFERENCES mh_districts(district_code) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mh_sub_district   ON mh_subdistricts(district_code);
CREATE INDEX IF NOT EXISTS idx_mh_vil_sub        ON mh_villages(subdistrict_code);
CREATE INDEX IF NOT EXISTS idx_mh_vil_district   ON mh_villages(district_code);
CREATE INDEX IF NOT EXISTS idx_mh_vil_name       ON mh_villages(village_name);


-- ========================
-- 2. GROUNDWATER DATA
-- Only 4 months of depth readings per year
-- ========================

CREATE TABLE IF NOT EXISTS groundwater_levels (
    id              BIGSERIAL PRIMARY KEY,
    village_code    BIGINT NOT NULL REFERENCES mh_villages(village_code) ON DELETE CASCADE,
    year            SMALLINT NOT NULL CHECK (year BETWEEN 2000 AND 2099),
    month           SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    depth_meters    DECIMAL(8, 2) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (village_code, year, month)
);

CREATE INDEX IF NOT EXISTS idx_gw_village_year ON groundwater_levels(village_code, year);


-- ========================
-- 3. ROW LEVEL SECURITY (Public Read)
-- ========================

ALTER TABLE mh_districts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mh_subdistricts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mh_villages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE groundwater_levels   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON mh_districts        FOR SELECT USING (true);
CREATE POLICY "public_read" ON mh_subdistricts     FOR SELECT USING (true);
CREATE POLICY "public_read" ON mh_villages         FOR SELECT USING (true);
CREATE POLICY "public_read" ON groundwater_levels  FOR SELECT USING (true);


-- ========================
-- DONE
-- ========================
-- mh_districts         → 35 rows
-- mh_subdistricts      → 358 rows
-- mh_villages          → 44,801 rows
-- groundwater_levels   → 4 readings/year/village (depth only)
