"""Test the FULL pipeline: Train + Predict + Store in Supabase."""
import httpx
import json

BASE = "http://localhost:8000"

# Test full pipeline for village 525008
print("=== FULL RF PIPELINE ===")
print("Training RF model + predicting 2026/2027 + storing in Supabase...")
print()

r = httpx.post(
    f"{BASE}/api/rf/pipeline",
    json={"village_code": "525008"},
    timeout=60,
)
result = r.json()
print(f"Status: {r.status_code}")
print(f"Success: {result.get('success')}")
print()

if result.get("success"):
    model = result.get("model", {})
    print("--- Model Metrics ---")
    print(f"  Algorithm:       {model.get('algorithm')}")
    print(f"  Model Run ID:    {model.get('model_run_id')}")
    print(f"  R2 (train):      {model.get('r_squared_train')}")
    print(f"  R2 (cv):         {model.get('r_squared_cv')}")
    print(f"  MAE:             {model.get('mae')}m")
    print(f"  RMSE:            {model.get('rmse')}m")
    print(f"  Training Range:  {model.get('year_range')}")
    print(f"  Samples:         {model.get('training_samples')}")
    print()

    print("--- Historical Data (first 4) ---")
    for h in result.get("historical_data", [])[:4]:
        print(f"  year={h['year']} month={h['month']} depth={h['depth_meters']}m [{h['type']}]")
    print()

    print("--- Predictions (2026 + 2027) ---")
    for p in result.get("predictions", []):
        print(f"  year={p['year']} month={p['month']} depth={p['predicted_depth_meters']}m  CI=[{p['confidence_low']}, {p['confidence_high']}] [{p['type']}]")
    print()

    print(f"Predictions stored in Supabase: {result.get('predictions_stored')}")
else:
    print(f"ERROR: {result.get('error')}")
    print(json.dumps(result, indent=2))
