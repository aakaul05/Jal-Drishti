import { useDashboard } from "@/context/DashboardContext";
import { useLanguage } from "@/context/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, Gauge, Calendar, Waves } from "lucide-react";

function R2Gauge({ value, r2Label }: { value: number; r2Label: string }) {
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
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{r2Label}</span>
      </div>
    </div>
  );
}

const riskConfig = {
  low: { color: "text-risk-low", bg: "bg-risk-low/10", border: "border-risk-low/30", labelKey: "riskLow" as const },
  moderate: { color: "text-risk-moderate", bg: "bg-risk-moderate/10", border: "border-risk-moderate/30", labelKey: "riskModerate" as const },
  high: { color: "text-risk-high", bg: "bg-risk-high/10", border: "border-risk-high/30", labelKey: "riskHigh" as const },
  severe: { color: "text-risk-severe", bg: "bg-risk-severe/10", border: "border-risk-severe/30", labelKey: "riskSevere" as const },
};

export function RiskEngine() {
  const { predictionData, isLoading, selectedRegion } = useDashboard();
  const { t } = useLanguage();

  if (!selectedRegion) {
    return (
      <div className="glass rounded-xl p-5 h-full flex items-center justify-center">
        <p className="text-muted-foreground text-sm text-center">{t("selectRegionRiskAnalysis")}</p>
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
  const riskLabel = t(risk.labelKey);
  const rate = predictionData.annualChangeRate;
  const isDecline = rate > 0;
  const rfMeta = predictionData.rfMeta;
  const trainedAtLabel = rfMeta?.trainedAt
    ? new Date(rfMeta.trainedAt).toLocaleString()
    : "N/A";

  return (
    <div className="glass rounded-xl p-5 h-full flex flex-col gap-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{t("riskEngine")}</h3>

      {/* Risk Badge */}
      <div className={`rounded-lg p-3 border ${risk.bg} ${risk.border} text-center`}>
        <span className={`text-sm font-bold uppercase tracking-wider ${risk.color}`}>
          {riskLabel}
        </span>
      </div>

      {/* R² Gauge */}
      <R2Gauge value={predictionData.rSquared} r2Label={t("r2Score")} />

      {/* Stats */}
      <div className="space-y-2">
        <StatCard
          icon={<Waves className="h-4 w-4 text-cyan-glow" />}
          label={t("currentDepth")}
          value={`${predictionData.currentDepth.toFixed(1)} ft`}
        />
        <StatCard
          icon={isDecline ? <TrendingDown className="h-4 w-4 text-risk-severe" /> : <TrendingUp className="h-4 w-4 text-risk-low" />}
          label={t("annualChange")}
          value={`${isDecline ? "−" : "+"}${Math.abs(rate).toFixed(2)} ft/yr`}
        />
        <StatCard
          icon={<Calendar className="h-4 w-4 text-neon-green" />}
          label={t("predictionHorizon")}
          value={t("eightYears")}
        />
        <StatCard
          icon={<Gauge className="h-4 w-4 text-primary" />}
          label={t("modelAccuracy")}
          value={`${(predictionData.rSquared * 100).toFixed(1)}%`}
        />
      </div>

      {/* Data quality / model provenance */}
      {rfMeta && (
        <div className="mt-1 rounded-lg border border-border/30 bg-secondary/20 p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            RF Data Quality
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-muted-foreground">Model Run ID</div>
            <div className="text-foreground font-mono">{rfMeta.modelRunId ?? "N/A"}</div>
            <div className="text-muted-foreground">Training Samples</div>
            <div className="text-foreground font-mono">{rfMeta.trainingSamples ?? "N/A"}</div>
            <div className="text-muted-foreground">Year Range</div>
            <div className="text-foreground font-mono">
              {rfMeta.yearMin && rfMeta.yearMax ? `${rfMeta.yearMin}-${rfMeta.yearMax}` : "N/A"}
            </div>
            <div className="text-muted-foreground">Last Trained</div>
            <div className="text-foreground font-mono">{trainedAtLabel}</div>
          </div>
        </div>
      )}
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
