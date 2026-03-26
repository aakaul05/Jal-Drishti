// Test file to verify monthly drill-down functionality
import { fetchMonthlyData } from '../src/data/mockData';

async function testMonthlyFunctionality() {
  console.log('Testing Monthly Drill-Down Functionality...\n');
  
  const testCases = [
    { regionId: 'v1', year: 2026, month: 5, description: 'Pre-monsoon (May)' },
    { regionId: 'v1', year: 2026, month: 8, description: 'Monsoon (August)' },
    { regionId: 'v1', year: 2026, month: 11, description: 'Post-monsoon (November)' },
  ];
  
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.description}`);
    try {
      const result = await fetchMonthlyData(testCase.regionId, testCase.year, testCase.month);
      console.log(`✅ Success: Depth=${result.exact_depth}ft, Change Rate=${result.monthly_change_rate}ft/mo`);
      console.log(`Insights: ${result.pointwise_insights.length} items generated`);
      result.pointwise_insights.forEach(insight => console.log(`  - ${insight}`));
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    console.log('---\n');
  }
}

// Export for manual testing in browser console
if (typeof window !== 'undefined') {
  window.testMonthlyFunctionality = testMonthlyFunctionality;
  console.log('Test function available. Run testMonthlyFunctionality() in console to test.');
}

export { testMonthlyFunctionality };
