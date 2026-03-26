import { RegionalDataService } from '../src/services/regionalDataService.js';
import { supabase } from '../src/lib/supabase.js';

// Maharashtra regional data structure
const maharashtraData = {
  state: {
    name: 'Maharashtra',
    code: 'MH'
  },
  districts: [
    {
      name: 'Pune',
      code: 'PN',
      subDistricts: [
        {
          name: 'Haveli',
          code: 'HV',
          villages: [
            { name: 'Wagholi', code: 'WGH' },
            { name: 'Lohegaon', code: 'LHG' },
            { name: 'Kharadi', code: 'KHD' },
            { name: 'Yerwada', code: 'YRW' },
            { name: 'Vishrantwadi', code: 'VSW' }
          ]
        },
        {
          name: 'Mulshi',
          code: 'MLS',
          villages: [
            { name: 'Pirangut', code: 'PRG' },
            { name: 'Paud', code: 'PAD' },
            { name: 'Lavale', code: 'LVL' },
            { name: 'Mulshi', code: 'MLH' },
            { name: 'Tamhini', code: 'TMH' }
          ]
        },
        {
          name: 'Baramati',
          code: 'BRT',
          villages: [
            { name: 'Baramati Town', code: 'BRT' },
            { name: 'Morgaon', code: 'MRG' },
            { name: 'Jejuri', code: 'JJR' },
            { name: 'Kasba Baramati', code: 'KBR' },
            { name: 'Nimbraj', code: 'NBR' }
          ]
        }
      ]
    },
    {
      name: 'Nashik',
      code: 'NK',
      subDistricts: [
        {
          name: 'Nashik Taluka',
          code: 'NSK',
          villages: [
            { name: 'Sinnar', code: 'SNR' },
            { name: 'Ghoti', code: 'GHT' },
            { name: 'Igatpuri', code: 'IGT' },
            { name: 'Trimbakeshwar', code: 'TRB' },
            { name: 'Chandwad', code: 'CND' }
          ]
        },
        {
          name: 'Dindori',
          code: 'DDR',
          villages: [
            { name: 'Dindori Town', code: 'DDT' },
            { name: 'Vani', code: 'VNI' },
            { name: 'Niphad', code: 'NPD' },
            { name: 'Pimpalgaon', code: 'PPN' },
            { name: 'Kalwan', code: 'KLN' }
          ]
        },
        {
          name: 'Malegaon',
          code: 'MLG',
          villages: [
            { name: 'Malegaon City', code: 'MLC' },
            { name: 'Satana', code: 'STN' },
            { name: 'Deola', code: 'DLA' },
            { name: 'Chandor', code: 'CDR' },
            { name: 'Nandgaon', code: 'NDN' }
          ]
        }
      ]
    },
    {
      name: 'Nagpur',
      code: 'NGP',
      subDistricts: [
        {
          name: 'Nagpur Urban',
          code: 'NGU',
          villages: [
            { name: 'Hingna', code: 'HNG' },
            { name: 'Kamptee', code: 'KPT' },
            { name: 'Parseoni', code: 'PRS' },
            { name: 'Mouda', code: 'MDA' },
            { name: 'Kalmeshwar', code: 'KMS' }
          ]
        },
        {
          name: 'Katol',
          code: 'KTL',
          villages: [
            { name: 'Katol Town', code: 'KTL' },
            { name: 'Narkhed', code: 'NRK' },
            { name: 'Savner', code: 'SVR' },
            { name: 'Mohpa', code: 'MHP' },
            { name: 'Bodhni', code: 'BDN' }
          ]
        }
      ]
    },
    {
      name: 'Chhatrapati Sambhajinagar',
      code: 'AUR',
      subDistricts: [
        {
          name: 'Aurangabad Taluka',
          code: 'AUR',
          villages: [
            { name: 'Paithan', code: 'PTN' },
            { name: 'Khuldabad', code: 'KHD' },
            { name: 'Kannad', code: 'KND' },
            { name: 'Deogaon', code: 'DGN' },
            { name: 'Gogaon', code: 'GGN' }
          ]
        },
        {
          name: 'Sillod',
          code: 'SLD',
          villages: [
            { name: 'Sillod Town', code: 'SLT' },
            { name: 'Soegaon', code: 'SGN' },
            { name: 'Ajanta', code: 'AJT' },
            { name: 'Fardapur', code: 'FRP' },
            { name: 'Jalna', code: 'JLN' }
          ]
        }
      ]
    },
    {
      name: 'Kolhapur',
      code: 'KLP',
      subDistricts: [
        {
          name: 'Karveer',
          code: 'KVR',
          villages: [
            { name: 'Ichalkaranji', code: 'ICK' },
            { name: 'Panhala', code: 'PNH' },
            { name: 'Kagal', code: 'KGL' },
            { name: 'Shiroli', code: 'SRL' },
            { name: 'Rukadi', code: 'RKD' }
          ]
        },
        {
          name: 'Hatkanangle',
          code: 'HTK',
          villages: [
            { name: 'Hatkanangle Town', code: 'HTK' },
            { name: 'Shirol', code: 'SRL' },
            { name: 'Gadhinglaj', code: 'GDJ' },
            { name: 'Kurundwad', code: 'KWD' },
            { name: 'Ainapur', code: 'ANP' }
          ]
        }
      ]
    },
    {
      name: 'Solapur',
      code: 'SLP',
      subDistricts: [
        {
          name: 'Solapur North',
          code: 'SLN',
          villages: [
            { name: 'Barshi', code: 'BRS' },
            { name: 'Akkalkot', code: 'AKK' },
            { name: 'Pandharpur', code: 'PDR' },
            { name: 'Mangalwedha', code: 'MGW' },
            { name: 'Karmala', code: 'KML' }
          ]
        },
        {
          name: 'Mohol',
          code: 'MHL',
          villages: [
            { name: 'Mohol Town', code: 'MLT' },
            { name: 'Kurduvadi', code: 'KVD' },
            { name: 'Jalkot', code: 'JKT' },
            { name: 'Madha', code: 'MDH' },
            { name: 'Kasegaon', code: 'KSG' }
          ]
        }
      ]
    },
    {
      name: 'Ahmednagar',
      code: 'AHM',
      subDistricts: [
        {
          name: 'Ahmednagar Taluka',
          code: 'AHN',
          villages: [
            { name: 'Shevgaon', code: 'SVG' },
            { name: 'Pathardi', code: 'PTD' },
            { name: 'Parner', code: 'PRN' },
            { name: 'Rahata', code: 'RHT' },
            { name: 'Shrigonda', code: 'SGD' }
          ]
        },
        {
          name: 'Sangamner',
          code: 'SGN',
          villages: [
            { name: 'Sangamner Town', code: 'SGT' },
            { name: 'Akole', code: 'AKL' },
            { name: 'Kopargaon', code: 'KPG' },
            { name: 'Rahuri', code: 'RHR' },
            { name: 'Karjat', code: 'KJT' }
          ]
        }
      ]
    },
    {
      name: 'Satara',
      code: 'STR',
      subDistricts: [
        {
          name: 'Satara Taluka',
          code: 'STR',
          villages: [
            { name: 'Karad', code: 'KRD' },
            { name: 'Wai', code: 'WAI' },
            { name: 'Mahabaleshwar', code: 'MBS' },
            { name: 'Panchgani', code: 'PCN' },
            { name: 'Khandala', code: 'KDL' }
          ]
        },
        {
          name: 'Phaltan',
          code: 'PHT',
          villages: [
            { name: 'Phaltan Town', code: 'PHT' },
            { name: 'Koregaon', code: 'KRG' },
            { name: 'Jawali', code: 'JWL' },
            { name: 'Mhaismal', code: 'MHM' },
            { name: 'Dahivadi', code: 'DHD' }
          ]
        }
      ]
    }
  ]
};

