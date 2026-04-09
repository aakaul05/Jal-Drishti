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
  dataSource?: "stored-rf" | "on-demand-rf" | "fallback-api" | "fallback-mock";
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
  dataSource?: "stored-rf" | "fallback-mock";
}

type RFStoredPrediction = {
  year: number;
  month: number;
  predicted_depth_meters: number;
  confidence_low?: number;
  confidence_high?: number;
};

type RFHistoricalPoint = {
  year: number;
  month: number;
  depth_meters: number;
};

// Maharashtra hierarchical data
export const maharashtraDistricts: District[] = [
  {
    id: "pune", name: "Pune",
    subDistricts: [
      { id: "haveli", name: "Haveli", villages: [
        { id: "v1", name: "Wagholi" }, { id: "v2", name: "Lohegaon" }, { id: "v3", name: "Kharadi" },
      ]},
      { id: "mulshi", name: "Mulshi", villages: [
        { id: "v4", name: "Pirangut" }, { id: "v5", name: "Paud" }, { id: "v6", name: "Lavale" },
      ]},
      { id: "baramati", name: "Baramati", villages: [
        { id: "v7", name: "Baramati Town" }, { id: "v8", name: "Morgaon" }, { id: "v9", name: "Jejuri" },
      ]},
    ],
  },
  {
    id: "nashik", name: "Nashik",
    subDistricts: [
      { id: "nashik_t", name: "Nashik Taluka", villages: [
        { id: "v10", name: "Sinnar" }, { id: "v11", name: "Ghoti" }, { id: "v12", name: "Igatpuri" },
      ]},
      { id: "dindori", name: "Dindori", villages: [
        { id: "v13", name: "Dindori Town" }, { id: "v14", name: "Vani" }, { id: "v15", name: "Niphad" },
      ]},
      { id: "malegaon", name: "Malegaon", villages: [
        { id: "v16", name: "Malegaon City" }, { id: "v17", name: "Satana" }, { id: "v18", name: "Deola" },
      ]},
    ],
  },
  {
    id: "nagpur", name: "Nagpur",
    subDistricts: [
      { id: "nagpur_t", name: "Nagpur Urban", villages: [
        { id: "v19", name: "Hingna" }, { id: "v20", name: "Kamptee" }, { id: "v21", name: "Parseoni" },
      ]},
      { id: "katol", name: "Katol", villages: [
        { id: "v22", name: "Katol Town" }, { id: "v23", name: "Narkhed" }, { id: "v24", name: "Savner" },
      ]},
    ],
  },
  {
    id: "aurangabad", name: "Chhatrapati Sambhajinagar",
    subDistricts: [
      { id: "aurangabad_t", name: "Aurangabad Taluka", villages: [
        { id: "v25", name: "Paithan" }, { id: "v26", name: "Khuldabad" }, { id: "v27", name: "Kannad" },
      ]},
      { id: "sillod", name: "Sillod", villages: [
        { id: "v28", name: "Sillod Town" }, { id: "v29", name: "Soegaon" }, { id: "v30", name: "Ajanta" },
      ]},
    ],
  },
  {
    id: "kolhapur", name: "Kolhapur",
    subDistricts: [
      { id: "karveer", name: "Karveer", villages: [
        { id: "v31", name: "Ichalkaranji" }, { id: "v32", name: "Panhala" }, { id: "v33", name: "Kagal" },
      ]},
      { id: "hatkanangle", name: "Hatkanangle", villages: [
        { id: "v34", name: "Hatkanangle Town" }, { id: "v35", name: "Shirol" }, { id: "v36", name: "Gadhinglaj" },
      ]},
    ],
  },
  {
    id: "solapur", name: "Solapur",
    subDistricts: [
      { id: "solapur_n", name: "Solapur North", villages: [
        { id: "v37", name: "Barshi" }, { id: "v38", name: "Akkalkot" }, { id: "v39", name: "Pandharpur" },
      ]},
      { id: "mohol", name: "Mohol", villages: [
        { id: "v40", name: "Mohol Town" }, { id: "v41", name: "Mangalwedha" }, { id: "v42", name: "Karmala" },
      ]},
    ],
  },
  {
    id: "ahmednagar", name: "Ahmednagar",
    subDistricts: [
      { id: "ahmednagar_t", name: "Ahmednagar Taluka", villages: [
        { id: "v43", name: "Shevgaon" }, { id: "v44", name: "Pathardi" }, { id: "v45", name: "Parner" },
      ]},
      { id: "sangamner", name: "Sangamner", villages: [
        { id: "v46", name: "Sangamner Town" }, { id: "v47", name: "Akole" }, { id: "v48", name: "Kopargaon" },
      ]},
    ],
  },
  {
    id: "satara", name: "Satara",
    subDistricts: [
      { id: "satara_t", name: "Satara Taluka", villages: [
        { id: "v49", name: "Karad" }, { id: "v50", name: "Wai" }, { id: "v51", name: "Mahabaleshwar" },
      ]},
      { id: "phaltan", name: "Phaltan", villages: [
        { id: "v52", name: "Phaltan Town" }, { id: "v53", name: "Koregaon" }, { id: "v54", name: "Jawali" },
      ]},
    ],
  },
];

