import React, { createContext, useContext, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRegionData, fetchMonthlyData, type Region, type PredictionResult, type MonthlyPredictionResult } from "@/data/mockData";

interface DashboardContextType {
  selectedRegion: Region | null;
  setSelectedRegion: (region: Region) => void;
  predictionData: PredictionResult | null;
  isLoading: boolean;
  sessionHistory: Region[];
  selectedMonth: number | null;
  setSelectedMonth: (month: number | null) => void;
  selectedYear: number | null;
  setSelectedYear: (year: number | null) => void;
  monthlyData: MonthlyPredictionResult | null;
  isLoadingMonthly: boolean;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [selectedRegion, setSelectedRegionState] = useState<Region | null>(null);
  const [sessionHistory, setSessionHistory] = useState<Region[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Use both id (for history endpoint) and name (for predictions/risk endpoints)
  // as part of the query key for proper cache invalidation.
  const { data: predictionData = null, isLoading } = useQuery({
    queryKey: ["regionData", selectedRegion?.id, selectedRegion?.name],
    queryFn: () => fetchRegionData(selectedRegion!),
    enabled: !!selectedRegion,
    staleTime: 5 * 60 * 1000,
  });

  // fetchMonthlyData now takes villageName (not regionId) to match the backend API.
  const { data: monthlyData = null, isLoading: isLoadingMonthly } = useQuery({
    queryKey: ["monthlyData", selectedRegion?.name, selectedYear, selectedMonth],
    queryFn: () => fetchMonthlyData(selectedRegion!.name, selectedYear!, selectedMonth!),
    enabled: !!(selectedRegion && selectedYear && selectedMonth),
    staleTime: 2 * 60 * 1000,
  });

  const setSelectedRegion = useCallback((region: Region) => {
    console.log('setSelectedRegion called with:', region);
    setSelectedRegionState(region);
    setSessionHistory((prev) => {
      const filtered = prev.filter((r) => r.id !== region.id);
      return [region, ...filtered].slice(0, 10);
    });
  }, []);

  return (
    <DashboardContext.Provider
      value={{ 
        selectedRegion, 
        setSelectedRegion, 
        predictionData, 
        isLoading, 
        sessionHistory,
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        monthlyData,
        isLoadingMonthly
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
