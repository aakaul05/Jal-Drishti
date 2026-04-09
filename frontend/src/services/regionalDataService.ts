import { supabase } from '@/lib/supabase';

export interface MhDistrict {
  district_code: number | string;
  district_name: string;
}

export interface MhSubDistrict {
  subdistrict_code: number | string;
  subdistrict_name: string;
  district_code: number | string;
  district_name: string;
  census_2011_code?: string;
}

export interface MhVillage {
  village_code: bigint | number | string;
  village_name: string;
  subdistrict_code: number | string;
  district_code: number | string;
  mh_subdistricts?: {
    subdistrict_name: string;
    district_name: string;
  };
}

export interface MhDistrictWithSubDistricts extends MhDistrict {
  mh_subdistricts: MhSubDistrict[];
}

export class RegionalDataService {
  // Fetch all unique districts from groundwater_cleaned_final
  static async getDistricts(): Promise<MhDistrict[]> {
    const { data, error } = await supabase
      .from('groundwater_cleaned_final')
      .select('district')
      .order('district');
    
    if (error) throw error;
    
    // Get unique districts
    const uniqueDistricts = [...new Set(data?.map(d => d.district) || [])];
    return uniqueDistricts.map((d, i) => ({
      district_code: i + 1,
      district_name: d,
    }));
  }

  // Fetch districts with their blocks
  static async getDistrictsWithHierarchy(): Promise<MhDistrictWithSubDistricts[]> {
    const districts = await this.getDistricts();
    const result: MhDistrictWithSubDistricts[] = [];
    
    for (const district of districts) {
      const blocks = await this.getSubDistricts(district.district_name);
      result.push({
        district_code: district.district_code,
        district_name: district.district_name,
        mh_subdistricts: blocks,
      });
    }
    return result;
  }

  // Fetch unique blocks for a district
  static async getSubDistricts(districtName: string): Promise<MhSubDistrict[]> {
    const { data, error } = await supabase
      .from('groundwater_cleaned_final')
      .select('block')
      .eq('district', districtName)
      .order('block');
    
    if (error) throw error;
    
    // Get unique blocks
    const uniqueBlocks = [...new Set(data?.map(d => d.block) || [])];
    return uniqueBlocks.map((b, i) => ({
      subdistrict_code: i + 1,
      subdistrict_name: b,
      district_code: districtName,
      district_name: districtName,
    }));
  }

  // Fetch villages for a district and block
  static async getVillages(districtName: string, blockName: string): Promise<MhVillage[]> {
    const { data, error } = await supabase
      .from('groundwater_cleaned_final')
      .select('id, village')
      .eq('district', districtName)
      .eq('block', blockName)
      .order('village');
    
    if (error) throw error;
    
    return (data || []).map((v, i) => ({
      village_code: v.id,
      village_name: v.village,
      subdistrict_code: blockName,
      district_code: districtName,
    }));
  }

  // Search villages by name across already loaded district hierarchy
  static async searchVillages(query: string): Promise<MhVillage[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    const districts = await this.getDistrictsWithHierarchy();
    const matches: MhVillage[] = [];

    for (const district of districts) {
      for (const sub of district.mh_subdistricts || []) {
        const villages = await this.getVillages(district.district_name, sub.subdistrict_name);
        for (const village of villages) {
          if (village.village_name.toLowerCase().includes(normalized)) {
            matches.push(village);
            if (matches.length >= 20) return matches;
          }
        }
      }
    }

    return matches;
  }

  // Get village by ID with full hierarchy
  static async getVillageById(villageCode: bigint | number | string) {
    const districts = await this.getDistrictsWithHierarchy();
    for (const district of districts) {
      for (const sub of district.mh_subdistricts || []) {
        const villages = await this.getVillages(district.district_name, sub.subdistrict_name);
        const found = villages.find((v) => v.village_code.toString() === villageCode.toString());
        if (found) return found;
      }
    }
    return null;
  }

  // Get district by code
  static async getDistrictByCode(districtCode: number | string): Promise<MhDistrict | null> {
    const districts = await this.getDistricts();
    return districts.find((d) => d.district_code.toString() === districtCode.toString()) || null;
  }

  // Get sub-district by code
  static async getSubDistrictByCode(subDistrictCode: number | string): Promise<MhSubDistrict | null> {
    const districts = await this.getDistrictsWithHierarchy();
    for (const district of districts) {
      const found = (district.mh_subdistricts || []).find(
        (s) => s.subdistrict_code.toString() === subDistrictCode.toString()
      );
      if (found) return found;
    }
    return null;
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
        villages: [] // Villages fetched separately via getVillages()
      })) || []
    }));
  }
}
