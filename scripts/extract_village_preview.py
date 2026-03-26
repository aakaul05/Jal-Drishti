import re
from pathlib import Path

import pdfplumber


PDF_PATH = Path(
    r"C:/Users/Shubham/AppData/Roaming/Cursor/User/workspaceStorage/f6f28a5caefe77c8350e8c7427857570/pdfs/"
    r"e25878b2-fd35-4b2b-be58-71afaaee2a2f/villageofSpecificState2026_03_26_13_14_42_885.pdf"
)

CODE_4 = re.compile(r"^\d{4}$")
CODE_6 = re.compile(r"^\d{6}$")
ROW_START = re.compile(r"^\d+\s+\d{3,4}\s+")


def extract_preview(max_pages: int = 2) -> list[str]:
    records: list[str] = []
    current: str | None = None

    with pdfplumber.open(str(PDF_PATH)) as pdf:
        for page_idx in range(min(max_pages, len(pdf.pages))):
            page = pdf.pages[page_idx]
            text = page.extract_text() or ""
            for raw_line in text.splitlines():
                line = raw_line.strip()
                if not line:
                    continue

                # Start of a new row: S.No then district code
                if ROW_START.match(line):
                    if current:
                        records.append(current)
                    current = line
                else:
                    if current:
                        current += " " + line

        if current:
            records.append(current)

    return records


def parse_record(rec: str) -> dict | None:
    tokens = rec.split()
    if len(tokens) < 10:
        return None
    if not tokens[0].isdigit():
        return None

    # tokens: [S.No, DistrictCode, DistrictName..., SubdistrictCode, SubdistrictName..., VillageCode, VillageVersion, VillageName..., Inhabitant, ...]
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
    # The PDF sample shows 'Inhabitant' as the status token.
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
    records = extract_preview(max_pages=2)
    print("candidate records:", len(records))

    parsed: list[dict] = []
    for rec in records[:4000]:
        item = parse_record(rec)
        if item:
            parsed.append(item)

    print("parsed:", len(parsed))
    print("first 10:")
    for row in parsed[:10]:
        print(row)


if __name__ == "__main__":
    main()

