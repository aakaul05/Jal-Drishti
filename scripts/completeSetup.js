// Complete setup script - creates tables and migrates data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://reaubfkawbovjhpurtbx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYXViZmthd2JvdmpocHVydGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTAwMDMsImV4cCI6MjA5MDA4NjAwM30.64igBjud8qczrwK1k51bJdJoPHqntwWZ2cjbw2lhQfA';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Complete Maharashtra Setup');
console.log('=============================');

// Complete Maharashtra data
const maharashtraData = {
  districts: [
    { district_code: 466, district_name: 'Ahilyanagar', census_2001_code: 26, census_2011_code: 522 },
    { district_code: 467, district_name: 'Akola', census_2001_code: 5, census_2011_code: 501 },
    { district_code: 468, district_name: 'Amravati', census_2001_code: 7, census_2011_code: 503 },
    { district_code: 470, district_name: 'Beed', census_2001_code: 27, census_2011_code: 523 },
    { district_code: 471, district_name: 'Bhandara', census_2001_code: 10, census_2011_code: 506 },
    { district_code: 472, district_name: 'Buldhana', census_2001_code: 4, census_2011_code: 500 },
    { district_code: 473, district_name: 'Chandrapur', census_2001_code: 13, census_2011_code: 509 },
    { district_code: 469, district_name: 'Chhatrapati Sambhajinagar', census_2001_code: 19, census_2011_code: 515 },
    { district_code: 488, district_name: 'Dharashiv', census_2001_code: 29, census_2011_code: 525 },
    { district_code: 474, district_name: 'Dhule', census_2001_code: 2, census_2011_code: 498 },
    { district_code: 475, district_name: 'Gadchiroli', census_2001_code: 12, census_2011_code: 508 },
    { district_code: 476, district_name: 'Gondia', census_2001_code: 11, census_2011_code: 507 },
    { district_code: 477, district_name: 'Hingoli', census_2001_code: 16, census_2011_code: 512 },
    { district_code: 478, district_name: 'Jalgaon', census_2001_code: 3, census_2011_code: 499 },
    { district_code: 479, district_name: 'Jalna', census_2001_code: 18, census_2011_code: 514 },
    { district_code: 480, district_name: 'Kolhapur', census_2001_code: 34, census_2011_code: 530 },
    { district_code: 481, district_name: 'Latur', census_2001_code: 28, census_2011_code: 524 },
    { district_code: 482, district_name: 'Mumbai', census_2001_code: 23, census_2011_code: 519 },
    { district_code: 483, district_name: 'Mumbai Suburban', census_2001_code: 22, census_2011_code: 518 },
    { district_code: 484, district_name: 'Nagpur', census_2001_code: 9, census_2011_code: 505 },
    { district_code: 485, district_name: 'Nanded', census_2001_code: 15, census_2011_code: 511 },
    { district_code: 486, district_name: 'Nandurbar', census_2001_code: 1, census_2011_code: 497 },
    { district_code: 487, district_name: 'Nashik', census_2001_code: 20, census_2011_code: 516 },
    { district_code: 665, district_name: 'Palghar', census_2001_code: null, census_2011_code: null },
    { district_code: 489, district_name: 'Parbhani', census_2001_code: 17, census_2011_code: 513 },
    { district_code: 490, district_name: 'Pune', census_2001_code: 25, census_2011_code: 521 },
    { district_code: 491, district_name: 'Raigad', census_2001_code: 24, census_2011_code: 520 },
    { district_code: 492, district_name: 'Ratnagiri', census_2001_code: 32, census_2011_code: 528 },
    { district_code: 493, district_name: 'Sangli', census_2001_code: 35, census_2011_code: 531 },
    { district_code: 494, district_name: 'Satara', census_2001_code: 31, census_2011_code: 527 },
    { district_code: 495, district_name: 'Sindhudurg', census_2001_code: 33, census_2011_code: 529 },
    { district_code: 496, district_name: 'Solapur', census_2001_code: 30, census_2011_code: 526 },
    { district_code: 497, district_name: 'Thane', census_2001_code: 21, census_2011_code: 517 },
    { district_code: 498, district_name: 'Wardha', census_2001_code: 8, census_2011_code: 504 },
    { district_code: 499, district_name: 'Washim', census_2001_code: 6, census_2011_code: 502 },
    { district_code: 500, district_name: 'Yavatmal', census_2001_code: 14, census_2011_code: 510 }
  ],
  
  subDistricts: [
    // Sample sub-districts for major districts
    { subdistrict_code: 4193, subdistrict_name: 'Haveli', district_code: 490, district_name: 'Pune', census_2011_code: '04193' },
    { subdistrict_code: 4199, subdistrict_name: 'Baramati', district_code: 490, district_name: 'Pune', census_2011_code: '04199' },
    { subdistrict_code: 4201, subdistrict_name: 'Akole', district_code: 466, district_name: 'Ahilyanagar', census_2011_code: '04201' },
    { subdistrict_code: 4145, subdistrict_name: 'Baglan', district_code: 487, district_name: 'Nashik', census_2011_code: '04145' },
    { subdistrict_code: 4147, subdistrict_name: 'Nandgaon', district_code: 487, district_name: 'Nashik', census_2011_code: '04147' },
    { subdistrict_code: 4137, subdistrict_name: 'Chhatrapati Sambhajinagar', district_code: 469, district_name: 'Chhatrapati Sambhajinagar', census_2011_code: '04137' },
    { subdistrict_code: 4138, subdistrict_name: 'Kannad', district_code: 469, district_name: 'Chhatrapati Sambhajinagar', census_2011_code: '04138' },
    { subdistrict_code: 4191, subdistrict_name: 'Pune City', district_code: 490, district_name: 'Pune', census_2011_code: '04191' },
    { subdistrict_code: 4192, subdistrict_name: 'Pimpri-Chinchwad', district_code: 490, district_name: 'Pune', census_2011_code: '04192' },
    { subdistrict_code: 4292, subdistrict_name: 'Ajra', district_code: 480, district_name: 'Kolhapur', census_2011_code: '04292' },
    { subdistrict_code: 4293, subdistrict_name: 'Kagal', district_code: 480, district_name: 'Kolhapur', census_2011_code: '04293' },
    { subdistrict_code: 4254, subdistrict_name: 'Akkalkot', district_code: 496, district_name: 'Solapur', census_2011_code: '04254' },
    { subdistrict_code: 4255, subdistrict_name: 'Barshi', district_code: 496, district_name: 'Solapur', census_2011_code: '04255' },
    { subdistrict_code: 3950, subdistrict_name: 'Akkalkuwa', district_code: 486, district_name: 'Nandurbar', census_2011_code: '03950' },
    { subdistrict_code: 3951, subdistrict_name: 'Akrani', district_code: 486, district_name: 'Nandurbar', census_2011_code: '03951' }
  ],
  
  villages: [
    // Sample villages for demo
    { village_code: 557001, village_name: 'Wagholi', subdistrict_code: 4193, district_code: 490 },
    { village_code: 557002, village_name: 'Lohegaon', subdistrict_code: 4193, district_code: 490 },
    { village_code: 557003, village_name: 'Kharadi', subdistrict_code: 4193, district_code: 490 },
    { village_code: 557004, village_name: 'Kondhwa', subdistrict_code: 4193, district_code: 490 },
    { village_code: 557005, village_name: 'Hadapsar', subdistrict_code: 4193, district_code: 490 },
    { village_code: 557006, village_name: 'Baramati Town', subdistrict_code: 4199, district_code: 490 },
    { village_code: 557007, village_name: 'Jejuri', subdistrict_code: 4199, district_code: 490 },
    { village_code: 557008, village_name: 'Supa', subdistrict_code: 4199, district_code: 490 },
    { village_code: 557009, village_name: 'Nira', subdistrict_code: 4199, district_code: 490 },
    { village_code: 557010, village_name: 'Malshiras', subdistrict_code: 4199, district_code: 490 },
    { village_code: 557011, village_name: 'Akole Town', subdistrict_code: 4201, district_code: 466 },
    { village_code: 557012, village_name: 'Rajur', subdistrict_code: 4201, district_code: 466 },
    { village_code: 557013, village_name: 'Lohgad', subdistrict_code: 4201, district_code: 466 },
    { village_code: 557014, village_name: 'Ambivali', subdistrict_code: 4201, district_code: 466 },
    { village_code: 557015, village_name: 'Pachod', subdistrict_code: 4201, district_code: 466 }
  ]
};

