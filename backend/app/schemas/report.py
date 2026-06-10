"""AIAnalysisReport 응답 스키마."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AIAnalysisReportOut(BaseModel):
    """AI 분석 리포트 응답."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    business_data_id: int
    merchant_id: int
    summary: str
    sales_forecast: dict
    cost_optimization_tips: list
    district_comparison: dict
    created_at: datetime
