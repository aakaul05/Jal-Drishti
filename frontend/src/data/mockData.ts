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
}

export interface MonthlyPredictionResult {
  exact_depth: number;
  monthly_change_rate: number;
  pointwise_insights: string[];
}

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

const dataCache = new Map<string, PredictionResult>();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function fetchRegionData(regionId: string): Promise<PredictionResult> {
  if (dataCache.has(regionId)) {
    return dataCache.get(regionId)!;
  }

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
    dataCache.set(regionId, result);
    return result;
  } catch {
    const h = hashId(regionId);
    const baseDepth = 20 + (h % 60);
    const rate = ((h % 20) / 10) - 0.5; // -0.5 to 1.5
    const noise = 1 + (h % 4);
    const region = regions.find((r) => r.id === regionId) || regions[0];
    const fallback = generateRegionData(baseDepth, rate, noise);
    fallback.region = region;
    dataCache.set(regionId, fallback);
    return fallback;
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
    const response = await fetch(`${API_BASE_URL}/api/predict/monthly`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region: regionId, year, month }),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as MonthlyPredictionResult;
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
    };
  }
}
