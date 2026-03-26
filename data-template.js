// COMPLETE MAHARASHRA DATA TEMPLATE
// Replace the sample data in scripts/completeSetup.js with your full dataset

export const completeMaharashtraData = {
  // ALL 36 DISTRICTS
  districts: [
    // Format: { district_code, district_name, census_2001_code, census_2011_code }
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
  
  // ALL 358 SUB-DISTRICTS
  subDistricts: [
    // Format: { subdistrict_code, subdistrict_name, district_code, district_name, census_2011_code }
    // Example for Pune district:
    { subdistrict_code: 4191, subdistrict_name: 'Pune City', district_code: 490, district_name: 'Pune', census_2011_code: '04191' },
    { subdistrict_code: 4192, subdistrict_name: 'Pimpri-Chinchwad', district_code: 490, district_name: 'Pune', census_2011_code: '04192' },
    { subdistrict_code: 4193, subdistrict_name: 'Haveli', district_code: 490, district_name: 'Pune', census_2011_code: '04193' },
    { subdistrict_code: 4194, subdistrict_name: 'Khed', district_code: 490, district_name: 'Pune', census_2011_code: '04194' },
    { subdistrict_code: 4195, subdistrict_name: 'Junnar', district_code: 490, district_name: 'Pune', census_2011_code: '04195' },
    { subdistrict_code: 4196, subdistrict_name: 'Ambegaon', district_code: 490, district_name: 'Pune', census_2011_code: '04196' },
    { subdistrict_code: 4197, subdistrict_name: 'Maval', district_code: 490, district_name: 'Pune', census_2011_code: '04197' },
    { subdistrict_code: 4198, subdistrict_name: 'Mulshi', district_code: 490, district_name: 'Pune', census_2011_code: '04198' },
    { subdistrict_code: 4199, subdistrict_name: 'Baramati', district_code: 490, district_name: 'Pune', census_2011_code: '04199' },
    { subdistrict_code: 4200, subdistrict_name: 'Indapur', district_code: 490, district_name: 'Pune', census_2011_code: '04200' },
    { subdistrict_code: 4201, subdistrict_name: 'Akole', district_code: 466, district_name: 'Ahilyanagar', census_2011_code: '04201' },
    { subdistrict_code: 4202, subdistrict_name: 'Karjat', district_code: 466, district_name: 'Ahilyanagar', census_2011_code: '04202' },
    { subdistrict_code: 4203, subdistrict_name: 'Sangamner', district_code: 466, district_name: 'Ahilyanagar', census_2011_code: '04203' },
    { subdistrict_code: 4204, subdistrict_name: 'Shrigonda', district_code: 466, district_name: 'Ahilyanagar', census_2011_code: '04204' },
    { subdistrict_code: 4205, subdistrict_name: 'Shirur', district_code: 466, district_name: 'Ahilyanagar', census_2011_code: '04205' },
    { subdistrict_code: 4206, subdistrict_name: 'Parner', district_code: 466, district_name: 'Ahilyanagar', census_2011_code: '04206' },
    { subdistrict_code: 4207, subdistrict_name: 'Pathardi', district_code: 466, district_name: 'Ahilyanagar', census_2011_code: '04207' },
    { subdistrict_code: 4208, subdistrict_name: 'Shevgaon', district_code: 466, district_name: 'Ahilyanagar', census_2011_code: '04208' },
    { subdistrict_code: 4209, subdistrict_name: 'Rahata', district_code: 466, district_name: 'Ahilyanagar', census_2011_code: '04209' },
    { subdistrict_code: 4210, subdistrict_name: 'Kopargaon', district_code: 466, district_name: 'Ahilyanagar', census_2011_code: '04210' },
    // Add all remaining 348+ sub-districts here...
  ],
  
  // ALL 44,806 VILLAGES  
  villages: [
    // Format: { village_code, village_name, subdistrict_code, district_code }
    // Example for Pune district:
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
    // Add all remaining 44,796+ villages here...
  ]
};

// HOW TO USE THIS DATA:
// 1. Replace the sample data in scripts/completeSetup.js with this complete dataset
// 2. Run: node scripts/completeSetup.js
// 3. Or use the web-based setup: open setup.html in browser

console.log('📊 Data Format Ready!');
console.log('📋 Replace sample data in scripts/completeSetup.js with your complete dataset');
console.log('🚀 Then run: npm run migrate:maharashtra');
