from __future__ import annotations

from typing import Any

from .models import Region


SUPABASE_URL: str | None = None
SUPABASE_KEY: str | None = None


def _get_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_KEY or "",
        "Authorization": f"Bearer {SUPABASE_KEY or ''}",
    }


class LocationStore:
    """
    Loads district/subdistrict/village hierarchy from Supabase.
    Falls back to empty data if Supabase is unavailable.
    """

    def __init__(self) -> None:
        self._village_by_id: dict[str, Region] = {}
        self._districts: list[dict[str, Any]] = []
        self._subdistricts_by_district: dict[str, list[dict[str, Any]]] = {}
        self._villages_by_subdistrict: dict[str, list[dict[str, Any]]] = {}
        self._loaded = False

    def load(self) -> None:
        if self._loaded:
            return

        if not SUPABASE_URL or not SUPABASE_KEY:
            print("⚠️  SUPABASE_URL or SUPABASE_KEY not set. Running with empty location data.")
            self._loaded = True
            return

        try:
            import httpx

            base = SUPABASE_URL.rstrip("/")
            headers = _get_headers()

            # 1. Load districts
            resp = httpx.get(
                f"{base}/rest/v1/mh_districts",
                params={"select": "district_code,district_name", "order": "district_name"},
                headers=headers,
                timeout=15,
            )
            resp.raise_for_status()
            districts_raw = resp.json()

            for d in districts_raw:
                dc = str(d["district_code"])
                dn = d["district_name"]
                self._districts.append({"district_code": dc, "district_name": dn})
                if dc not in self._subdistricts_by_district:
                    self._subdistricts_by_district[dc] = []

            # 2. Load sub-districts
            resp = httpx.get(
                f"{base}/rest/v1/mh_subdistricts",
                params={"select": "subdistrict_code,subdistrict_name,district_code,district_name", "order": "subdistrict_name"},
                headers=headers,
                timeout=15,
            )
            resp.raise_for_status()
            subs_raw = resp.json()

            for s in subs_raw:
                sc = str(s["subdistrict_code"])
                dc = str(s["district_code"])
                sub_obj = {
                    "subdistrict_code": sc,
                    "subdistrict_name": s["subdistrict_name"],
                    "district_code": dc,
                    "district_name": s["district_name"],
                    "census_2011_code": "",
                }
                self._subdistricts_by_district.setdefault(dc, []).append(sub_obj)
                if sc not in self._villages_by_subdistrict:
                    self._villages_by_subdistrict[sc] = []

            # 3. Load villages (44,801 rows — paginate)
            offset = 0
            page_size = 10000
            total_villages = 0
            while True:
                print(f"Loading villages batch: offset={offset}, limit={page_size}")
                resp = httpx.get(
                    f"{base}/rest/v1/mh_villages",
                    params={
                        "select": "village_code,village_name,subdistrict_code,district_code",
                        "order": "village_code",
                        "offset": offset,
                        "limit": page_size,
                    },
                    headers=headers,
                    timeout=30,
                )
                resp.raise_for_status()
                villages_raw = resp.json()
                
                batch_size = len(villages_raw)
                total_villages += batch_size
                print(f"Got {batch_size} villages (total: {total_villages})")

                if not villages_raw or batch_size < page_size:
                    break

                offset += page_size  # Missing offset increment!

                for v in villages_raw:
                    vid = str(v["village_code"])
                    sc = str(v["subdistrict_code"])
                    dc = str(v["district_code"])

                    # Find parent names
                    sub_name = ""
                    dist_name = ""
                    for s in self._subdistricts_by_district.get(dc, []):
                        if s["subdistrict_code"] == sc:
                            sub_name = s["subdistrict_name"]
                            dist_name = s["district_name"]
                            break

                    village_obj = {
                        "village_code": vid,
                        "village_name": v["village_name"],
                        "subdistrict_code": sc,
                        "district_code": dc,
                        "mh_subdistricts": {
                            "subdistrict_name": sub_name,
                            "district_name": dist_name,
                        },
                    }
                    self._villages_by_subdistrict.setdefault(sc, []).append(village_obj)
                    self._village_by_id[vid] = Region(
                        id=vid,
                        name=v["village_name"],
                        village=v["village_name"],
                        subDistrict=sub_name,
                        district=dist_name,
                        state="Maharashtra",
                    )

                offset += page_size
                if len(villages_raw) < page_size:
                    break

            print(f"✅ Loaded from Supabase: {len(self._districts)} districts, "
                  f"{sum(len(v) for v in self._subdistricts_by_district.values())} sub-districts, "
                  f"{len(self._village_by_id)} villages")

        except Exception as e:
            print(f"❌ Supabase load failed: {e}")
            print("   Backend will run with empty location data.")

        self._loaded = True

    def get_region_by_id(self, region_id: str) -> Region:
        self.load()
        if region_id in self._village_by_id:
            return self._village_by_id[region_id]
        return Region(id=region_id)

    def get_districts_with_hierarchy(self) -> list[dict[str, Any]]:
        self.load()
        districts: list[dict[str, Any]] = []
        for d in self._districts:
            districts.append(
                {
                    "district_code": d["district_code"],
                    "district_name": d["district_name"],
                    "mh_subdistricts": self._subdistricts_by_district.get(d["district_code"], []),
                }
            )
        return districts

    def get_subdistricts(self, district_code: str) -> list[dict[str, Any]]:
        self.load()
        return self._subdistricts_by_district.get(district_code, [])

    def get_villages(self, subdistrict_code: str) -> list[dict[str, Any]]:
        self.load()
        return self._villages_by_subdistrict.get(subdistrict_code, [])
