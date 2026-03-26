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
            for sd in d.get("subDistricts", []):
                subdistrict_name = str(sd.get("name", ""))
                for v in sd.get("villages", []):
                    vid = str(v.get("id", ""))
                    if not vid:
                        continue
                    village_name = str(v.get("name", ""))
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


