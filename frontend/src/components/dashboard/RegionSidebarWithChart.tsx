import { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, History, Droplets, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useDashboard } from '@/context/DashboardContext';
import { RegionalDataService } from '@/services/regionalDataService';
import type { MhDistrict, MhSubDistrict, MhVillage, MhDistrictWithSubDistricts } from '@/services/regionalDataService';

export function RegionSidebarWithChart() {
  const { setSelectedRegion, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear } = useDashboard();
  
  // State for dropdown selections
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedSubDistrict, setSelectedSubDistrict] = useState<string>("");
  const [selectedVillage, setSelectedVillage] = useState<string>("");
  
  // Data from Supabase
  const [districts, setDistricts] = useState<MhDistrictWithSubDistricts[]>([]);
  const [subDistricts, setSubDistricts] = useState<MhSubDistrict[]>([]);
  const [villages, setVillages] = useState<MhVillage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load districts on mount
  useEffect(() => {
    loadDistricts();
  }, []);

  const loadDistricts = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading districts from Supabase...');
      const data = await RegionalDataService.getDistrictsWithHierarchy();
      console.log(`✅ Service returned ${data?.length || 0} districts`);
      setDistricts(data);
    } catch (error) {
      console.error('❌ Service error:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load sub-districts when district changes
  useEffect(() => {
    if (selectedDistrict) {
      const district = districts.find(d => d.district_name === selectedDistrict);
      if (district && district.mh_subdistricts) {
        setSubDistricts(district.mh_subdistricts);
      }
    } else {
      setSubDistricts([]);
    }
    setVillages([]);
  }, [selectedDistrict, districts]);

  // Load villages when sub-district changes
  useEffect(() => {
    if (selectedSubDistrict) {
      loadVillages();
    } else {
      setVillages([]);
    }
  }, [selectedSubDistrict]);

  const loadVillages = async () => {
    try {
      const subDistrict = subDistricts.find(sd => sd.subdistrict_name === selectedSubDistrict);
      if (subDistrict) {
        console.log('🏘️ Loading villages for sub-district:', subDistrict.subdistrict_name);
        const villageData = await RegionalDataService.getVillages(subDistrict.subdistrict_code);
        console.log(`✅ Got ${villageData?.length || 0} villages`);
        setVillages(villageData);
      }
    } catch (error) {
      console.error('❌ Error loading villages:', error.message);
      setVillages([]);
    }
  };

  // Handle village selection - update dashboard context
  const handleVillageChange = (villageName: string) => {
    setSelectedVillage(villageName);

    // Update dashboard context with selected region
    if (villageName && selectedDistrict && selectedSubDistrict) {
      const selectedVillageData = villages.find((v) => v.village_name === villageName);
      const region = {
        id: selectedVillageData?.village_code?.toString() ?? villageName,
        name: villageName,
        village: villageName,
        subDistrict: selectedSubDistrict,
        district: selectedDistrict,
        state: 'Maharashtra'
      };
      setSelectedRegion(region);
    }
  };

  // Month/Year data
  const currentYear = new Date().getFullYear();
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  const years = Array.from({ length: 2 }, (_, i) => currentYear + i);

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Regional Selection */}
      <div className="glass rounded-xl p-4 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-cyan-glow" />
          <h3 className="text-sm font-semibold text-foreground">Regional Selection</h3>
        </div>
        
        <div className="space-y-2">
          {/* District Dropdown */}
          <div>
            <Label htmlFor="district-select" className="text-xs text-muted-foreground mb-1 block">
              District
            </Label>
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={isLoading}>
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
            <Label htmlFor="subdistrict-select" className="text-xs text-muted-foreground mb-1 block">
              Sub-district
            </Label>
            <Select value={selectedSubDistrict} onValueChange={setSelectedSubDistrict} disabled={!selectedDistrict}>
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
            <Label htmlFor="village-select" className="text-xs text-muted-foreground mb-1 block">
              Village
            </Label>
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

      {/* Time Period Selection */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-cyan-glow" />
          <h3 className="text-sm font-semibold text-foreground">Time Period</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Month Selector */}
          <div>
            <Label htmlFor="month-select" className="text-xs text-muted-foreground mb-1 block">
              Month
            </Label>
            <Select value={selectedMonth?.toString() || ""} onValueChange={(value) => setSelectedMonth(value ? parseInt(value) : null)}>
              <SelectTrigger id="month-select" className="bg-secondary/50 border-border/50 text-sm">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Selector */}
          <div>
            <Label htmlFor="year-select" className="text-xs text-muted-foreground mb-1 block">
              Year
            </Label>
            <Select value={selectedYear?.toString() || ""} onValueChange={(value) => setSelectedYear(value ? parseInt(value) : null)}>
              <SelectTrigger id="year-select" className="bg-secondary/50 border-border/50 text-sm">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year} {year === currentYear ? '(Current)' : '(Prediction)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selection Summary */}
        {(selectedMonth && selectedYear) && (
          <div className="mt-3 p-2 bg-secondary/30 rounded-lg border border-border/30">
            <p className="text-xs text-muted-foreground text-center">
              {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              {selectedYear > currentYear && (
                <span className="ml-1 text-neon-green font-medium">• Predicted</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
