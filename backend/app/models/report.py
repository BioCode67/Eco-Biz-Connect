"""AIAnalysisReport 모델 — BusinessData 업로드에 대한 AI 분석 엔진 출력.

설계서 2.2.2: BusinessData 1 → 1 AIAnalysisReport.
salesForecast / costOptimizationTips / districtComparison 등을 JSON 으로 보관한다.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AIAnalysisReport(Base):
    """AI 분석 리포트(매출 예측·비용 최적화·상권 비교)."""

    __tablename__ = "ai_analysis_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    business_data_id: Mapped[int] = mapped_column(
        ForeignKey("business_data.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    merchant_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    summary: Mapped[str] = mapped_column(String(512), nullable=False)
    sales_forecast: Mapped[dict] = mapped_column(JSON, nullable=False)
    cost_optimization_tips: Mapped[list] = mapped_column(JSON, nullable=False)
    district_comparison: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
