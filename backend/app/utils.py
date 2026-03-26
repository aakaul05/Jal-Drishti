from __future__ import annotations

import hashlib


def stable_hash_int(value: str) -> int:
    """
    Stable deterministic hash across runs.

    We use md5 and convert to int to avoid Python's randomized hash().
    """
    digest = hashlib.md5(value.encode("utf-8")).hexdigest()
    return int(digest, 16)


def clamp(n: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, n))

