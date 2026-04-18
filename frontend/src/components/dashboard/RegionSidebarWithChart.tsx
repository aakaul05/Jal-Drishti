import { useState, useEffect } from 'react';
import { MapPin, Calendar, Loader2, Droplets } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useDashboard } from '@/context/DashboardContext';
import { useLanguage } from '@/context/LanguageContext';
import { monthSelectOptions } from '@/i18n/helpers';
import { RegionalDataService } from '@/services/regionalDataService';
import type { MhSubDistrict, MhVillage, MhDistrictWithSubDistricts } from '@/services/regionalDataService';

export function RegionSidebarWithChart() {
  const { setSelectedRegion, selectedMonth, setSelectedMonth, selectedYear, setSelectedYear } = useDashboard();
  const { t } = useLanguage();
  
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
      // Only fetch district names (1 API call instead of 36+)
      const data = await RegionalDataService.getDistricts();
      setDistricts(data.map(d => ({ ...d, mh_subdistricts: [] })));
    } catch (error) {
      console.error('Failed to load districts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load sub-districts when district changes (1 API call per selection)
  useEffect(() => {
    if (selectedDistrict) {
      loadSubDistricts(selectedDistrict);
    } else {
      setSubDistricts([]);
    }
    setVillages([]);
  }, [selectedDistrict]);

  const loadSubDistricts = async (districtName: string) => {
    try {
      const blocks = await RegionalDataService.getSubDistricts(districtName);
      setSubDistricts(blocks);
    } catch (error) {
      console.error('Failed to load sub-districts:', error);
      setSubDistricts([]);
    }
  };

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
        const villageData = await RegionalDataService.getVillages(selectedDistrict, selectedSubDistrict);
        setVillages(villageData);
      }
    } catch (error) {
      console.error('Failed to load villages:', error);
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
  // const years = Array.from({ length: 2 }, (_, i) => currentYear + i);
  const years = [2025];

  // Step indicator
  const step = !selectedDistrict ? 1 : !selectedSubDistrict ? 2 : !selectedVillage ? 3 : 4;

  return (
    <div className="flex flex-col gap-3">
      {/* ─── Region Selection ─── */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-cyan-500/10">
            <MapPin className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("regionalSelection")}</h3>
            <p className="text-[10px] text-muted-foreground">Select your location to view data</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span className="ml-2 text-sm text-muted-foreground">Loading regions...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Step 1: District */}
            <div>
              <Label htmlFor="district-select" className="text-xs text-muted-foreground mb-1 block">
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold mr-1.5 ${step >= 1 ? 'bg-cyan-500 text-white' : 'bg-secondary text-muted-foreground'}`}>1</span>
                {t("district")}
              </Label>
              <Select value={selectedDistrict} onValueChange={(val) => { setSelectedDistrict(val); setSelectedSubDistrict(""); setSelectedVillage(""); }}>
                <SelectTrigger id="district-select" className="bg-secondary/50 border-border/50 text-sm">
                  <SelectValue placeholder={`🏛️ ${t("selectDistrict")}`} />
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

            {/* Step 2: Sub-district */}
            <div>
              <Label htmlFor="subdistrict-select" className="text-xs text-muted-foreground mb-1 block">
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold mr-1.5 ${step >= 2 ? 'bg-cyan-500 text-white' : 'bg-secondary text-muted-foreground'}`}>2</span>
                {t("subDistrict")}
              </Label>
              <Select value={selectedSubDistrict} onValueChange={(val) => { setSelectedSubDistrict(val); setSelectedVillage(""); }} disabled={!selectedDistrict}>
                <SelectTrigger id="subdistrict-select" className={`bg-secondary/50 border-border/50 text-sm ${!selectedDistrict ? 'opacity-40' : ''}`}>
                  <SelectValue placeholder={`📍 ${t("selectSubDistrict")}`} />
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

            {/* Step 3: Village */}
            <div>
              <Label htmlFor="village-select" className="text-xs text-muted-foreground mb-1 block">
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold mr-1.5 ${step >= 3 ? 'bg-cyan-500 text-white' : 'bg-secondary text-muted-foreground'}`}>3</span>
                {t("village")}
              </Label>
              <Select value={selectedVillage} onValueChange={handleVillageChange} disabled={!selectedSubDistrict}>
                <SelectTrigger id="village-select" className={`bg-secondary/50 border-border/50 text-sm ${!selectedSubDistrict ? 'opacity-40' : ''}`}>
                  <SelectValue placeholder={`🏘️ ${t("selectVillage")}`} />
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

            {/* Selection Complete Indicator */}
            {selectedVillage && (
              <div className="mt-1 p-2.5 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-lg border border-emerald-500/20 animate-slide-up">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-emerald-400" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-emerald-300">✅ Location Selected</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{selectedVillage} → {selectedSubDistrict} → {selectedDistrict}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Time Period Selection ─── */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-blue-500/10">
            <Calendar className="h-4 w-4 text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{t("timePeriod")}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Month */}
          <div>
            <Label htmlFor="month-select" className="text-xs text-muted-foreground mb-1 block">{t("month")}</Label>
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

          {/* Year */}
          <div>
            <Label htmlFor="year-select" className="text-xs text-muted-foreground mb-1 block">{t("year")}</Label>
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
          <div className="mt-2 p-2 bg-secondary/20 rounded-lg border border-border/20">
            <p className="text-xs text-muted-foreground text-center">
              📅 {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              {selectedYear > currentYear && (
                <span className="ml-1 text-neon-green font-medium">• {t("summaryPredicted")}</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* ─── Quick Info ─── */}
      <div className="glass rounded-xl p-4">
        <div className="grid grid-cols-2 gap-2 text-center place-items-center">
          <div className="p-2.5 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 rounded-lg border border-cyan-500/15 flex flex-col items-center justify-center">
            <p className="text-lg font-bold text-cyan-400">{2025}</p>
            <p className="text-[10px] text-muted-foreground">Current Year</p>
          </div>
        </div>
      </div>
    </div>
  );
}
