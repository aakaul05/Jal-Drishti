import { supabase } from '../src/lib/supabase.js';

export async function showMaharashtraHierarchy() {
  console.log('🗺️ Maharashtra Regional Hierarchy Viewer');
  console.log('========================================');
  
  try {
    // Test connection first
    console.log('🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('mh_districts')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError.message);
      console.log('💡 Please ensure:');
      console.log('   1. Supabase tables are created using maharashtra-schema.sql');
      console.log('   2. Your .env file has correct Supabase credentials');
      console.log('   3. RLS policies allow public read access');
      return;
    }
    
    console.log('✅ Connection successful!');
    console.log('');
    
    // Get counts first
    const { count: districtCount } = await supabase.from('mh_districts').select('*', { count: 'exact', head: true });
    const { count: subDistrictCount } = await supabase.from('mh_subdistricts').select('*', { count: 'exact', head: true });
    const { count: villageCount } = await supabase.from('mh_villages').select('*', { count: 'exact', head: true });
    
    console.log('📊 Current Database Status:');
    console.log(`   Districts: ${districtCount || 0}`);
    console.log(`   Sub-districts: ${subDistrictCount || 0}`);
    console.log(`   Villages: ${villageCount || 0}`);
    console.log('');
    
    if (!districtCount) {
      console.log('📝 No data found. Please run the migration first:');
      console.log('   npm run migrate:maharashtra');
      return;
    }
    
    // Get districts with sample data
    console.log('📍 Districts in Maharashtra:');
    console.log('==========================');
    
    const { data: districts, error } = await supabase
      .from('mh_districts')
      .select(`
        district_code,
        district_name,
        census_2001_code,
        census_2011_code
      `)
      .order('district_name')
      .limit(10); // Show first 10 for demo
    
    if (error) throw error;
    
    districts?.forEach((district, index) => {
      console.log(`${index + 1}. ${district.district_name} (Code: ${district.district_code})`);
      console.log(`   Census 2001: ${district.census_2001_code}, Census 2011: ${district.census_2011_code}`);
    });
    
    if (districtCount > 10) {
      console.log(`... and ${districtCount - 10} more districts`);
    }
    
    // Show sample hierarchy for first district
    if (districts && districts.length > 0) {
      console.log('');
      console.log(`🏘️ Sample Hierarchy for ${districts[0].district_name}:`);
      console.log('=============================================');
      
      const { data: hierarchy } = await supabase
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
        .eq('district_code', districts[0].district_code)
        .single();
      
      if (hierarchy) {
        hierarchy.mh_subdistricts?.forEach((subDistrict, subIndex) => {
          console.log(`   ${subIndex + 1}. ${subDistrict.subdistrict_name}`);
          
          // Show first 3 villages
          const villages = subDistrict.mh_villages?.slice(0, 3) || [];
          villages.forEach((village) => {
            console.log(`      🏡 ${village.village_name}`);
          });
          
          const totalVillages = subDistrict.mh_villages?.length || 0;
          if (totalVillages > 3) {
            console.log(`      ... and ${totalVillages - 3} more villages`);
          }
        });
      }
    }
    
    console.log('');
    console.log('🔍 Search Examples:');
    console.log('=================');
    console.log('You can search for villages like:');
    console.log('- "Wagholi"');
    console.log('- "Pune"');
    console.log('- "Mumbai"');
    console.log('');
    console.log('💡 To see full hierarchy, run:');
    console.log('   npm run show:full-hierarchy');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

export async function showFullHierarchy() {
  console.log('🗺️ Complete Maharashtra Hierarchy');
  console.log('==================================');
  console.log('⚠️  This will show ALL data - may be very large!');
  console.log('');
  
  try {
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
    
    let totalVillages = 0;
    
    districts?.forEach((district, districtIndex) => {
      console.log(`\n${districtIndex + 1}. 📍 ${district.district_name} (${district.district_code})`);
      
      district.mh_subdistricts?.forEach((subDistrict, subIndex) => {
        console.log(`   ${districtIndex + 1}.${subIndex + 1} 🏘️ ${subDistrict.subdistrict_name} (${subDistrict.subdistrict_code})`);
        
        const villages = subDistrict.mh_villages || [];
        villages.forEach((village, villageIndex) => {
          if (villageIndex < 10) { // Show first 10 villages per sub-district
            console.log(`      ${districtIndex + 1}.${subIndex + 1}.${villageIndex + 1} 🏡 ${village.village_name} (${village.village_code})`);
          }
        });
        
        totalVillages += villages.length;
        if (villages.length > 10) {
          console.log(`      ... and ${villages.length - 10} more villages`);
        }
      });
    });
    
    console.log(`\n📊 Total: ${districts?.length} districts, ${districts?.reduce((sum, d) => sum + (d.mh_subdistricts?.length || 0), 0)} sub-districts, ${totalVillages} villages`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'full') {
    showFullHierarchy();
  } else {
    showMaharashtraHierarchy();
  }
}
