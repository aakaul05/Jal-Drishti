"""
Seed ALL villages with groundwater data (44,801 villages).
This will create realistic groundwater data for every village in Maharashtra.
"""

import os
import sys
import random
import math
import httpx
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

SUPABASE_URL = (os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL") or "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY") or ""

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation,resolution=merge-duplicates",
}

YEARS = list(range(2016, 2026))        # 10 years: 2016-2025
MONTHS = [1, 5, 8, 11]                 # 4 readings per year
BATCH_SIZE = 1000                       # Process villages in batches


def fetch_all_village_codes() -> list[int]:
    """Fetch ALL village codes from mh_villages table."""
    print("Fetching ALL village codes from Supabase...")
    
    all_codes = []
    offset = 0
    limit = 5000
    
    while True:
        try:
            resp = httpx.get(
                f"{SUPABASE_URL}/rest/v1/mh_villages",
                params={
                    "select": "village_code",
                    "limit": limit,
                    "offset": offset,
                    "order": "village_code.asc"
                },
                headers=HEADERS,
                timeout=30,
            )
            resp.raise_for_status()
            batch = resp.json()
            
            if not batch:
                break
                
            codes = [int(v["village_code"]) for v in batch]
            all_codes.extend(codes)
            
            print(f"  Fetched {len(codes)} villages (total: {len(all_codes)})")
            offset += limit
            
            if len(batch) < limit:
                break
                
        except Exception as e:
            print(f"ERROR: Failed to fetch villages: {e}")
            break
    
    print(f"Total villages fetched: {len(all_codes)}")
    return sorted(all_codes)


def generate_depth_series(village_code: int) -> list[dict]:
    """
    Generate realistic 10-year groundwater depth data for one village.
    """
    rng = random.Random(village_code)

    # Village-specific parameters based on village_code for variety
    base_depth = 3.0 + (village_code % 12) + (rng.uniform(0, 5))  # 3-20 meters range
    annual_decline = 0.05 + (village_code % 8) * 0.05  # 0.05-0.45 m/year
    noise_scale = 0.3 + (village_code % 5) * 0.2  # 0.3-1.1 noise amplitude

    # Seasonal offsets
    seasonal = {
        1:  +1.0,    # Jan: moderately deep
        5:  +3.5,    # May: deepest (dry season)
        8:  -2.0,    # Aug: shallowest (monsoon)
        11: -0.5,    # Nov: post-monsoon
    }

    rows = []
    for year in YEARS:
        year_offset = year - YEARS[0]
        for month in MONTHS:
            depth = (
                base_depth
                + annual_decline * year_offset
                + seasonal[month]
                + rng.gauss(0, noise_scale)
            )
            # Clamp to reasonable range
            depth = max(0.5, round(depth, 2))

            rows.append({
                "village_code": village_code,
                "year": year,
                "month": month,
                "depth_meters": depth,
            })

    return rows


def insert_data_batch(rows: list[dict]) -> int:
    """Insert rows into groundwater_levels table."""
    try:
        resp = httpx.post(
            f"{SUPABASE_URL}/rest/v1/groundwater_levels",
            json=rows,
            headers=HEADERS,
            timeout=30,
        )
        resp.raise_for_status()
        result = resp.json()
        count = len(result) if isinstance(result, list) else 0
        return count
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 409:
            # Conflict - data already exists, count as success
            return len(rows)
        print(f"ERROR: HTTP {e.response.status_code}: {e.response.text[:200]}")
        return 0
    except Exception as e:
        print(f"ERROR: Failed to insert batch: {e}")
        return 0


def main():
    print("=" * 80)
    print("Jal-Drishti: Seed ALL villages with groundwater data")
    print("=" * 80)
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Years: {YEARS[0]}-{YEARS[-1]} ({len(YEARS)} years)")
    print(f"Months: {MONTHS}")
    print(f"Records per village: {len(YEARS) * len(MONTHS)}")
    print()

    # Step 1: Get ALL village codes
    village_codes = fetch_all_village_codes()
    total_villages = len(village_codes)
    total_records = total_villages * len(YEARS) * len(MONTHS)
    
    print(f"Found {total_villages:,} villages in database")
    print(f"Preparing to generate {total_records:,} total records...")
    print()

    # Step 2: Process ALL villages in larger batches
    total_inserted = 0
    batch_count = 0
    
    for i in range(0, total_villages, BATCH_SIZE):
        batch_villages = village_codes[i:i + BATCH_SIZE]
        batch_count += 1
        
        print(f"Processing batch {batch_count}: villages {i+1}-{min(i+BATCH_SIZE, total_villages)} of {total_villages}")
        
        # Generate all data for this batch
        all_rows = []
        for village_code in batch_villages:
            rows = generate_depth_series(village_code)
            all_rows.extend(rows)
        
        # Insert in smaller chunks to avoid timeouts
        chunk_size = 500
        for j in range(0, len(all_rows), chunk_size):
            chunk = all_rows[j:j + chunk_size]
            inserted = insert_data_batch(chunk)
            total_inserted += inserted
            
            # Progress indicator
            progress = ((i + len(batch_villages)) / total_villages) * 100
            print(f"  Inserted {inserted}/{len(chunk)} records ({total_inserted:,}/{total_records:,} total, {progress:.1f}%)")
        
        print(f"  Batch {batch_count} completed")
        print()
        
        # Stop after processing all villages
        if i + BATCH_SIZE >= total_villages:
            break

    print("=" * 80)
    print(f"COMPLETED!")
    print(f"Villages processed: {total_villages:,}")
    print(f"Records inserted: {total_inserted:,}/{total_records:,}")
    print("=" * 80)


if __name__ == "__main__":
    main()
