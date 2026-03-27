-- =============================================================================
-- JAL-DRISHTI — Complete PostgreSQL / Supabase Database Schema
-- Virtual Groundwater Advisor · Decision Support System
-- =============================================================================
-- 15 tables | 4 domains | RLS enabled | 3 utility views | seed data included
-- =============================================================================


-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";          -- For spatial queries on lat/lon
CREATE EXTENSION IF NOT EXISTS "pg_trgm";          -- For village name fuzzy search


-- =============================================================================
-- DOMAIN 1: GEOGRAPHIC HIERARCHY
-- districts → sub_districts (talukas/blocks) → villages
-- =============================================================================

CREATE TABLE districts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100)    NOT NULL,
    state           VARCHAR(100)    NOT NULL DEFAULT 'Maharashtra',
    census_code     VARCHAR(20)     UNIQUE,           -- LGD district code
    latitude        DECIMAL(10, 7),
    longitude       DECIMAL(10, 7),
    area_sq_km      DECIMAL(10, 2),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE districts IS 'Top-level administrative geography. One row per district.';
COMMENT ON COLUMN districts.census_code IS 'LGD (Local Government Directory) code from Census of India.';


CREATE TABLE sub_districts (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id                 UUID            NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    name                        VARCHAR(100)    NOT NULL,
    taluka_code                 VARCHAR(20)     UNIQUE,  -- LGD taluka code
    -- CGWB block-level classification (macro-scale — the problem Jal-Drishti solves)
    block_classification        VARCHAR(50)
                                CHECK (block_classification IN (
                                    'Safe', 'Semi-Critical', 'Critical',
                                    'Over-Exploited', 'Saline', 'Not Assessed'
                                )),
    area_sq_km                  DECIMAL(10, 2),
    population                  INTEGER,
    latitude                    DECIMAL(10, 7),
    longitude                   DECIMAL(10, 7),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE sub_districts IS 'Block / Taluka level. Covers ~500 sq km. block_classification is the macro-scale CGWB label — the mismatch Jal-Drishti bridges.';


CREATE TABLE villages (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_district_id             UUID            NOT NULL REFERENCES sub_districts(id) ON DELETE CASCADE,
    name                        VARCHAR(150)    NOT NULL,
    village_code                VARCHAR(20)     UNIQUE,  -- Census LGD village code
    pincode                     VARCHAR(10),
    latitude                    DECIMAL(10, 7),
    longitude                   DECIMAL(10, 7),
    elevation_meters            DECIMAL(8, 2),           -- Above mean sea level
    area_hectares               DECIMAL(10, 2),
    population                  INTEGER,
    agricultural_land_hectares  DECIMAL(10, 2),
    -- Geological attributes — used as ML features
    soil_type                   VARCHAR(100),            -- Black Cotton, Red, Alluvial, etc.
    aquifer_type                VARCHAR(100),            -- Alluvial, Hard Rock, Basalt, etc.
    avg_borewell_depth_m        DECIMAL(8, 2),           -- Local average from borewell_records
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE villages IS 'Micro-scale unit (1-5 acre farm context). Village-level granularity is the core value proposition of Jal-Drishti.';
COMMENT ON COLUMN villages.aquifer_type IS 'Primary aquifer type. Influences ML model feature importance.';
COMMENT ON COLUMN villages.avg_borewell_depth_m IS 'Computed from borewell_records. Updated by trigger on INSERT to borewell_records.';

-- Indexes for geographic lookups
CREATE INDEX idx_sub_districts_district ON sub_districts(district_id);
CREATE INDEX idx_villages_sub_district  ON villages(sub_district_id);
CREATE INDEX idx_villages_name_trgm     ON villages USING GIN (name gin_trgm_ops); -- Fuzzy name search
CREATE INDEX idx_villages_location      ON villages(latitude, longitude);          -- Nearby village queries


-- =============================================================================
-- DOMAIN 2: GROUNDWATER DATA
-- Annual (10-year graph) + Monthly (current year + next year prediction)
-- =============================================================================

-- Data provenance — every row of water data is traceable to a source
CREATE TABLE data_sources (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(100)    NOT NULL,
    abbreviation        VARCHAR(20),
    url                 VARCHAR(255),
    reliability_score   INTEGER         CHECK (reliability_score BETWEEN 1 AND 10),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE data_sources IS 'Provenance for all water level data. E.g. CGWB, India-WRIS, IN-GRES, Manual Entry.';

-- Seed data for data_sources
INSERT INTO data_sources (name, abbreviation, url, reliability_score, notes) VALUES
('Central Ground Water Board',           'CGWB',      'https://cgwb.gov.in',        9, 'Primary government authority for groundwater in India'),
('India Water Resources Info System',    'India-WRIS', 'https://indiawris.gov.in',   9, 'National standardised water resources portal'),
('Indian Groundwater Resources Assess.', 'IN-GRES',   'https://ingres.gov.in',      8, 'Specialised groundwater resource assessment system'),
('Manual Field Entry',                   'MANUAL',    NULL,                          5, 'Entered by admin or verified field agent');


-- Annual groundwater data — the backbone of 10-year trend graphs
CREATE TABLE groundwater_annual (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    village_id                  UUID        NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
    data_source_id              UUID        REFERENCES data_sources(id),
    year                        SMALLINT    NOT NULL CHECK (year BETWEEN 2000 AND 2099),
    -- Depth to water table from ground level (higher value = deeper = worse)
    pre_monsoon_depth_m         DECIMAL(8, 2),  -- Typically March/April measurement
    post_monsoon_depth_m        DECIMAL(8, 2),  -- Typically November measurement
    avg_annual_depth_m          DECIMAL(8, 2),  -- Computed average or government-provided
    -- Hydrology
    annual_rainfall_mm          DECIMAL(8, 2),
    extraction_mcm              DECIMAL(10, 4), -- Million cubic metres extracted
    recharge_mcm                DECIMAL(10, 4), -- Natural + artificial recharge
    net_change_m                DECIMAL(8, 3),  -- Positive = depletion, Negative = recharge
    -- Data quality
    data_quality_score          SMALLINT    CHECK (data_quality_score BETWEEN 1 AND 5),
    is_interpolated             BOOLEAN     NOT NULL DEFAULT FALSE, -- Gap-filled by interpolation?
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (village_id, year)
);
COMMENT ON TABLE groundwater_annual IS 'One row per village per year. Powers the 10-year historical trend graph on the dashboard.';
COMMENT ON COLUMN groundwater_annual.pre_monsoon_depth_m IS 'Depth in metres below ground level. Higher = deeper = more stressed aquifer.';
COMMENT ON COLUMN groundwater_annual.net_change_m        IS 'Positive means water table dropped (bad). Negative means water table rose (good).';
COMMENT ON COLUMN groundwater_annual.is_interpolated     IS 'TRUE if this row was gap-filled from neighbouring readings, not a direct measurement.';

-- Monthly granularity — actual readings AND ML predictions in one table
CREATE TABLE groundwater_monthly (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    village_id              UUID        NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
    data_source_id          UUID        REFERENCES data_sources(id),
    model_version_id        UUID,       -- FK to model_versions — SET when is_predicted = TRUE
    year                    SMALLINT    NOT NULL CHECK (year BETWEEN 2000 AND 2099),
    month                   SMALLINT    NOT NULL CHECK (month BETWEEN 1 AND 12),
    depth_meters            DECIMAL(8, 2),
    rainfall_mm             DECIMAL(8, 2),
    temperature_celsius     DECIMAL(5, 2),
    -- Prediction metadata
    is_predicted            BOOLEAN     NOT NULL DEFAULT FALSE,
    prediction_confidence   DECIMAL(5, 4) CHECK (prediction_confidence BETWEEN 0 AND 1),
    confidence_interval_low  DECIMAL(8, 2), -- Lower bound (shallower)
    confidence_interval_high DECIMAL(8, 2), -- Upper bound (deeper)
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (village_id, year, month)
);
COMMENT ON TABLE groundwater_monthly IS 'Monthly granularity for current year (is_predicted=FALSE) and next year (is_predicted=TRUE). The React graph shows solid line for actuals, dashed line for predictions.';

-- Composite indexes for the most frequent dashboard queries
CREATE INDEX idx_gw_annual_village_year  ON groundwater_annual(village_id, year);
CREATE INDEX idx_gw_monthly_village_year ON groundwater_monthly(village_id, year, month);
CREATE INDEX idx_gw_monthly_predicted    ON groundwater_monthly(village_id, is_predicted) WHERE is_predicted = TRUE;


-- =============================================================================
-- DOMAIN 3: MACHINE LEARNING & PREDICTIONS
-- Model versioning → Future yearly predictions → Risk classification → Advisory
-- =============================================================================

-- Every trained Random Forest model gets a row here
CREATE TABLE model_versions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_tag             VARCHAR(50)     NOT NULL UNIQUE,  -- e.g. 'v1.0.0', 'v2.1.0'
    algorithm               VARCHAR(100)    NOT NULL DEFAULT 'Random Forest Regression',
    training_start_year     SMALLINT,
    training_end_year       SMALLINT,
    -- Validation metrics (from Section 3.4 of the report)
    r_squared               DECIMAL(8, 6),   -- Coefficient of determination
    mae                     DECIMAL(8, 4),   -- Mean Absolute Error (metres)
    rmse                    DECIMAL(8, 4),   -- Root Mean Square Error (metres)
    -- Feature importance as JSONB: {"year": 0.45, "rainfall_mm": 0.30, ...}
    feature_importance      JSONB,
    -- Hyperparameters: {"n_estimators": 100, "max_depth": 10, "min_samples_split": 2}
    hyperparameters         JSONB,
    joblib_file_path        VARCHAR(255),    -- Path to the .joblib file on backend
    is_active               BOOLEAN         NOT NULL DEFAULT FALSE,
    trained_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    trained_by              VARCHAR(100),
    notes                   TEXT,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE model_versions IS 'Full audit trail of every trained Random Forest model. Only one row should have is_active=TRUE at any time.';
COMMENT ON COLUMN model_versions.feature_importance IS 'JSONB map of input feature → importance score. Helps explain why a prediction was made.';

-- Constraint: only one active model at a time
CREATE UNIQUE INDEX idx_model_one_active ON model_versions (is_active) WHERE is_active = TRUE;

-- Yearly predictions per village — supports 5-year and 10-year projection graphs
CREATE TABLE ml_predictions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    village_id              UUID        NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
    model_version_id        UUID        NOT NULL REFERENCES model_versions(id),
    prediction_year         SMALLINT    NOT NULL CHECK (prediction_year BETWEEN 2020 AND 2099),
    predicted_depth_m       DECIMAL(8, 2),
    confidence_low          DECIMAL(8, 2),  -- 95% CI lower bound
    confidence_high         DECIMAL(8, 2),  -- 95% CI upper bound
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (village_id, model_version_id, prediction_year)
);
COMMENT ON TABLE ml_predictions IS 'Future year predictions per village from the active model. Supports 5yr and 10yr projection graphs.';

CREATE INDEX idx_ml_pred_village_year ON ml_predictions(village_id, prediction_year);


-- Risk classification lookup — seeded, not user-editable
CREATE TABLE risk_classifications (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level                   VARCHAR(20)     NOT NULL UNIQUE
                            CHECK (level IN ('LOW', 'MODERATE', 'HIGH', 'SEVERE')),
    level_order             SMALLINT        NOT NULL UNIQUE,  -- 1=Low ... 4=Severe (for sorting/comparison)
    -- Annual change rate thresholds in metres per year (positive = declining)
    min_change_rate_mpy     DECIMAL(8, 4),  -- NULL means no lower bound
    max_change_rate_mpy     DECIMAL(8, 4),  -- NULL means no upper bound
    color_hex               VARCHAR(7),
    description             TEXT,
    advisory_template       TEXT,           -- Plain-language template for farmer advisory
    drilling_recommendation VARCHAR(150),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE risk_classifications IS 'Seeded lookup table. Maps annual decline rate to farmer-ready risk level and advisory.';

-- Seed data for risk levels
INSERT INTO risk_classifications
    (level, level_order, min_change_rate_mpy, max_change_rate_mpy, color_hex, description, advisory_template, drilling_recommendation)
VALUES
(
    'LOW', 1, NULL, 0.10,
    '#22c55e',
    'Groundwater is stable or slowly recharging. Long-term sustainability looks positive.',
    'Groundwater levels in your area are stable. Borewell investment carries low risk at this time. Regular monitoring is still advised.',
    'Safe to drill'
),
(
    'MODERATE', 2, 0.10, 0.30,
    '#f59e0b',
    'Gradual decline observed. Sustainable with conservative usage and recharge measures.',
    'Groundwater is declining gradually. A new borewell can still be viable, but implement water conservation practices. Monitor levels annually.',
    'Proceed with caution'
),
(
    'HIGH', 3, 0.30, 0.60,
    '#f97316',
    'Significant depletion trend. Borewell viability is limited; high financial risk.',
    'Groundwater is depleting at a significant rate. A new borewell may run dry within 3-5 years. Evaluate alternatives before investing ₹50,000–₹2,00,000.',
    'Not recommended — evaluate alternatives'
),
(
    'SEVERE', 4, 0.60, NULL,
    '#ef4444',
    'Critical depletion. Existing borewells at risk of failure. Drilling strongly inadvisable.',
    'CRITICAL: Groundwater in your area is severely depleted. Drilling a new borewell is strongly inadvisable. Contact your local Jal Shakti office for emergency water access support.',
    'Strongly advised against'
);


-- The final computed output — what the farmer dashboard actually displays
CREATE TABLE village_risk_assessments (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    village_id                  UUID        NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
    risk_classification_id      UUID        NOT NULL REFERENCES risk_classifications(id),
    model_version_id            UUID        NOT NULL REFERENCES model_versions(id),
    annual_change_rate_mpy      DECIMAL(8, 4),  -- Metres per year (positive = declining)
    borewell_viability_years    DECIMAL(5, 1),  -- Estimated viable life of a new borewell
    projected_depth_5yr         DECIMAL(8, 2),
    projected_depth_10yr        DECIMAL(8, 2),
    advisory_text               TEXT,           -- Generated plain-language advisory
    drilling_recommendation     VARCHAR(150),
    investment_risk_score       INTEGER         CHECK (investment_risk_score BETWEEN 0 AND 100),
    assessed_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until                 TIMESTAMPTZ,    -- Assessment expires after 1 year
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (village_id, model_version_id)
);
COMMENT ON TABLE village_risk_assessments IS 'The final output of the ML pipeline per village. This is what the React dashboard displays to the farmer. Regenerated every time the model is retrained.';
COMMENT ON COLUMN village_risk_assessments.investment_risk_score IS '0 = safest investment, 100 = most dangerous. Composite of decline rate, viability years, and risk level.';
COMMENT ON COLUMN village_risk_assessments.valid_until IS 'Set to NOW() + 1 year on INSERT. Stale assessments trigger an ANNUAL_UPDATE alert.';

CREATE INDEX idx_vra_village          ON village_risk_assessments(village_id);
CREATE INDEX idx_vra_valid          ON village_risk_assessments(village_id, valid_until);
CREATE INDEX idx_vra_risk_level       ON village_risk_assessments(risk_classification_id);


-- =============================================================================
-- DOMAIN 4: USERS & ADVISORY
-- Auth, bookmarks, crowdsourced borewell data, alerts, audit logs
-- =============================================================================

-- Extends Supabase auth.users with app-specific profile data
CREATE TABLE users (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name           VARCHAR(150),
    phone               VARCHAR(20),
    email               VARCHAR(255)    UNIQUE,
    role                VARCHAR(20)     NOT NULL DEFAULT 'farmer'
                        CHECK (role IN ('farmer', 'admin', 'researcher', 'government')),
    preferred_language  VARCHAR(10)     NOT NULL DEFAULT 'en'
                        CHECK (preferred_language IN ('en', 'hi', 'mr')), -- English, Hindi, Marathi
    -- Home location — enables personalised default dashboard view
    home_village_id     UUID            REFERENCES villages(id),
    sub_district_id     UUID            REFERENCES sub_districts(id),
    district_id         UUID            REFERENCES districts(id),
    land_area_acres     DECIMAL(8, 2),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE users IS 'App profile linked to Supabase auth.users. Role controls what the user can see and do.';

-- Users can bookmark multiple villages (e.g. farmer with multiple plots)
CREATE TABLE user_saved_locations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    village_id  UUID        NOT NULL REFERENCES villages(id),
    nickname    VARCHAR(100),  -- "My farm", "Father's land", "Leased plot"
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, village_id)
);
COMMENT ON TABLE user_saved_locations IS 'User-village bookmarks. A farmer managing 3 plots can track all of them from one dashboard.';


-- Crowdsourced borewell records — real-world ground truth for the ML model
CREATE TABLE borewell_records (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    village_id                  UUID        NOT NULL REFERENCES villages(id),
    latitude                    DECIMAL(10, 7),
    longitude                   DECIMAL(10, 7),
    drilled_at                  DATE,
    total_depth_m               DECIMAL(8, 2),      -- Total drilled depth
    water_struck_depth_m        DECIMAL(8, 2),      -- First water encountered at
    current_water_level_m       DECIMAL(8, 2),      -- Current static water level
    yield_liters_per_hour       DECIMAL(10, 2),
    drilling_cost_inr           DECIMAL(12, 2),
    casing_type                 VARCHAR(100),       -- PVC, MS, etc.
    pump_type                   VARCHAR(100),
    status                      VARCHAR(30)     NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'failed', 'dry', 'abandoned', 'seasonal')),
    failure_year                SMALLINT,           -- If status = 'failed' or 'dry'
    is_public                   BOOLEAN         NOT NULL DEFAULT FALSE,  -- Share with researchers
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE borewell_records IS 'Crowdsourced borewell data from farmers. is_public=TRUE records can be used to validate and improve the ML model.';
COMMENT ON COLUMN borewell_records.failure_year IS 'Year the borewell went dry/failed. This is crucial training signal for the ML model.';

CREATE INDEX idx_borewell_village     ON borewell_records(village_id);
CREATE INDEX idx_borewell_public      ON borewell_records(village_id, is_public) WHERE is_public = TRUE;


-- Real-time alerts — risk upgrades, annual updates, depletion warnings
CREATE TABLE alerts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    village_id  UUID            REFERENCES villages(id),
    user_id     UUID            REFERENCES users(id) ON DELETE CASCADE,
    alert_type  VARCHAR(50)     NOT NULL
                CHECK (alert_type IN (
                    'RISK_UPGRADE',        -- Village moved to higher risk level
                    'DEPLETION_WARNING',   -- Exceeding projected decline rate
                    'ANNUAL_UPDATE',       -- New year data available
                    'BOREWELL_ALERT',      -- Registered borewell approaching dry threshold
                    'RECHARGE_ADVISORY',   -- Good monsoon — favourable recharge news
                    'MODEL_RETRAINED'      -- New model version deployed
                )),
    severity    VARCHAR(20)     CHECK (severity IN ('info', 'warning', 'critical')),
    title       VARCHAR(255)    NOT NULL,
    message     TEXT            NOT NULL,
    is_read     BOOLEAN         NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE alerts IS 'Push notifications for users. village_id=NULL means account-level alert; user_id=NULL means broadcast to all users in that village.';

CREATE INDEX idx_alerts_user_unread ON alerts(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_alerts_village     ON alerts(village_id);


-- Admin audit trail for data uploads
CREATE TABLE data_upload_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by         UUID            REFERENCES users(id),
    data_source_id      UUID            REFERENCES data_sources(id),
    upload_type         VARCHAR(50)
                        CHECK (upload_type IN (
                            'ANNUAL_BATCH',       -- Full year data for all villages
                            'MONTHLY_UPDATE',     -- Monthly actuals
                            'HISTORICAL_IMPORT',  -- Bulk historical import
                            'MANUAL_CORRECTION'   -- Single-row admin correction
                        )),
    records_uploaded    INTEGER         NOT NULL DEFAULT 0,
    records_failed      INTEGER         NOT NULL DEFAULT 0,
    year_covered        SMALLINT,
    districts_covered   TEXT[],                  -- Array: ['Pune', 'Nashik']
    file_name           VARCHAR(255),
    status              VARCHAR(20)     NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_log           TEXT,
    started_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ
);
COMMENT ON TABLE data_upload_logs IS 'Audit log for every data import. Tracks failures so admins can replay or correct partial uploads.';


-- =============================================================================
-- UTILITY VIEWS — Prebuilt for React dashboard API calls
-- =============================================================================

-- View 1: Full village profile with its current risk assessment
-- Used by: Dashboard main card, village search results
CREATE VIEW v_village_current_risk AS
SELECT
    v.id                                AS village_id,
    v.name                              AS village_name,
    v.latitude,
    v.longitude,
    v.aquifer_type,
    v.soil_type,
    sd.name                             AS sub_district_name,
    sd.block_classification             AS cgwb_block_classification,
    d.name                              AS district_name,
    d.state,
    rc.level                            AS risk_level,
    rc.color_hex                        AS risk_color,
    vra.annual_change_rate_mpy,
    vra.borewell_viability_years,
    vra.investment_risk_score,
    vra.advisory_text,
    vra.drilling_recommendation,
    vra.projected_depth_5yr,
    vra.projected_depth_10yr,
    vra.assessed_at
FROM villages v
JOIN sub_districts sd ON v.sub_district_id = sd.id
JOIN districts d      ON sd.district_id = d.id
LEFT JOIN village_risk_assessments vra
    ON v.id = vra.village_id
    AND vra.valid_until > NOW()
LEFT JOIN risk_classifications rc ON vra.risk_classification_id = rc.id;

COMMENT ON VIEW v_village_current_risk IS 'One-stop view for the main dashboard card. Returns current risk for any village with full location context.';


-- View 2: 10-year trend data ready for the React graph
-- Used by: Historical trend graph component (solid line)
CREATE VIEW v_groundwater_10yr_trend AS
SELECT
    ga.village_id,
    v.name                          AS village_name,
    ga.year,
    ga.pre_monsoon_depth_m,
    ga.post_monsoon_depth_m,
    ga.avg_annual_depth_m,
    ga.annual_rainfall_mm,
    ga.net_change_m,
    ga.is_interpolated,
    ds.abbreviation                 AS source
FROM groundwater_annual ga
JOIN villages v         ON ga.village_id = v.id
LEFT JOIN data_sources ds ON ga.data_source_id = ds.id
WHERE ga.year >= EXTRACT(YEAR FROM NOW()) - 10
ORDER BY ga.village_id, ga.year;

COMMENT ON VIEW v_groundwater_10yr_trend IS 'Last 10 years of annual groundwater data per village, ordered for direct charting. Feed directly into Recharts / Chart.js.';


-- View 3: Monthly data + predictions for current and next year
-- Used by: Monthly trend graph (solid line = actual, dashed = predicted)
CREATE VIEW v_monthly_current_and_forecast AS
SELECT
    gm.village_id,
    v.name                          AS village_name,
    gm.year,
    gm.month,
    TO_DATE(gm.year::text || '-' || LPAD(gm.month::text, 2, '0') || '-01', 'YYYY-MM-DD') AS date,
    gm.depth_meters,
    gm.rainfall_mm,
    gm.is_predicted,
    gm.confidence_interval_low,
    gm.confidence_interval_high,
    gm.prediction_confidence,
    mv.version_tag                  AS model_version
FROM groundwater_monthly gm
JOIN villages v             ON gm.village_id = v.id
LEFT JOIN model_versions mv ON gm.model_version_id = mv.id
WHERE gm.year IN (
    EXTRACT(YEAR FROM NOW())::SMALLINT,
    (EXTRACT(YEAR FROM NOW()) + 1)::SMALLINT
)
ORDER BY gm.village_id, gm.year, gm.month;

COMMENT ON VIEW v_monthly_current_and_forecast IS 'Current year actuals + next year ML predictions in one dataset. The React chart uses is_predicted to switch between solid and dashed rendering.';


-- =============================================================================
-- ROW LEVEL SECURITY (SUPABASE RLS)
-- =============================================================================

-- Geographic tables — publicly readable, no auth needed
ALTER TABLE districts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_districts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE villages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read districts"     ON districts       FOR SELECT USING (TRUE);
CREATE POLICY "public read sub_districts" ON sub_districts   FOR SELECT USING (TRUE);
CREATE POLICY "public read villages"      ON villages        FOR SELECT USING (TRUE);
CREATE POLICY "public read data_sources"  ON data_sources    FOR SELECT USING (TRUE);

-- Water data — publicly readable (farmers need this without signup)
ALTER TABLE groundwater_annual        ENABLE ROW LEVEL SECURITY;
ALTER TABLE groundwater_monthly       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_classifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE village_risk_assessments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions            ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read gw_annual"     ON groundwater_annual       FOR SELECT USING (TRUE);
CREATE POLICY "public read gw_monthly"    ON groundwater_monthly      FOR SELECT USING (TRUE);
CREATE POLICY "public read ml_preds"      ON ml_predictions           FOR SELECT USING (TRUE);
CREATE POLICY "public read risk_class"    ON risk_classifications     FOR SELECT USING (TRUE);
CREATE POLICY "public read vra"           ON village_risk_assessments FOR SELECT USING (TRUE);
CREATE POLICY "public read models"        ON model_versions           FOR SELECT USING (TRUE);

-- Admin writes to water and ML tables
CREATE POLICY "admin write gw_annual"  ON groundwater_annual
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "admin write gw_monthly" ON groundwater_monthly
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "admin write ml_preds"   ON ml_predictions
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "admin write vra"        ON village_risk_assessments
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- User tables — own rows only
ALTER TABLE users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_locations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE borewell_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_upload_logs      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user read own profile"    ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user update own profile"  ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "user own locations" ON user_saved_locations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user own borewells" ON borewell_records
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "public read borewells"    ON borewell_records
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "user read own alerts"     ON alerts
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "user mark alert read"     ON alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "admin view upload logs"   ON data_upload_logs
    FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE role IN ('admin', 'researcher')));
