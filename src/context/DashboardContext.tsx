import React, { createContext, useContext, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRegionData, type Region, type PredictionResult } from "@/data/mockData";

interface DashboardContextType {
  selectedRegion: Region | null;
  setSelectedRegion: (region: Region) => void;
  predictionData: PredictionResult | null;
  isLoading: boolean;
  sessionHistory: Region[];
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [selectedRegion, setSelectedRegionState] = useState<Region | null>(null);
  const [sessionHistory, setSessionHistory] = useState<Region[]>([]);

  const { data: predictionData = null, isLoading } = useQuery({
    queryKey: ["regionData", selectedRegion?.id],
    queryFn: () => fetchRegionData(selectedRegion!.id),
    enabled: !!selectedRegion,
    staleTime: 5 * 60 * 1000,
  });

  const setSelectedRegion = useCallback((region: Region) => {
    setSelectedRegionState(region);
    setSessionHistory((prev) => {
      const filtered = prev.filter((r) => r.id !== region.id);
      return [region, ...filtered].slice(0, 10);
    });
  }, []);

  return (
    <DashboardContext.Provider
      value={{ selectedRegion, setSelectedRegion, predictionData, isLoading, sessionHistory }}
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
