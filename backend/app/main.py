from __future__ import annotations

import os
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
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
# HEALTH
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/health")
def health_check():
    return {"status": "ok", "supabase_url": SUPABASE_URL or "NOT SET"}


# ═══════════════════════════════════════════════════════════════════════════
# LOCATION ENDPOINTS (from groundwater_cleaned_final)
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/cleaned/districts")
def get_cleaned_districts():
    """Fetch unique districts."""
    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
        params={"select": "district", "order": "district"},
        headers=_headers(),
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    districts = sorted(set(item["district"] for item in data if item.get("district")))
    return [{"district_code": i + 1, "district_name": d} for i, d in enumerate(districts)]


@app.get("/api/cleaned/blocks/{district_name}")
def get_cleaned_blocks(district_name: str):
    """Fetch unique blocks for a district."""
    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
        params={"select": "block", "district": f"eq.{district_name}", "order": "block"},
        headers=_headers(),
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    blocks = sorted(set(item["block"] for item in data if item.get("block")))
    return [{"subdistrict_code": i + 1, "subdistrict_name": b, "district_name": district_name} for i, b in enumerate(blocks)]


@app.get("/api/cleaned/villages/{district_name}/{block_name}")
def get_cleaned_villages(district_name: str, block_name: str):
    """Fetch villages for a district + block."""
    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
        params={
            "select": "id,village",
            "district": f"eq.{district_name}",
            "block": f"eq.{block_name}",
            "order": "village",
        },
        headers=_headers(),
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    return [
        {
            "village_code": item["id"],
            "village_name": item["village"],
            "subdistrict_name": block_name,
            "district_name": district_name,
        }
        for item in data
    ]


# ═══════════════════════════════════════════════════════════════════════════
# API 1: HISTORICAL DATA — 10-year yearly averages for graph
# ═══════════════════════════════════════════════════════════════════════════

HISTORY_YEARS = list(range(2014, 2024))
HISTORY_MONTHS = ["jan", "may", "aug", "nov"]


@app.get("/api/cleaned/history/{village_id}")
def get_village_history(village_id: int):
    """
    Returns 10 yearly avg depth points (2014-2023).
    Each point = average of Jan, May, Aug, Nov readings.
    Frontend uses this for the 10-year graph.
    """
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

    return {
        "village_id": village_id,
        "village": row.get("village", ""),
        "district": row.get("district", ""),
        "block": row.get("block", ""),
        "history": history,
    }


# ═══════════════════════════════════════════════════════════════════════════
# API 2: PREDICTIONS — per-season from groundwater_predictions table
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/predictions/{village_name}")
def get_predictions(village_name: str):
    """Fetch season-level predictions (2024 + 2025) for a village."""
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

    return {
        "village": village_name,
        "district": data[0].get("district", ""),
        "block": data[0].get("block", ""),
        "predictions": data,
    }


# ═══════════════════════════════════════════════════════════════════════════
# API 3: VILLAGE RISK — aggregated from groundwater_village_risk table
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/village-risk/{village_name}")
def get_village_risk(village_name: str):
    """Fetch aggregated village risk summary."""
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

    return data[0]


@app.get("/api/village-risk")
def get_all_village_risks(district: str = None, block: str = None):
    """Fetch all village risks, optionally filtered by district/block."""
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
