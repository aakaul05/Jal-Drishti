-- ============================================================================
-- GROUNDWATER PREDICTION TABLES
-- ============================================================================
-- Two tables to store model output from run_pipeline.py:
-- 1. groundwater_predictions   — per village per season (4 rows per village)
-- 2. groundwater_village_risk  — aggregated per village (1 row per village)
--
-- Run this SQL in Supabase Dashboard → SQL Editor BEFORE running the pipeline.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 1: groundwater_predictions
-- Stores per-season predictions (from predictions_by_season.csv)
-- ────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.groundwater_predictions CASCADE;

CREATE TABLE public.groundwater_predictions (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- Location

    district text NOT NULL,
    block text NOT NULL,
    village text NOT NULL,

    -- Season: 'Jan', 'May', 'Aug', 'Nov'
    season text NOT NULL,

    -- Model output
    actual_2024 numeric(8,3),              -- actual value (nullable if unknown)
    predicted_2024 numeric(8,3) NOT NULL,
    predicted_2025 numeric(8,3) NOT NULL,
    difference numeric(8,3),               -- actual - predicted
    abs_difference numeric(8,3),

    -- Risk classification
    risk_level text NOT NULL,              -- 'SAFE', 'MODERATE', 'HIGH', 'CRITICAL'

    created_at timestamptz DEFAULT now(),

    -- One row per village per season
    UNIQUE (district, block, village, season)
);

-- Indexes
CREATE INDEX idx_pred_district ON public.groundwater_predictions(district);
CREATE INDEX idx_pred_block ON public.groundwater_predictions(block);
CREATE INDEX idx_pred_village ON public.groundwater_predictions(village);
CREATE INDEX idx_pred_risk ON public.groundwater_predictions(risk_level);

-- RLS
ALTER TABLE public.groundwater_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_predictions" ON public.groundwater_predictions
    FOR SELECT USING (true);
CREATE POLICY "service_write_predictions" ON public.groundwater_predictions
    FOR ALL USING (true);


-- ────────────────────────────────────────────────────────────────────────────
-- TABLE 2: groundwater_village_risk
-- Stores aggregated village-level risk (from village_risk_summary.csv)
-- ────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS public.groundwater_village_risk CASCADE;

CREATE TABLE public.groundwater_village_risk (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Location
    district text NOT NULL,
    block text NOT NULL,
    village text NOT NULL,

    -- Aggregated model output (average across 4 seasons)
    avg_actual_2024 numeric(8,3),
    avg_predicted_2024 numeric(8,3),
    avg_predicted_2025 numeric(8,3),
    avg_difference numeric(8,3),
    avg_abs_difference numeric(8,3),

    -- Overall risk classification
    risk_level text NOT NULL,              -- 'SAFE', 'MODERATE', 'HIGH', 'CRITICAL'

    created_at timestamptz DEFAULT now(),

    -- One row per village
    UNIQUE (district, block, village)
);

-- Indexes
CREATE INDEX idx_vrisk_district ON public.groundwater_village_risk(district);
CREATE INDEX idx_vrisk_block ON public.groundwater_village_risk(block);
CREATE INDEX idx_vrisk_village ON public.groundwater_village_risk(village);
CREATE INDEX idx_vrisk_risk ON public.groundwater_village_risk(risk_level);

-- RLS
ALTER TABLE public.groundwater_village_risk ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_village_risk" ON public.groundwater_village_risk
    FOR SELECT USING (true);
CREATE POLICY "service_write_village_risk" ON public.groundwater_village_risk
    FOR ALL USING (true);
