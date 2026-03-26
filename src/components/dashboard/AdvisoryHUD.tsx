import { useDashboard } from "@/context/DashboardContext";
import { AlertTriangle, CheckCircle, Info, ShieldAlert } from "lucide-react";

const hudConfig = {
  low: { icon: CheckCircle, borderColor: "border-risk-low/40", bgColor: "bg-risk-low/5", textColor: "text-risk-low" },
  moderate: { icon: Info, borderColor: "border-risk-moderate/40", bgColor: "bg-risk-moderate/5", textColor: "text-risk-moderate" },
  high: { icon: AlertTriangle, borderColor: "border-risk-high/40", bgColor: "bg-risk-high/5", textColor: "text-risk-high" },
  severe: { icon: ShieldAlert, borderColor: "border-risk-severe/40", bgColor: "bg-risk-severe/5", textColor: "text-risk-severe" },
};

export function AdvisoryHUD() {
  const { predictionData, selectedRegion } = useDashboard();

  if (!selectedRegion || !predictionData) {
    return (
      <div className="glass rounded-xl px-5 py-3 flex items-center gap-3">
        <Info className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-sm text-muted-foreground">
          Advisory updates will appear here after selecting a region.
        </p>
      </div>
    );
  }

  const config = hudConfig[predictionData.riskLevel];
  const Icon = config.icon;
  const isSevere = predictionData.riskLevel === "severe" || predictionData.riskLevel === "high";

  return (
    <div className={`rounded-xl px-5 py-3 flex items-center gap-3 border ${config.borderColor} ${config.bgColor} ${isSevere ? "animate-pulse-slow" : ""}`}>
      <Icon className={`h-5 w-5 shrink-0 ${config.textColor}`} />
      <p className={`text-sm font-medium ${config.textColor}`}>
        {predictionData.advisory}
      </p>
      <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
        {selectedRegion.name}
      </span>
    </div>
  );
}
