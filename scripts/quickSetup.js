// Direct test with your Supabase credentials
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://reaubfkawbovjhpurtbx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYXViZmthd2JvdmpocHVydGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTAwMDMsImV4cCI6MjA5MDA4NjAwM30.64igBjud8qczrwK1k51bJdJoPHqntwWZ2cjbw2lhQfA';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Testing Supabase Connection...');

// Test connection and create tables if needed
async function setupAndTest() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('mh_districts')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('📝 Tables not found, creating schema...');
      
      // Create tables using the SQL schema
      const schema = `
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mh_subdistricts_district ON mh_subdistricts(district_code);
CREATE INDEX IF NOT EXISTS idx_mh_villages_subdistrict ON mh_villages(subdistrict_code);
CREATE INDEX IF NOT EXISTS idx_mh_villages_district ON mh_villages(district_code);
CREATE INDEX IF NOT EXISTS idx_mh_villages_name ON mh_villages(village_name);

-- RLS Policies
ALTER TABLE mh_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mh_subdistricts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mh_villages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for districts" ON mh_districts FOR SELECT USING (true);
CREATE POLICY "Public read access for sub-districts" ON mh_subdistricts FOR SELECT USING (true);
CREATE POLICY "Public read access for villages" ON mh_villages FOR SELECT USING (true);
      `;
      
      console.log('⚠️  Please run this SQL in your Supabase SQL Editor first');
      console.log('📄 Copy the schema from: supabase/maharashtra-schema.sql');
      return;
    }
    
    console.log('✅ Connection successful!');
    
    // Check current data
    const [districts, subDistricts, villages] = await Promise.all([
      supabase.from('mh_districts').select('*', { count: 'exact', head: true }),
      supabase.from('mh_subdistricts').select('*', { count: 'exact', head: true }),
      supabase.from('mh_villages').select('*', { count: 'exact', head: true })
    ]);
    
    console.log('📊 Current Database Status:');
    console.log(`   Districts: ${districts.count || 0}`);
    console.log(`   Sub-districts: ${subDistricts.count || 0}`);
    console.log(`   Villages: ${villages.count || 0}`);
    
    if (districts.count === 0) {
      console.log('📝 No data found. Running migration...');
      await migrateData();
    } else {
      console.log('🎉 Data exists! Showing sample hierarchy...');
      await showSample();
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Migrate sample data
async function migrateData() {
  console.log('🚀 Starting migration...');
  
  // Insert sample districts
  const sampleDistricts = [
    { district_code: 490, district_name: 'Pune', census_2001_code: 25, census_2011_code: 521 },
    { district_code: 487, district_name: 'Nashik', census_2001_code: 20, census_2011_code: 516 },
    { district_code: 469, district_name: 'Chhatrapati Sambhajinagar', census_2001_code: 19, census_2011_code: 515 },
    { district_code: 496, district_name: 'Solapur', census_2001_code: 30, census_2011_code: 526 },
    { district_code: 480, district_name: 'Kolhapur', census_2001_code: 34, census_2011_code: 530 }
  ];
  
  const { data: insertedDistricts } = await supabase
    .from('mh_districts')
    .insert(sampleDistricts)
    .select();
  
  console.log(`✅ Inserted ${insertedDistricts?.length || 0} districts`);
  
  // Insert sample sub-districts
  const sampleSubDistricts = [
    { subdistrict_code: 4193, subdistrict_name: 'Haveli', district_code: 490, district_name: 'Pune' },
    { subdistrict_code: 4199, subdistrict_name: 'Baramati', district_code: 490, district_name: 'Pune' },
    { subdistrict_code: 4145, subdistrict_name: 'Baglan', district_code: 487, district_name: 'Nashik' },
    { subdistrict_code: 4147, subdistrict_name: 'Nandgaon', district_code: 487, district_name: 'Nashik' },
    { subdistrict_code: 4137, subdistrict_name: 'Chhatrapati Sambhajinagar', district_code: 469, district_name: 'Chhatrapati Sambhajinagar' }
  ];
  
  const { data: insertedSubDistricts } = await supabase
    .from('mh_subdistricts')
    .insert(sampleSubDistricts)
    .select();
  
  console.log(`✅ Inserted ${insertedSubDistricts?.length || 0} sub-districts`);
  
  // Insert sample villages
  const sampleVillages = [
    { village_code: 557001, village_name: 'Wagholi', subdistrict_code: 4193, district_code: 490 },
    { village_code: 557002, village_name: 'Lohegaon', subdistrict_code: 4193, district_code: 490 },
    { village_code: 557003, village_name: 'Kharadi', subdistrict_code: 4193, district_code: 490 },
    { village_code: 557004, village_name: 'Baramati Town', subdistrict_code: 4199, district_code: 490 },
    { village_code: 557005, village_name: 'Jejuri', subdistrict_code: 4199, district_code: 490 }
  ];
  
  const { data: insertedVillages } = await supabase
    .from('mh_villages')
    .insert(sampleVillages)
    .select();
  
  console.log(`✅ Inserted ${insertedVillages?.length || 0} villages`);
  console.log('🎉 Sample migration completed!');
  
  await showSample();
}

// Show sample hierarchy
async function showSample() {
  console.log('\n🗺️ Sample Maharashtra Hierarchy:');
  console.log('================================');
  
  const { data: districts } = await supabase
    .from('mh_districts')
    .select(`
      district_name,
      mh_subdistricts(
        subdistrict_name,
        mh_villages(
          village_name
        )
      )
    `)
    .limit(3);
  
  districts?.forEach((district, index) => {
    console.log(`\n${index + 1}. 📍 ${district.district_name}`);
    
    district.mh_subdistricts?.forEach((subDistrict, subIndex) => {
      console.log(`   ${index + 1}.${subIndex + 1} 🏘️ ${subDistrict.subdistrict_name}`);
      
      subDistrict.mh_villages?.forEach((village, villageIndex) => {
        console.log(`      ${index + 1}.${subIndex + 1}.${villageIndex + 1} 🏡 ${village.village_name}`);
      });
    });
  });
  
  console.log('\n🎯 Ready for application!');
  console.log('📱 Start the app with: npm run dev');
}

setupAndTest();
