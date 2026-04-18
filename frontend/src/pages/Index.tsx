import { DashboardProvider, useDashboard } from "@/context/DashboardContext";
import { RegionSidebarWithChart } from "@/components/dashboard/RegionSidebarWithChart";
import { WaterLevelChart } from "@/components/dashboard/WaterLevelChart";
import { RiskEngine } from "@/components/dashboard/RiskEngine";
import { AdvisoryHUD } from "@/components/dashboard/AdvisoryHUD";
import { ChatBot } from "@/components/dashboard/ChatBot";
import { MonthlyInsightCard } from "@/components/dashboard/MonthlyInsightCard";
import { FarmerAnalysis } from "@/components/dashboard/FarmerAnalysis";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Droplets, TrendingUp, BarChart3,
  Sprout, ChevronDown, ChevronUp, LayoutDashboard, LineChart, Wheat
} from "lucide-react";
import { useState } from "react";

type TabKey = "overview" | "trends" | "farmer";

const TABS: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "trends",   label: "Water Trend", icon: LineChart },
  { key: "farmer",   label: "Farmer Guide", icon: Wheat },
];

/* ───────────────────── Tab Content ───────────────────── */

function OverviewTab() {
  const { predictionData, selectedRegion } = useDashboard();

  if (!selectedRegion) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center">
            <Droplets className="h-10 w-10 text-cyan-400" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to Jal Drishti</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Select your <span className="text-cyan-400 font-medium">District → Sub-district → Village</span> from the left panel to view groundwater analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 flex-1 overflow-y-auto pr-1">
      {/* Advisory Banner */}
      <AdvisoryHUD />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickStat
          label="Current Depth"
          value={predictionData ? `${predictionData.currentDepth.toFixed(1)} ft` : "—"}
          sub="Below Ground Level"
          color="cyan"
        />
        <QuickStat
          label="Annual Change"
          value={predictionData ? `${predictionData.annualChangeRate > 0 ? '↓' : '↑'} ${Math.abs(predictionData.annualChangeRate).toFixed(2)} ft/yr` : "—"}
          sub={predictionData?.annualChangeRate > 0 ? "Water level declining" : "Water level rising"}
          color={predictionData?.annualChangeRate > 0 ? "red" : "green"}
        />
        <QuickStat
          label="Risk Level"
          value={predictionData?.riskLevel?.toUpperCase() ?? "—"}
          sub="Based on ML prediction"
          color={
            predictionData?.riskLevel === "low" ? "green" :
            predictionData?.riskLevel === "moderate" ? "amber" :
            predictionData?.riskLevel === "high" ? "orange" : "red"
          }
        />
      </div>

      {/* Risk + Monthly side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RiskEngine />
        <MonthlyInsightCard />
      </div>
    </div>
  );
}

function TrendsTab() {
  const { selectedRegion } = useDashboard();
  const [showChart, setShowChart] = useState(false);

  if (!selectedRegion) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-blue-400" />
          </div>
          <p className="text-muted-foreground text-sm">Select a village first to see the water level trend chart.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 flex-1">
      {/* Info Bar */}
      <div className="glass rounded-xl px-5 py-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Groundwater Depth Analysis</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            📍 {selectedRegion.name} • {selectedRegion.district} — Historical + Predicted
          </p>
        </div>
        <button
          onClick={() => setShowChart(!showChart)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all text-sm font-medium text-cyan-300"
        >
          {showChart ? (
            <>
              <ChevronUp className="h-4 w-4" /> Hide Chart
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4" /> 📊 Show Trend
            </>
          )}
        </button>
      </div>

      {/* Chart Area */}
      {showChart ? (
        <div className="flex-1 min-h-[420px] animate-slide-up">
          <WaterLevelChart />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center glass rounded-xl">
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <LineChart className="h-8 w-8 text-cyan-400/60" />
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Click <span className="text-cyan-400 font-medium">"Show Trend"</span> above to view the water level chart
            </p>
            <button
              onClick={() => setShowChart(true)}
              className="px-6 py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-medium hover:bg-cyan-500/20 transition-all"
            >
              📊 Show Water Level Trend
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FarmerTab() {
  const { selectedRegion } = useDashboard();

  if (!selectedRegion) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Sprout className="h-8 w-8 text-emerald-400" />
          </div>
          <p className="text-muted-foreground text-sm">Select a village to get farmer-specific water advisory.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-1">
      <FarmerAnalysis />
    </div>
  );
}

/* ───────────────────── Quick Stat Card ───────────────────── */

function QuickStat({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    cyan:   "from-cyan-500/15 to-cyan-600/5 border-cyan-500/20 text-cyan-400",
    green:  "from-emerald-500/15 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
    amber:  "from-amber-500/15 to-amber-600/5 border-amber-500/20 text-amber-400",
    orange: "from-orange-500/15 to-orange-600/5 border-orange-500/20 text-orange-400",
    red:    "from-red-500/15 to-red-600/5 border-red-500/20 text-red-400",
  };
  const classes = colorMap[color] || colorMap.cyan;

  return (
    <div className={`rounded-xl p-5 bg-gradient-to-br border ${classes}`}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono ${classes.split(' ').pop()}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

/* ───────────────────── Main Page ───────────────────── */

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <DashboardProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <header className="shrink-0 border-b border-border/20 bg-background/95 backdrop-blur-sm z-50">
          <div className="px-5 h-14 flex items-center justify-between">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/15">
                <Droplets className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent leading-tight">
                  Jal Drishti
                </h1>
                <p className="text-[10px] text-muted-foreground">Groundwater Intelligence for Farmers</p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* ─── Body ─── */}
        <div className="flex-1 flex min-h-0">
          {/* ─── Left Sidebar ─── */}
          <aside className="w-[300px] shrink-0 border-r border-border/15 bg-secondary/5 overflow-y-auto p-4 sidebar-pattern">
            <RegionSidebarWithChart />
          </aside>

          {/* ─── Main Content Area ─── */}
          <main className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* Tabs */}
            <div className="shrink-0 border-b border-border/15 px-6">
              <div className="flex gap-1">
                {TABS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`
                      flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative
                      ${activeTab === key
                        ? "text-cyan-400"
                        : "text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden md:inline">{label}</span>
                    {activeTab === key && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-400 rounded-full tab-glow" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 p-6 flex flex-col animate-fade-in" key={activeTab}>
              {activeTab === "overview" && <OverviewTab />}
              {activeTab === "trends" && <TrendsTab />}
              {activeTab === "farmer" && <FarmerTab />}
            </div>
          </main>
        </div>

        {/* Floating Chatbot */}
        <ChatBot />
      </div>
    </DashboardProvider>
  );
};

export default Index;
