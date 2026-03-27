import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Maharashtra-specific database types for TypeScript
export interface MhDistrict {
  id: number;
  district_code: number;
  district_version?: number;
  district_name: string;
  state_code: number;
  state_name: string;
  census_2001_code?: number;
  census_2011_code?: number;
  created_at: string;
}

export interface MhSubDistrict {
  id: number;
  subdistrict_code: number;
  subdistrict_version?: number;
  subdistrict_name: string;
  district_code: number;
  district_name: string;
  census_2011_code?: string;
  created_at: string;
}

export interface MhVillage {
  id: number;
  village_code: bigint;
  village_version?: number;
  village_name: string;
  subdistrict_code: number;
  district_code: number;
  created_at: string;
}

// Joined interfaces for easier data handling
export interface MhVillageWithRelations extends MhVillage {
  mh_subdistricts: MhSubDistrict & {
    mh_districts: MhDistrict;
  };
}

export interface MhDistrictWithSubDistricts extends MhDistrict {
  mh_subdistricts: (MhSubDistrict & {
    mh_villages: MhVillage[];
  })[];
}

// Legacy interfaces for backward compatibility
export interface State {
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface District {
  id: string;
  state_id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface SubDistrict {
  id: string;
  district_id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface Village {
  id: string;
  sub_district_id: string;
  name: string;
  code: string;
  latitude?: number;
  longitude?: number;
  population?: number;
  created_at: string;
  updated_at: string;
}

export interface GroundwaterData {
  id: string;
  village_id: string;
  year: number;
  month?: number;
  depth_feet: number;
  is_predicted: boolean;
  upper_ci?: number;
  lower_ci?: number;
  measurement_date?: string;
  created_at: string;
  updated_at: string;
}
