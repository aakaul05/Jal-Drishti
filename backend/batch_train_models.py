"""
Batch Train RF Model for All Villages with Groundwater Data
========================================================
Automatically finds villages with training data and trains RF models
"""

import os
import sys
import httpx
import time
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

API_BASE_URL = "http://localhost:8000"
BATCH_DELAY = 2  # Seconds between requests to avoid overwhelming


def get_villages_with_data() -> list[str]:
    """Get list of villages that have groundwater training data."""
    print("Finding villages with training data...")
    
    try:
        # Get distinct village codes from groundwater_levels
        resp = httpx.get(
            f"{API_BASE_URL}/api/debug/villages-with-data",
            timeout=30
        )
        if resp.status_code == 200:
            villages = resp.json()
            print(f"Found {len(villages)} villages with training data")
            return villages
    except Exception as e:
        print(f"Could not auto-detect villages: {e}")
    
    # Fallback: try common village codes from our import
    sample_villages = [
        "525008", "525027", "525029", "525032", "525034",
        "557293", "557238", "557249", "556254", "944088"
    ]
    print(f"Using sample village list: {len(sample_villages)} villages")
    return sample_villages


def train_single_village(village_code: str) -> dict:
    """Train RF model for a single village."""
    try:
        resp = httpx.post(
            f"{API_BASE_URL}/api/rf/pipeline",
            json={"village_code": village_code},
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        if resp.status_code == 200:
            result = resp.json()
            return {
                "village_code": village_code,
                "success": result.get("success", False),
                "model_run_id": result.get("model", {}).get("model_run_id"),
                "r_squared": result.get("model", {}).get("r_squared_train"),
                "mae": result.get("model", {}).get("mae"),
                "predictions": len(result.get("predictions", [])),
                "error": None
            }
        else:
            return {
                "village_code": village_code,
                "success": False,
                "error": f"HTTP {resp.status_code}: {resp.text[:100]}"
            }
            
    except Exception as e:
        return {
            "village_code": village_code,
            "success": False,
            "error": str(e)
        }


def batch_train_all_villages():
    """Train RF model for all villages with data."""
    print("=" * 80)
    print("Jal-Drishti: Batch RF Model Training")
    print("=" * 80)
    
    # Get villages with training data
    villages = get_villages_with_data()
    
    if not villages:
        print("No villages found with training data!")
        return
    
    print(f"Starting batch training for {len(villages)} villages...")
    print()
    
    results = {
        "total": len(villages),
        "successful": 0,
        "failed": 0,
        "details": []
    }
    
    # Train each village
    for i, village_code in enumerate(tqdm(villages, desc="Training Models")):
        print(f"\n[{i+1}/{len(villages)}] Training village {village_code}...")
        
        result = train_single_village(village_code)
        results["details"].append(result)
        
        if result["success"]:
            results["successful"] += 1
            print(f"  SUCCESS: R²={result['r_squared']:.3f}, MAE={result['mae']:.3f}, {result['predictions']} predictions")
        else:
            results["failed"] += 1
            print(f"  FAILED: {result['error']}")
        
        # Small delay to avoid overwhelming the API
        if i < len(villages) - 1:
            time.sleep(BATCH_DELAY)
    
    # Print summary
    print()
    print("=" * 80)
    print("BATCH TRAINING RESULTS")
    print("=" * 80)
    print(f"Total villages: {results['total']}")
    print(f"Successful: {results['successful']} ({results['successful']/results['total']*100:.1f}%)")
    print(f"Failed: {results['failed']} ({results['failed']/results['total']*100:.1f}%)")
    print()
    
    if results["successful"] > 0:
        print("Successful models:")
        for detail in results["details"]:
            if detail["success"]:
                print(f"  Village {detail['village_code']}: R²={detail['r_squared']:.3f}, MAE={detail['mae']:.3f}m")
    
    if results["failed"] > 0:
        print("\nFailed models:")
        for detail in results["details"]:
            if not detail["success"]:
                print(f"  Village {detail['village_code']}: {detail['error']}")
    
    print("=" * 80)
    print(f"Batch training completed! {results['successful']} models ready for use.")
    print("=" * 80)


if __name__ == "__main__":
    batch_train_all_villages()
