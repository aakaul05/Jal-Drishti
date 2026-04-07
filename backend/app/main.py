from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import location_store as ls_module
from . import rf_model
from .location_store import LocationStore
from .models import AnnualPredictRequest, MonthlyPredictRequest
from .predictor import (
    CURRENT_YEAR_DEFAULT,
    generate_annual_prediction,
    generate_monthly_prediction,
)

# Load .env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

# Set Supabase credentials for the location store
ls_module.SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
ls_module.SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

# Set Supabase credentials for the RF model
rf_model.SUPABASE_URL = ls_module.SUPABASE_URL
rf_model.SUPABASE_KEY = ls_module.SUPABASE_KEY

# Create location store (loads from Supabase on first access)
location_store = LocationStore()


app = FastAPI(title="Jal-Drishti API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173", "http://127.0.0.1:8080", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════
# REQUEST MODELS for RF endpoints
# ═══════════════════════════════════════════════════════════════════════════

class RFPipelineRequest(BaseModel):
    """Run the full RF pipeline: train + predict + store in Supabase."""
    village_code: str = Field(..., min_length=1)
    years: list[int] | None = None  # defaults to [2026, 2027]


class RFPredictRequest(BaseModel):
    """Get RF predictions (from cache or train on-the-fly)."""
    village_code: str = Field(..., min_length=1)
    years: list[int] | None = None


class RFStoredRequest(BaseModel):
    """Fetch previously stored predictions from Supabase."""
    village_code: str = Field(..., min_length=1)


# ═══════════════════════════════════════════════════════════════════════════
# EXISTING ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/api/health")
def health_check() -> dict[str, Any]:
    """Health check — also verifies Supabase connectivity."""
    location_store.load()
    districts = location_store.get_districts_with_hierarchy()
    return {
        "status": "ok",
        "supabase_url": ls_module.SUPABASE_URL or "NOT SET",
        "districts_loaded": len(districts),
    }


@app.post("/api/predict/annual")
def predict_annual(payload: AnnualPredictRequest) -> Any:
    if not payload.region.strip():
        raise HTTPException(status_code=400, detail="region is required")

    try:
        result = generate_annual_prediction(payload.region, location_store=location_store)
        return result.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Annual prediction failed: {e}")


@app.post("/api/predict/monthly")
def predict_monthly(payload: MonthlyPredictRequest) -> Any:
    if not payload.region.strip():
        raise HTTPException(status_code=400, detail="region is required")

    min_year = CURRENT_YEAR_DEFAULT - 10
    max_year = CURRENT_YEAR_DEFAULT + 8
    if payload.year < min_year or payload.year > max_year:
        raise HTTPException(
            status_code=422,
            detail=f"year must be in [{min_year}, {max_year}] for the current model horizon",
        )

    try:
        exact_depth, monthly_change_rate, insights = generate_monthly_prediction(
            region_id=payload.region,
            location_store=location_store,
            year=payload.year,
            month=payload.month,
        )
        return {
            "exact_depth": exact_depth,
            "monthly_change_rate": monthly_change_rate,
            "pointwise_insights": insights,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Monthly prediction failed: {e}")


@app.get("/api/locations/districts")
def get_districts_with_hierarchy() -> Any:
    return location_store.get_districts_with_hierarchy()


@app.get("/api/locations/subdistricts/{district_code}")
def get_subdistricts(district_code: str) -> Any:
    return location_store.get_subdistricts(district_code)


@app.get("/api/locations/villages/{subdistrict_code}")
def get_villages(subdistrict_code: str, limit: int = 1000) -> Any:
    villages = location_store.get_villages(subdistrict_code)
    # Return all villages but limit if too many for performance
    if len(villages) > limit:
        return villages[:limit]
    return villages


# ═══════════════════════════════════════════════════════════════════════════
# RANDOM FOREST ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/api/rf/pipeline")
def rf_pipeline(payload: RFPipelineRequest) -> Any:
    """
    FULL PIPELINE: Train RF model on village's groundwater_levels data,
    predict months 1/5/8/11 for this year + next year,
    store model run + predictions in Supabase.

    This is the main endpoint to call.
    """
    try:
        result = rf_model.run_pipeline(
            village_code=payload.village_code,
            years=payload.years,
        )
        if not result.get("success"):
            raise HTTPException(
                status_code=422,
                detail=result.get("error", "Pipeline failed"),
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RF pipeline failed: {e}")


@app.post("/api/rf/predict")
def rf_predict(payload: RFPredictRequest) -> Any:
    """
    Get RF predictions for a village (trains on-the-fly if not cached).
    Does NOT store to Supabase — use /api/rf/pipeline for that.
    """
    try:
        predictions, meta = rf_model.predict_village(
            village_code=payload.village_code,
            years=payload.years,
        )
        if not predictions:
            raise HTTPException(
                status_code=422,
                detail=meta.get("error", "Prediction failed — insufficient data"),
            )
        return {
            "village_code": payload.village_code,
            "model_metrics": {
                "r_squared_train": meta.get("r_squared_train"),
                "r_squared_cv": meta.get("r_squared_cv"),
                "mae": meta.get("mae"),
                "rmse": meta.get("rmse"),
                "training_samples": meta.get("training_samples"),
            },
            "predictions": predictions,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RF predict failed: {e}")


@app.get("/api/rf/predictions/{village_code}")
def rf_get_stored_predictions(village_code: str) -> Any:
    """
    Fetch previously stored predictions from Supabase groundwater_predictions table.
    """
    predictions = rf_model.fetch_stored_predictions(village_code)
    model_run = rf_model.fetch_model_run(village_code)
    return {
        "village_code": village_code,
        "model_run": model_run,
        "predictions": predictions,
    }


@app.get("/api/rf/training-data/{village_code}")
def rf_get_training_data(village_code: str) -> Any:
    """
    Fetch the raw training data (groundwater_levels) for a village.
    Useful for debugging / inspecting what the model trained on.
    """
    df = rf_model.fetch_village_data(village_code)
    if df.empty:
        return {"village_code": village_code, "data": [], "count": 0}
    records = df.to_dict(orient="records")
    return {
        "village_code": village_code,
        "data": records,
        "count": len(records),
    }


@app.get("/api/rf/model-info/{village_code}")
def rf_get_model_info(village_code: str) -> Any:
    """
    Get the active model run info for a village from Supabase.
    """
    model_run = rf_model.fetch_model_run(village_code)
    if not model_run:
        raise HTTPException(
            status_code=404,
            detail=f"No active model found for village {village_code}. Run /api/rf/pipeline first.",
        )
    return model_run


@app.post("/api/rf/clear-cache")
def rf_clear_cache() -> Any:
    """Clear the in-memory RF model cache (forces retrain on next request)."""
    rf_model.clear_cache()
    return {"status": "ok", "message": "Model cache cleared"}


@app.get("/api/debug/village-count")
def debug_village_count() -> Any:
    """Debug endpoint to check how many villages are loaded."""
    location_store.load()
    return {
        "total_villages_loaded": len(location_store._village_by_id),
        "total_subdistricts": len(location_store._villages_by_subdistrict),
        "sample_subdistrict_villages": {
            sd: len(villages) for sd, villages in 
            list(location_store._villages_by_subdistrict.items())[:5]
        }
    }


@app.get("/api/direct-villages/{subdistrict_code}")
def direct_villages(subdistrict_code: str, limit: int = 1000) -> Any:
    """Direct query to Supabase for villages."""
    try:
        import httpx
        resp = httpx.get(
            f"{ls_module.SUPABASE_URL}/rest/v1/mh_villages",
            params={
                "select": "village_code,village_name,subdistrict_code,district_code",
                "subdistrict_code": f"eq.{subdistrict_code}",
                "order": "village_name",
                "limit": limit,
            },
            headers=ls_module._get_headers(),
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/debug/villages-with-data")
def villages_with_training_data() -> Any:
    """Get village codes that have groundwater training data."""
    try:
        import httpx
        resp = httpx.get(
            f"{ls_module.SUPABASE_URL}/rest/v1/groundwater_levels",
            params={
                "select": "village_code",
                "order": "village_code",
            },
            headers=ls_module._get_headers(),
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        # Extract unique village codes
        village_codes = list(set(str(item["village_code"]) for item in data))
        return sorted(village_codes)
    except Exception as e:
        return {"error": str(e)}
