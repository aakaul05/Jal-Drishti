import { RegionalDataService } from '../src/services/regionalDataService.js';
import { supabase } from '../src/lib/supabase.js';

// Maharashtra regional data structure from your SQL
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
    // Sample sub-districts - you'll need to provide the complete list
    { subdistrict_code: 4004, subdistrict_name: 'Achalpur', district_code: 468, district_name: 'Amravati', census_2011_code: '04004' },
    { subdistrict_code: 4062, subdistrict_name: 'Aheri', district_code: 475, district_name: 'Gadchiroli', census_2011_code: '04062' },
    { subdistrict_code: 4228, subdistrict_name: 'Ahmadpur', district_code: 481, district_name: 'Latur', census_2011_code: '04228' },
    { subdistrict_code: 4292, subdistrict_name: 'Ajra', district_code: 480, district_name: 'Kolhapur', census_2011_code: '04292' },
    { subdistrict_code: 4254, subdistrict_name: 'Akkalkot', district_code: 496, district_name: 'Solapur', census_2011_code: '04254' },
    { subdistrict_code: 3950, subdistrict_name: 'Akkalkuwa', district_code: 486, district_name: 'Nandurbar', census_2011_code: '03950' },
    { subdistrict_code: 3991, subdistrict_name: 'Akola', district_code: 467, district_name: 'Akola', census_2011_code: '03991' },
    { subdistrict_code: 4201, subdistrict_name: 'Akole', district_code: 466, district_name: 'Ahilyanagar', census_2011_code: '04201' },
    { subdistrict_code: 3989, subdistrict_name: 'Akot', district_code: 467, district_name: 'Akola', census_2011_code: '03989' },
    { subdistrict_code: 3951, subdistrict_name: 'Akrani', district_code: 486, district_name: 'Nandurbar', census_2011_code: '03951' }
    // Add all 358 sub-districts here...
  ],
  
  villages: [
    // Sample villages - you'll need to provide the complete list
    { village_code: 557293, village_name: 'Aabitkhind', subdistrict_code: 4201, district_code: 466 },
    { village_code: 557238, village_name: 'Aagar', subdistrict_code: 4201, district_code: 466 },
    { village_code: 557249, village_name: 'Agastinagar', subdistrict_code: 4201, district_code: 466 },
    { village_code: 557248, village_name: 'Akole', subdistrict_code: 4201, district_code: 466 },
    { village_code: 557253, village_name: 'Ambad', subdistrict_code: 4201, district_code: 466 }
    // Add all 44,806 villages here...
  ]
};