// Build flat list of all villages as Region objects for data generation
function buildAllRegions(): Region[] {
  const regions: Region[] = [];
  for (const dist of maharashtraDistricts) {
    for (const sub of dist.subDistricts) {
      for (const village of sub.villages) {
        regions.push({
          id: village.id,
          name: village.name,
          village: village.name,
          subDistrict: sub.name,
          district: dist.name,
          state: "Maharashtra",
        });
      }
    }
  }
  return regions;
}

export const regions = buildAllRegions();

function generateRegionData(baseDepth: number, annualRate: number, noise: number): PredictionResult {
  const currentYear = 2026;
  const historicalData: WaterDataPoint[] = [];
  const predictedData: WaterDataPoint[] = [];

  for (let i = -10; i <= 0; i++) {
    const year = currentYear + i;
    const depth = baseDepth + annualRate * i + (Math.random() - 0.5) * noise;
    historicalData.push({ year, depth: Math.round(depth * 100) / 100 });
  }

  const lastDepth = historicalData[historicalData.length - 1].depth;

  for (let i = 1; i <= 8; i++) {
    const year = currentYear + i;
    const depth = lastDepth + annualRate * i + (Math.random() - 0.5) * noise * 1.5;
    const ciWidth = i * 0.3 + Math.random() * 0.2;
    predictedData.push({
      year,
      depth: Math.round(depth * 100) / 100,
      predicted: true,
      upperCI: Math.round((depth + ciWidth) * 100) / 100,
      lowerCI: Math.round((depth - ciWidth) * 100) / 100,
    });
  }

  const rSquared = 0.82 + Math.random() * 0.15;
  const absRate = Math.abs(annualRate);
  let riskLevel: PredictionResult["riskLevel"];
  let advisory: string;

  if (absRate < 0.3) {
    riskLevel = "low";
    advisory = `Stable conditions: Annual change of ${annualRate.toFixed(2)} ft/year within safe limits.`;
  } else if (absRate < 0.7) {
    riskLevel = "moderate";
    advisory = `Moderate Risk: Annual decline of ${absRate.toFixed(2)} ft/year. Monitor extraction rates.`;
  } else if (absRate < 1.2) {
    riskLevel = "high";
    advisory = `High Risk: Annual decline of ${absRate.toFixed(1)} ft/year. Immediate intervention recommended.`;
  } else {
    riskLevel = "severe";
    advisory = `⚠️ Severe Risk: Annual decline of ${absRate.toFixed(1)} ft/year detected. Critical depletion imminent.`;
  }

  return {
    region: regions[0],
    historicalData,
    predictedData,
    rSquared: Math.round(rSquared * 1000) / 1000,
    annualChangeRate: annualRate,
    currentDepth: lastDepth,
    riskLevel,
    advisory,
  };
}

// Deterministic seed per village ID for consistent data
function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function riskFromAnnualChange(rate: number): PredictionResult["riskLevel"] {
  const absRate = Math.abs(rate);
  if (absRate < 0.3) return "low";
  if (absRate < 0.7) return "moderate";
  if (absRate < 1.2) return "high";
  return "severe";
}

function advisoryFromAnnualChange(rate: number): string {
  const absRate = Math.abs(rate);
  if (absRate < 0.3) {
    return `Stable conditions: Annual change of ${rate.toFixed(2)} ft/year within safe limits.`;
  }
  if (absRate < 0.7) {
    return `Moderate Risk: Annual decline of ${absRate.toFixed(2)} ft/year. Monitor extraction rates.`;
  }
  if (absRate < 1.2) {
    return `High Risk: Annual decline of ${absRate.toFixed(1)} ft/year. Immediate intervention recommended.`;
  }
  return `Severe Risk: Annual decline of ${absRate.toFixed(1)} ft/year detected. Critical depletion imminent.`;
}

