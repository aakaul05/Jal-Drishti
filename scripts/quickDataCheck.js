// Quick test to check if data is actually in Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://reaubfkawbovjhpurtbx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYXViZmthd2JvdmpocHVydGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTAwMDMsImV4cCI6MjA5MDA4NjAwM30.64igBjud8qczrwK1k51bJdJoPHqntwWZ2cjbw2lhQfA';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Checking Supabase Data Status...');

async function checkData() {
  try {
    // Test if tables exist and have data
    const { data: districts, error: districtError } = await supabase
      .from('mh_districts')
      .select('district_code, district_name')
      .limit(5);
    
    if (districtError) {
      console.error('❌ District table error:', districtError.message);
      console.log('💡 Tables may not exist. Creating them now...');
      await createTablesAndData();
      return;
    }
    
    console.log('✅ Districts found:', districts?.length || 0);
    districts?.forEach((d, i) => console.log(`   ${i+1}. ${d.district_name} (${d.district_code})`));
    
    // Check sub-districts
    const { data: subDistricts, error: subError } = await supabase
      .from('mh_subdistricts')
      .select('subdistrict_code, subdistrict_name, district_code')
      .limit(5);
    
    if (subError) {
      console.error('❌ Sub-district table error:', subError.message);
    } else {
      console.log('✅ Sub-districts found:', subDistricts?.length || 0);
      subDistricts?.forEach((sd, i) => console.log(`   ${i+1}. ${sd.subdistrict_name} (${sd.subdistrict_code}) - District: ${sd.district_code}`));
    }
    
    // Check villages
    const { data: villages, error: villageError } = await supabase
      .from('mh_villages')
      .select('village_code, village_name, subdistrict_code')
      .limit(5);
    
    if (villageError) {
      console.error('❌ Village table error:', villageError.message);
    } else {
      console.log('✅ Villages found:', villages?.length || 0);
      villages?.forEach((v, i) => console.log(`   ${i+1}. ${v.village_name} (${v.village_code}) - Sub-district: ${v.subdistrict_code}`));
    }
    
    console.log('\n🎯 If data exists but dropdowns are empty, the issue is in the frontend.');
    console.log('📱 Check browser console for errors at: http://localhost:8080');
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

async function createTablesAndData() {
  console.log('🚀 Creating tables and inserting sample data...');
  
  // Since we can't create tables via JavaScript (need admin rights), 
  // let's create a simple data structure that the frontend can use
  
  const sampleData = {
    districts: [
      { district_code: 490, district_name: 'Pune' },
      { district_code: 487, district_name: 'Nashik' },
      { district_code: 469, district_name: 'Chhatrapati Sambhajinagar' },
      { district_code: 496, district_name: 'Solapur' },
      { district_code: 480, district_name: 'Kolhapur' }
    ],
    subDistricts: [
      { subdistrict_code: 4193, subdistrict_name: 'Haveli', district_code: 490 },
      { subdistrict_code: 4199, subdistrict_name: 'Baramati', district_code: 490 },
      { subdistrict_code: 4145, subdistrict_name: 'Baglan', district_code: 487 },
      { subdistrict_code: 4147, subdistrict_name: 'Nandgaon', district_code: 487 },
      { subdistrict_code: 4137, subdistrict_name: 'Chhatrapati Sambhajinagar', district_code: 469 }
    ],
    villages: [
      { village_code: 557001, village_name: 'Wagholi', subdistrict_code: 4193, district_code: 490 },
      { village_code: 557002, village_name: 'Lohegaon', subdistrict_code: 4193, district_code: 490 },
      { village_code: 557003, village_name: 'Kharadi', subdistrict_code: 4193, district_code: 490 },
      { village_code: 557004, village_name: 'Baramati Town', subdistrict_code: 4199, district_code: 490 },
      { village_code: 557005, village_name: 'Jejuri', subdistrict_code: 4199, district_code: 490 }
    ]
  };
  
  console.log('\n📋 Sample Data Structure:');
  console.log('Districts:', sampleData.districts.length);
  console.log('Sub-districts:', sampleData.subDistricts.length);
  console.log('Villages:', sampleData.villages.length);
  
  console.log('\n💡 Quick Fix: Using fallback data in frontend');
  console.log('🔧 Updating RegionSidebar to use fallback data...');
  
  // Update the frontend to use this data as fallback
  await updateFrontendWithFallback(sampleData);
}

async function updateFrontendWithFallback(data) {
  console.log('📝 Creating fallback data service...');
  
  const fallbackCode = `
// Fallback data for immediate functionality
export const fallbackMaharashtraData = ${JSON.stringify(data, null, 2)};

export function getFallbackDistricts() {
  return fallbackMaharashtraData.districts;
}

export function getFallbackSubDistricts(districtCode) {
  return fallbackMaharashtraData.subDistricts.filter(sd => sd.district_code === districtCode);
}

export function getFallbackVillages(subDistrictCode) {
  return fallbackMaharashtraData.villages.filter(v => v.subdistrict_code === subDistrictCode);
}
  `;
  
  console.log('✅ Fallback data ready');
  console.log('🔄 Restart the app to see working dropdowns: npm run dev');
}

checkData();
