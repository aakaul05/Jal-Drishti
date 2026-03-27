import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, ComposedChart, ReferenceLine, ReferenceDot,
} from "recharts";
import { useDashboard } from "@/context/DashboardContext";
import { Skeleton } from "@/components/ui/skeleton";

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs shadow-xl border border-border/30">
      <p className="font-semibold text-foreground mb-1">
        {point.isMonthly ? `${point.label} ${point.year}` : `Year: ${point.year}`}
      </p>
      <p className="text-cyan-glow">
        Depth: <span className="font-mono font-bold">{point?.depth?.toFixed(2)} ft</span>
      </p>
      {point?.predicted && point?.upperCI && (
        <p className="text-muted-foreground mt-0.5">
          95% CI: {point.lowerCI?.toFixed(2)} – {point.upperCI?.toFixed(2)} ft
        </p>
      )}
      {point?.predicted && (
        <span className="inline-block mt-1 text-neon-green text-[10px] font-medium uppercase tracking-wider">
          Predicted
        </span>
      )}
      {point?.isMonthly && !point?.predicted && (
        <span className="inline-block mt-1 text-cyan-glow text-[10px] font-medium uppercase tracking-wider">
          Current Year
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

  const chartData = useMemo(() => {
    if (!predictionData) return [];
    
    const currentYear = 2026;
    const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Historical yearly data (last 10 years, excluding current year)
    const historicalYearly = predictionData.historicalData
      .filter(d => d.year < currentYear)
      .map((d) => ({
        year: d.year,
        label: d.year.toString(),
        depth: d.depth,
        historicalDepth: d.depth,
        predictedDepth: undefined as number | undefined,
        upperCI: undefined as number | undefined,
        lowerCI: undefined as number | undefined,
        isMonthly: false
      }));

    // Current year monthly data (simulate monthly data based on yearly average)
    const currentYearMonthly = monthlyLabels.map((month, index) => {
      const baseDepth = predictionData.historicalData.find(d => d.year === currentYear)?.depth || 
                       predictionData.historicalData[predictionData.historicalData.length - 1]?.depth || 50;
      // Add some monthly variation
      const monthlyVariation = Math.sin((index / 12) * Math.PI * 2) * 5;
      const depth = baseDepth + monthlyVariation;
      
      return {
        year: currentYear,
        label: month,
        depth: depth,
        historicalDepth: depth,
        predictedDepth: undefined as number | undefined,
        upperCI: undefined as number | undefined,
        lowerCI: undefined as number | undefined,
        isMonthly: true
      };
    });

    // Predicted monthly data for next year
    const predictedMonthly = monthlyLabels.map((month, index) => {
      const basePrediction = predictionData.predictedData[0]?.depth || 55;
      const monthlyVariation = Math.sin((index / 12) * Math.PI * 2) * 5;
      const depth = basePrediction + monthlyVariation;
      const ci = 3; // Confidence interval
      
      return {
        year: currentYear + 1,
        label: month,
        depth: depth,
        historicalDepth: undefined as number | undefined,
        predictedDepth: depth,
        upperCI: depth + ci,
        lowerCI: depth - ci,
        isMonthly: true
      };
    });

    // Connect the lines between current year and predictions
    const allData = [
      ...historicalYearly,
      ...currentYearMonthly,
      ...predictedMonthly
    ];

    // Add bridge points for smooth transitions
    if (historicalYearly.length > 0 && currentYearMonthly.length > 0) {
      const lastYearly = allData[historicalYearly.length - 1];
      const firstMonthly = allData[historicalYearly.length];
      // Add a bridge point
      allData.splice(historicalYearly.length, 0, {
        ...lastYearly,
        label: lastYearly.label,
        isMonthly: false
      });
    }

    return allData;
  }, [predictionData]);

  // Calculate monthly highlight position
  const monthlyHighlight = useMemo(() => {
    if (!selectedMonth || !selectedYear || !monthlyData) return null;
    
    // Find the position on the chart for the selected year
    const yearData = chartData.find(d => d.year === selectedYear);
    if (!yearData) return null;
    
    return {
      x: selectedYear,
      y: monthlyData.exact_depth,
      depth: monthlyData.exact_depth,
    };
  }, [selectedMonth, selectedYear, monthlyData, chartData]);

  if (!selectedRegion) {
    return (
      <div className="flex items-center justify-center h-full glass rounded-xl">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">Select a region to begin analysis</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Choose from the sidebar to view water level data</p>
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

  const currentYear = 2026;

  return (
    <div className="glass rounded-xl p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Groundwater Depth Analysis</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{selectedRegion.name} • {selectedRegion.district}</p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-cyan-glow rounded-full inline-block" />
            Historical (Yearly)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-cyan-glow rounded-full inline-block" style={{ opacity: 0.7 }} />
            Current Year (Monthly)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-neon-green rounded-full inline-block" style={{ backgroundImage: "repeating-linear-gradient(90deg, hsl(145,100%,50%) 0, hsl(145,100%,50%) 4px, transparent 4px, transparent 8px)" }} />
            Predicted (Monthly)
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
              label={{ value: "Depth (ft)", angle: -90, position: "insideLeft", style: { fill: "hsla(215,20%,55%,0.6)", fontSize: 11 } }}
              reversed
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              x="2026"
              stroke="hsla(170,100%,33%,0.5)"
              strokeDasharray="4 4"
              label={{ value: "Current Year", position: "top", fill: "hsla(170,100%,33%,0.7)", fontSize: 11 }}
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
