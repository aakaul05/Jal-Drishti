from __future__ import annotations

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
    params: dict[str, str] = {"select": "*", "order": "village"}
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
