// CSV to Supabase Migration Script
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://reaubfkawbovjhpurtbx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYXViZmthd2JvdmpocHVydGJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MTAwMDMsImV4cCI6MjA5MDA4NjAwM30.64igBjud8qczrwK1k51bJdJoPHqntwWZ2cjbw2lhQfA';
const supabase = createClient(supabaseUrl, supabaseKey);

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((header, index) => {
      const value = values[index];
      // Convert numeric strings to numbers
      if (header.includes('_code') && value) {
        obj[header] = parseInt(value) || value;
      } else {
        obj[header] = value || '';
      }
    });
    return obj;
  });
}

async function migrateCSVData() {
  console.log('🚀 CSV to Supabase Migration Started');
  
  try {
    // Parse CSV files
    console.log('📊 Parsing CSV files...');
    const districts = parseCSV('maharashtra-districts.csv');
    const subDistricts = parseCSV('maharashtra-subdistricts.csv');
    const villages = parseCSV('maharashtra-villages.csv');
    
    console.log(`📋 Found: ${districts.length} districts, ${subDistricts.length} sub-districts, ${villages.length} villages`);
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await supabase.from('mh_villages').delete().neq('village_code', 0);
    await supabase.from('mh_subdistricts').delete().neq('subdistrict_code', 0);
    await supabase.from('mh_districts').delete().neq('district_code', 0);
    
    // Insert districts
    console.log('📍 Inserting districts...');
    const { data: insertedDistricts, error: districtError } = await supabase
      .from('mh_districts')
      .insert(districts)
      .select();
    
    if (districtError) throw districtError;
    console.log(`✅ Inserted ${insertedDistricts?.length || 0} districts`);
    
    // Insert sub-districts
    console.log('🏘️ Inserting sub-districts...');
    const { data: insertedSubDistricts, error: subDistrictError } = await supabase
      .from('mh_subdistricts')
      .insert(subDistricts)
      .select();
    
    if (subDistrictError) throw subDistrictError;
    console.log(`✅ Inserted ${insertedSubDistricts?.length || 0} sub-districts`);
    
    // Insert villages in batches
    console.log('🏡 Inserting villages...');
    const batchSize = 1000;
    let totalInserted = 0;
    
    for (let i = 0; i < villages.length; i += batchSize) {
      const batch = villages.slice(i, i + batchSize);
      const { data: insertedVillages, error: villageError } = await supabase
        .from('mh_villages')
        .insert(batch)
        .select();
      
      if (villageError) throw villageError;
      
      totalInserted += insertedVillages?.length || 0;
      console.log(`📊 Progress: ${totalInserted}/${villages.length} villages...`);
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log(`📈 Final counts: ${insertedDistricts?.length} districts, ${insertedSubDistricts?.length} sub-districts, ${totalInserted} villages`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

// Instructions
console.log('📋 CSV Migration Instructions:');
console.log('==============================');
console.log('1. Fill in your complete data in the CSV files:');
console.log('   - maharashtra-districts.csv (36 districts)');
console.log('   - maharashtra-subdistricts.csv (358 sub-districts)');
console.log('   - maharashtra-villages.csv (44,806 villages)');
console.log('');
console.log('2. Run this script:');
console.log('   node csv-migration.js');
console.log('');
console.log('3. Or use the file uploader:');
console.log('   Open file-uploader.html in browser');
console.log('');

// Uncomment to run migration
// migrateCSVData();
