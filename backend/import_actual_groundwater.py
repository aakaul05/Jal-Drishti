"""
Import Actual Groundwater Data from CSV
========================================
Matches village names to village codes and inserts into groundwater_levels table
"""

import os
import sys
import csv
import httpx
from dotenv import load_dotenv
from tqdm import tqdm
import re
from difflib import SequenceMatcher

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
BATCH_SIZE = 2000  # Increased from 500 for faster uploads


def fetch_village_lookup() -> dict[str, int]:
    """Create village name -> village_code lookup table from Supabase."""
    print("Fetching village lookup table from Supabase...")
    
    # Use pagination directly to avoid Supabase limits
    return fetch_village_lookup_paginated()


def fetch_village_lookup_paginated() -> dict[str, int]:
    """Fallback pagination method."""
    print("  Using pagination fallback...")
    village_lookup = {}
    offset = 0
    limit = 10000
    
    while True:
        try:
            resp = httpx.get(
                f"{SUPABASE_URL}/rest/v1/mh_villages",
                params={
                    "select": "village_code,village_name",
                    "order": "village_code",
                    "offset": offset,
                    "limit": limit,
                },
                headers=HEADERS,
                timeout=30,
            )
            resp.raise_for_status()
            villages = resp.json()
            
            if not villages:
                break
                
            for v in villages:
                clean_name = clean_village_name(v["village_name"])
                village_lookup[clean_name] = int(v["village_code"])
            
            offset += limit
            if len(villages) < limit:
                break
                
        except Exception as e:
            print(f"ERROR: Failed to fetch villages: {e}")
            break
    
    print(f"Loaded {len(village_lookup):,} villages into lookup table")
    return village_lookup


def clean_village_name(name: str) -> str:
    """Clean village name for consistent matching."""
    if not name:
        return ""
    
    # Remove common suffixes and prefixes
    name = re.sub(r'\s*(Bk|Kh|BK|bu|khi)\s*$', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s*\([^)]*\)\s*', '', name)  # Remove parentheses content
    name = re.sub(r'\s*\[[^\]]*\]\s*', '', name)  # Remove brackets content
    
    # Clean whitespace and convert to lowercase
    return name.lower().strip()


def fuzzy_match_village(village_name: str, lookup: dict[str, int]) -> int | None:
    """Try fuzzy matching if exact match fails."""
    clean_name = clean_village_name(village_name)
    
    # First try exact match
    if clean_name in lookup:
        return lookup[clean_name]
    
    # Try fuzzy matching
    best_match = None
    best_ratio = 0.0
    
    for lookup_name, code in lookup.items():
        ratio = SequenceMatcher(None, clean_name, lookup_name).ratio()
        if ratio > best_ratio and ratio > 0.8:  # 80% similarity threshold
            best_ratio = ratio
            best_match = code
    
    return best_match


def process_csv_and_upload(lookup: dict[str, int]) -> dict:
    """Process CSV file and upload to Supabase."""
    print(f"Processing CSV file: {CSV_FILE}")
    
    results = {
        "total_rows": 0,
        "matched": 0,
        "unmatched": 0,
        "uploaded": 0,
        "unmatched_villages": set(),
        "errors": []
    }
    
    batch = []
    
    with open(CSV_FILE, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        rows = list(reader)  # Load all rows at once for faster processing
        
        print(f"Processing {len(rows)} CSV rows...")
        
        for i, row in enumerate(rows):
            if i % 5000 == 0:
                print(f"  Processed {i:,}/{len(rows):,} rows ({i/len(rows)*100:.1f}%)")
            
            results["total_rows"] += 1
            
            village_name = row["village"].strip()
            year = int(row["year"])
            month = int(row["month"])
            depth = float(row["depth_meters"])
            
            # Match village name to code
            village_code = fuzzy_match_village(village_name, lookup)
            
            if village_code:
                results["matched"] += 1
                
                batch.append({
                    "village_code": village_code,
                    "year": year,
                    "month": month,
                    "depth_meters": depth,
                })
                
                # Upload in batches
                if len(batch) >= BATCH_SIZE:
                    uploaded = upload_batch(batch)
                    results["uploaded"] += uploaded
                    batch = []
            else:
                results["unmatched"] += 1
                results["unmatched_villages"].add(village_name)
        
        # Upload remaining batch
        if batch:
            uploaded = upload_batch(batch)
            results["uploaded"] += uploaded
    
    return results


def upload_batch(batch: list[dict]) -> int:
    """Upload batch of records to Supabase."""
    try:
        resp = httpx.post(
            f"{SUPABASE_URL}/rest/v1/groundwater_levels",
            json=batch,
            headers=HEADERS,
            timeout=30,
        )
        resp.raise_for_status()
        result = resp.json()
        uploaded = len(result) if isinstance(result, list) else 0
        print(f"  Batch upload: {uploaded}/{len(batch)} records")
        return uploaded
    except httpx.HTTPStatusError as e:
        print(f"  Upload ERROR: HTTP {e.response.status_code}")
        print(f"  Response: {e.response.text[:200]}")
        if e.response.status_code == 409:
            return len(batch)  # Duplicate, count as success
        return 0
    except Exception as e:
        print(f"  Upload ERROR: {e}")
        return 0


def main():
    print("=" * 80)
    print("Jal-Drishti: Import Actual Groundwater Data")
    print("=" * 80)
    print(f"CSV File: {CSV_FILE}")
    print(f"Supabase URL: {SUPABASE_URL}")
    print()
    
    # Step 1: Get village lookup
    lookup = fetch_village_lookup()
    
    if not lookup:
        print("ERROR: Could not load village lookup table")
        return
    
    # Step 2: Process CSV and upload
    results = process_csv_and_upload(lookup)
    
    # Step 3: Report results
    print()
    print("=" * 80)
    print("IMPORT RESULTS")
    print("=" * 80)
    print(f"Total CSV rows: {results['total_rows']:,}")
    print(f"Villages matched: {results['matched']:,}")
    print(f"Villages unmatched: {results['unmatched']:,}")
    print(f"Records uploaded: {results['uploaded']:,}")
    print()
    
    if results['unmatched_villages']:
        print(f"Unmatched villages (first 20):")
        for village in list(results['unmatched_villages'])[:20]:
            print(f"  - {village}")
        if len(results['unmatched_villages']) > 20:
            print(f"  ... and {len(results['unmatched_villages']) - 20} more")
    
    print("=" * 80)


if __name__ == "__main__":
    main()