export async function migrateMaharashtraData() {
  console.log('Starting Maharashtra data migration...');

  try {
    // Get or create Maharashtra state
    const { data: states } = await supabase
      .from('states')
      .select('id')
      .eq('name', 'Maharashtra');
    
    let stateId;
    if (states && states.length > 0) {
      stateId = states[0].id;
      console.log('Maharashtra state already exists');
    } else {
      const { data: newState } = await supabase
        .from('states')
        .insert(maharashtraData.state)
        .select()
        .single();
      stateId = newState.id;
      console.log('Created Maharashtra state');
    }

    // Migrate districts
    for (const districtData of maharashtraData.districts) {
      console.log(`Migrating district: ${districtData.name}`);
      
      // Insert district
      const { data: district } = await supabase
        .from('districts')
        .insert({
          state_id: stateId,
          name: districtData.name,
          code: districtData.code
        })
        .select()
        .single();

      // Migrate sub-districts
      for (const subDistrictData of districtData.subDistricts) {
        console.log(`  Migrating sub-district: ${subDistrictData.name}`);
        
        // Insert sub-district
        const { data: subDistrict } = await supabase
          .from('sub_districts')
          .insert({
            district_id: district.id,
            name: subDistrictData.name,
            code: subDistrictData.code
          })
          .select()
          .single();

        // Migrate villages
        const villagesToInsert = subDistrictData.villages.map(village => ({
          sub_district_id: subDistrict.id,
          name: village.name,
          code: village.code
        }));

        const { data: villages } = await supabase
          .from('villages')
          .insert(villagesToInsert)
          .select();

        console.log(`    Inserted ${villages?.length || 0} villages`);
      }
    }

    console.log('Maharashtra data migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateMaharashtraData();
}
