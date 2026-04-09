export interface Village {
  id: string;
  name: string;
}

export interface SubDistrict {
  id: string;
  name: string;
  villages: Village[];
}

export interface District {
  id: string;
  name: string;
  subDistricts: SubDistrict[];
}

export interface Region {
  id: string;
  name: string;       // village name
  village: string;
  subDistrict: string;
  district: string;
  state: string;
}

export interface WaterDataPoint {
  year: number;
  depth: number;
  predicted?: boolean;
  upperCI?: number;
  lowerCI?: number;
}

export interface PredictionResult {
  region: Region;
  historicalData: WaterDataPoint[];
  predictedData: WaterDataPoint[];
  rSquared: number;
  annualChangeRate: number;
  currentDepth: number;
  riskLevel: "low" | "moderate" | "high" | "severe";
  advisory: string;
  dataSource?: "backend" | "fallback-mock";
  rfMeta?: {
    modelRunId?: number;
    trainingSamples?: number;
    yearMin?: number;
    yearMax?: number;
    trainedAt?: string;
  };
}

export interface MonthlyPredictionResult {
  exact_depth: number;
  monthly_change_rate: number;
  pointwise_insights: string[];
  dataSource?: "backend" | "fallback-mock";
}

// ─── API Base URL ───────────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// ─── Season ↔ Month mapping ────────────────────────────────────────────────────
// The backend stores predictions for 4 seasons per year, keyed by season name.
// Each season corresponds to a calendar month anchor.
const SEASON_MONTH_MAP: Record<string, number> = {
  jan: 1,
  may: 5,
  aug: 8,
  nov: 11,
};

// ─── Helpers ────────────────────────────────────────────────────────────────────
function riskFromAnnualChange(rate: number): PredictionResult["riskLevel"] {
  const absRate = Math.abs(rate);
  if (absRate < 0.3) return "low";
  if (absRate < 0.7) return "moderate";
  if (absRate < 1.2) return "high";
  return "severe";
}

function advisoryFromRisk(riskLevel: PredictionResult["riskLevel"], rate: number): string {
  const absRate = Math.abs(rate);
  switch (riskLevel) {
    case "low":
      return `Stable conditions: Annual change of ${rate.toFixed(2)} m/year within safe limits.`;
    case "moderate":
      return `Moderate Risk: Annual decline of ${absRate.toFixed(2)} m/year. Monitor extraction rates.`;
    case "high":
      return `High Risk: Annual decline of ${absRate.toFixed(1)} m/year. Immediate intervention recommended.`;
    case "severe":
      return `⚠️ Severe Risk: Annual decline of ${absRate.toFixed(1)} m/year detected. Critical depletion imminent.`;
  }
}

/**
 * Linear-interpolate a value between known anchor points.
 * `anchors` is a sorted array of { month, depth } for the 4 seasonal predictions.
 */
function interpolateMonth(month: number, anchors: { month: number; depth: number }[]): number {
  if (!anchors.length) return 0;
  // Before the first anchor → clamp
  if (month <= anchors[0].month) return anchors[0].depth;
  // After the last anchor → clamp
  if (month >= anchors[anchors.length - 1].month) return anchors[anchors.length - 1].depth;

  // Find the two surrounding anchors
  for (let i = 0; i < anchors.length - 1; i++) {
    if (month >= anchors[i].month && month <= anchors[i + 1].month) {
      const ratio = (month - anchors[i].month) / (anchors[i + 1].month - anchors[i].month);
      return anchors[i].depth + ratio * (anchors[i + 1].depth - anchors[i].depth);
    }
  }
  return anchors[anchors.length - 1].depth;
}

// Deterministic seed per village ID for fallback mock data
function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function generateFallbackData(region: Region): PredictionResult {
  const h = hashId(region.id);
  const baseDepth = 5 + (h % 20);
  const annualRate = ((h % 20) / 10) - 0.5;
  const noise = 0.5 + (h % 3);
  const currentYear = 2023;

  const historicalData: WaterDataPoint[] = [];
  for (let i = -9; i <= 0; i++) {
    const year = currentYear + i;
    const depth = baseDepth + annualRate * i + (Math.random() - 0.5) * noise;
    historicalData.push({ year, depth: Math.round(depth * 100) / 100 });
  }

  const lastDepth = historicalData[historicalData.length - 1].depth;
  const predictedData: WaterDataPoint[] = [];
  for (let i = 1; i <= 2; i++) {
    const year = currentYear + i;
    const depth = lastDepth + annualRate * i + (Math.random() - 0.5) * noise * 1.2;
    predictedData.push({
      year,
      depth: Math.round(depth * 100) / 100,
      predicted: true,
    });
  }

  const riskLevel = riskFromAnnualChange(annualRate);
  return {
    region,
    historicalData,
    predictedData,
    rSquared: 0.75 + Math.random() * 0.2,
    annualChangeRate: annualRate,
    currentDepth: lastDepth,
    riskLevel,
    advisory: advisoryFromRisk(riskLevel, annualRate),
    dataSource: "fallback-mock",
  };
}

