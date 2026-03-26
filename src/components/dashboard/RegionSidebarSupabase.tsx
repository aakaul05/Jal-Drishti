import { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, History, Droplets, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useDashboard } from '@/context/DashboardContext';
import { RegionalDataService } from '@/services/regionalDataService';
import type { MhDistrict, MhSubDistrict, MhVillage } from '@/lib/supabase';

// Fallback data for immediate functionality
const fallbackData = {
  districts: [
    { district_code: 490, district_name: 'Pune' },
    { district_code: 487, district_name: 'Nashik' },
    { district_code: 469, district_name: 'Chhatrapati Sambhajinagar' },
    { district_code: 496, district_name: 'Solapur' },
    { district_code: 480, district_name: 'Kolhapur' },
    { district_code: 466, district_name: 'Ahilyanagar' },
    { district_code: 467, district_name: 'Akola' },
    { district_code: 468, district_name: 'Amravati' },
    { district_code: 470, district_name: 'Beed' },
    { district_code: 471, district_name: 'Bhandara' }
  ],
  subDistricts: [
    { subdistrict_code: 4193, subdistrict_name: 'Haveli', district_code: 490, district_name: 'Pune' },
    { subdistrict_code: 4199, subdistrict_name: 'Baramati', district_code: 490, district_name: 'Pune' },
    { subdistrict_code: 4191, subdistrict_name: 'Pune City', district_code: 490, district_name: 'Pune' },
    { subdistrict_code: 4145, subdistrict_name: 'Baglan', district_code: 487, district_name: 'Nashik' },
    { subdistrict_code: 4147, subdistrict_name: 'Nandgaon', district_code: 487, district_name: 'Nashik' },
    { subdistrict_code: 4137, subdistrict_name: 'Chhatrapati Sambhajinagar', district_code: 469, district_name: 'Chhatrapati Sambhajinagar' },
    { subdistrict_code: 4254, subdistrict_name: 'Akkalkot', district_code: 496, district_name: 'Solapur' },
    { subdistrict_code: 4255, subdistrict_name: 'Barshi', district_code: 496, district_name: 'Solapur' },
    { subdistrict_code: 4292, subdistrict_name: 'Ajra', district_code: 480, district_name: 'Kolhapur' },
    { subdistrict_code: 4293, subdistrict_name: 'Kagal', district_code: 480, district_name: 'Kolhapur' },
    { subdistrict_code: 4201, subdistrict_name: 'Akole', district_code: 466, district_name: 'Ahilyanagar' }
  ],
  villages: [
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
    { village_code: 557011, village_name: 'Akole Town', subdistrict_code: 4201, district_code: 466 },
    { village_code: 557012, village_name: 'Rajur', subdistrict_code: 4201, district_code: 466 },
    { village_code: 557013, village_name: 'Lohgad', subdistrict_code: 4201, district_code: 466 },
    { village_code: 557014, village_name: 'Ambivali', subdistrict_code: 4201, district_code: 466 },
    { village_code: 557015, village_name: 'Pachod', subdistrict_code: 4201, district_code: 466 }
  ]
};

