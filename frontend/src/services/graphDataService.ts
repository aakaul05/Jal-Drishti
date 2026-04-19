const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export interface GraphDataPoint {
  year: number;
  depth: number;
  type: "historical" | "prediction";
  season: string | null;
  confidence_low?: number;
  confidence_high?: number;
}

export interface VillageInfo {
  name: string;
  id: number;
  district: string;
  block: string;
}

export interface RiskAnalysis {
  risk_level: "HIGH" | "MODERATE" | "SAFE";
  avg_actual_2024?: number;
  avg_predicted_2024?: number;
  avg_predicted_2025?: number;
  avg_difference?: number;
  trend: "increasing" | "decreasing";
}

export interface GraphDataResponse {
  village: VillageInfo;
  graph_data: GraphDataPoint[];
  risk_analysis: RiskAnalysis;
  metadata: {
    historical_years: number;
    prediction_points: number;
    data_source: string;
    last_updated: string;
  };
}

export class GraphDataService {
  /**
   * Fetch comprehensive graph data for a village
   * Combines historical data, predictions, and risk analysis
   */
  static async getGraphData(villageName: string): Promise<GraphDataResponse> {
    const url = `${API_BASE_URL}/api/graph-data/${encodeURIComponent(villageName)}`;
    console.log("[GraphDataService] 📡 Fetching:", url);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("[GraphDataService] ❌ HTTP Error:", response.status, response.statusText);
      throw new Error(`Failed to fetch graph data: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("[GraphDataService] ✅ Raw API response:", data);
    return data;
  }

  /**
   * Transform graph data for Chart.js format
   */
  static formatForChartJs(data: GraphDataResponse): {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      type?: 'line';
      fill?: boolean;
      tension?: number;
    }>;
  } {
    const historicalData = data.graph_data.filter(point => point.type === 'historical');
    const predictionData = data.graph_data.filter(point => point.type === 'prediction');
    
    // Create labels (years)
    const allYears = [...new Set(data.graph_data.map(point => point.year))].sort();
    const labels = allYears.map(year => year.toString());
    
    // Historical dataset
    const historicalDepths = allYears.map(year => {
      const point = historicalData.find(p => p.year === year);
      return point ? point.depth : null;
    });
    
    // Prediction dataset
    const predictionDepths = allYears.map(year => {
      const point = predictionData.find(p => p.year === year);
      return point ? point.depth : null;
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Historical Groundwater Depth',
          data: historicalDepths,
          borderColor: 'rgb(59, 130, 246)', // blue-500
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          type: 'line',
          fill: false,
          tension: 0.1
        },
        {
          label: 'Predicted Groundwater Depth',
          data: predictionDepths,
          borderColor: 'rgb(239, 68, 68)', // red-500
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          type: 'line',
          fill: false,
          tension: 0.1
        }
      ]
    };
  }

  /**
   * Transform graph data for Recharts format
   */
  static formatForRecharts(data: GraphDataResponse): Array<{
    year: number;
    historical: number | null;
    prediction: number | null;
    confidence_low?: number;
    confidence_high?: number;
  }> {
    const result: Array<{
      year: number;
      historical: number | null;
      prediction: number | null;
      confidence_low?: number;
      confidence_high?: number;
    }> = [];
    
    // Get all unique years
    const allYears = [...new Set(data.graph_data.map(point => point.year))].sort();
    
    allYears.forEach(year => {
      const historicalPoint = data.graph_data.find(p => p.year === year && p.type === 'historical');
      const predictionPoint = data.graph_data.find(p => p.year === year && p.type === 'prediction');
      
      result.push({
        year,
        historical: historicalPoint ? historicalPoint.depth : null,
        prediction: predictionPoint ? predictionPoint.depth : null,
        confidence_low: predictionPoint?.confidence_low,
        confidence_high: predictionPoint?.confidence_high
      });
    });
    
    return result;
  }

  /**
   * Get risk level color
   */
  static getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'HIGH':
        return '#ef4444'; // red-500
      case 'MODERATE':
        return '#f59e0b'; // amber-500
      case 'SAFE':
        return '#10b981'; // emerald-500
      default:
        return '#6b7280'; // gray-500
    }
  }

  /**
   * Get trend icon
   */
  static getTrendIcon(trend: string): string {
    return trend === 'increasing' ? 'up' : 'down';
  }
}
