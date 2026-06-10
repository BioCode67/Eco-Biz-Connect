"""TokenTransaction 모델 — 개별 STO 토큰 구매 거래 기록.

설계서 2.2.3: STOAsset 와 합성(◆), Investor 와 1 → 0..* 연관.
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TokenTransaction(Base):
    """STO 토큰 구매 거래."""

    __tablename__ = "token_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    investor_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    sto_asset_id: Mapped[int] = mapped_column(
        ForeignKey("sto_assets.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    quantity_purchased: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    total_amount_paid: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    on_chain_tx_hash: Mapped[str | None] = mapped_column(String(66), nullable=True)
    block_number: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