function buildPredictionFromRF(
  region: Region,
  historicalRows: RFHistoricalPoint[],
  predictionRows: RFStoredPrediction[],
  r2FromModelRun?: number
): PredictionResult | null {
  const sortedHistoricalRows = (historicalRows || [])
    .slice()
    .sort((a, b) => (a.year - b.year) || (a.month - b.month));
  const sortedPredictionRows = (predictionRows || [])
    .slice()
    .sort((a, b) => (a.year - b.year) || (a.month - b.month));

  if (!sortedHistoricalRows.length || !sortedPredictionRows.length) return null;

  const yearlyHistoricalMap = new Map<number, number>();
  for (const row of sortedHistoricalRows) {
    yearlyHistoricalMap.set(row.year, Number(row.depth_meters));
  }
  const historicalData = Array.from(yearlyHistoricalMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, depth]) => ({ year, depth: Math.round(depth * 100) / 100 }));

  const yearlyPredMap = new Map<number, { sum: number; count: number; min?: number; max?: number }>();
  for (const row of sortedPredictionRows) {
    const y = row.year;
    const prev = yearlyPredMap.get(y) || { sum: 0, count: 0, min: undefined, max: undefined };
    prev.sum += Number(row.predicted_depth_meters);
    prev.count += 1;
    if (row.confidence_low != null) {
      prev.min = prev.min == null ? Number(row.confidence_low) : Math.min(prev.min, Number(row.confidence_low));
    }
    if (row.confidence_high != null) {
      prev.max = prev.max == null ? Number(row.confidence_high) : Math.max(prev.max, Number(row.confidence_high));
    }
    yearlyPredMap.set(y, prev);
  }

  const predictedData = Array.from(yearlyPredMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, agg]) => {
      const avg = agg.sum / Math.max(1, agg.count);
      return {
        year,
        depth: Math.round(avg * 100) / 100,
        predicted: true,
        lowerCI: agg.min == null ? undefined : Math.round(agg.min * 100) / 100,
        upperCI: agg.max == null ? undefined : Math.round(agg.max * 100) / 100,
      };
    });

  const currentDepth = historicalData[historicalData.length - 1]?.depth ?? 0;
  const futureDepth = predictedData[0]?.depth ?? currentDepth;
  const annualChangeRate = futureDepth - currentDepth;
  const riskLevel = riskFromAnnualChange(annualChangeRate);
  const r2 = Number(r2FromModelRun ?? 0.7);

  return {
    region,
    historicalData,
    predictedData,
    rSquared: Math.max(0, Math.min(1, r2)),
    annualChangeRate,
    currentDepth,
    riskLevel,
    advisory: advisoryFromAnnualChange(annualChangeRate),
  };
}

