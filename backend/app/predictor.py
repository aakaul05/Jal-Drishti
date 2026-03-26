from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple

import numpy as np
import pandas as pd

from .location_store import LocationStore
from .models import (
    PredictionResultAnnual,
    RiskLevel,
    WaterDataPoint,
)
from .utils import stable_hash_int


CURRENT_YEAR_DEFAULT = 2026


@dataclass(frozen=True)
class AnnualModelParams:
    base_depth: float
    annual_rate: float
    noise: float


def build_annual_model_params(region_id: str) -> AnnualModelParams:
    h = stable_hash_int(region_id)
    base_depth = 20 + (h % 60)  # 20..79
    annual_rate = ((h % 20) / 10) - 0.5  # -0.5..1.5
    noise = 1 + (h % 4)  # 1..4
    return AnnualModelParams(
        base_depth=float(base_depth),
        annual_rate=float(annual_rate),
        noise=float(noise),
    )


def risk_and_advisory(annual_rate: float) -> Tuple[RiskLevel, str]:
    abs_rate = abs(annual_rate)
    if abs_rate < 0.3:
        return "low", f"Stable conditions: Annual change of {annual_rate:.2f} ft/year within safe limits."
    if abs_rate < 0.7:
        return "moderate", f"Moderate Risk: Annual decline of {abs_rate:.2f} ft/year. Monitor extraction rates."
    if abs_rate < 1.2:
        return "high", f"High Risk: Annual decline of {abs_rate:.1f} ft/year. Immediate intervention recommended."
    return "severe", f"⚠️ Severe Risk: Annual decline of {abs_rate:.1f} ft/year detected. Critical depletion imminent."


def generate_annual_prediction(
    region_id: str,
    *,
    location_store: LocationStore,
    current_year: int = CURRENT_YEAR_DEFAULT,
) -> PredictionResultAnnual:
    params = build_annual_model_params(region_id)

    # Deterministic RNG for reproducible predictions.
    rng = np.random.default_rng(stable_hash_int(region_id))

    annual_rate = params.annual_rate
    base_depth = params.base_depth
    noise = params.noise

    historical: list[WaterDataPoint] = []
    predicted: list[WaterDataPoint] = []

    # Historical: 10 years up to T=0 (current_year)
    for i in range(-10, 1):
        year = current_year + i
        depth = base_depth + annual_rate * i + (float(rng.random()) - 0.5) * noise
        historical.append(WaterDataPoint(year=year, depth=round(depth, 2)))

    last_depth = historical[-1].depth

    # Predicted: next 8 years
    for i in range(1, 9):
        year = current_year + i
        depth = last_depth + annual_rate * i + (float(rng.random()) - 0.5) * noise * 1.5
        ci_width = i * 0.3 + float(rng.random()) * 0.2
        upper = depth + ci_width
        lower = depth - ci_width

        predicted.append(
            WaterDataPoint(
                year=year,
                depth=round(depth, 2),
                predicted=True,
                upperCI=round(upper, 2),
                lowerCI=round(lower, 2),
            )
        )

    r_squared = 0.82 + float(rng.random()) * 0.15
    r_squared = round(r_squared, 3)

    risk_level, advisory = risk_and_advisory(annual_rate)

    return PredictionResultAnnual(
        region=location_store.get_region_by_id(region_id),
        historicalData=historical,
        predictedData=predicted,
        rSquared=r_squared,
        annualChangeRate=annual_rate,
        currentDepth=historical[-1].depth,
        riskLevel=risk_level,
        advisory=advisory,
    )


def get_year_depth_from_annual(result: PredictionResultAnnual, year: int) -> float:
    for d in [*result.historicalData, *result.predictedData]:
        if d.year == year:
            return float(d.depth)
    raise ValueError(f"Requested year {year} not in prediction horizon.")


def month_name(month: int) -> str:
    names = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ]
    return names[month - 1]


def monthly_seasonal_offsets(annual_rate: float) -> dict[int, float]:
    """
    Sparse seasonal anchors (2, 5, 8, 11) mapped deterministically from annual trend.

    This acts as a month-aware seasonal component without changing the annual model output.
    """
    scale = 0.4 * abs(annual_rate) + 0.25
    return {
        2: +0.65 * scale,   # winter recovery/recharge phase
        5: -0.95 * scale,   # pre-monsoon depletion (dryest)
        8: +0.45 * scale,   # monsoon impact/ramp
        11: +0.20 * scale,  # post-monsoon stabilization/recharge
    }


def interpolate_depth_for_month(
    *,
    known_month_depths: dict[int, float],
    target_month: int,
    method: str = "polynomial",
    order: int = 3,
) -> float:
    """
    Pandas interpolation utility.

    We set known months as values and unknown months as NaNs, then interpolate across 1..12.
    """
    idx = list(range(1, 13))
    values = [known_month_depths.get(m, np.nan) for m in idx]
    s = pd.Series(values, index=idx, dtype="float64")

    s_interp = s.interpolate(method=method, order=order, limit_direction="both")
    return float(round(s_interp.loc[target_month], 4))


