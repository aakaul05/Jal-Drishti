import json
import re
import time
from pathlib import Path

import pdfplumber


PDF_PATH = Path(
    r"C:/Users/Shubham/AppData/Roaming/Cursor/User/workspaceStorage/f6f28a5caefe77c8350e8c7427857570/pdfs/"
    r"e25878b2-fd35-4b2b-be58-71afaaee2a2f/villageofSpecificState2026_03_26_13_14_42_885.pdf"
)

CODE_4 = re.compile(r"^\d{4}$")
CODE_6 = re.compile(r"^\d{6}$")
ROW_START = re.compile(r"^\d+\s+\d{3,4}\s+")


def extract_rows() -> list[str]:
    rows: list[str] = []
    current: str | None = None

    with pdfplumber.open(str(PDF_PATH)) as pdf:
        for page_idx, page in enumerate(pdf.pages):
            text = page.extract_text() or ""
            for raw_line in text.splitlines():
                line = raw_line.strip()
                if not line:
                    continue

                # Start of a new row: S.No then district code
                if ROW_START.match(line):
                    if current:
                        rows.append(current)
                    current = line
                else:
                    if current:
                        current += " " + line

            # Periodically flush to avoid holding massive temporary state.
            # This keeps memory stable for large PDFs.
            if page_idx % 50 == 49 and current:
                rows.append(current)
                current = None

        if current:
            rows.append(current)

    return rows


def parse_record(rec: str) -> dict | None:
    tokens = rec.split()
    if len(tokens) < 10 or not tokens[0].isdigit():
        return None

    district_code = tokens[1]

    i = 2
    district_name_tokens: list[str] = []
    while i < len(tokens) and not CODE_4.match(tokens[i]):
        district_name_tokens.append(tokens[i])
        i += 1
    if i >= len(tokens):
        return None
    subdistrict_code = tokens[i]
    i += 1

    subdistrict_name_tokens: list[str] = []
    while i < len(tokens) and not CODE_6.match(tokens[i]):
        subdistrict_name_tokens.append(tokens[i])
        i += 1
    if i >= len(tokens):
        return None
    village_code = tokens[i]
    i += 1

    if i >= len(tokens):
        return None
    village_version = tokens[i]
    i += 1

    village_name_tokens: list[str] = []
    while i < len(tokens) and tokens[i] != "Inhabitant":
        village_name_tokens.append(tokens[i])
        i += 1
    if i >= len(tokens):
        return None

    district_name = " ".join(district_name_tokens).strip()
    subdistrict_name = " ".join(subdistrict_name_tokens).strip()
    village_name = " ".join(village_name_tokens).strip()

    if not district_name or not subdistrict_name or not village_name:
        return None

    return {
        "district_code": district_code,
        "district": district_name,
        "subdistrict_code": subdistrict_code,
        "subdistrict": subdistrict_name,
        "village_code": village_code,
        "village_version": village_version,
        "village": village_name,
    }


def main() -> None:
    start = time.time()
    print("Extracting rows from PDF (this may take a while)...")
    rows = extract_rows()
    print("Total candidate rows:", len(rows))

    districts: dict[str, dict] = {}
    parsed_count = 0
    skipped_count = 0

    for idx, rec in enumerate(rows):
        parsed = parse_record(rec)
        if not parsed:
            skipped_count += 1
            continue

        parsed_count += 1
        dcode = parsed["district_code"]
        scode = parsed["subdistrict_code"]
        vcode = parsed["village_code"]
        dname = parsed["district"]
        sname = parsed["subdistrict"]
        vname = parsed["village"]

        if dcode not in districts:
            districts[dcode] = {
                "code": dcode,
                "name": dname,
                "subDistricts": {},
            }

        if scode not in districts[dcode]["subDistricts"]:
            districts[dcode]["subDistricts"][scode] = {
                "code": scode,
                "name": sname,
                "villages": [],
            }

        districts[dcode]["subDistricts"][scode]["villages"].append(
            {"id": vcode, "name": vname}
        )

        if parsed_count % 5000 == 0:
            print(f"Parsed {parsed_count} villages...")

        # Defensive: avoid pathological blowups if something goes wrong.
        if idx % 50000 == 49999:
            print(f"Progress: {idx+1}/{len(rows)}")

    # Convert subDistricts maps to arrays
    district_list = []
    total_villages = 0
    for d in districts.values():
        sub_list = []
        for sd in d["subDistricts"].values():
            sub_list.append(
                {
                    "code": sd["code"],
                    "name": sd["name"],
                    "villages": sd["villages"],
                }
            )
            total_villages += len(sd["villages"])
        district_list.append({"code": d["code"], "name": d["name"], "subDistricts": sub_list})

    out = {
        "state": {"name": "Maharashtra", "code": "27"},
        "districts": district_list,
        "meta": {
            "parsed_villages": total_villages,
            "parsed_count": parsed_count,
            "skipped_count": skipped_count,
        },
    }

    out_path = Path("public/location/maharashtra.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    dur = time.time() - start
    print("Wrote:", out_path)
    print("Duration seconds:", round(dur, 2))


if __name__ == "__main__":
    main()

