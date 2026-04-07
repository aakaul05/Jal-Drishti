import { useEffect, useMemo, useState } from "react";
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, ComposedChart, ReferenceLine, ReferenceDot,
} from "recharts";
import { useDashboard } from "@/context/DashboardContext";
import { fetchMonthlyData, type MonthlyPredictionResult } from "@/data/mockData";
import { useLanguage } from "@/context/LanguageContext";
import { monthShortLabels } from "@/i18n/helpers";
import { Skeleton } from "@/components/ui/skeleton";

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: Record<string, unknown> }[];
}) {
  const { t } = useLanguage();
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as {
    isMonthly?: boolean;
    label?: string;
    year?: number;
    depth?: number;
    predicted?: boolean;
    upperCI?: number;
    lowerCI?: number;
  };
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs shadow-xl border border-border/30">
      <p className="font-semibold text-foreground mb-1">
        {point.isMonthly
          ? `${point.label} ${point.year}`
          : `${t("yearLabel")}: ${point.year}`}
      </p>
      <p className="text-cyan-glow">
        {t("depthFt")}: <span className="font-mono font-bold">{point?.depth?.toFixed(2)} ft</span>
      </p>
      {point?.predicted && point?.upperCI != null && (
        <p className="text-muted-foreground mt-0.5">
          {t("confidenceInterval")}: {point.lowerCI?.toFixed(2)} – {point.upperCI?.toFixed(2)} ft
        </p>
      )}
      {point?.predicted && (
        <span className="inline-block mt-1 text-neon-green text-[10px] font-medium uppercase tracking-wider">
          {t("predicted")}
        </span>
      )}
      {point?.isMonthly && !point?.predicted && (
        <span className="inline-block mt-1 text-cyan-glow text-[10px] font-medium uppercase tracking-wider">
          {t("currentYear")}
        </span>
      )}
    </div>
  );
}

