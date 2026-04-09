-- ============================================================================
-- GROUNDWATER CLEANED FINAL TABLE
-- ============================================================================
-- Matches exact structure of Groundwater_Cleaned_Final.csv
-- Columns: District, Block, Village + 10 years (2014-2023) × 4 months each
-- ============================================================================

DROP TABLE IF EXISTS public.groundwater_cleaned_final CASCADE;

CREATE TABLE public.groundwater_cleaned_final (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- Location columns (matching CSV headers)
    district text NOT NULL,
    block text NOT NULL,
    village text NOT NULL,
    
    -- 2014 (4 months: Jan, May, Aug, Nov)
    y2014_jan numeric(8,2),
    y2014_may numeric(8,2),
    y2014_aug numeric(8,2),
    y2014_nov numeric(8,2),
    
    -- 2015 (4 months)
    y2015_jan numeric(8,2),
    y2015_may numeric(8,2),
    y2015_aug numeric(8,2),
    y2015_nov numeric(8,2),
    
    -- 2016 (4 months)
    y2016_jan numeric(8,2),
    y2016_may numeric(8,2),
    y2016_aug numeric(8,2),
    y2016_nov numeric(8,2),
    
    -- 2017 (4 months)
    y2017_jan numeric(8,2),
    y2017_may numeric(8,2),
    y2017_aug numeric(8,2),
    y2017_nov numeric(8,2),
    
    -- 2018 (4 months)
    y2018_jan numeric(8,2),
    y2018_may numeric(8,2),
    y2018_aug numeric(8,2),
    y2018_nov numeric(8,2),
    
    -- 2019 (4 months)
    y2019_jan numeric(8,2),
    y2019_may numeric(8,2),
    y2019_aug numeric(8,2),
    y2019_nov numeric(8,2),
    
    -- 2020 (4 months)
    y2020_jan numeric(8,2),
    y2020_may numeric(8,2),
    y2020_aug numeric(8,2),
    y2020_nov numeric(8,2),
    
    -- 2021 (4 months)
    y2021_jan numeric(8,2),
    y2021_may numeric(8,2),
    y2021_aug numeric(8,2),
    y2021_nov numeric(8,2),
    
    -- 2022 (4 months)
    y2022_jan numeric(8,2),
    y2022_may numeric(8,2),
    y2022_aug numeric(8,2),
    y2022_nov numeric(8,2),
    
    -- 2023 (4 months)
    y2023_jan numeric(8,2),
    y2023_may numeric(8,2),
    y2023_aug numeric(8,2),
    y2023_nov numeric(8,2),
    
    created_at timestamp with time zone DEFAULT now(),
    
    -- Unique constraint: one row per village
    UNIQUE (district, block, village)
);

-- Indexes for fast queries
CREATE INDEX idx_groundwater_district ON public.groundwater_cleaned_final(district);
CREATE INDEX idx_groundwater_block ON public.groundwater_cleaned_final(block);
CREATE INDEX idx_groundwater_village ON public.groundwater_cleaned_final(village);

-- Enable RLS
ALTER TABLE public.groundwater_cleaned_final ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "public_read" ON public.groundwater_cleaned_final FOR SELECT USING (true);
