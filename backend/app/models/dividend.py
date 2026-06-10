"""Dividend 모델 — STOAsset 에 대한 스마트 컨트랙트 트리거 배당 분배 이벤트.

설계서 2.2.3: STOAsset 와 합성(◆). perTokenAmount, distributionDate, onChainTxHash 보유.
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Dividend(Base):
    """STO 자산 배당 분배 이벤트."""

    __tablename__ = "dividends"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sto_asset_id: Mapped[int] = mapped_column(
        ForeignKey("sto_assets.id", ondelete="CASCADE"), index=True, nullable=False
    )
    per_token_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    distribution_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    on_chain_tx_hash: Mapped[str | None] = mapped_column(String(66), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
