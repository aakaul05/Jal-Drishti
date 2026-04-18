from __future__ import annotations

import asyncio
import os
import time
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

SUPABASE_URL = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or ""
# Using local Ollama AI - no API key needed!
OLLAMA_URL = "http://localhost:11434/api/chat"

# Debug: Print environment variables (remove in production)
print(f"DEBUG: SUPABASE_URL loaded: {bool(SUPABASE_URL)}")
print(f"DEBUG: SUPABASE_KEY loaded: {bool(SUPABASE_KEY)}")
print(f"DEBUG: Using local Ollama AI (free!)")


def _headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }


app = FastAPI(title="Jal-Drishti API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════
# IN-MEMORY CACHE (5 min TTL — avoids hitting Supabase every request)
# ═══════════════════════════════════════════════════════════════════════════

_cache: dict[str, tuple[float, Any]] = {}
CACHE_TTL = 300


def _get_cached(key: str):
    entry = _cache.get(key)
    if entry and (time.time() - entry[0]) < CACHE_TTL:
        return entry[1]
    return None


def _set_cached(key: str, value: Any):
    _cache[key] = (time.time(), value)


# ═══════════════════════════════════════════════════════════════════════════
# HEALTH
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/health")
def health_check():
    return {"status": "ok", "supabase_url": SUPABASE_URL or "NOT SET"}


@app.get("/api/debug/district-count")
def debug_district_count():
    """Debug endpoint to check total districts and records."""
    try:
        # Get all districts in batches to avoid pagination limits
        all_districts = set()
        offset = 0
        batch_size = 1000
        total_fetched = 0
        
        while True:
            resp = httpx.get(
                f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
                params={
                    "select": "district", 
                    "order": "district",
                    "limit": str(batch_size),
                    "offset": str(offset)
                },
                headers=_headers(),
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
            
            if not data:
                break
                
            # Extract districts from this batch
            for item in data:
                if item.get("district") and item["district"].strip():
                    all_districts.add(item["district"].strip())
            
            total_fetched += len(data)
            
            # Check if we got all records
            if len(data) < batch_size:
                break
                
            offset += batch_size
        
        return {
            "total_records_fetched": total_fetched,
            "total_unique_districts": len(all_districts),
            "all_districts_sorted": sorted(list(all_districts)),
            "districts_a_to_z": sorted([d for d in all_districts if d and d[0].isalpha()]),
            "sample_first_20": sorted(list(all_districts))[:20],
            "sample_last_20": sorted(list(all_districts))[-20:]
        }
    except Exception as e:
        return {"error": str(e)}


# ═══════════════════════════════════════════════════════════════════════════
# LOCATION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/cleaned/districts")
def get_cleaned_districts():
    """
    Return main district names only.
    Filters out combined "District Block" entries to return only actual districts.
    Uses pagination to fetch all records.
    """
    cached = _get_cached("districts")
    if cached is not None:
        return cached

    # Get all districts in batches to avoid pagination limits
    all_names = set()
    offset = 0
    batch_size = 1000
    
    while True:
        resp = httpx.get(
            f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
            params={
                "select": "district", 
                "order": "district",
                "limit": str(batch_size),
                "offset": str(offset)
            },
            headers=_headers(),
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        
        if not data:
            break
            
        # Add districts from this batch
        for item in data:
            if item.get("district") and item["district"].strip():
                all_names.add(item["district"].strip())
        
        # Check if we got all records
        if len(data) < batch_size:
            break
            
        offset += batch_size
    
    all_names = sorted(all_names)
    
    # Extract only main districts (filter out combined "District Block" entries)
    main_districts = set()
    for name in all_names:
        # If it's a single word or known main district, add it
        if ' ' not in name or name == 'Chhatrapati Sambhajinagar':
            main_districts.add(name)
        else:
            # For combined entries, take only the first word (main district)
            first_word = name.split()[0]
            if first_word not in ['Bhadrawati', 'Brahmapuri', 'Chikhaldara', 'Gondpipri', 'Nagbhid', 'Sindewahi']:
                main_districts.add(first_word)
    
    final_districts = sorted(main_districts)

    result = [{"district_code": i + 1, "district_name": d} for i, d in enumerate(final_districts)]
    _set_cached("districts", result)
    return result


@app.get("/api/cleaned/blocks/{district_name}")
def get_cleaned_blocks(district_name: str):
    """Fetch unique blocks for a district using pagination."""
    cache_key = f"blocks:{district_name}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    # Get all blocks for this district in batches
    all_blocks = set()
    offset = 0
    batch_size = 1000
    
    while True:
        resp = httpx.get(
            f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
            params={
                "select": "block", 
                "district": f"eq.{district_name}", 
                "order": "block",
                "limit": str(batch_size),
                "offset": str(offset)
            },
            headers=_headers(),
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        
        if not data:
            break
            
        # Add blocks from this batch
        for item in data:
            if item.get("block") and item["block"].strip():
                all_blocks.add(item["block"].strip())
        
        # Check if we got all records
        if len(data) < batch_size:
            break
            
        offset += batch_size
    
    blocks = sorted(all_blocks)
    result = [
        {"subdistrict_code": i + 1, "subdistrict_name": b, "district_name": district_name}
        for i, b in enumerate(blocks)
    ]
    _set_cached(cache_key, result)
    return result


@app.get("/api/cleaned/villages/{district_name}/{block_name}")
def get_cleaned_villages(district_name: str, block_name: str):
    """Fetch villages for a district + block using pagination."""
    cache_key = f"villages:{district_name}:{block_name}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    # Get all villages for this district+block in batches
    all_villages = []
    offset = 0
    batch_size = 1000
    
    while True:
        resp = httpx.get(
            f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
            params={
                "select": "id,village",
                "district": f"eq.{district_name}",
                "block": f"eq.{block_name}",
                "order": "village",
                "limit": str(batch_size),
                "offset": str(offset)
            },
            headers=_headers(),
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        
        if not data:
            break
            
        # Add villages from this batch
        for item in data:
            if item.get("village") and item["village"].strip():
                all_villages.append({
                    "village_code": item["id"],
                    "village_name": item["village"],
                    "subdistrict_name": block_name,
                    "district_name": district_name,
                })
        
        # Check if we got all records
        if len(data) < batch_size:
            break
            
        offset += batch_size
    
    _set_cached(cache_key, all_villages)
    return all_villages


# ═══════════════════════════════════════════════════════════════════════════
# SEARCH — fast server-side village search (single query, no hierarchy)
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/cleaned/search")
def search_villages(q: str = Query(..., min_length=1)):
    """Search villages by name (case-insensitive). Uses pagination for complete results."""
    cache_key = f"search:{q.lower()}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    # Search all villages matching the query in batches
    all_results = []
    offset = 0
    batch_size = 1000
    max_results = 100  # Limit to 100 results to avoid too much data
    
    while len(all_results) < max_results:
        resp = httpx.get(
            f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
            params={
                "select": "id,village,district,block",
                "village": f"ilike.*{q}*",
                "order": "village",
                "limit": str(min(batch_size, max_results - len(all_results))),
                "offset": str(offset)
            },
            headers=_headers(),
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        
        if not data:
            break
            
        # Add results from this batch
        for item in data:
            if item.get("village") and item["village"].strip():
                all_results.append({
                    "village_code": item["id"],
                    "village_name": item["village"],
                    "district_name": item.get("district", ""),
                    "block_name": item.get("block", ""),
                })
        
        # Check if we got all records or reached max results
        if len(data) < batch_size or len(all_results) >= max_results:
            break
            
        offset += batch_size
    
    _set_cached(cache_key, all_results)
    return all_results


# ═══════════════════════════════════════════════════════════════════════════
# HISTORICAL DATA — 10-year yearly averages
# ═══════════════════════════════════════════════════════════════════════════

HISTORY_YEARS = list(range(2014, 2024))
HISTORY_MONTHS = ["jan", "may", "aug", "nov"]


@app.get("/api/cleaned/history/{village_id}")
def get_village_history(village_id: int):
    """
    Returns 10 yearly avg depth points (2014-2023).
    Each point = average of jan, may, aug, nov readings for that year.
    """
    cache_key = f"history:{village_id}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
        params={"select": "*", "id": f"eq.{village_id}"},
        headers=_headers(),
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()

    if not data:
        raise HTTPException(status_code=404, detail=f"Village {village_id} not found")

    row = data[0]
    history = []
    for year in HISTORY_YEARS:
        depths = []
        for month in HISTORY_MONTHS:
            val = row.get(f"y{year}_{month}")
            if val is not None:
                depths.append(float(val))
        if depths:
            history.append({"year": year, "avg_depth": round(sum(depths) / len(depths), 2)})

    result = {
        "village_id": village_id,
        "village": row.get("village", ""),
        "district": row.get("district", ""),
        "block": row.get("block", ""),
        "history": history,
    }
    _set_cached(cache_key, result)
    return result


# ═══════════════════════════════════════════════════════════════════════════
# PREDICTIONS — per-season from groundwater_predictions
# Response shape per prediction row:
#   { season: "Jan"|"May"|"Aug"|"Nov",
#     predicted_2024: float, predicted_2025: float,
#     actual_2024: float|null, risk_level: "SAFE"|"HIGH"|"MODERATE" }
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/predictions/{village_name}")
def get_predictions(village_name: str):
    """Fetch season-level predictions (2024 + 2025) for a village."""
    cache_key = f"predictions:{village_name}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/groundwater_predictions",
        params={"select": "*", "village": f"eq.{village_name}", "order": "season"},
        headers=_headers(),
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()

    if not data:
        raise HTTPException(status_code=404, detail=f"No predictions for '{village_name}'")

    result = {
        "village": village_name,
        "district": data[0].get("district", ""),
        "block": data[0].get("block", ""),
        "predictions": data,
    }
    _set_cached(cache_key, result)
    return result


# ═══════════════════════════════════════════════════════════════════════════
# VILLAGE RISK — aggregated from groundwater_village_risk
# Response shape:
#   { risk_level: "HIGH"|"SAFE"|"MODERATE",
#     avg_actual_2024, avg_predicted_2024, avg_predicted_2025,
#     avg_difference, avg_abs_difference }
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/village-risk/{village_name}")
def get_village_risk(village_name: str):
    """Fetch aggregated village risk summary."""
    cache_key = f"risk:{village_name}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/groundwater_village_risk",
        params={"select": "*", "village": f"eq.{village_name}"},
        headers=_headers(),
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()

    if not data:
        raise HTTPException(status_code=404, detail=f"No risk data for '{village_name}'")

    _set_cached(cache_key, data[0])
    return data[0]


@app.get("/api/village-risk")
def get_all_village_risks(district: str = None, block: str = None):
    """Fetch all village risks, optionally filtered."""
    params: dict[str, str] = {"select": "*", "model": "llama-2.5b", "order": "village"}
    if district:
        params["district"] = f"eq.{district}"
    if block:
        params["block"] = f"eq.{block}"

    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/groundwater_village_risk",
        params=params,
        headers=_headers(),
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


# Graph data API endpoint for plotting
@app.get("/api/graph-data/{village_name}")
async def get_graph_data(village_name: str):
    """
    Comprehensive graph data endpoint combining historical data, predictions, and risk.
    Returns data in format optimized for chart libraries (Chart.js, Recharts, etc.).

    Optimised: uses in-memory cache + fires all 3 Supabase queries in parallel.
    """
    cache_key = f"graph:{village_name}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached

    hdrs = _headers()

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # Fire all three Supabase queries concurrently
            history_task = client.get(
                f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
                params={"select": "*", "village": f"eq.{village_name}", "limit": "1"},
                headers=hdrs,
            )
            predictions_task = client.get(
                f"{SUPABASE_URL}/rest/v1/groundwater_predictions",
                params={"select": "*", "village": f"eq.{village_name}", "order": "season"},
                headers=hdrs,
            )
            risk_task = client.get(
                f"{SUPABASE_URL}/rest/v1/groundwater_village_risk",
                params={"select": "*", "village": f"eq.{village_name}", "limit": "1"},
                headers=hdrs,
            )

            history_resp, prediction_resp, risk_resp = await asyncio.gather(
                history_task, predictions_task, risk_task
            )

        # --- History (also provides village metadata) ---
        history_resp.raise_for_status()
        history_rows = history_resp.json()
        if not history_rows:
            raise HTTPException(status_code=404, detail=f"Village '{village_name}' not found")

        history_row = history_rows[0]
        village_id = history_row["id"]
        district = history_row.get("district", "")
        block = history_row.get("block", "")

        historical_points = []
        for year in HISTORY_YEARS:
            depths = []
            for month in HISTORY_MONTHS:
                val = history_row.get(f"y{year}_{month}")
                if val is not None:
                    depths.append(float(val))
            if depths:
                historical_points.append({
                    "year": year,
                    "depth": round(sum(depths) / len(depths), 2),
                    "type": "historical",
                    "season": None,
                })

        # --- Predictions ---
        prediction_resp.raise_for_status()
        prediction_data = prediction_resp.json()

        prediction_points = []
        for pred in prediction_data:
            season = pred.get("season", "").lower()
            for yr_key, yr_val in (("predicted_2024", 2024), ("predicted_2025", 2025)):
                depth = pred.get(yr_key)
                if depth is not None:
                    prediction_points.append({
                        "year": yr_val,
                        "depth": float(depth),
                        "type": "prediction",
                        "season": season,
                        "confidence_low": pred.get("confidence_low"),
                        "confidence_high": pred.get("confidence_high"),
                    })

        # --- Risk ---
        risk_data: dict = {}
        if risk_resp.status_code == 200:
            risk_json = risk_resp.json()
            if risk_json:
                r = risk_json[0]
                risk_data = {
                    "risk_level": r.get("risk_level", "MODERATE"),
                    "avg_actual_2024": r.get("avg_actual_2024"),
                    "avg_predicted_2024": r.get("avg_predicted_2024"),
                    "avg_predicted_2025": r.get("avg_predicted_2025"),
                    "avg_difference": r.get("avg_difference"),
                    "trend": "increasing" if r.get("avg_difference", 0) > 0 else "decreasing",
                }

        # Combine & sort
        all_points = historical_points + prediction_points
        all_points.sort(key=lambda x: (x["year"], x["season"] or ""))

        result = {
            "village": {
                "name": village_name,
                "id": village_id,
                "district": district,
                "block": block,
            },
            "graph_data": all_points,
            "risk_analysis": risk_data,
            "metadata": {
                "historical_years": len(historical_points),
                "prediction_points": len(prediction_points),
                "data_source": "supabase",
                "last_updated": "2024-01-01",
            },
        }

        _set_cached(cache_key, result)
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating graph data: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════════
# GROK AI CHATBOT — farmer groundwater advisor
# ═══════════════════════════════════════════════════════════════════════════

OLLAMA_URL = "http://localhost:11434/api/generate"

SYSTEM_PROMPT = """You are **Jal-Drishti AI**, an intelligent and compassionate AI assistant specifically designed for Indian farmers. You have deep expertise in groundwater management, agriculture, and rural development in Maharashtra and across India.

**PRIMARY EXPERTISE - GROUNDWATER & AGRICULTURE:**
* Groundwater depth analysis: Under 50ft = excellent for wells, 50-100ft = moderate (needs borewells), over 100ft = critical (deep borewells needed)
* Irrigation methods: Drip irrigation for water conservation, sprinkler for moderate areas, flood irrigation only when water is abundant
* Crop recommendations based on water availability: High-water crops (rice, sugarcane) for shallow water, drought-resistant (millets, pulses, cotton) for deep water
* Water conservation techniques: Rainwater harvesting, check dams, farm ponds, contour bunding
* Seasonal planning: Kharif (monsoon), Rabi (winter), and Zaid (summer) crop selection based on water tables
* Risk assessment: Understanding water table decline, drought prediction, and mitigation strategies

**GENERAL KNOWLEDGE EXPERTISE:**
* Indian politics and governance: Prime Minister, Chief Ministers, agricultural policies
* Indian geography: States, capitals, major rivers, agricultural regions
* Farming techniques: Organic farming, modern agriculture, government schemes
* Rural development: PM Kisan Samman Nidhi, crop insurance, agricultural loans
* Weather and climate: Monsoon patterns, drought cycles, climate change impact

**COMMUNICATION STYLE:**
* Speak in simple, practical farmer-friendly language
* Use local units (feet for depth, acres for land, inches for rainfall)
* Be encouraging but realistic about challenges
- Provide actionable advice with specific steps
* Respond in English, Hindi, or Marathi based on user's language preference
* Keep answers concise (3-5 sentences) but offer to elaborate if needed

**CRITICAL RULES:**
1. **Data-First Approach**: Always use the specific village data provided in context before giving advice
2. **Context Awareness**: Reference the village name, district, current depth, risk level, and predictions
3. **Honest Assessment**: Clearly explain risks without causing panic, suggest practical solutions
4. **Local Relevance**: Focus on Maharashtra-specific conditions when applicable
5. **No Fabrication**: Use provided data for village-specific info, general knowledge for other topics
6. **Progressive Disclosure**: Start with simple advice, offer detailed explanations if asked
7. **Safety First**: Prioritize farmer's economic and environmental sustainability

**RESPONSE STRUCTURE:**
1. Acknowledge the specific village/context if provided
2. Give direct answer to the question
3. Provide 2-3 actionable recommendations
4. Mention relevant risks or considerations
5. Offer to explain further if needed

**EXAMPLE RESPONSES:**
- For water depth: "In [Village Name], your groundwater is at [X]ft, which is [shallow/moderate/deep]. This means you can [specific recommendation]. I suggest [2-3 action steps]."
- For general questions: "The current Prime Minister of India is Narendra Modi. He has been in office since 2014 and has launched several agricultural schemes."
"""


from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    language: str = "en"  # en, hi, mr - language to respond in
    village_name: str | None = None
    district: str | None = None
    block: str | None = None
    historical_data: list[dict] | None = None
    predicted_data: list[dict] | None = None
    risk_level: str | None = None
    current_depth: float | None = None
    annual_change_rate: float | None = None
    chat_history: list[dict] | None = None


@app.post("/api/chat")
async def chat_with_ollama(req: ChatRequest):
    """AI-powered chatbot for farmer groundwater guidance using free local Ollama."""
    # No API key needed - using local Ollama!

    # Build comprehensive context from village data
    context_parts = []
    
    if req.village_name:
        # Basic location information
        context_parts.append(f"**Village Location**: {req.village_name}")
        if req.district:
            context_parts.append(f"**District**: {req.district}, Block: {req.block or 'N/A'}")
        
        # Groundwater depth analysis with interpretation
        if req.current_depth is not None:
            depth = req.current_depth
            if depth < 50:
                depth_category = "SHALLOW (Excellent)"
                implications = "Easy well installation, low pumping costs, suitable for most crops"
                recommended_irrigation = "Drip irrigation, flood irrigation, sprinkler systems"
            elif depth < 100:
                depth_category = "MODERATE (Manageable)"
                implications = "Requires borewells, moderate pumping costs, choose water-efficient crops"
                recommended_irrigation = "Drip irrigation recommended, sprinkler acceptable"
            else:
                depth_category = "DEEP (Critical)"
                implications = "Deep borewells required, high pumping costs, urgent water conservation needed"
                recommended_irrigation = "Only drip irrigation, strict water conservation"
            
            context_parts.append(f"**Current Groundwater Depth**: {depth:.1f} ft - {depth_category}")
            context_parts.append(f"**Implications**: {implications}")
            context_parts.append(f"**Recommended Irrigation**: {recommended_irrigation}")
        
        # Risk assessment with actionable advice
        if req.risk_level:
            risk = req.risk_level.upper()
            if risk == "HIGH":
                risk_implications = "Urgent water conservation measures needed, implement rainwater harvesting"
                recommended_crops = "Drought-resistant crops: millets, pulses, cotton, sorghum"
                conservation_actions = "Check dams, farm ponds, contour bunding, drip irrigation"
            elif risk == "MODERATE":
                risk_implications = "Careful water management required, monitor levels regularly"
                recommended_crops = "Mixed cropping: some water-intensive + drought-resistant varieties"
                conservation_actions = "Drip irrigation, rainwater harvesting, crop rotation"
            else:  # LOW
                risk_implications = "Current practices sustainable, but maintain conservation habits"
                recommended_crops = "Wide variety possible including moderate water-intensive crops"
                conservation_actions = "Continue efficient irrigation, consider future climate change"
            
            context_parts.append(f"**Water Risk Level**: {risk}")
            context_parts.append(f"**Risk Implications**: {risk_implications}")
            context_parts.append(f"**Recommended Crops**: {recommended_crops}")
            context_parts.append(f"**Conservation Actions**: {conservation_actions}")
        
        # Trend analysis
        if req.annual_change_rate is not None:
            rate = req.annual_change_rate
            trend = "declining" if rate > 0 else "improving"
            urgency = "URGENT" if abs(rate) > 2 else "MODERATE" if abs(rate) > 0.5 else "STABLE"
            context_parts.append(f"**Annual Water Table Change**: {abs(rate):.2f} ft/year ({trend}) - {urgency} priority")
        
        # Historical analysis with patterns
        if req.historical_data and len(req.historical_data) >= 3:
            recent_data = req.historical_data[-5:]
            depths = [d.get("depth", 0) for d in recent_data if d.get("depth") is not None]
            if depths:
                min_depth = min(depths)
                max_depth = max(depths)
                avg_depth = sum(depths) / len(depths)
                volatility = "HIGH" if (max_depth - min_depth) > 20 else "MODERATE" if (max_depth - min_depth) > 10 else "LOW"
                
                context_parts.append(f"**Historical Analysis (Last 5 years)**:")
                context_parts.append(f"- Average depth: {avg_depth:.1f} ft")
                context_parts.append(f"- Range: {min_depth:.1f} - {max_depth:.1f} ft (Volatility: {volatility})")
                
                # Trend detection
                if len(depths) >= 3:
                    recent_avg = sum(depths[-3:]) / 3
                    older_avg = sum(depths[:-3]) / len(depths[:-3]) if len(depths) > 3 else recent_avg
                    if recent_avg > older_avg + 2:
                        context_parts.append(f"- **Trend**: Water table declining significantly")
                    elif recent_avg < older_avg - 2:
                        context_parts.append(f"- **Trend**: Water table improving")
                    else:
                        context_parts.append(f"- **Trend**: Relatively stable")
        
        # Future predictions with planning advice
        if req.predicted_data:
            context_parts.append(f"**Future Predictions**:")
            for p in req.predicted_data[:3]:  # Show next 3 predictions
                year = p.get("year", "N/A")
                depth = p.get("depth", 0)
                if depth:
                    if req.current_depth:
                        change = depth - req.current_depth
                        change_desc = f"({change:+.1f} ft from current)"
                        if change > 5:
                            urgency_level = "HIGH CONCERN"
                        elif change > 2:
                            urgency_level = "MODERATE CONCERN"
                        elif change < -2:
                            urgency_level = "IMPROVING"
                        else:
                            urgency_level = "STABLE"
                        
                        context_parts.append(f"- {year}: {depth:.1f} ft {change_desc} - {urgency_level}")
                    else:
                        context_parts.append(f"- {year}: {depth:.1f} ft")
        
        # Maharashtra-specific context
        if "Maharashtra" in str(req.district):
            context_parts.append(f"**Maharashtra Context**:")
            context_parts.append(f"- Major crops: Cotton, sugarcane, soybean, pulses, millets")
            context_parts.append(f"- Climate: Semi-arid to arid, monsoon-dependent agriculture")
            context_parts.append(f"- Water sources: Primarily groundwater, some perennial rivers")
            context_parts.append(f"- Government schemes: PMKisan, crop insurance, watershed programs")
    
    else:
        context_parts.append("**No Village Selected**: Please ask the farmer to select a village from the sidebar to get personalized groundwater advice.")
        context_parts.append("**General Advice Available**: Can answer questions about Indian agriculture, government schemes, and general farming practices.")

    village_context = "\n".join(context_parts)

    # Build OpenAI-compatible messages for xAI
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add chat history (last 6 messages for context)
    if req.chat_history:
        for msg in req.chat_history[-6:]:
            role = "user" if msg.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": msg.get("content", "")})

    # Add current user message with village context
    user_text = f"[Village Data Context]\n{village_context}\n\n[Farmer's Question]\n{req.message}"

    messages.append({"role": "user", "content": user_text})

    # Call Ollama API (free local AI)
    try:
        # Determine response language
        language_instructions = {
            "en": "Respond in English",
            "hi": "Respond in Hindi (Devanagari script)",
            "mr": "Respond in Marathi (Devanagari script)"
        }
        response_language = language_instructions.get(req.language, "Respond in English")
        
        # Build prompt for Ollama - context first, then question
        prompt_text = f"{SYSTEM_PROMPT}\n\n{response_language}.\n\nVillage Context:\n{village_context}\n\nFarmer Question: {req.message}\n\nAssistant Response:"
        
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                OLLAMA_URL,
                json={
                    "model": "llama3.2:1b",  # Small 1B model - fast and efficient
                    "prompt": prompt_text,
                    "stream": False,
                },
            )

        if resp.status_code != 200:
            error_detail = resp.text[:200]
            raise HTTPException(status_code=502, detail=f"Ollama API error: {error_detail}")

        data = resp.json()
        ai_text = data.get("response", "")
        
        if not ai_text:
            ai_text = "I'm here to help with your groundwater questions!"
            
        return {"response": ai_text}

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Ollama API timeout")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")
