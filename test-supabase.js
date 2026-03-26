// Simple browser test for Supabase connection
// Run this in the browser console after starting the dev server

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Import supabase dynamically
    const { supabase } = await import('./src/lib/supabase.js');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('states')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.log('🔧 Please check your .env file and Supabase configuration');
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('📊 Sample data:', data);
    
    // Check if tables exist
    const tables = ['states', 'districts', 'sub_districts', 'villages'];
    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        console.log(`✅ ${table}: ${count} records`);
      } catch (err) {
        console.log(`❌ ${table}: Table not found or not accessible`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Make it available globally
window.testSupabaseConnection = testSupabaseConnection;

console.log('🚀 Supabase test function loaded. Run testSupabaseConnection() in console to test.');