export function RegionSidebarSupabase() {
  const { 
    selectedRegion, 
    setSelectedRegion, 
    sessionHistory,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear
  } = useDashboard();
  const [query, setQuery] = useState("");
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);
  const [expandedSubDistrict, setExpandedSubDistrict] = useState<string | null>(null);
  
  // State for dropdown selections
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedSubDistrict, setSelectedSubDistrict] = useState<string>("");
  const [selectedVillage, setSelectedVillage] = useState<string>("");
  
  // Data from Supabase or fallback
  const [districts, setDistricts] = useState<MhDistrict[]>([]);
  const [subDistricts, setSubDistricts] = useState<MhSubDistrict[]>([]);
  const [villages, setVillages] = useState<MhVillage[]>([]);
  const [searchResults, setSearchResults] = useState<MhVillage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  // Load initial data
  useEffect(() => {
    loadDistricts();
  }, []);

  // Load districts with fallback
  const loadDistricts = async () => {
    try {
      setIsLoading(true);
      const data = await RegionalDataService.getDistrictsWithHierarchy();
      setDistricts(data);
      setUseFallback(false);
    } catch (error) {
      console.log('Using fallback data - Supabase tables not created yet');
      // Use fallback data
      const formattedDistricts = fallbackData.districts.map(d => ({
        ...d,
        id: d.district_code,
        state_code: 27,
        state_name: 'Maharashtra',
        created_at: new Date().toISOString(),
        mh_subdistricts: fallbackData.subDistricts
          .filter(sd => sd.district_code === d.district_code)
          .map(sd => ({
            ...sd,
            id: sd.subdistrict_code,
            created_at: new Date().toISOString(),
            mh_villages: fallbackData.villages
              .filter(v => v.subdistrict_code === sd.subdistrict_code)
              .map(v => ({
                ...v,
                id: v.village_code,
                created_at: new Date().toISOString()
              }))
          }))
      }));
      setDistricts(formattedDistricts);
      setUseFallback(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Load sub-districts when district changes
  useEffect(() => {
    if (selectedDistrict) {
      const district = districts.find(d => d.district_name === selectedDistrict);
      if (district) {
        setSubDistricts(district.mh_subdistricts || []);
      }
    } else {
      setSubDistricts([]);
    }
    setVillages([]);
  }, [selectedDistrict, districts]);

  // Load villages when sub-district changes
  useEffect(() => {
    if (selectedSubDistrict) {
      const subDistrict = subDistricts.find(sd => sd.subdistrict_name === selectedSubDistrict);
      if (subDistrict) {
        setVillages(subDistrict.mh_villages || []);
      }
    } else {
      setVillages([]);
    }
  }, [selectedSubDistrict, subDistricts]);

  // Search functionality
  useEffect(() => {
    if (query.length > 0) {
      if (useFallback) {
        // Use fallback search
        const results = fallbackData.villages.filter(v => 
          v.village_name.toLowerCase().includes(query.toLowerCase())
        ).map(v => ({
          ...v,
          id: v.village_code,
          created_at: new Date().toISOString(),
          mh_subdistricts: fallbackData.subDistricts.find(sd => sd.subdistrict_code === v.subdistrict_code)
        }));
        setSearchResults(results);
      } else {
        // Use Supabase search
        const searchVillages = async () => {
          try {
            const results = await RegionalDataService.searchVillages(query);
            setSearchResults(results);
          } catch (error) {
            console.error('Search failed:', error);
          }
        };
        
        const timeoutId = setTimeout(searchVillages, 300);
        return () => clearTimeout(timeoutId);
      }
    } else {
      setSearchResults([]);
    }
  }, [query, useFallback]);

  // Handle dropdown selections
  const handleDistrictChange = (districtName: string) => {
    setSelectedDistrict(districtName);
    setSelectedSubDistrict("");
    setSelectedVillage("");
  };

  const handleSubDistrictChange = (subDistrictName: string) => {
    setSelectedSubDistrict(subDistrictName);
    setSelectedVillage("");
  };

  const handleVillageChange = async (villageName: string) => {
    setSelectedVillage(villageName);
    
    // Find the village with full hierarchy
    let foundRegion = null;
    for (const district of districts) {
      for (const subDistrict of district.mh_subdistricts || []) {
        const village = subDistrict.mh_villages?.find(v => v.village_name === villageName);
        if (village) {
          foundRegion = {
            id: village.village_code.toString(),
            name: village.village_name,
            village: village.village_name,
            subDistrict: subDistrict.subdistrict_name,
            district: district.district_name,
            state: 'Maharashtra'
          };
          break;
        }
      }
      if (foundRegion) break;
    }
    
    if (foundRegion) {
      setSelectedRegion(foundRegion);
    }
  };

  const selectVillageFromSearch = async (village: MhVillage) => {
    const region = {
      id: village.village_code.toString(),
      name: village.village_name,
      village: village.village_name,
      subDistrict: village.mh_subdistricts?.subdistrict_name || '',
      district: village.mh_subdistricts?.district_name || '',
      state: 'Maharashtra'
    };
    setSelectedRegion(region);
    setQuery("");
    
    // Update dropdown selections
    if (village.mh_subdistricts) {
      setSelectedDistrict(village.mh_subdistricts?.district_name || '');
      setSelectedSubDistrict(village.mh_subdistricts?.subdistrict_name || '');
      setSelectedVillage(village.village_name);
    }
  };

  return (
    <aside className="flex flex-col h-full glass-strong rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <Droplets className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold text-foreground tracking-tight">Jal-Drishti</h1>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          Maharashtra Groundwater DSS {useFallback && '(Demo Data)'}
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search village..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-secondary/50 border-border/50 text-sm placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="px-4 pt-3 pb-2 border-b border-border/30">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Search className="h-3 w-3" />
            <span className="uppercase tracking-wider font-medium">Search Results</span>
          </div>
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {searchResults.map((village) => (
              <button
                key={village.village_code}
                onClick={() => selectVillageFromSearch(village)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-xs ${
                  selectedRegion?.id === village.village_code.toString()
                    ? "bg-primary/15 border border-primary/30"
                    : "hover:bg-secondary/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className={`h-3.5 w-3.5 shrink-0 ${
                    selectedRegion?.id === village.village_code.toString() ? "text-primary" : "text-muted-foreground"
                  }`} />
                  <div className="min-w-0">
                    <p className={`font-medium truncate ${
                      selectedRegion?.id === village.village_code.toString() ? "text-primary" : "text-foreground"
                    }`}>{village.village_name}</p>
                    <p className="text-muted-foreground truncate">
                      {village.mh_subdistricts?.subdistrict_name} • {village.mh_subdistricts?.district_name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hierarchical Dropdown Selectors */}
      <div className="px-4 pt-3 pb-2 border-b border-border/30">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <MapPin className="h-3 w-3" />
          <span className="uppercase tracking-wider font-medium">Regional Selection</span>
        </div>
        <div className="space-y-2">
          {/* District Dropdown */}
          <div>
            <Label htmlFor="district-select" className="text-xs text-muted-foreground mb-1 block">District</Label>
            <Select value={selectedDistrict} onValueChange={handleDistrictChange} disabled={isLoading}>
              <SelectTrigger id="district-select" className="bg-secondary/50 border-border/50 text-sm">
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                {districts.map((district) => (
                  <SelectItem key={district.district_code} value={district.district_name}>
                    {district.district_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub-district Dropdown */}
          <div>
            <Label htmlFor="subdistrict-select" className="text-xs text-muted-foreground mb-1 block">Sub-district</Label>
            <Select value={selectedSubDistrict} onValueChange={handleSubDistrictChange} disabled={!selectedDistrict}>
              <SelectTrigger id="subdistrict-select" className="bg-secondary/50 border-border/50 text-sm">
                <SelectValue placeholder="Select sub-district" />
              </SelectTrigger>
              <SelectContent>
                {subDistricts.map((sub) => (
                  <SelectItem key={sub.subdistrict_code} value={sub.subdistrict_name}>
                    {sub.subdistrict_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Village Dropdown */}
          <div>
            <Label htmlFor="village-select" className="text-xs text-muted-foreground mb-1 block">Village</Label>
            <Select value={selectedVillage} onValueChange={handleVillageChange} disabled={!selectedSubDistrict}>
              <SelectTrigger id="village-select" className="bg-secondary/50 border-border/50 text-sm">
                <SelectValue placeholder="Select village" />
              </SelectTrigger>
              <SelectContent>
                {villages.map((village) => (
                  <SelectItem key={village.village_code} value={village.village_name}>
                    {village.village_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Month & Year Selectors */}
      {selectedRegion && (
        <div className="px-4 pt-3 pb-2 border-b border-border/30">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Calendar className="h-3 w-3" />
            <span className="uppercase tracking-wider font-medium">Monthly Drill-Down</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="month-select" className="text-xs text-muted-foreground mb-1 block">Month</Label>
              <Select value={selectedMonth?.toString() || ""} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger id="month-select" className="bg-secondary/50 border-border/50 text-sm">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year-select" className="text-xs text-muted-foreground mb-1 block">Year</Label>
              <Select value={selectedYear?.toString() || ""} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger id="year-select" className="bg-secondary/50 border-border/50 text-sm">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 19 }, (_, i) => 2016 + i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Session History */}
      {sessionHistory.length > 0 && !query && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <History className="h-3 w-3" />
            <span className="uppercase tracking-wider font-medium">Recent</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sessionHistory.slice(0, 5).map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRegion(r)}
                className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                  selectedRegion?.id === r.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-xs text-muted-foreground">Loading regional data...</div>
        </div>
      )}
    </aside>
  );
}
