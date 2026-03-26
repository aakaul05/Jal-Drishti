-- Jal-Drishti Regional Data Schema for Supabase
-- Hierarchical structure: State -> District -> Sub-district -> Village

-- States table (for future expansion beyond Maharashtra)
CREATE TABLE states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Districts table
CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id UUID NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(state_id, name)
);

-- Sub-districts (Talukas) table
CREATE TABLE sub_districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(district_id, name)
);

-- Villages table
CREATE TABLE villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_district_id UUID NOT NULL REFERENCES sub_districts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    population INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sub_district_id, name)
);

-- Groundwater data table for historical and predicted data
CREATE TABLE groundwater_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    village_id UUID NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER, -- NULL for annual data, 1-12 for monthly data
    depth_feet DECIMAL(8, 2) NOT NULL,
    is_predicted BOOLEAN DEFAULT FALSE,
    upper_ci DECIMAL(8, 2), -- Confidence interval upper bound
    lower_ci DECIMAL(8, 2), -- Confidence interval lower bound
    measurement_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(village_id, year, month)
);

-- Indexes for better performance
CREATE INDEX idx_districts_state_id ON districts(state_id);
CREATE INDEX idx_sub_districts_district_id ON sub_districts(district_id);
CREATE INDEX idx_villages_sub_district_id ON villages(sub_district_id);
CREATE INDEX idx_groundwater_village_year ON groundwater_data(village_id, year);
CREATE INDEX idx_groundwater_village_year_month ON groundwater_data(village_id, year, month);

-- RLS (Row Level Security) Policies
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE groundwater_data ENABLE ROW LEVEL SECURITY;

-- Public read access for regional data
CREATE POLICY "Public read access for states" ON states
    FOR SELECT USING (true);

CREATE POLICY "Public read access for districts" ON districts
    FOR SELECT USING (true);

CREATE POLICY "Public read access for sub-districts" ON sub_districts
    FOR SELECT USING (true);

CREATE POLICY "Public read access for villages" ON villages
    FOR SELECT USING (true);

CREATE POLICY "Public read access for groundwater data" ON groundwater_data
    FOR SELECT USING (true);

-- Insert Maharashtra state
INSERT INTO states (name, code) VALUES 
('Maharashtra', 'MH');

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_states_updated_at BEFORE UPDATE ON states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_districts_updated_at BEFORE UPDATE ON districts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_districts_updated_at BEFORE UPDATE ON sub_districts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_villages_updated_at BEFORE UPDATE ON villages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groundwater_data_updated_at BEFORE UPDATE ON groundwater_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
