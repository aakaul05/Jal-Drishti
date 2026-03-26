import { useDashboard } from "@/context/DashboardContext";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, Gauge, Calendar, Waves } from "lucide-react";

function R2Gauge({ value }: { value: number }) {
  const percentage = value * 100;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="hsla(222,30%,25%,0.3)" strokeWidth="6" />
        <circle
          cx="50" cy="50" r="42" fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold font-mono text-foreground">{(value).toFixed(3)}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">R² Score</span>
      </div>
    </div>
  );
}

const riskConfig = {
  low: { color: "text-risk-low", bg: "bg-risk-low/10", border: "border-risk-low/30", label: "Low Risk" },
  moderate: { color: "text-risk-moderate", bg: "bg-risk-moderate/10", border: "border-risk-moderate/30", label: "Moderate Risk" },
  high: { color: "text-risk-high", bg: "bg-risk-high/10", border: "border-risk-high/30", label: "High Risk" },
  severe: { color: "text-risk-severe", bg: "bg-risk-severe/10", border: "border-risk-severe/30", label: "Severe Risk" },
};

export function RiskEngine() {
  const { predictionData, isLoading, selectedRegion } = useDashboard();

  if (!selectedRegion) {
    return (
      <div className="glass rounded-xl p-5 h-full flex items-center justify-center">
        <p className="text-muted-foreground text-sm text-center">Select a region to view risk analysis</p>
      </div>
    );
  }

  if (isLoading || !predictionData) {
    return (
      <div className="glass rounded-xl p-5 h-full space-y-4">
        <Skeleton className="h-5 w-32 bg-secondary" />
        <Skeleton className="h-28 w-28 rounded-full mx-auto bg-secondary" />
        <Skeleton className="h-16 bg-secondary/50 rounded-lg" />
        <Skeleton className="h-16 bg-secondary/50 rounded-lg" />
        <Skeleton className="h-16 bg-secondary/50 rounded-lg" />
      </div>
    );
  }

  const risk = riskConfig[predictionData.riskLevel];
  const rate = predictionData.annualChangeRate;
  const isDecline = rate > 0;

  return (
    <div className="glass rounded-xl p-5 h-full flex flex-col gap-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Risk Engine</h3>

      {/* Risk Badge */}
      <div className={`rounded-lg p-3 border ${risk.bg} ${risk.border} text-center`}>
        <span className={`text-sm font-bold uppercase tracking-wider ${risk.color}`}>
          {risk.label}
        </span>
      </div>

      {/* R² Gauge */}
      <R2Gauge value={predictionData.rSquared} />

      {/* Stats */}
      <div className="space-y-2">
        <StatCard
          icon={<Waves className="h-4 w-4 text-cyan-glow" />}
          label="Current Depth"
          value={`${predictionData.currentDepth.toFixed(1)} ft`}
        />
        <StatCard
          icon={isDecline ? <TrendingDown className="h-4 w-4 text-risk-severe" /> : <TrendingUp className="h-4 w-4 text-risk-low" />}
          label="Annual Change"
          value={`${isDecline ? "−" : "+"}${Math.abs(rate).toFixed(2)} ft/yr`}
        />
        <StatCard
          icon={<Calendar className="h-4 w-4 text-neon-green" />}
          label="Prediction Horizon"
          value="8 Years"
        />
        <StatCard
          icon={<Gauge className="h-4 w-4 text-primary" />}
          label="Model Accuracy"
          value={`${(predictionData.rSquared * 100).toFixed(1)}%`}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-secondary/30 rounded-lg px-3 py-2.5">
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold font-mono text-foreground">{value}</p>
      </div>
    </div>
  );
}
