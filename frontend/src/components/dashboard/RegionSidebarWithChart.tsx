import { useState, useMemo, useEffect } from 'react';
import { Search, MapPin, History, Droplets, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useDashboard } from '@/context/DashboardContext';
import { useLanguage } from '@/context/LanguageContext';
import { monthSelectOptions } from '@/i18n/helpers';
import { RegionalDataService } from '@/services/regionalDataService';
import type { MhDistrict, MhSubDistrict, MhVillage, MhDistrictWithSubDistricts } from '@/services/regionalDataService';

export function RegionSidebarWithChart() {
  console.log('RegionSidebarWithChart component mounting...');
  const { setSelectedRegion, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear } = useDashboard();
  const { t } = useLanguage();
  console.log('Dashboard hooks loaded, t function:', typeof t);
  
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
    console.log('useEffect triggered - calling loadDistricts...');
    loadDistricts();
  }, []);

  const loadDistricts = async () => {
    try {
      setIsLoading(true);
      console.log('Loading districts from Supabase...');
      const data = await RegionalDataService.getDistrictsWithHierarchy();
      console.log(`Service returned ${data?.length || 0} districts`);
      if (data && data.length > 0) {
        console.log('Sample districts:', data.slice(0, 3).map(d => d.district_name));
      } else {
        console.warn('No districts returned from service!');
      }
      setDistricts(data);
    } catch (error) {
      console.error('Service error:', error.message);
      console.error('Full error:', error);
      console.error('Stack trace:', error.stack);
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
      if (selectedDistrict && selectedSubDistrict) {
        console.log('Loading villages for district:', selectedDistrict, 'sub-district:', selectedSubDistrict);
        const villageData = await RegionalDataService.getVillages(selectedDistrict, selectedSubDistrict);
        console.log(`Got ${villageData?.length || 0} villages`);
        if (villageData && villageData.length > 0) {
          console.log('Sample villages:', villageData.slice(0, 3).map(v => v.village_name));
        } else {
          console.warn('No villages returned for this block!');
        }
        setVillages(villageData);
      }
    } catch (error) {
      console.error('Error loading villages:', error.message);
      console.error('Full error:', error);
      console.error('Stack trace:', error.stack);
      console.error('API call parameters:', { selectedDistrict, selectedSubDistrict });
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
  const months = monthSelectOptions(t);
  const years = Array.from({ length: 2 }, (_, i) => currentYear + i);

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Regional Selection */}
      <div className="glass rounded-xl p-4 flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-cyan-glow" />
          <h3 className="text-sm font-semibold text-foreground">{t("regionalSelection")}</h3>
        </div>
        
        <div className="space-y-2">
          {/* District Dropdown */}
          <div>
            <Label htmlFor="district-select" className="text-xs text-muted-foreground mb-1 block">
              {t("district")}
            </Label>
            <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={isLoading}>
              <SelectTrigger id="district-select" className="bg-secondary/50 border-border/50 text-sm">
                <SelectValue placeholder={t("selectDistrict")} />
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
              {t("subDistrict")}
            </Label>
            <Select value={selectedSubDistrict} onValueChange={setSelectedSubDistrict} disabled={!selectedDistrict}>
              <SelectTrigger id="subdistrict-select" className="bg-secondary/50 border-border/50 text-sm">
                <SelectValue placeholder={t("selectSubDistrict")} />
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
              {t("village")}
            </Label>
            <Select value={selectedVillage} onValueChange={handleVillageChange} disabled={!selectedSubDistrict}>
              <SelectTrigger id="village-select" className="bg-secondary/50 border-border/50 text-sm">
                <SelectValue placeholder={t("selectVillage")} />
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
          <h3 className="text-sm font-semibold text-foreground">{t("timePeriod")}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Month Selector */}
          <div>
            <Label htmlFor="month-select" className="text-xs text-muted-foreground mb-1 block">
              {t("month")}
            </Label>
            <Select value={selectedMonth?.toString() || ""} onValueChange={(value) => setSelectedMonth(value ? parseInt(value) : null)}>
              <SelectTrigger id="month-select" className="bg-secondary/50 border-border/50 text-sm">
                <SelectValue placeholder={t("selectMonth")} />
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
              {t("year")}
            </Label>
            <Select value={selectedYear?.toString() || ""} onValueChange={(value) => setSelectedYear(value ? parseInt(value) : null)}>
              <SelectTrigger id="year-select" className="bg-secondary/50 border-border/50 text-sm">
                <SelectValue placeholder={t("selectYear")} />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year} {year === currentYear ? t("yearCurrent") : t("yearPrediction")}
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
                <span className="ml-1 text-neon-green font-medium">• {t("summaryPredicted")}</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
