"""
Upload Groundwater_Cleaned_Final.csv
=====================================
Handles malformed CSV with proper parsing
"""

import csv
import os
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

CSV_FILE = os.path.join(os.path.dirname(__file__), "..", "\backend\Groundwater_Cleaned_Final.csv")


def parse_csv():
    """Parse CSV - simple format: District,Block,Village,40 depth values."""
    print(f"Parsing {CSV_FILE}...")
    
    data = []
    years = ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023']
    months = ['jan', 'may', 'aug', 'nov']
    
    with open(CSV_FILE, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.reader(f)
        
        for i, row in enumerate(reader):
            # Skip if less than 43 columns (District, Block, Village + 40 depths)
            if len(row) < 43:
                if i < 10:  # Only print for first few rows
                    print(f"  Skipping row {i+1}: only {len(row)} fields")
                continue
            
            try:
                district = row[0].strip()
                block = row[1].strip()
                village = row[2].strip()
                
                # Skip empty or header rows
                if not district or not village or district.lower() in ['district', '']:
                    continue
                
                db_row = {
                    'district': district,
                    'block': block,
                    'village': village,
                }
                
                # Map 40 depth values (columns 3-42)
                col_idx = 3
                for year in years:
                    for month in months:
                        db_col = f"y{year}_{month}"
                        value = row[col_idx].strip() if col_idx < len(row) else ''
                        
                        if value and value != '':
                            try:
                                db_row[db_col] = float(value)
                            except (ValueError, TypeError):
                                db_row[db_col] = None
                        else:
                            db_row[db_col] = None
                        
                        col_idx += 1
                
                data.append(db_row)
                
                if (len(data)) % 100 == 0:
                    print(f"  Parsed {len(data)} villages...")
                    
            except Exception as e:
                if i < 50:  # Only print errors for first 50 rows
                    print(f"  Error row {i+1}: {e}")
                continue
    
    print(f"\\n✅ Total valid villages: {len(data)}")
    return data


def upload_data(data):
    """Upload data to Supabase in batches."""
    print("\nUploading to Supabase...")
    
    batch_size = 50
    total_uploaded = 0
    
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        
        try:
            resp = httpx.post(
                f"{SUPABASE_URL}/rest/v1/groundwater_cleaned_final",
                json=batch,
                headers=HEADERS,
                timeout=30,
            )
            resp.raise_for_status()
            result = resp.json()
            uploaded = len(result) if isinstance(result, list) else 0
            total_uploaded += uploaded
            print(f"  Batch {i//batch_size + 1}: {uploaded}/{len(batch)} uploaded")
            
        except Exception as e:
            print(f"  Batch {i//batch_size + 1} failed: {e}")
    
    print(f"\n✅ Total uploaded: {total_uploaded} villages")


def main():
    print("=" * 60)
    print("Upload Groundwater Cleaned Final CSV")
    print("=" * 60)
    
    data = parse_csv()
    if data:
        upload_data(data)
    else:
        print("No data to upload!")


if __name__ == "__main__":
    main()
