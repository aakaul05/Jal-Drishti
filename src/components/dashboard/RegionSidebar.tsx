import { useState, useMemo } from "react";
import { Search, MapPin, History, Droplets, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDashboard } from "@/context/DashboardContext";
import { maharashtraDistricts, searchRegions, regions, type Region } from "@/data/mockData";

export function RegionSidebar() {
  const { selectedRegion, setSelectedRegion, sessionHistory } = useDashboard();
  const [query, setQuery] = useState("");
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);
  const [expandedSubDistrict, setExpandedSubDistrict] = useState<string | null>(null);

  const searchResults = useMemo(
    () => (query.length > 0 ? searchRegions(query) : null),
    [query]
  );

  const selectVillage = (villageId: string) => {
    const region = regions.find((r) => r.id === villageId);
    if (region) {
      setSelectedRegion(region);
      setQuery("");
    }
  };

  return (
    <aside className="flex flex-col h-full glass-strong rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <Droplets className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold text-foreground tracking-tight">Jal-Drishti</h1>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">Maharashtra Groundwater DSS</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search district, taluka, village..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-secondary/50 border-border/50 text-sm placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Session History */}
      {sessionHistory.length > 0 && !query && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <History className="h-3 w-3" />
            <span className="uppercase tracking-wider font-medium">Recent</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sessionHistory.slice(0, 5).map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRegion(r)}
                className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                  selectedRegion?.id === r.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Region Tree / Search Results */}
      <ScrollArea className="flex-1 px-2 py-2">
        {searchResults ? (
          /* Search results */
          <div className="space-y-0.5">
            {searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
            )}
            {searchResults.map((region) => (
              <button
                key={region.id}
                onClick={() => selectVillage(region.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                  selectedRegion?.id === region.id
                    ? "bg-primary/15 border border-primary/30"
                    : "hover:bg-secondary/50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className={`h-3.5 w-3.5 shrink-0 ${
                    selectedRegion?.id === region.id ? "text-primary" : "text-muted-foreground"
                  }`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      selectedRegion?.id === region.id ? "text-primary" : "text-foreground"
                    }`}>{region.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {region.subDistrict} • {region.district}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Hierarchical tree: District → Sub-district → Village */
          <div className="space-y-0.5">
            {/* Fixed state header */}
            <div className="px-3 py-2 text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              Maharashtra
            </div>

            {maharashtraDistricts.map((district) => {
              const isDistExpanded = expandedDistrict === district.id;
              return (
                <div key={district.id}>
                  {/* District */}
                  <button
                    onClick={() => {
                      setExpandedDistrict(isDistExpanded ? null : district.id);
                      setExpandedSubDistrict(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    {isDistExpanded
                      ? <ChevronDown className="h-3.5 w-3.5 text-primary shrink-0" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    }
                    <span className={isDistExpanded ? "text-primary" : ""}>{district.name}</span>
                  </button>

                  {isDistExpanded && (
                    <div className="ml-3 pl-3 border-l border-border/30 space-y-0.5">
                      {district.subDistricts.map((sub) => {
                        const isSubExpanded = expandedSubDistrict === sub.id;
                        return (
                          <div key={sub.id}>
                            {/* Sub-district */}
                            <button
                              onClick={() => setExpandedSubDistrict(isSubExpanded ? null : sub.id)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-foreground/80 hover:bg-secondary/40 transition-colors"
                            >
                              {isSubExpanded
                                ? <ChevronDown className="h-3 w-3 text-primary shrink-0" />
                                : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                              }
                              <span className={isSubExpanded ? "text-primary" : ""}>{sub.name}</span>
                            </button>

                            {isSubExpanded && (
                              <div className="ml-3 pl-3 border-l border-border/20 space-y-0.5">
                                {sub.villages.map((village) => {
                                  const isActive = selectedRegion?.id === village.id;
                                  return (
                                    <button
                                      key={village.id}
                                      onClick={() => selectVillage(village.id)}
                                      className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all ${
                                        isActive
                                          ? "bg-primary/15 text-primary font-medium"
                                          : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
                                      }`}
                                    >
                                      {village.name}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
