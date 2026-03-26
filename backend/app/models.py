from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


RiskLevel = Literal["low", "moderate", "high", "severe"]


class Region(BaseModel):
    id: str
    name: str = ""
    village: str = ""
    subDistrict: str = ""
    district: str = ""
    state: str = "Maharashtra"


class WaterDataPoint(BaseModel):
    year: int
    depth: float
    predicted: bool | None = None
    upperCI: float | None = None
    lowerCI: float | None = None


class PredictionResultAnnual(BaseModel):
    region: Region
    historicalData: list[WaterDataPoint]
    predictedData: list[WaterDataPoint]
    rSquared: float
    annualChangeRate: float
    currentDepth: float
    riskLevel: RiskLevel
    advisory: str


class AnnualPredictRequest(BaseModel):
    # Region = village id (front-end currently uses village ids as region.id)
    region: str = Field(..., min_length=1)


class MonthlyPredictRequest(BaseModel):
    region: str = Field(..., min_length=1)
    year: int = Field(..., ge=1900, le=3000)
    month: int = Field(..., ge=1, le=12)


class MonthlyPredictResponse(BaseModel):
    exact_depth: float
    monthly_change_rate: float
    pointwise_insights: list[str]

