import { AlertCircle, TrendingUp, Calendar, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/context/DashboardContext";

export function MonthlyInsightCard() {
  const { monthlyData, isLoadingMonthly, selectedMonth, selectedYear } = useDashboard();

  if (!selectedMonth || !selectedYear) {
    return (
      <Card className="glass-strong border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Monthly Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">
            Select a month and year to view detailed insights
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingMonthly) {
    return (
      <Card className="glass-strong border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Monthly Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full bg-secondary" />
          <Skeleton className="h-4 w-3/4 bg-secondary" />
          <Skeleton className="h-4 w-5/6 bg-secondary" />
        </CardContent>
      </Card>
    );
  }

  if (!monthlyData) {
    return (
      <Card className="glass-strong border-border/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Monthly Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center py-4">
            No data available for selected period
          </p>
        </CardContent>
      </Card>
    );
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthName = monthNames[selectedMonth - 1];

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Monthly Insights: {monthName} {selectedYear}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-lg p-3 border border-border/20">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3 w-3 text-cyan-glow" />
              <span className="text-xs text-muted-foreground">Expected Depth</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {monthlyData.exact_depth.toFixed(2)}
              <span className="text-xs font-normal text-muted-foreground ml-1">ft</span>
            </p>
          </div>
          <div className="glass rounded-lg p-3 border border-border/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Info className="h-3 w-3 text-neon-green" />
              <span className="text-xs text-muted-foreground">Monthly Change</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {monthlyData.monthly_change_rate > 0 ? '+' : ''}
              {monthlyData.monthly_change_rate.toFixed(3)}
              <span className="text-xs font-normal text-muted-foreground ml-1">ft/mo</span>
            </p>
          </div>
        </div>

        {/* Pointwise Insights */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3 text-amber-500" />
            <span className="text-xs font-medium text-foreground">Analysis & Recommendations</span>
          </div>
          <div className="space-y-1.5">
            {monthlyData.pointwise_insights.map((insight, index) => (
              <div 
                key={index} 
                className={`text-xs p-2 rounded-lg border ${
                  insight.includes('⚠️') 
                    ? 'bg-red-500/10 border-red-500/30 text-red-300' 
                    : 'bg-secondary/30 border-border/20 text-muted-foreground'
                }`}
              >
                {insight}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
