"""
Random Forest Model — Groundwater Depth Prediction
====================================================
Full pipeline:
  1. Fetch 10-year training data from Supabase `groundwater_levels`
  2. Train RandomForestRegressor per village
  3. Predict months 1/5/8/11 for current year + next year
  4. Store predictions in Supabase `groundwater_predictions`
  5. Store model run metadata in Supabase `rf_model_runs`
"""

from __future__ import annotations

import threading
from typing import Any

import httpx
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import cross_val_score

# ---------------------------------------------------------------------------
# Supabase connection — set by main.py on startup
# ---------------------------------------------------------------------------
SUPABASE_URL: str | None = None
SUPABASE_KEY: str | None = None

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
PREDICTION_MONTHS = [1, 5, 8, 11]
CURRENT_YEAR = 2026

FEATURE_COLS = [
    "year_offset",
    "month",
    "month_sin",
    "month_cos",
    "is_month_1",
    "is_month_5",
    "is_month_8",
    "is_month_11",
]

# ---------------------------------------------------------------------------
# Model cache: village_code -> (model, metadata)
# ---------------------------------------------------------------------------
_model_cache: dict[str, tuple[RandomForestRegressor, dict[str, Any]]] = {}
_cache_lock = threading.Lock()


# ===========================================================================
# SUPABASE HELPERS
# ===========================================================================

def _headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_KEY or "",
        "Authorization": f"Bearer {SUPABASE_KEY or ''}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _base_url() -> str:
    return (SUPABASE_URL or "").rstrip("/")


# ===========================================================================
# 1. FETCH TRAINING DATA
# ===========================================================================