// ─── Main API Functions ─────────────────────────────────────────────────────────

/**
 * Fetch full region prediction data from the FastAPI backend.
 * Uses three parallel requests:
 *  1. /api/cleaned/history/{village_id}  → historicalData
 *  2. /api/predictions/{village_name}    → predictedData (seasonal → yearly aggregates)
 *  3. /api/village-risk/{village_name}   → risk stats
 */
export async function fetchRegionData(region: Region): Promise<PredictionResult> {
  const villageId = region.id;
  const villageName = region.name;

  console.log('fetchRegionData called for village:', villageName, 'ID:', villageId);

  try {
    console.log('Making 3 parallel API calls...');
    const [historyResp, predictionsResp, riskResp] = await Promise.all([
      fetch(`${API_BASE_URL}/api/cleaned/history/${encodeURIComponent(villageId)}`),
      fetch(`${API_BASE_URL}/api/predictions/${encodeURIComponent(villageName)}`),
      fetch(`${API_BASE_URL}/api/village-risk/${encodeURIComponent(villageName)}`),
    ]);

    // Check API responses
    console.log(`History API status: ${historyResp.status}`);
    console.log(`Predictions API status: ${predictionsResp.status}`);
    console.log(`Risk API status: ${riskResp.status}`);

    // ── Historical Data ───────────────────────────────────────────────────────
    let historicalData: WaterDataPoint[] = [];
    if (historyResp.ok) {
      const historyJson = await historyResp.json() as {
        history: { year: number; avg_depth: number }[];
      };
      historicalData = (historyJson.history || []).map((h) => ({
        year: h.year,
        depth: h.avg_depth,
      }));
      console.log('Historical data loaded:', historicalData.length, 'points');
    }

    // ── Predicted Data ────────────────────────────────────────────────────────
    // The backend returns season-level predictions (season = "jan_2024", etc.)
    // We aggregate them per-year to get yearly predicted averages.
    let predictedData: WaterDataPoint[] = [];
    if (predictionsResp.ok) {
      const predJson = await predictionsResp.json() as {
        predictions: {
          season: string;
          predicted_depth: number;
          confidence_low?: number;
          confidence_high?: number;
        }[];
      };
      const predictions = predJson.predictions || [];
      console.log('Raw prediction response:', predJson);
      console.log('Number of predictions:', predictions.length);

      // Group predictions by year (extracted from season string like "jan_2024")
      const yearlyMap = new Map<number, { sum: number; count: number; minCI?: number; maxCI?: number }>();
      console.log('Processing predictions:', predictions);
      
      for (const pred of predictions) {
        console.log('Processing prediction:', pred);
        // season format: "jan_2024", "may_2025", etc.
        const parts = pred.season.split("_");
        const yearStr = parts[parts.length - 1];
        const year = parseInt(yearStr, 10);
        console.log('Extracted year:', year, 'from season:', pred.season);
        if (isNaN(year)) {
          console.log('Skipping invalid year for season:', pred.season);
          continue;
        }

        const prev = yearlyMap.get(year) || { sum: 0, count: 0 };
        prev.sum += Number(pred.predicted_depth);
        prev.count += 1;
        if (pred.confidence_low != null) {
          prev.minCI = prev.minCI == null ? Number(pred.confidence_low) : Math.min(prev.minCI, Number(pred.confidence_low));
        }
        if (pred.confidence_high != null) {
          prev.maxCI = prev.maxCI == null ? Number(pred.confidence_high) : Math.max(prev.maxCI, Number(pred.confidence_high));
        }
        yearlyMap.set(year, prev);
      }

      predictedData = Array.from(yearlyMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([year, agg]) => ({
          year,
          depth: Math.round((agg.sum / Math.max(1, agg.count)) * 100) / 100,
          predicted: true,
          lowerCI: agg.minCI != null ? Math.round(agg.minCI * 100) / 100 : undefined,
          upperCI: agg.maxCI != null ? Math.round(agg.maxCI * 100) / 100 : undefined,
        }));
      console.log('Prediction data loaded:', predictedData.length, 'points');
    }

    // ── Risk Data ─────────────────────────────────────────────────────────────
    let riskLevel: PredictionResult["riskLevel"] = "moderate";
    let advisory = "";
    let currentDepth = 0;
    let annualChangeRate = 0;
    let rSquared = 0.8;

    if (riskResp.ok) {
      const riskJson = await riskResp.json() as {
        risk_level?: string;
        advisory?: string;
        avg_predicted_depth?: number;
        annual_change_rate?: number;
        avg_depth_latest_year?: number;
        r_squared?: number;
      };

      // Map backend risk levels to frontend expected values
      const backendRisk = (riskJson.risk_level || "moderate").toLowerCase();
      if (backendRisk === "low" || backendRisk === "safe") riskLevel = "low";
      else if (backendRisk === "moderate" || backendRisk === "medium") riskLevel = "moderate";
      else if (backendRisk === "high") riskLevel = "high";
      else if (backendRisk === "severe" || backendRisk === "critical") riskLevel = "severe";
      else riskLevel = riskFromAnnualChange(riskJson.annual_change_rate ?? 0);

      annualChangeRate = riskJson.annual_change_rate ?? 0;
      currentDepth = riskJson.avg_depth_latest_year ?? riskJson.avg_predicted_depth ?? 0;
      advisory = riskJson.advisory || advisoryFromRisk(riskLevel, annualChangeRate);
      rSquared = riskJson.r_squared ?? 0.8;
    } else {
      // Derive risk from historical + prediction data if risk endpoint fails
      if (historicalData.length > 0) {
        currentDepth = historicalData[historicalData.length - 1].depth;
      }
      if (predictedData.length > 0 && historicalData.length > 0) {
        annualChangeRate = predictedData[0].depth - currentDepth;
      }
      riskLevel = riskFromAnnualChange(annualChangeRate);
      advisory = advisoryFromRisk(riskLevel, annualChangeRate);
    }

    // If we got nothing at all, fall back to mock
    if (!historicalData.length && !predictedData.length) {
      throw new Error("No data returned from backend");
    }

    return {
      region,
      historicalData,
      predictedData,
      rSquared: Math.max(0, Math.min(1, rSquared)),
      annualChangeRate,
      currentDepth,
      riskLevel,
      advisory,
      dataSource: "backend",
    };
  } catch (err) {
    console.warn("[fetchRegionData] Backend call failed, using fallback mock:", err);
    return generateFallbackData(region);
  }
}

