from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .location_store import LocationStore
from .models import AnnualPredictRequest, MonthlyPredictRequest
from .predictor import (
    CURRENT_YEAR_DEFAULT,
    generate_annual_prediction,
    generate_monthly_prediction,
)


BASE_DIR = Path(__file__).resolve().parents[2]
LOCATION_JSON_PATH = BASE_DIR / "frontend" / "public" / "location" / "maharashtra.json"

location_store = LocationStore(str(LOCATION_JSON_PATH))


app = FastAPI(title="Jal-Drishti API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173", "http://127.0.0.1:8080", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

    # Validate year within the annual horizon: [current_year-10 .. current_year+8]
    min_year = CURRENT_YEAR_DEFAULT - 10
    max_year = CURRENT_YEAR_DEFAULT + 8
    if payload.year < min_year or payload.year > max_year:
        raise HTTPException(
            status_code=422,
            detail=f"year must be in [{min_year}, {max_year}] for the current model horizon",
        )

    # Month validated by Pydantic (1..12)
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
def get_villages(subdistrict_code: str) -> Any:
    return location_store.get_villages(subdistrict_code)

