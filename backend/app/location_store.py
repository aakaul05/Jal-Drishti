from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .models import Region


class LocationStore:
    """
    Loads your district/subdistrict/village hierarchy from a JSON file.
    Frontend can request region.id from that JSON.
    """

    def __init__(self, json_path: str) -> None:
        self.json_path = Path(json_path)
        self._village_by_id: dict[str, Region] = {}
        self._districts: list[dict[str, Any]] = []
        self._subdistricts_by_district: dict[str, list[dict[str, Any]]] = {}
        self._villages_by_subdistrict: dict[str, list[dict[str, Any]]] = {}
        self._loaded = False

    def load(self) -> None:
        if self._loaded:
            return
        if not self.json_path.exists():
            # It's ok to run without the JSON during early development.
            self._loaded = True
            return

        data: dict[str, Any] = json.loads(self.json_path.read_text(encoding="utf-8"))

        for d in data.get("districts", []):
            district_code = str(d.get("code", ""))
            district_name = str(d.get("name", ""))
            district_obj = {
                "district_code": district_code,
                "district_name": district_name,
            }
            self._districts.append(district_obj)
            self._subdistricts_by_district[district_code] = []
            for sd in d.get("subDistricts", []):
                subdistrict_code = str(sd.get("code", ""))
                subdistrict_name = str(sd.get("name", ""))
                subdistrict_obj = {
                    "subdistrict_code": subdistrict_code,
                    "subdistrict_name": subdistrict_name,
                    "district_code": district_code,
                    "district_name": district_name,
                    "census_2011_code": str(sd.get("census_2011_code", "")),
                }
                self._subdistricts_by_district[district_code].append(subdistrict_obj)
                self._villages_by_subdistrict[subdistrict_code] = []
                for v in sd.get("villages", []):
                    vid = str(v.get("id", ""))
                    if not vid:
                        continue
                    village_name = str(v.get("name", ""))
                    village_obj = {
                        "village_code": vid,
                        "village_name": village_name,
                        "subdistrict_code": subdistrict_code,
                        "district_code": district_code,
                        "mh_subdistricts": {
                            "subdistrict_name": subdistrict_name,
                            "district_name": district_name,
                        },
                    }
                    self._villages_by_subdistrict[subdistrict_code].append(village_obj)
                    self._village_by_id[vid] = Region(
                        id=vid,
                        name=village_name,
                        village=village_name,
                        subDistrict=subdistrict_name,
                        district=district_name,
                        state="Maharashtra",
                    )

        self._loaded = True

    def get_region_by_id(self, region_id: str) -> Region:
        self.load()
        if region_id in self._village_by_id:
            return self._village_by_id[region_id]
        # Fallback: keep backend stable even if the frontend is using mock ids.
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


