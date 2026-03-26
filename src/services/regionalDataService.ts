import { supabase, MhDistrict, MhSubDistrict, MhVillage, MhDistrictWithSubDistricts } from '@/lib/supabase';

export class RegionalDataService {
  // Fetch all districts from Maharashtra
  static async getDistricts(): Promise<MhDistrict[]> {
    const { data, error } = await supabase
      .from('mh_districts')
      .select('*')
      .order('district_name');

    if (error) throw error;
    return data || [];
  }

  // Fetch districts with their sub-districts and villages (hierarchical)
  static async getDistrictsWithHierarchy(): Promise<MhDistrictWithSubDistricts[]> {
    const { data, error } = await supabase
      .from('mh_districts')
      .select(`
        *,
        mh_subdistricts(
          subdistrict_code,
          subdistrict_name,
          district_code,
          district_name,
          census_2011_code,
          mh_villages(
            village_code,
            village_name,
            subdistrict_code,
            district_code
          )
        )
      `)
      .order('district_name')
      .order('mh_subdistricts(subdistrict_name)')
      .order('mh_subdistricts(mh_villages(village_name))');

    if (error) throw error;
    return data || [];
  }

  // Fetch sub-districts for a specific district
  static async getSubDistricts(districtCode: number): Promise<MhSubDistrict[]> {
    const { data, error } = await supabase
      .from('mh_subdistricts')
      .select('*')
      .eq('district_code', districtCode)
      .order('subdistrict_name');

    if (error) throw error;
    return data || [];
  }

  // Fetch villages for a specific sub-district
  static async getVillages(subDistrictCode: number): Promise<MhVillage[]> {
    const { data, error } = await supabase
      .from('mh_villages')
      .select('*')
      .eq('subdistrict_code', subDistrictCode)
      .order('village_name');

    if (error) throw error;
    return data || [];
  }

  // Search villages by name across all sub-districts
  static async searchVillages(query: string): Promise<MhVillage[]> {
    const { data, error } = await supabase
      .from('mh_villages')
      .select(`
        *,
        mh_subdistricts(
          subdistrict_name,
          district_code,
          district_name,
          mh_districts(
            district_name
          )
        )
      `)
      .ilike('village_name', `%${query}%`)
      .limit(20)
      .order('village_name');

    if (error) throw error;
    return data || [];
  }

  // Get village by ID with full hierarchy
  static async getVillageById(villageCode: bigint) {
    const { data, error } = await supabase
      .from('mh_villages')
      .select(`
        *,
        mh_subdistricts(
          subdistrict_name,
          district_code,
          district_name,
          mh_districts(
            district_name
          )
        )
      `)
      .eq('village_code', villageCode)
      .single();

    if (error) throw error;
    return data;
  }

  // Get district by code
  static async getDistrictByCode(districtCode: number): Promise<MhDistrict | null> {
    const { data, error } = await supabase
      .from('mh_districts')
      .select('*')
      .eq('district_code', districtCode)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
    return data;
  }

  // Get sub-district by code
  static async getSubDistrictByCode(subDistrictCode: number): Promise<MhSubDistrict | null> {
    const { data, error } = await supabase
      .from('mh_subdistricts')
      .select('*')
      .eq('subdistrict_code', subDistrictCode)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
    return data;
  }

  // Legacy methods for backward compatibility
  static async getStates() {
    // Return Maharashtra as the only state
    return [{
      id: '27',
      name: 'Maharashtra',
      code: 'MH',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];
  }

  // Convert Maharashtra data to legacy format
  static convertToLegacyFormat(districts: MhDistrictWithSubDistricts[]) {
    return districts.map(district => ({
      id: district.district_code.toString(),
      name: district.district_name,
      code: district.district_code.toString(),
      state_id: '27',
      subDistricts: district.mh_subdistricts?.map(sub => ({
        id: sub.subdistrict_code.toString(),
        name: sub.subdistrict_name,
        code: sub.subdistrict_code.toString(),
        district_id: district.district_code.toString(),
        villages: sub.mh_villages?.map(village => ({
          id: village.village_code.toString(),
          name: village.village_name,
          code: village.village_code.toString(),
          sub_district_id: sub.subdistrict_code.toString()
        })) || []
      })) || []
    }));
  }
}
