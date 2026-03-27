import { supabase } from '../src/lib/supabase.js';

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('states')
      .select('count')
      .single();
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    
    // Check if Maharashtra state exists
    const { data: states } = await supabase
      .from('states')
      .select('*')
      .eq('name', 'Maharashtra');
    
    if (states && states.length > 0) {
      console.log('✅ Maharashtra state found');
    } else {
      console.log('ℹ️ Maharashtra state not found - needs migration');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testSupabaseConnection();
}

export { testSupabaseConnection };