export async function migrateMaharashtraData() {
  console.log('🚀 Starting Maharashtra data migration...');
  console.log(`📊 Data to migrate: ${maharashtraData.districts.length} districts, ${maharashtraData.subDistricts.length} sub-districts, ${maharashtraData.villages.length} villages`);
  
  try {
    // Step 1: Clear existing data (optional - remove if you want to preserve)
    console.log('🗑️ Clearing existing data...');
    await supabase.from('mh_villages').delete().neq('village_code', 0);
    await supabase.from('mh_subdistricts').delete().neq('subdistrict_code', 0);
    await supabase.from('mh_districts').delete().neq('district_code', 0);
    
    // Step 2: Insert districts
    console.log('📍 Inserting districts...');
    const { data: insertedDistricts, error: districtError } = await supabase
      .from('mh_districts')
      .insert(maharashtraData.districts.map(d => ({
        district_code: d.district_code,
        district_version: 1,
        district_name: d.district_name,
        state_code: 27,
        state_name: 'Maharashtra',
        census_2001_code: d.census_2001_code,
        census_2011_code: d.census_2011_code
      })))
      .select();
    
    if (districtError) {
      console.error('❌ District insertion failed:', districtError);
      throw districtError;
    }
    console.log(`✅ Successfully inserted ${insertedDistricts?.length || 0} districts`);
    
    // Step 3: Insert sub-districts
    console.log('🏘️ Inserting sub-districts...');
    const { data: insertedSubDistricts, error: subDistrictError } = await supabase
      .from('mh_subdistricts')
      .insert(maharashtraData.subDistricts.map(sd => ({
        subdistrict_code: sd.subdistrict_code,
        subdistrict_version: 1,
        subdistrict_name: sd.subdistrict_name,
        district_code: sd.district_code,
        district_name: sd.district_name,
        census_2011_code: sd.census_2011_code
      })))
      .select();
    
    if (subDistrictError) {
      console.error('❌ Sub-district insertion failed:', subDistrictError);
      throw subDistrictError;
    }
    console.log(`✅ Successfully inserted ${insertedSubDistricts?.length || 0} sub-districts`);
    
    // Step 4: Insert villages in batches (to avoid timeout)
    console.log('🏡 Inserting villages...');
    const batchSize = 1000;
    let totalVillagesInserted = 0;
    
    for (let i = 0; i < maharashtraData.villages.length; i += batchSize) {
      const batch = maharashtraData.villages.slice(i, i + batchSize);
      const { data: insertedVillages, error: villageError } = await supabase
        .from('mh_villages')
        .insert(batch.map(v => ({
          village_code: v.village_code,
          village_version: 1,
          village_name: v.village_name,
          subdistrict_code: v.subdistrict_code,
          district_code: v.district_code
        })))
        .select();
      
      if (villageError) {
        console.error(`❌ Village batch insertion failed at batch ${Math.floor(i/batchSize) + 1}:`, villageError);
        throw villageError;
      }
      
      totalVillagesInserted += insertedVillages?.length || 0;
      console.log(`📊 Progress: ${totalVillagesInserted}/${maharashtraData.villages.length} villages inserted...`);
    }
    
    console.log('✅ Maharashtra data migration completed successfully!');
    console.log(`📈 Final counts: ${insertedDistricts?.length || 0} districts, ${insertedSubDistricts?.length || 0} sub-districts, ${totalVillagesInserted} villages`);
    
    // Step 5: Verify data
    console.log('🔍 Verifying migrated data...');
    const { count: districtCount } = await supabase.from('mh_districts').select('*', { count: 'exact', head: true });
    const { count: subDistrictCount } = await supabase.from('mh_subdistricts').select('*', { count: 'exact', head: true });
    const { count: villageCount } = await supabase.from('mh_villages').select('*', { count: 'exact', head: true });
    
    console.log(`📊 Database verification: ${districtCount} districts, ${subDistrictCount} sub-districts, ${villageCount} villages`);
    
    return {
      success: true,
      districts: districtCount,
      subDistricts: subDistrictCount,
      villages: villageCount
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Function to display hierarchical data
export async function displayMaharashtraHierarchy() {
  console.log('🗺️ Maharashtra Regional Hierarchy:');
  console.log('================================');
  
  try {
    // Get all districts with their sub-districts and villages
    const { data: districts, error } = await supabase
      .from('mh_districts')
      .select(`
        district_code,
        district_name,
        mh_subdistricts(
          subdistrict_code,
          subdistrict_name,
          mh_villages(
            village_code,
            village_name
          )
        )
      `)
      .order('district_name')
      .order('mh_subdistricts(subdistrict_name)')
      .order('mh_subdistricts(mh_villages(village_name)');
    
    if (error) throw error;
    
    districts?.forEach((district, districtIndex) => {
      console.log(`\n${districtIndex + 1}. 📍 ${district.district_name} (Code: ${district.district_code})`);
      
      district.mh_subdistricts?.forEach((subDistrict, subIndex) => {
        console.log(`   ${districtIndex + 1}.${subIndex + 1} 🏘️ ${subDistrict.subdistrict_name} (Code: ${subDistrict.subdistrict_code})`);
        
        // Show first 5 villages as sample (to avoid console overflow)
        const sampleVillages = subDistrict.mh_villages?.slice(0, 5) || [];
        sampleVillages.forEach((village, villageIndex) => {
          console.log(`      ${districtIndex + 1}.${subIndex + 1}.${villageIndex + 1} 🏡 ${village.village_name}`);
        });
        
        const totalVillages = subDistrict.mh_villages?.length || 0;
        if (totalVillages > 5) {
          console.log(`      ... and ${totalVillages - 5} more villages`);
        }
      });
    });
    
    // Summary statistics
    const totalDistricts = districts?.length || 0;
    const totalSubDistricts = districts?.reduce((sum, d) => sum + (d.mh_subdistricts?.length || 0), 0) || 0;
    const totalVillages = districts?.reduce((sum, d) => 
      sum + d.mh_subdistricts?.reduce((subSum, sd) => subSum + (sd.mh_villages?.length || 0), 0) || 0, 0) || 0;
    
    console.log('\n📊 Summary:');
    console.log(`   Total Districts: ${totalDistricts}`);
    console.log(`   Total Sub-districts: ${totalSubDistricts}`);
    console.log(`   Total Villages: ${totalVillages}`);
    
  } catch (error) {
    console.error('❌ Failed to display hierarchy:', error);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateMaharashtraData()
    .then(() => displayMaharashtraHierarchy())
    .catch(console.error);
}
