import { DashboardProvider } from "@/context/DashboardContext";
import { RegionSidebarWithChart } from "@/components/dashboard/RegionSidebarWithChart";
import { WaterLevelChart } from "@/components/dashboard/WaterLevelChart";
import { RiskEngine } from "@/components/dashboard/RiskEngine";
import { AdvisoryHUD } from "@/components/dashboard/AdvisoryHUD";
import { ChatBot } from "@/components/dashboard/ChatBot";
import { MaharashtraMap } from "@/components/dashboard/MaharashtraMap";
import { MonthlyInsightCard } from "@/components/dashboard/MonthlyInsightCard";
import { MultilingualSupport } from "@/components/dashboard/MultilingualSupport";
import { FarmerAnalysis } from "@/components/dashboard/FarmerAnalysis";

const Index = () => {
  return (
    <DashboardProvider>
      <div className="h-screen w-screen overflow-hidden bg-background p-3 grid grid-cols-[280px_1fr_280px] grid-rows-[1fr_auto] gap-3">
        {/* Left Sidebar - Regional Selection + Time Period */}
        <div className="row-span-2 min-h-0 overflow-hidden flex flex-col gap-3">
          <RegionSidebarWithChart />
          <MultilingualSupport />
          <FarmerAnalysis />
        </div>

        {/* Main Chart */}
        <div className="min-h-0">
          <WaterLevelChart />
        </div>

        {/* Right Rail: Map + Risk + Monthly Insights */}
        <div className="row-span-2 min-h-0 overflow-hidden flex flex-col gap-3">
          <div className="h-[300px] shrink-0">
            <MaharashtraMap />
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <RiskEngine />
          </div>
          <div className="shrink-0">
            <MonthlyInsightCard />
          </div>
        </div>

        {/* Bottom HUD */}
        <div>
          <AdvisoryHUD />
        </div>
      </div>

      {/* Floating Chatbot */}
      <ChatBot />
    </DashboardProvider>
  );
};

export default Index;
