"""
Simple Direct Upload - Test with Small Batch
============================================
Upload first 100 records to test the mechanism
"""

import os
import sys
import csv
import httpx
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

SUPABASE_URL = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or ""

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation,resolution=merge-duplicates",
}

CSV_FILE = os.path.join(os.path.dirname(__file__), "..", "groundwater1.csv")


def get_village_lookup() -> dict[str, int]:
    """Simple village lookup."""
    print("Getting village lookup...")
    village_lookup = {}
    
    try:
        resp = httpx.get(
            f"{SUPABASE_URL}/rest/v1/mh_villages",
            params={
                "select": "village_code,village_name",
                "limit": 1000,
            },
            headers=HEADERS,
            timeout=30,
        )
        resp.raise_for_status()
        villages = resp.json()
        
        for v in villages:
            clean_name = v["village_name"].lower().strip()
            village_lookup[clean_name] = int(v["village_code"])
        
        print(f"Loaded {len(village_lookup)} villages")
        return village_lookup
        
    except Exception as e:
        print(f"Error: {e}")
        return {}


def simple_upload():
    """Upload first 100 matching records."""
    print("=" * 60)
    print("Simple Upload Test - First 100 Records")
    print("=" * 60)
    
    # Get village lookup
    lookup = get_village_lookup()
    if not lookup:
        print("No villages loaded!")
        return
    
    # Process CSV
    records_to_upload = []
    
    with open(CSV_FILE, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        
        for i, row in enumerate(reader):
            if i >= 1000:  # Check first 1000 rows
                break
                
            village_name = row["village"].strip().lower()
            if village_name in lookup:
                records_to_upload.append({
                    "village_code": lookup[village_name],
                    "year": int(row["year"]),
                    "month": int(row["month"]),
                    "depth_meters": float(row["depth_meters"]),
                })
                
                if len(records_to_upload) >= 100:  # Upload first 100 matches
                    break
    
    print(f"Found {len(records_to_upload)} records to upload")
    
    if not records_to_upload:
        print("No matching records found!")
        return
    
    # Upload in small batches
    batch_size = 10
    total_uploaded = 0
    
    for i in range(0, len(records_to_upload), batch_size):
        batch = records_to_upload[i:i + batch_size]
        
        print(f"Uploading batch {i//batch_size + 1}: {len(batch)} records...")
        
        try:
            resp = httpx.post(
                f"{SUPABASE_URL}/rest/v1/groundwater_levels",
                json=batch,
                headers=HEADERS,
                timeout=30,
            )
            
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text[:200]}")
            
            if resp.status_code == 201:
                result = resp.json()
                uploaded = len(result) if isinstance(result, list) else 0
                total_uploaded += uploaded
                print(f"  Success: {uploaded} records uploaded")
            else:
                print(f"  Failed: {resp.text[:200]}")
                
        except Exception as e:
            print(f"  Error: {e}")
    
    print(f"\nTotal uploaded: {total_uploaded} records")
    
    # Verify
    print("\nVerifying upload...")
    try:
        resp = httpx.get(
            f"{SUPABASE_URL}/rest/v1/groundwater_levels?select=count",
            headers=HEADERS
        )
        count = resp.json()
        print(f"Total records in database: {count}")
        
        # Show sample
        resp2 = httpx.get(
            f"{SUPABASE_URL}/rest/v1/groundwater_levels?select=*&limit=3",
            headers=HEADERS
        )
        sample = resp2.json()
        print(f"Sample data: {sample}")
        
    except Exception as e:
        print(f"Verification error: {e}")


if __name__ == "__main__":
    simple_upload()
