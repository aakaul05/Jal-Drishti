#!/usr/bin/env python3
"""
Test RF Pipeline with Seeded Data
=================================
Tests the Random Forest pipeline using the seeded groundwater data.
"""

import os
import sys
import json
from pathlib import Path

# Add backend app to path
backend_path = Path(__file__).parent / "app"
sys.path.insert(0, str(backend_path))

import rf_model

def main():
    """Test RF pipeline with seeded data."""
    
    # Set Supabase credentials from environment
    rf_model.SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    rf_model.SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
    
    if not rf_model.SUPABASE_URL or not rf_model.SUPABASE_KEY:
        print("ERROR: Supabase credentials not found in environment")
        print("Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables")
        return 1
    
    print("=== RF Pipeline Test ===")
    print(f"Supabase URL: {rf_model.SUPABASE_URL}")
    
    # Test with a few village codes from the seeded data
    test_villages = ["500001", "500002", "500003"]  # First 3 villages from seed data
    
    for village_code in test_villages:
        print(f"\n--- Testing Village: {village_code} ---")
        
        # 1. Fetch training data
        print("Fetching training data...")
        df = rf_model.fetch_village_data(village_code)
        if df.empty:
            print(f"No data found for village {village_code}")
            continue
            
        print(f"Found {len(df)} training records")
        print(f"Year range: {df['year'].min()} - {df['year'].max()}")
        print(f"Depth range: {df['depth_meters'].min():.2f} - {df['depth_meters'].max():.2f} meters")
        
        # 2. Train model
        print("Training Random Forest model...")
        model, meta = rf_model.train_model(village_code)
        if model is None:
            print(f"Failed to train model for village {village_code}")
            continue
            
        print(f"Model trained successfully")
        print(f"R² (train): {meta['r2_train']:.4f}")
        print(f"MAE: {meta['mae']:.4f}")
        print(f"RMSE: {meta['rmse']:.4f}")
        
        # 3. Make predictions
        print("Making predictions...")
        predictions, _ = rf_model.predict_village(village_code, years=[2026, 2027])
        print(f"Generated {len(predictions)} predictions")
        
        for pred in predictions[:4]:  # Show first 4 predictions
            print(f"  {pred['year']}-{pred['month']:02d}: {pred['predicted_depth_meters']:.2f}m "
                  f"(±{pred['std_dev']:.2f})")
        
        # 4. Run full pipeline (including storage)
        print("Running full pipeline...")
        try:
            result = rf_model.run_pipeline(village_code, years=[2026, 2027])
            if result['success']:
                print(f"Pipeline completed successfully!")
                print(f"Stored {result['predictions_stored']} predictions")
                print(f"Model run ID: {result['model_run']['id']}")
            else:
                print(f"Pipeline failed: {result.get('error', 'Unknown error')}")
        except Exception as e:
            print(f"Pipeline error: {e}")
            # This might fail if tables don't exist yet
    
    print("\n=== Test Complete ===")
    return 0

if __name__ == "__main__":
    exit(main())
