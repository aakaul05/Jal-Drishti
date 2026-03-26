// Simple test script to check Supabase connection
console.log('🔍 Testing Supabase Connection for Jal-Drishti');
console.log('=============================================');

// Test environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  console.log('');
  console.log('💡 Please check your .env file contains:');
  console.log('   VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('   VITE_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log(`🔗 Supabase URL: ${supabaseUrl}`);
console.log('');

// Import and test Supabase
import('@supabase/supabase-js').then(({ createClient }) => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔌 Testing Supabase connection...');
  
  // Test basic connection by checking districts table
  supabase
    .from('mh_districts')
    .select('count')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('');
        console.log('🔧 Possible solutions:');
        console.log('   1. Run the database schema first (supabase/maharashtra-schema.sql)');
        console.log('   2. Check if tables exist in your Supabase project');
        console.log('   3. Verify RLS policies allow public access');
        console.log('   4. Check your Supabase project URL and keys');
        process.exit(1);
      }
      
      console.log('✅ Supabase connection successful!');
      console.log('');
      
      // Check data status
      Promise.all([
        supabase.from('mh_districts').select('*', { count: 'exact', head: true }),
        supabase.from('mh_subdistricts').select('*', { count: 'exact', head: true }),
        supabase.from('mh_villages').select('*', { count: 'exact', head: true })
      ]).then(([districts, subDistricts, villages]) => {
        console.log('📊 Current Database Status:');
        console.log(`   Districts: ${districts.count || 0}`);
        console.log(`   Sub-districts: ${subDistricts.count || 0}`);
        console.log(`   Villages: ${villages.count || 0}`);
        console.log('');
        
        if (districts.count === 0) {
          console.log('📝 No data found. Next steps:');
          console.log('   1. Add your complete data to scripts/migrateMaharashtraComplete.js');
          console.log('   2. Run: npm run migrate:maharashtra');
          console.log('   3. Then: npm run show:hierarchy');
        } else {
          console.log('🎉 Data found! You can now:');
          console.log('   1. Run: npm run show:hierarchy (to see sample data)');
          console.log('   2. Run: npm run show:full-hierarchy (to see all data)');
          console.log('   3. Start the app: npm run dev');
        }
        
        process.exit(0);
      }).catch(error => {
        console.error('❌ Error checking data:', error.message);
        process.exit(1);
      });
    })
    .catch(error => {
      console.error('❌ Connection error:', error.message);
      process.exit(1);
    });
}).catch(error => {
  console.error('❌ Failed to import Supabase:', error.message);
  console.log('💡 Please install @supabase/supabase-js:');
  console.log('   npm install @supabase/supabase-js');
  process.exit(1);
});