export async function fetchRegionData(region: Region): Promise<PredictionResult> {
  const regionId = region.id;
  try {
    const readStoredPredictions = async (): Promise<RFStoredPrediction[]> => {
      const response = await fetch(`${API_BASE_URL}/api/rf/predictions/${regionId}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { predictions?: RFStoredPrediction[] };
      return payload.predictions || [];
    };

    let storedPredictions = await readStoredPredictions();
    let usedOnDemandRF = false;

    // On-demand fallback for this village only when table has no rows.
    if (!storedPredictions.length) {
      const runResponse = await fetch(`${API_BASE_URL}/api/rf/pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ village_code: regionId }),
      });
      if (runResponse.ok) {
        usedOnDemandRF = true;
        storedPredictions = await readStoredPredictions();
      }
    }

    if (!storedPredictions.length) {
      throw new Error("No stored RF predictions available");
    }

    const trainingResponse = await fetch(`${API_BASE_URL}/api/rf/training-data/${regionId}`);
    if (!trainingResponse.ok) {
      throw new Error(`HTTP ${trainingResponse.status}`);
    }
    const trainingPayload = (await trainingResponse.json()) as { data?: RFHistoricalPoint[] };
    const historicalRows = trainingPayload.data || [];

    let r2FromModelRun: number | undefined;
    let modelRunId: number | undefined;
    let trainedAt: string | undefined;
    let trainingSamplesFromRun: number | undefined;
    let yearMin: number | undefined;
    let yearMax: number | undefined;
    const modelResponse = await fetch(`${API_BASE_URL}/api/rf/model-info/${regionId}`);
    if (modelResponse.ok) {
      const modelPayload = (await modelResponse.json()) as {
        id?: number;
        r_squared_cv?: number;
        r_squared_train?: number;
        trained_at?: string;
        training_samples?: number;
        training_year_min?: number;
        training_year_max?: number;
      };
      r2FromModelRun = Number(modelPayload.r_squared_cv ?? modelPayload.r_squared_train ?? 0.7);
      modelRunId = modelPayload.id;
      trainedAt = modelPayload.trained_at;
      trainingSamplesFromRun = modelPayload.training_samples;
      yearMin = modelPayload.training_year_min;
      yearMax = modelPayload.training_year_max;
    }

    const mapped = buildPredictionFromRF(region, historicalRows, storedPredictions, r2FromModelRun);
    if (!mapped) {
      throw new Error("RF data mapping failed");
    }
    mapped.dataSource = usedOnDemandRF ? "on-demand-rf" : "stored-rf";
    mapped.rfMeta = {
      modelRunId,
      trainingSamples: trainingSamplesFromRun ?? historicalRows.length,
      yearMin: yearMin ?? (historicalRows.length ? Math.min(...historicalRows.map((r) => r.year)) : undefined),
      yearMax: yearMax ?? (historicalRows.length ? Math.max(...historicalRows.map((r) => r.year)) : undefined),
      trainedAt,
    };
    return mapped;
  } catch {
    // Final fallback: old annual endpoint (if available), else deterministic mock.
    try {
      const response = await fetch(`${API_BASE_URL}/api/predict/annual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region: regionId }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = (await response.json()) as PredictionResult;
      result.region = region;
      result.dataSource = "fallback-api";
      return result;
    } catch {
    const h = hashId(regionId);
    const baseDepth = 20 + (h % 60);
    const rate = ((h % 20) / 10) - 0.5; // -0.5 to 1.5
    const noise = 1 + (h % 4);
    const fallback = generateRegionData(baseDepth, rate, noise);
    fallback.region = region;
    fallback.dataSource = "fallback-mock";
    return fallback;
    }
  }
}

export function searchRegions(query: string): Region[] {
  const q = query.toLowerCase();
  return regions.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.district.toLowerCase().includes(q) ||
      r.subDistrict.toLowerCase().includes(q)
  );
}

export async function fetchMonthlyData(regionId: string, year: number, month: number): Promise<MonthlyPredictionResult> {
  try {
    // RF-first: read stored predictions for the village and interpolate if needed.
    const response = await fetch(`${API_BASE_URL}/api/rf/predictions/${regionId}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = (await response.json()) as {
      predictions?: { year: number; month: number; predicted_depth_meters: number }[];
    };
    const rows = (payload.predictions || []).filter((p) => p.year === year);
    if (rows.length === 0) {
      throw new Error("No RF predictions for selected year");
    }

    const exact = rows.find((p) => p.month === month);
    const monthDepth = exact?.predicted_depth_meters;

    // Linear interpolation using nearest known anchor months (1,5,8,11).
    const sorted = rows.slice().sort((a, b) => a.month - b.month);
    const valueAt = (m: number): number => {
      const direct = sorted.find((r) => r.month === m);
      if (direct) return Number(direct.predicted_depth_meters);
      const prev = sorted.filter((r) => r.month < m).pop();
      const next = sorted.find((r) => r.month > m);
      if (prev && next) {
        const ratio = (m - prev.month) / (next.month - prev.month);
        return Number(prev.predicted_depth_meters) + ratio * (Number(next.predicted_depth_meters) - Number(prev.predicted_depth_meters));
      }
      if (prev) return Number(prev.predicted_depth_meters);
      if (next) return Number(next.predicted_depth_meters);
      return 0;
    };

    const exactDepth = monthDepth == null ? valueAt(month) : Number(monthDepth);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevDepth = valueAt(prevMonth);
    const monthlyChange = exactDepth - prevDepth;

    return {
      exact_depth: Math.round(exactDepth * 100) / 100,
      monthly_change_rate: Math.round(monthlyChange * 1000) / 1000,
      pointwise_insights: [
        `RF estimate for ${month}/${year} from stored model outputs`,
      ],
      dataSource: "stored-rf",
    };
  } catch {
    // Deterministic fallback if backend is unavailable
    const h = hashId(regionId + year.toString() + month.toString());
    const baseDepth = 20 + (h % 60);
    const annualRate = ((h % 20) / 10) - 0.5;
    const seasonalFactors = [0.8, 0.7, 0.6, 0.5, 0.4, 0.5, 0.6, 0.8, 1.0, 1.1, 1.0, 0.9];
    const seasonalFactor = seasonalFactors[month - 1];
    const exactDepth = baseDepth + annualRate * (year - 2026) + (Math.random() - 0.5) * 2 + seasonalFactor * 5;
    const monthlyChangeRate = annualRate / 12 + (Math.random() - 0.5) * 0.1;

    return {
      exact_depth: Math.round(exactDepth * 100) / 100,
      monthly_change_rate: Math.round(monthlyChangeRate * 1000) / 1000,
      pointwise_insights: [`Expected Depth: ${exactDepth.toFixed(2)} ft`],
      dataSource: "fallback-mock",
    };
  }
}