def fetch_village_data(village_code: str) -> pd.DataFrame:
    """
    Fetch all groundwater_levels rows for ONE village from Supabase.
    Returns DataFrame: village_code, year, month, depth_meters
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Warning: RF: Supabase not configured")
        return pd.DataFrame()

    try:
        resp = httpx.get(
            f"{_base_url()}/rest/v1/groundwater_levels",
            params={
                "select": "village_code,year,month,depth_meters",
                "village_code": f"eq.{village_code}",
                "order": "year.asc,month.asc",
            },
            headers=_headers(),
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"ERROR RF fetch failed for village {village_code}: {e}")
        return pd.DataFrame()

    if not data:
        return pd.DataFrame()

    df = pd.DataFrame(data)
    df["depth_meters"] = df["depth_meters"].astype(float)
    df["year"] = df["year"].astype(int)
    df["month"] = df["month"].astype(int)
    df["village_code"] = df["village_code"].astype(str)
    return df


# ===========================================================================
# 2. FEATURE ENGINEERING
# ===========================================================================

def _engineer_features(df: pd.DataFrame, min_year: int) -> pd.DataFrame:
    """Add derived features for RF model."""
    df = df.copy()
    df["year_offset"] = df["year"] - min_year
    df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12)
    for m in PREDICTION_MONTHS:
        df[f"is_month_{m}"] = (df["month"] == m).astype(int)
    return df


def _make_feature_row(year: int, month: int, min_year: int) -> np.ndarray:
    """Build one feature vector for prediction."""
    return np.array([
        year - min_year,                         # year_offset
        month,                                   # month
        np.sin(2 * np.pi * month / 12),          # month_sin
        np.cos(2 * np.pi * month / 12),          # month_cos
        int(month == 1),                         # is_month_1
        int(month == 5),                         # is_month_5
        int(month == 8),                         # is_month_8
        int(month == 11),                        # is_month_11
    ])


# ===========================================================================
# 3. TRAIN MODEL
# ===========================================================================

def train_model(
    village_code: str,
    n_estimators: int = 100,
    max_depth: int | None = 10,
) -> tuple[RandomForestRegressor | None, dict[str, Any]]:
    """
    Train RF on a single village's groundwater_levels data.
    Returns (model, metadata). Model is None if data insufficient.
    """
    df = fetch_village_data(village_code)

    if df.empty or len(df) < 4:
        return None, {
            "error": f"Need >= 4 data points, found {len(df) if not df.empty else 0}",
        }

    min_year = int(df["year"].min())
    max_year = int(df["year"].max())
    df_feat = _engineer_features(df, min_year)

    X = df_feat[FEATURE_COLS].values
    y = df_feat["depth_meters"].values

    # Train
    rf = RandomForestRegressor(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42,
        n_jobs=-1,
    )
    rf.fit(X, y)

    # Metrics
    y_pred = rf.predict(X)
    r2_train = float(r2_score(y, y_pred))
    mae_val = float(mean_absolute_error(y, y_pred))
    rmse_val = float(np.sqrt(mean_squared_error(y, y_pred)))

    # Cross-val R-squared
    if len(df) >= 8:
        try:
            cv = cross_val_score(rf, X, y, cv=min(5, len(df)), scoring="r2")
            r2_cv = float(np.mean(cv))
        except Exception:
            r2_cv = r2_train
    else:
        r2_cv = r2_train

    feat_imp = {
        col: round(float(imp), 4)
        for col, imp in zip(FEATURE_COLS, rf.feature_importances_)
    }

    meta = {
        "village_code": village_code,
        "min_year": min_year,
        "max_year": max_year,
        "training_samples": len(df),
        "n_estimators": n_estimators,
        "max_depth": max_depth,
        "r_squared_train": round(r2_train, 6),
        "r_squared_cv": round(r2_cv, 6),
        "mae": round(mae_val, 4),
        "rmse": round(rmse_val, 4),
        "feature_importance": feat_imp,
    }

    print(
        f"RF trained village={village_code} | "
        f"samples={len(df)} | R2={r2_train:.4f} | MAE={mae_val:.4f}m"
    )
    return rf, meta


# ===========================================================================
# 4. PREDICT
# ===========================================================================

def _predict_single(
    model: RandomForestRegressor,
    year: int,
    month: int,
    min_year: int,
) -> dict[str, Any]:
    """Predict depth for one (year, month) pair."""
    X = _make_feature_row(year, month, min_year).reshape(1, -1)
    predicted = float(model.predict(X)[0])

    # Confidence interval from individual trees
    tree_preds = np.array([t.predict(X)[0] for t in model.estimators_])
    ci_low = float(np.percentile(tree_preds, 5))
    ci_high = float(np.percentile(tree_preds, 95))
    std = float(np.std(tree_preds))

    return {
        "year": year,
        "month": month,
        "predicted_depth_meters": round(predicted, 2),
        "confidence_low": round(ci_low, 2),
        "confidence_high": round(ci_high, 2),
        "std_dev": round(std, 4),
    }


def predict_village(
    village_code: str,
    years: list[int] | None = None,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """
    Predict all 4 months for given years (default: current + next year).
    Returns (predictions_list, model_metadata).
    """
    if years is None:
        years = [CURRENT_YEAR, CURRENT_YEAR + 1]

    # Get or train model
    with _cache_lock:
        cached = _model_cache.get(village_code)
    if cached:
        model, meta = cached
    else:
        model, meta = train_model(village_code)
        if model is not None:
            with _cache_lock:
                _model_cache[village_code] = (model, meta)

    if model is None:
        return [], meta

    min_year = meta["min_year"]
    predictions = []
    for yr in years:
        for mo in PREDICTION_MONTHS:
            pred = _predict_single(model, yr, mo, min_year)
            predictions.append(pred)

    return predictions, meta


# ===========================================================================
# 5. STORE IN SUPABASE
# ===========================================================================

def _store_model_run(village_code: str, meta: dict[str, Any]) -> int | None:
    """
    Insert a row into rf_model_runs. Returns the new row ID.
    First deactivates any existing active runs for this village.
    """
    base = _base_url()
    hdrs = _headers()

    # Deactivate old active runs for this village
    try:
        httpx.patch(
            f"{base}/rest/v1/rf_model_runs",
            params={
                "village_code": f"eq.{village_code}",
                "is_active": "eq.true",
            },
            json={"is_active": False},
            headers=hdrs,
            timeout=10,
        )
    except Exception as e:
        print(f"Warning: Could not deactivate old model runs: {e}")

    # Insert new run
    payload = {
        "village_code": int(village_code),
        "algorithm": "RandomForestRegressor",
        "n_estimators": meta.get("n_estimators", 100),
        "max_depth": meta.get("max_depth", 10),
        "min_samples_split": 2,
        "training_samples": meta["training_samples"],
        "training_year_min": meta["min_year"],
        "training_year_max": meta["max_year"],
        "r_squared_train": meta["r_squared_train"],
        "r_squared_cv": meta["r_squared_cv"],
        "mae": meta["mae"],
        "rmse": meta["rmse"],
        "feature_importance": meta["feature_importance"],
        "is_active": True,
    }

    try:
        resp = httpx.post(
            f"{base}/rest/v1/rf_model_runs",
            json=payload,
            headers=hdrs,
            timeout=10,
        )
        resp.raise_for_status()
        rows = resp.json()
        if rows and len(rows) > 0:
            run_id = rows[0].get("id")
            print(f"Stored model run id={run_id} for village={village_code}")
            return int(run_id)
    except Exception as e:
        print(f"ERROR: Failed to store model run: {e}")

    return None


def _store_predictions(
    village_code: str,
    predictions: list[dict[str, Any]],
    model_run_id: int | None,
) -> int:
    """
    Upsert predictions into groundwater_predictions table.
    Returns number of rows stored.
    """
    base = _base_url()
    hdrs = _headers()
    # Upsert on conflict: village_code, year, month
    hdrs["Prefer"] = "return=representation,resolution=merge-duplicates"

    rows_to_insert = []
    for p in predictions:
        rows_to_insert.append({
            "village_code": int(village_code),
            "year": p["year"],
            "month": p["month"],
            "predicted_depth_meters": p["predicted_depth_meters"],
            "confidence_low": p["confidence_low"],
            "confidence_high": p["confidence_high"],
            "std_dev": p["std_dev"],
            "model_run_id": model_run_id,
        })

    stored = 0
    try:
        resp = httpx.post(
            f"{base}/rest/v1/groundwater_predictions",
            json=rows_to_insert,
            headers=hdrs,
            timeout=15,
        )
        resp.raise_for_status()
        result = resp.json()
        stored = len(result) if isinstance(result, list) else 0
        print(f"Stored {stored} predictions for village={village_code}")
    except Exception as e:
        print(f"ERROR: Failed to store predictions: {e}")

    return stored


# ===========================================================================
# 6. FULL PIPELINE  —  Train + Predict + Store
# ===========================================================================

def run_pipeline(
    village_code: str,
    years: list[int] | None = None,
) -> dict[str, Any]:
    """
    Complete pipeline for one village:
      1. Fetch training data from groundwater_levels
      2. Train Random Forest
      3. Predict months 1/5/8/11 for current + next year
      4. Store model run metadata in rf_model_runs
      5. Store predictions in groundwater_predictions
      6. Return full response
    """
    if years is None:
        years = [CURRENT_YEAR, CURRENT_YEAR + 1]

    # Invalidate cache so we always retrain on pipeline run
    with _cache_lock:
        _model_cache.pop(village_code, None)

    predictions, meta = predict_village(village_code, years=years)

    if not predictions:
        return {
            "success": False,
            "village_code": village_code,
            "error": meta.get("error", "Model training failed"),
        }

    # Store model run
    model_run_id = _store_model_run(village_code, meta)

    # Store predictions
    stored_count = _store_predictions(village_code, predictions, model_run_id)

    # Fetch historical data for response
    df = fetch_village_data(village_code)
    historical = []
    if not df.empty:
        for _, row in df.iterrows():
            historical.append({
                "year": int(row["year"]),
                "month": int(row["month"]),
                "depth_meters": float(row["depth_meters"]),
                "type": "actual",
            })

    return {
        "success": True,
        "village_code": village_code,
        "model": {
            "algorithm": "RandomForestRegressor",
            "model_run_id": model_run_id,
            "r_squared_train": meta["r_squared_train"],
            "r_squared_cv": meta["r_squared_cv"],
            "mae": meta["mae"],
            "rmse": meta["rmse"],
            "training_samples": meta["training_samples"],
            "year_range": f"{meta['min_year']}-{meta['max_year']}",
            "n_estimators": meta["n_estimators"],
            "max_depth": meta["max_depth"],
            "feature_importance": meta["feature_importance"],
        },
        "historical_data": historical,
        "predictions": [
            {**p, "type": "predicted"} for p in predictions
        ],
        "predictions_stored": stored_count,
    }


def fetch_stored_predictions(village_code: str) -> list[dict[str, Any]]:
    """Fetch previously stored predictions from groundwater_predictions."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return []

    try:
        resp = httpx.get(
            f"{_base_url()}/rest/v1/groundwater_predictions",
            params={
                "select": "village_code,year,month,predicted_depth_meters,confidence_low,confidence_high,std_dev,model_run_id,created_at",
                "village_code": f"eq.{village_code}",
                "order": "year.asc,month.asc",
            },
            headers=_headers(),
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"ERROR: Failed to fetch predictions: {e}")
        return []


def fetch_model_run(village_code: str) -> dict[str, Any] | None:
    """Fetch the active model run metadata for a village."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None

    try:
        resp = httpx.get(
            f"{_base_url()}/rest/v1/rf_model_runs",
            params={
                "select": "*",
                "village_code": f"eq.{village_code}",
                "is_active": "eq.true",
                "limit": "1",
            },
            headers=_headers(),
            timeout=10,
        )
        resp.raise_for_status()
        rows = resp.json()
        return rows[0] if rows else None
    except Exception as e:
        print(f"ERROR: Failed to fetch model run: {e}")
        return None


def clear_cache(village_code: str | None = None) -> None:
    """Clear in-memory model cache."""
    with _cache_lock:
        if village_code:
            _model_cache.pop(village_code, None)
        else:
            _model_cache.clear()
