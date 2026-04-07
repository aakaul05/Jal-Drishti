-- =============================================================================
-- JAL-DRISHTI — Random Forest Model Tables
-- Run this in Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================


-- ========================
-- 1. MODEL TRAINING RUNS
-- Stores metadata for each RF training run per village
-- ========================
CREATE TABLE IF NOT EXISTS rf_model_runs (
    id                  BIGSERIAL PRIMARY KEY,
    village_code        BIGINT NOT NULL REFERENCES mh_villages(village_code) ON DELETE CASCADE,
    trained_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Model hyperparameters
    algorithm           VARCHAR(100) NOT NULL DEFAULT 'RandomForestRegressor',
    n_estimators        INTEGER NOT NULL DEFAULT 100,
    max_depth           INTEGER,
    min_samples_split   INTEGER NOT NULL DEFAULT 2,
    -- Training info
    training_samples    INTEGER NOT NULL,
    training_year_min   SMALLINT NOT NULL,
    training_year_max   SMALLINT NOT NULL,
    -- Evaluation metrics
    r_squared_train     DECIMAL(8, 6),
    r_squared_cv        DECIMAL(8, 6),
    mae                 DECIMAL(8, 4),
    rmse                DECIMAL(8, 4),
    -- Feature importance as JSON
    feature_importance  JSONB,
    -- Status
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rf_runs_village ON rf_model_runs(village_code);
CREATE INDEX IF NOT EXISTS idx_rf_runs_active  ON rf_model_runs(village_code, is_active) WHERE is_active = TRUE;


-- ========================
-- 2. GROUNDWATER PREDICTIONS
-- Stores RF predictions in same format as groundwater_levels
-- ========================
CREATE TABLE IF NOT EXISTS groundwater_predictions (
    id                      BIGSERIAL PRIMARY KEY,
    village_code            BIGINT NOT NULL REFERENCES mh_villages(village_code) ON DELETE CASCADE,
    year                    SMALLINT NOT NULL CHECK (year BETWEEN 2000 AND 2099),
    month                   SMALLINT NOT NULL CHECK (month IN (1, 5, 8, 11)),
    predicted_depth_meters  DECIMAL(8, 2) NOT NULL,
    confidence_low          DECIMAL(8, 2),
    confidence_high         DECIMAL(8, 2),
    std_dev                 DECIMAL(8, 4),
    -- Link to the model run that produced this prediction
    model_run_id            BIGINT REFERENCES rf_model_runs(id) ON DELETE CASCADE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (village_code, year, month)
);

CREATE INDEX IF NOT EXISTS idx_gw_pred_village_year ON groundwater_predictions(village_code, year);
CREATE INDEX IF NOT EXISTS idx_gw_pred_model_run    ON groundwater_predictions(model_run_id);


-- ========================
-- 3. ROW LEVEL SECURITY (Public Read)
-- ========================
ALTER TABLE rf_model_runs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE groundwater_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON rf_model_runs          FOR SELECT USING (true);
CREATE POLICY "public_read" ON groundwater_predictions FOR SELECT USING (true);

-- Allow backend service role to INSERT/UPDATE/DELETE
CREATE POLICY "service_write" ON rf_model_runs
    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_write" ON groundwater_predictions
    FOR ALL USING (true) WITH CHECK (true);


-- ========================
-- DONE
-- ========================
-- rf_model_runs          → 1 row per training run per village
-- groundwater_predictions → 4 rows per year per village (months 1, 5, 8, 11)
--                           Same depth format as groundwater_levels
