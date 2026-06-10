"""ESGScore 모델 — 단일 EBC 상생 지수 레코드.

설계서 2.2.2: env/social/governance/composite/grade + onChainTxHash(앵커링 연결).
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ESGScore(Base):
    """소상공인의 ESG 상생 지수 산출 결과."""

    __tablename__ = "esg_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    business_data_id: Mapped[int] = mapped_column(
        ForeignKey("business_data.id", ondelete="CASCADE"), nullable=False
    )
    env_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    social_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    governance_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    composite_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    score_grade: Mapped[str] = mapped_column(String(2), nullable=False)
    on_chain_tx_hash: Mapped[str | None] = mapped_column(String(66), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