export function WaterLevelChart() {
  const { 
    predictionData, 
    isLoading, 
    selectedRegion, 
    selectedMonth, 
    selectedYear, 
    monthlyData 
  } = useDashboard();
  const { t, locale } = useLanguage();

  // Next-year (12 months) forecast from the backend ML model.
  const [nextYearMonthly, setNextYearMonthly] = useState<MonthlyPredictionResult[] | null>(null);

  const chartData = useMemo(() => {
    if (!predictionData) return [];
    
    const inferredCurrentYear = Math.max(...predictionData.historicalData.map((d) => d.year));
    const nextYear = inferredCurrentYear + 1;
    const monthlyLabels = monthShortLabels(t);
    
    // Historical yearly data (last 10 years, excluding current year)
    const historicalYearly = predictionData.historicalData
      .filter((d) => d.year < inferredCurrentYear)
      .slice()
      .sort((a, b) => a.year - b.year)
      .slice(-10)
      .map((d) => ({
        year: d.year,
        label: d.year.toString(),
        depth: d.depth,
        historicalDepth: d.depth,
        predictedDepth: undefined as number | undefined,
        upperCI: undefined as number | undefined,
        lowerCI: undefined as number | undefined,
        isMonthly: false,
      }));

    // Predicted monthly data for next year (from backend)
    const predictedMonthly = nextYearMonthly
      ? monthlyLabels.map((monthLabel, idx) => {
          const m = nextYearMonthly[idx];
          const depth = m?.exact_depth;
          return {
            year: nextYear,
            label: monthLabel,
            depth,
            historicalDepth: undefined as number | undefined,
            predictedDepth: depth,
            upperCI: undefined as number | undefined,
            lowerCI: undefined as number | undefined,
            isMonthly: true,
          };
        })
      : [];

    // Connect the lines between current year and predictions
    const allData = [
      ...historicalYearly,
      ...predictedMonthly
    ];

    // Add bridge points for smooth transitions
    // (No bridge needed; historical points are discrete, monthly forecast starts right after.)

    return allData;
  }, [predictionData, locale, t, nextYearMonthly]);

  // Calculate monthly highlight position
  const monthlyHighlight = useMemo(() => {
    if (!selectedMonth || !selectedYear || !monthlyData) return null;
    
    const inferredMonthLabels = monthShortLabels(t);
    const monthLabel = inferredMonthLabels[selectedMonth - 1];
    const match = chartData.find((d) => d.year === selectedYear && d.label === monthLabel);
    if (!match) return null;
    
    return {
      x: monthLabel,
      y: monthlyData.exact_depth,
      depth: monthlyData.exact_depth,
    };
  }, [selectedMonth, selectedYear, monthlyData, chartData, t]);

  // Load next-year monthly forecast when region changes / after annual prediction loads.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selectedRegion || !predictionData) return;

      const inferredCurrentYear = Math.max(...predictionData.historicalData.map((d) => d.year));
      const nextYear = inferredCurrentYear + 1;

      try {
        setNextYearMonthly(null);
        const results = await Promise.all(
          Array.from({ length: 12 }, (_, i) => fetchMonthlyData(selectedRegion.id, nextYear, i + 1))
        );
        if (cancelled) return;
        setNextYearMonthly(results);
      } catch {
        if (cancelled) return;
        setNextYearMonthly([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedRegion, predictionData]);

  if (!selectedRegion) {
    return (
      <div className="flex items-center justify-center h-full glass rounded-xl">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">{t("selectRegionToBegin")}</p>
          <p className="text-muted-foreground/60 text-sm mt-1">{t("chooseFromSidebar")}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6 h-full flex flex-col gap-4">
        <Skeleton className="h-6 w-48 bg-secondary" />
        <Skeleton className="flex-1 bg-secondary/50 rounded-lg" />
      </div>
    );
  }
  const derivedCurrentYear = predictionData ? Math.max(...predictionData.historicalData.map((d) => d.year)) : 2026;
  const currentYear = derivedCurrentYear;
  const lastHistorical = chartData
    .slice()
    .reverse()
    .find((d) => !d.isMonthly);
  const referenceLineX = lastHistorical?.label ?? currentYear.toString();

  return (
    <div className="glass rounded-xl p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("groundwaterDepthAnalysis")}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{selectedRegion.name} • {selectedRegion.district}</p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-cyan-glow rounded-full inline-block" />
            {t("legendHistoricalYearly")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-neon-green rounded-full inline-block" style={{ backgroundImage: "repeating-linear-gradient(90deg, hsl(145,100%,50%) 0, hsl(145,100%,50%) 4px, transparent 4px, transparent 8px)" }} />
            {t("legendPredictedMonthly")}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="ciGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(145,100%,50%)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(145,100%,50%)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(222,30%,25%,0.3)" />
            <XAxis
              dataKey="label"
              stroke="hsla(215,20%,55%,0.6)"
              tick={{ fontSize: 11, fill: "hsla(215,20%,55%,0.8)" }}
              axisLine={{ stroke: "hsla(222,30%,25%,0.4)" }}
            />
            <YAxis
              stroke="hsla(215,20%,55%,0.6)"
              tick={{ fontSize: 11, fill: "hsla(215,20%,55%,0.8)" }}
              axisLine={{ stroke: "hsla(222,30%,25%,0.4)" }}
              label={{ value: `${t("depthFt")} (ft)`, angle: -90, position: "insideLeft", style: { fill: "hsla(215,20%,55%,0.6)", fontSize: 11 } }}
              reversed
            />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine
              x={referenceLineX}
              stroke="hsla(170,100%,33%,0.5)"
              strokeDasharray="4 4"
              label={{ value: t("currentYearAxis"), position: "top", fill: "hsla(170,100%,33%,0.7)", fontSize: 11 }}
            />
            {/* Confidence interval area */}
            <Area
              dataKey="upperCI"
              stroke="none"
              fill="url(#ciGradient)"
              fillOpacity={1}
              connectNulls={false}
            />
            <Area
              dataKey="lowerCI"
              stroke="none"
              fill="hsl(var(--background))"
              fillOpacity={1}
              connectNulls={false}
            />
            {/* Historical line */}
            <Line
              dataKey="historicalDepth"
              stroke="hsl(185,100%,50%)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "hsl(185,100%,50%)", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "hsl(185,100%,50%)", stroke: "hsl(185,100%,70%)", strokeWidth: 2 }}
              connectNulls={false}
            />
            {/* Predicted line */}
            <Line
              dataKey="predictedDepth"
              stroke="hsl(145,100%,50%)"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={{ r: 3, fill: "hsl(145,100%,50%)", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "hsl(145,100%,50%)", stroke: "hsl(145,100%,70%)", strokeWidth: 2 }}
              connectNulls={false}
            />
            
            {/* Monthly highlight dot */}
            {monthlyHighlight && (
              <ReferenceDot
                x={monthlyHighlight.x}
                y={monthlyHighlight.y}
                r={8}
                fill="hsl(340,100%,50%)"
                stroke="hsl(340,100%,70%)"
                strokeWidth={3}
                className="animate-pulse"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
