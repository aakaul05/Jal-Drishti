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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class RegionalDataService {
  private static async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  // Fetch all districts from backend
  static async getDistricts(): Promise<MhDistrict[]> {
    const data = await this.get<MhDistrictWithSubDistricts[]>('/api/locations/districts');
    return data.map((d) => ({
      district_code: d.district_code,
      district_name: d.district_name,
    }));
  }

  // Fetch districts with their sub-districts (hierarchical)
  static async getDistrictsWithHierarchy(): Promise<MhDistrictWithSubDistricts[]> {
    return this.get<MhDistrictWithSubDistricts[]>('/api/locations/districts');
  }

  // Fetch sub-districts for a specific district
  static async getSubDistricts(districtCode: number | string): Promise<MhSubDistrict[]> {
    return this.get<MhSubDistrict[]>(`/api/locations/subdistricts/${districtCode}`);
  }

  // Fetch villages for a specific sub-district
  static async getVillages(subDistrictCode: number | string): Promise<MhVillage[]> {
    return this.get<MhVillage[]>(`/api/locations/villages/${subDistrictCode}`);
  }

  // Search villages by name across already loaded district hierarchy
  static async searchVillages(query: string): Promise<MhVillage[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    const districts = await this.getDistrictsWithHierarchy();
    const matches: MhVillage[] = [];

    for (const district of districts) {
      for (const sub of district.mh_subdistricts || []) {
        const villages = await this.getVillages(sub.subdistrict_code);
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
        const villages = await this.getVillages(sub.subdistrict_code);
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