/**
 * Fetch monthly drilldown data for a specific village, year, and month.
 *
 * The backend provides 4 seasonal predictions per year (Jan, May, Aug, Nov).
 * We fetch all seasonal predictions for the given year and linearly interpolate
 * to estimate the requested month.
 */
export async function fetchMonthlyData(
  villageName: string,
  year: number,
  month: number
): Promise<MonthlyPredictionResult> {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/predictions/${encodeURIComponent(villageName)}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const payload = await resp.json() as {
      predictions: {
        season: string;
        predicted_depth: number;
      }[];
    };

    const predictions = payload.predictions || [];

    // Build anchor points for the requested year
    // Season format: "jan_2024"
    const anchors: { month: number; depth: number }[] = [];
    for (const pred of predictions) {
      const parts = pred.season.split("_");
      const seasonName = parts[0].toLowerCase();
      const predYear = parseInt(parts[parts.length - 1], 10);
      if (predYear !== year) continue;

      const anchorMonth = SEASON_MONTH_MAP[seasonName];
      if (anchorMonth != null) {
        anchors.push({ month: anchorMonth, depth: Number(pred.predicted_depth) });
      }
    }

    anchors.sort((a, b) => a.month - b.month);

    if (!anchors.length) {
      throw new Error(`No predictions for year ${year}`);
    }

    const exactDepth = interpolateMonth(month, anchors);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevDepth = interpolateMonth(prevMonth, anchors);
    const monthlyChange = exactDepth - prevDepth;

    const isExactSeason = anchors.some((a) => a.month === month);

    return {
      exact_depth: Math.round(exactDepth * 100) / 100,
      monthly_change_rate: Math.round(monthlyChange * 1000) / 1000,
      pointwise_insights: [
        isExactSeason
          ? `Seasonal prediction for month ${month}/${year}`
          : `Interpolated estimate for month ${month}/${year} from seasonal anchors`,
      ],
      dataSource: "backend",
    };
  } catch {
    // Deterministic fallback
    const h = hashId(villageName + year.toString() + month.toString());
    const baseDepth = 5 + (h % 20);
    const annualRate = ((h % 20) / 10) - 0.5;
    const seasonalFactors = [0.8, 0.7, 0.6, 0.5, 0.4, 0.5, 0.6, 0.8, 1.0, 1.1, 1.0, 0.9];
    const seasonalFactor = seasonalFactors[month - 1];
    const exactDepth = baseDepth + annualRate * (year - 2024) + seasonalFactor * 2;
    const monthlyChangeRate = annualRate / 12;

    return {
      exact_depth: Math.round(exactDepth * 100) / 100,
      monthly_change_rate: Math.round(monthlyChangeRate * 1000) / 1000,
      pointwise_insights: [`Estimated depth: ${exactDepth.toFixed(2)} m`],
      dataSource: "fallback-mock",
    };
  }
}

export function searchRegions(query: string): Region[] {
  // This is now a no-op since the sidebar uses RegionalDataService.searchVillages()
  return [];
}
