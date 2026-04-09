const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

console.log('RegionalDataService module loaded. API_BASE_URL:', API_BASE_URL);

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
  // Fetch all unique districts from FastAPI backend
  static async getDistricts(): Promise<MhDistrict[]> {
    console.log('RegionalDataService.getDistricts() called...');
    console.log(`Fetching districts from: ${API_BASE_URL}/api/cleaned/districts`);
    const resp = await fetch(`${API_BASE_URL}/api/cleaned/districts`);
    if (!resp.ok) {
      console.error(`Districts API failed: ${resp.status} ${resp.statusText}`);
      throw new Error(`Failed to fetch districts: ${resp.status}`);
    }
    const data: { district_code: number; district_name: string }[] = await resp.json();
    console.log(`Districts API returned ${data.length} districts`);
    return data;
  }

  // Fetch districts with their blocks (sub-districts)
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

  // Fetch unique blocks for a district from FastAPI backend
  static async getSubDistricts(districtName: string): Promise<MhSubDistrict[]> {
    const resp = await fetch(`${API_BASE_URL}/api/cleaned/blocks/${encodeURIComponent(districtName)}`);
    if (!resp.ok) throw new Error(`Failed to fetch blocks: ${resp.status}`);
    const data: { subdistrict_code: number; subdistrict_name: string; district_name: string }[] = await resp.json();
    return data.map((b) => ({
      subdistrict_code: b.subdistrict_code,
      subdistrict_name: b.subdistrict_name,
      district_code: districtName,
      district_name: b.district_name,
    }));
  }

  // Fetch villages for a district and block from FastAPI backend
  static async getVillages(districtName: string, blockName: string): Promise<MhVillage[]> {
    const url = `${API_BASE_URL}/api/cleaned/villages/${encodeURIComponent(districtName)}/${encodeURIComponent(blockName)}`;
    console.log(`Fetching villages from: ${url}`);
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error(`Villages API failed: ${resp.status} ${resp.statusText}`);
      console.error(`URL was: ${url}`);
      throw new Error(`Failed to fetch villages: ${resp.status}`);
    }
    const data: { village_code: number; village_name: string; subdistrict_name: string; district_name: string }[] =
      await resp.json();
    console.log(`Villages API returned ${data.length} villages for ${districtName}/${blockName}`);
    return data.map((v) => ({
      village_code: v.village_code,
      village_name: v.village_name,
      subdistrict_code: blockName,
      district_code: districtName,
    }));
  }

  // Search villages using the fast backend search endpoint (single API call)
  static async searchVillages(query: string): Promise<MhVillage[]> {
    const normalized = query.trim();
    if (!normalized) return [];

    const resp = await fetch(
      `${API_BASE_URL}/api/cleaned/search?q=${encodeURIComponent(normalized)}`
    );
    if (!resp.ok) return [];

    const data: { village_code: number; village_name: string; district_name: string; block_name: string }[] =
      await resp.json();

    return data.map((item) => ({
      village_code: item.village_code,
      village_name: item.village_name,
      subdistrict_code: item.block_name,
      district_code: item.district_name,
      mh_subdistricts: {
        subdistrict_name: item.block_name,
        district_name: item.district_name,
      },
    }));
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