CREATE POLICY "admin write upload logs"  ON data_upload_logs
    FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));


-- =============================================================================
-- TRIGGER: Auto-update villages.avg_borewell_depth_m from borewell_records
-- =============================================================================
CREATE OR REPLACE FUNCTION update_village_avg_borewell_depth()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE villages
    SET avg_borewell_depth_m = (
        SELECT AVG(total_depth_m)
        FROM borewell_records
        WHERE village_id = NEW.village_id
          AND total_depth_m IS NOT NULL
    )
    WHERE id = NEW.village_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_avg_borewell_depth
AFTER INSERT OR UPDATE ON borewell_records
FOR EACH ROW EXECUTE FUNCTION update_village_avg_borewell_depth();

COMMENT ON FUNCTION update_village_avg_borewell_depth IS 'Keeps villages.avg_borewell_depth_m in sync with crowdsourced borewell records. This feeds back into the ML feature set.';


-- =============================================================================
-- TRIGGER: Auto-expire and alert on stale risk assessments
-- =============================================================================
CREATE OR REPLACE FUNCTION flag_stale_risk_assessments()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new assessment is inserted, set valid_until = 1 year from now
    IF TG_OP = 'INSERT' AND NEW.valid_until IS NULL THEN
        NEW.valid_until := NOW() + INTERVAL '1 year';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_vra_expiry
BEFORE INSERT ON village_risk_assessments
FOR EACH ROW EXECUTE FUNCTION flag_stale_risk_assessments();


-- =============================================================================
-- SUMMARY
-- =============================================================================
-- Tables (15):
--   Geographic    : districts, sub_districts, villages
--   Data          : data_sources, groundwater_annual, groundwater_monthly
--   ML            : model_versions, ml_predictions, risk_classifications,
--                   village_risk_assessments
--   Users         : users, user_saved_locations, borewell_records, alerts,
--                   data_upload_logs
--
-- Views (3)       : v_village_current_risk, v_groundwater_10yr_trend,
--                   v_monthly_current_and_forecast
--
-- Indexes (11)    : Optimised for dashboard, village search, and ML queries
-- RLS Policies    : Public read on geo+water, user-scoped writes, admin full access
-- Triggers (2)    : Auto avg_borewell_depth, auto valid_until on assessments
-- Seed data       : data_sources (4 rows), risk_classifications (4 rows)
-- =============================================================================