def bedrock_limit_ft(region_id: str) -> float:
    # Deterministic "limit" to flag pump burnout risk.
    h = stable_hash_int(region_id)
    return float(65 + (h % 25))  # 65..89


def generate_monthly_prediction(
    *,
    region_id: str,
    location_store: LocationStore,
    year: int,
    month: int,
    current_year: int = CURRENT_YEAR_DEFAULT,
) -> tuple[float, float, list[str]]:
    annual = generate_annual_prediction(region_id, location_store=location_store, current_year=current_year)
    annual_rate = float(annual.annualChangeRate)

    year_depth = get_year_depth_from_annual(annual, year)

    offsets = monthly_seasonal_offsets(annual_rate)
    known_month_depths = {m: year_depth + off for m, off in offsets.items()}

    exact_depth = interpolate_depth_for_month(
        known_month_depths=known_month_depths,
        target_month=month,
        method="polynomial",
        order=3,
    )

    # Previous-month depth for monthly_change_rate
    prev_month = month - 1
    if prev_month >= 1:
        prev_depth = interpolate_depth_for_month(
            known_month_depths=known_month_depths,
            target_month=prev_month,
            method="polynomial",
            order=3,
        )
    else:
        # month == 1 -> previous month is December of previous year.
        try:
            prev_year_depth = get_year_depth_from_annual(annual, year - 1)
        except Exception:
            # Fallback: linear adjustment by annual change rate (stable heuristic).
            prev_year_depth = float(year_depth - annual_rate)
        prev_known = {m: prev_year_depth + off for m, off in offsets.items()}
        prev_depth = interpolate_depth_for_month(
            known_month_depths=prev_known,
            target_month=12,
            method="polynomial",
            order=3,
        )

    monthly_change_rate = round(exact_depth - float(prev_depth), 4)

    # Insights
    insights: list[str] = []
    insights.append(f"Expected Depth ({month_name(month)} {year}): {exact_depth:.2f} ft")
    trend_word = "increase" if monthly_change_rate >= 0 else "decrease"
    insights.append(f"Seasonal Fluctuation: Predicted {trend_word} vs previous month by {abs(monthly_change_rate):.2f} ft")

    if month in (5,):
        insights.append("Monsoon Impact: May is the pre-monsoon depletion phase (highest drawdown risk).")
    elif month in (6, 7, 8):
        insights.append("Monsoon Impact: Monsoon ramp phase. Align irrigation with expected recharge timing.")
    elif month in (9, 10):
        insights.append("Monsoon Impact: Post-monsoon transition. Monitor decline rate to avoid over-extraction.")
    else:
        insights.append("Monsoon Impact: Winter/shoulder season. Favor managed recovery and controlled pumping.")

    # Recharge Capacity (May -> November) for the selected year
    may_depth = interpolate_depth_for_month(
        known_month_depths=known_month_depths,
        target_month=5,
        method="polynomial",
        order=3,
    )
    nov_depth = interpolate_depth_for_month(
        known_month_depths=known_month_depths,
        target_month=11,
        method="polynomial",
        order=3,
    )
    recharge_capacity = round(may_depth - nov_depth, 3)
    insights.append(f"Recharge Capacity (May vs November {year}): {recharge_capacity:.2f} ft")

    # Year-over-year shrinking warning (simple heuristic)
    prev_year = year - 1
    try:
        prev_annual = generate_annual_prediction(region_id, location_store=location_store, current_year=current_year)
        prev_year_depth = get_year_depth_from_annual(prev_annual, prev_year)
        prev_known = {m: prev_year_depth + off for m, off in offsets.items()}
        prev_may_depth = interpolate_depth_for_month(
            known_month_depths=prev_known,
            target_month=5,
            method="polynomial",
            order=3,
        )
        prev_nov_depth = interpolate_depth_for_month(
            known_month_depths=prev_known,
            target_month=11,
            method="polynomial",
            order=3,
        )
        prev_recharge_capacity = round(prev_may_depth - prev_nov_depth, 3)
        if prev_recharge_capacity is not None and recharge_capacity < prev_recharge_capacity:
            insights.append(
                f"Warning: Recharge Capacity is shrinking year-over-year (prev: {prev_recharge_capacity:.2f} ft)."
            )
    except Exception:
        pass

    # Pump burnout risk
    limit = bedrock_limit_ft(region_id)
    if exact_depth > limit:
        insights.append(f"Pump Burnout Risk: Predicted depth {exact_depth:.2f} ft exceeds bedrock limit {limit:.0f} ft.")

    # Return
    return exact_depth, float(monthly_change_rate), insights