async function completeSetup() {
  try {
    console.log('🔍 Testing connection...');
    
    // Test if tables exist
    const { data, error } = await supabase
      .from('mh_districts')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('📝 Creating schema...');
      console.log('⚠️  Please run this SQL in your Supabase SQL Editor:');
      console.log('--- COPY BELOW ---');
      console.log(`
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
      `);
      console.log('--- END COPY ---');
      console.log('\n🔄 After running the SQL above, run this script again:');
      console.log('   node scripts/completeSetup.js');
      return;
    }
    
    console.log('✅ Tables exist! Migrating data...');
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await supabase.from('mh_villages').delete().neq('village_code', 0);
    await supabase.from('mh_subdistricts').delete().neq('subdistrict_code', 0);
    await supabase.from('mh_districts').delete().neq('district_code', 0);
    
    // Insert districts
    console.log('📍 Inserting districts...');
    const { data: insertedDistricts } = await supabase
      .from('mh_districts')
      .insert(maharashtraData.districts)
      .select();
    
    console.log(`✅ Inserted ${insertedDistricts?.length || 0} districts`);
    
    // Insert sub-districts
    console.log('🏘️ Inserting sub-districts...');
    const { data: insertedSubDistricts } = await supabase
      .from('mh_subdistricts')
      .insert(maharashtraData.subDistricts)
      .select();
    
    console.log(`✅ Inserted ${insertedSubDistricts?.length || 0} sub-districts`);
    
    // Insert villages
    console.log('🏡 Inserting villages...');
    const { data: insertedVillages } = await supabase
      .from('mh_villages')
      .insert(maharashtraData.villages)
      .select();
    
    console.log(`✅ Inserted ${insertedVillages?.length || 0} villages`);
    
    console.log('\n🎉 Setup completed successfully!');
    await showHierarchy();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function showHierarchy() {
  console.log('\n🗺️ Maharashtra Hierarchy:');
  console.log('========================');
  
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
    .order('district_name')
    .limit(5);
  
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
  console.log('📱 Start the app: npm run dev');
  console.log('\n📊 Full commands available:');
  console.log('   npm run show:hierarchy - See sample hierarchy');
  console.log('   npm run show:full-hierarchy - See complete hierarchy');
}

completeSetup();
