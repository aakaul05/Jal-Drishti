"""
Jal-Drishti Pipeline: Train → Predict → Upload to Supabase
============================================================
Single script — run once to do everything:
  1. Load CSV data
  2. Train RF models (one per season)
  3. Predict 2024 + 2025 for all villages
  4. Assign risk levels
  5. Save CSVs locally
  6. DELETE old data from Supabase tables
  7. Upload fresh data to Supabase tables

Usage:
  cd backend
  python -m model.run_pipeline
"""

import os
import sys
import math

import httpx
import pandas as pd
from dotenv import load_dotenv

# Load env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

SUPABASE_URL = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or ""

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation,resolution=merge-duplicates",
}

CSV_PATH = os.path.join(os.path.dirname(__file__), "Groundwater_Cleaned_Final.csv")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "output")


def safe_val(v):
    """Convert NaN/None to None for JSON serialization."""
    if v is None:
        return None
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    return v


def delete_table_data(table_name: str):
    """Delete ALL rows from a Supabase table before fresh upload."""
    print(f"  🗑️  Deleting old data from {table_name}...")
    try:
        delete_headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }
        # Delete where id > 0 (matches all rows)
        resp = httpx.delete(
            f"{SUPABASE_URL}/rest/v1/{table_name}",
            params={"id": "gt.0"},
            headers=delete_headers,
            timeout=60,
        )
        resp.raise_for_status()
        print(f"  ✅ Old data deleted from {table_name}")
    except Exception as e:
        print(f"  ⚠️  Delete failed for {table_name}: {e}")
        print(f"      (Table may not exist yet — run prediction_tables.sql first)")


def upload_predictions(df: pd.DataFrame):
    """Upload predictions_by_season data to groundwater_predictions table."""
    print("\n📤 Uploading predictions to Supabase...")

    records = []
    for _, row in df.iterrows():
        records.append({
            "district": str(row["District"]).strip(),
            "block": str(row["Block"]).strip(),
            "village": str(row["Village"]).strip(),
            "season": str(row["Season"]).strip(),
            "actual_2024": safe_val(row.get("Actual_2024")),
            "predicted_2024": safe_val(row["Predicted_2024"]),
            "predicted_2025": safe_val(row["Predicted_2025"]),
            "difference": safe_val(row.get("Difference")),
            "abs_difference": safe_val(row.get("Abs_Difference")),
            "risk_level": str(row["Risk_Level"]).strip(),
        })

    # Delete old data first
    delete_table_data("groundwater_predictions")

    # Upload in batches
    batch_size = 50
    total = 0
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            resp = httpx.post(
                f"{SUPABASE_URL}/rest/v1/groundwater_predictions",
                json=batch,
                headers=HEADERS,
                timeout=30,
            )
            resp.raise_for_status()
            result = resp.json()
            uploaded = len(result) if isinstance(result, list) else 0
            total += uploaded
            if (i // batch_size + 1) % 20 == 0 or i + batch_size >= len(records):
                print(f"  Batch {i // batch_size + 1}: {total}/{len(records)} total uploaded")
        except Exception as e:
            print(f"  ❌ Batch {i // batch_size + 1} failed: {e}")

    print(f"  ✅ Total predictions uploaded: {total}/{len(records)}")


def upload_village_risk(df: pd.DataFrame):
    """Upload village_risk_summary data to groundwater_village_risk table."""
    print("\n📤 Uploading village risk to Supabase...")

    records = []
    for _, row in df.iterrows():
        records.append({
            "district": str(row["District"]).strip(),
            "block": str(row["Block"]).strip(),
            "village": str(row["Village"]).strip(),
            "avg_actual_2024": safe_val(row.get("Avg_Actual_2024")),
            "avg_predicted_2024": safe_val(row.get("Avg_Predicted_2024")),
            "avg_predicted_2025": safe_val(row.get("Avg_Predicted_2025")),
            "avg_difference": safe_val(row.get("Avg_Difference")),
            "avg_abs_difference": safe_val(row.get("Avg_Abs_Difference")),
            "risk_level": str(row.get("Risk_Level", "SAFE")).strip(),
        })

    # Delete old data first
    delete_table_data("groundwater_village_risk")

    # Upload in batches
    batch_size = 50
    total = 0
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        try:
            resp = httpx.post(
                f"{SUPABASE_URL}/rest/v1/groundwater_village_risk",
                json=batch,
                headers=HEADERS,
                timeout=30,
            )
            resp.raise_for_status()
            result = resp.json()
            uploaded = len(result) if isinstance(result, list) else 0
            total += uploaded
            if (i // batch_size + 1) % 20 == 0 or i + batch_size >= len(records):
                print(f"  Batch {i // batch_size + 1}: {total}/{len(records)} total uploaded")
        except Exception as e:
            print(f"  ❌ Batch {i // batch_size + 1} failed: {e}")

    print(f"  ✅ Total village risks uploaded: {total}/{len(records)}")


def main():
    print("=" * 60)
    print("  Jal-Drishti Pipeline: Train → Predict → Upload")
    print("=" * 60)

    # Check env
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("⚠️  SUPABASE_URL or SUPABASE_KEY not set in .env")
        print("   Pipeline will run model but skip Supabase upload.")

    # Import model functions
    from model.predict import load_data, train_and_predict, assign_risk, aggregate_village

    # Step 1: Load CSV
    print("\n📂 Step 1: Loading CSV data...")
    csv_path = os.path.abspath(CSV_PATH)
    print(f"   CSV path: {csv_path}")
    df = load_data(csv_path)

    # Step 2-3: Train RF models + Predict 2024/2025
    print("\n🤖 Step 2-3: Training RF models and predicting...")
    results = train_and_predict(df)
    results["Risk_Level"] = results.apply(assign_risk, axis=1)

    # Step 4: Aggregate
    print("\n📊 Step 4: Aggregating village-level risk...")
    combined, village_agg = aggregate_village(df, results)

    # Step 5: Save CSVs locally
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    predictions_csv = os.path.join(OUTPUT_DIR, "predictions_by_season.csv")
    village_csv = os.path.join(OUTPUT_DIR, "village_risk_summary.csv")

    results.to_csv(predictions_csv, index=False)
    village_agg.to_csv(village_csv, index=False)

    print(f"\n💾 Step 5: CSVs saved:")
    print(f"   - {predictions_csv} ({len(results)} rows)")
    print(f"   - {village_csv} ({len(village_agg)} rows)")

    # Step 6: Delete old + Upload fresh to Supabase
    if SUPABASE_URL and SUPABASE_KEY:
        print("\n☁️  Step 6: Deleting old data & uploading fresh to Supabase...")
        upload_predictions(results)
        upload_village_risk(village_agg)
    else:
        print("\n⏭️  Step 6: Skipped (no Supabase credentials)")

    print("\n" + "=" * 60)
    print("  ✅ PIPELINE COMPLETE")
    print("=" * 60)
    print(f"  Predictions: {len(results)} rows (villages × seasons)")
    print(f"  Village Risk: {len(village_agg)} rows")
    print("=" * 60)


if __name__ == "__main__":
    main()
