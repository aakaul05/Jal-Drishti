"""
Seed groundwater_levels with 10 years of realistic data.
Inserts data for months 1, 5, 8, 11 for years 2016-2025.
Picks a sample of villages from mh_villages table.
"""

import os
import sys
import random
import math
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

YEARS = list(range(2016, 2026))        # 10 years: 2016-2025
MONTHS = [1, 5, 8, 11]                 # 4 readings per year
SAMPLE_SIZE = 50                        # number of villages to seed


def fetch_sample_villages(n: int) -> list[int]:
    """Fetch N random village_codes from mh_villages."""
    # Get total count first
    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/mh_villages",
        params={"select": "village_code", "limit": 1000, "order": "village_code.asc"},
        headers=HEADERS,
        timeout=30,
    )
    resp.raise_for_status()
    all_villages = resp.json()
    codes = [int(v["village_code"]) for v in all_villages]

    # Pick a sample
    if len(codes) > n:
        random.seed(42)
        codes = random.sample(codes, n)

    return sorted(codes)


def generate_depth_series(village_code: int) -> list[dict]:
    """
    Generate realistic 10-year groundwater depth data for one village.

    Characteristics:
    - Base depth between 3-15 meters (varies by village)
    - Annual trend: slight decline (0.1-0.5 m/year) simulating over-extraction
    - Seasonal pattern:
        Month 1 (Jan):  moderate depth (post-monsoon recovery fading)
        Month 5 (May):  deepest (pre-monsoon, dry season peak)
        Month 8 (Aug):  shallowest (monsoon recharge happening)
        Month 11 (Nov): moderate (post-monsoon, recharged)
    - Random noise for realism
    """
    rng = random.Random(village_code)

    # Village-specific parameters
    base_depth = rng.uniform(3.0, 15.0)          # starting depth in meters
    annual_decline = rng.uniform(0.05, 0.4)       # meters per year decline
    noise_scale = rng.uniform(0.3, 1.2)           # noise amplitude

    # Seasonal offsets (relative to annual average)
    seasonal = {
        1:  +1.0,    # Jan: moderately deep (winter, limited recharge)
        5:  +3.5,    # May: deepest (peak dry season)
        8:  -2.0,    # Aug: shallowest (peak monsoon recharge)
        11: -0.5,    # Nov: slightly above average (post-monsoon)
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


def insert_data(rows: list[dict]) -> int:
    """Insert rows into groundwater_levels (upsert)."""
    batch_size = 500
    total = 0

    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        try:
            resp = httpx.post(
                f"{SUPABASE_URL}/rest/v1/groundwater_levels",
                json=batch,
                headers=HEADERS,
                timeout=30,
            )
            resp.raise_for_status()
            result = resp.json()
            count = len(result) if isinstance(result, list) else 0
            total += count
            print(f"  Inserted batch {i // batch_size + 1}: {count} rows")
        except Exception as e:
            print(f"  ERROR batch {i // batch_size + 1}: {e}")
            # Print response body for debugging
            try:
                print(f"  Response: {resp.text[:500]}")
            except:
                pass

    return total


def main():
    print("=" * 60)
    print("Jal-Drishti: Seed groundwater_levels")
    print("=" * 60)
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Years: {YEARS[0]}-{YEARS[-1]} ({len(YEARS)} years)")
    print(f"Months: {MONTHS}")
    print(f"Villages to seed: {SAMPLE_SIZE}")
    print()

    # Step 1: Get sample villages
    print("Fetching village codes from mh_villages...")
    village_codes = fetch_sample_villages(SAMPLE_SIZE)
    print(f"Got {len(village_codes)} villages")
    print(f"Sample: {village_codes[:5]}...")
    print()

    # Step 2: Generate data
    print("Generating depth data...")
    all_rows = []
    for vc in village_codes:
        rows = generate_depth_series(vc)
        all_rows.extend(rows)
    print(f"Generated {len(all_rows)} total rows ({len(village_codes)} villages x {len(YEARS)} years x {len(MONTHS)} months)")
    print()

    # Step 3: Insert
    print("Inserting into groundwater_levels...")
    inserted = insert_data(all_rows)
    print()
    print(f"DONE — {inserted} rows inserted into groundwater_levels")
    print()

    # Step 4: Verify
    print("Verifying...")
    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/groundwater_levels",
        params={"select": "village_code,year,month,depth_meters", "limit": "5", "order": "village_code.asc,year.asc,month.asc"},
        headers=HEADERS,
        timeout=15,
    )
    for row in resp.json():
        print(f"  village={row['village_code']} year={row['year']} month={row['month']} depth={row['depth_meters']}m")


if __name__ == "__main__":
    main()
