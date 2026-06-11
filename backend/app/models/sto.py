"""STOAsset 모델 — 토큰화된 환경 자산(증권형 토큰).

설계서 2.2.3 / State machine 4.3: Drafting→Compiling→Deploying→Listed→(SoldOut)→Closed.
Administrator 가 합성(◆)으로 발행·소유한다.
"""

import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, JSON, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AssetType(str, enum.Enum):
    """환경 자산 유형."""

    SOLAR = "SOLAR"
    WIND = "WIND"
    FOREST = "FOREST"
    HYDRO = "HYDRO"


class STOStatus(str, enum.Enum):
    """STO 자산 생명주기 상태."""

    DRAFTING = "DRAFTING"
    COMPILING = "COMPILING"
    DEPLOYING = "DEPLOYING"
    LISTED = "LISTED"
    SOLD_OUT = "SOLD_OUT"
    CLOSED = "CLOSED"


class STOAsset(Base):
    """토큰증권(STO) 자산."""

    __tablename__ = "sto_assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    issuer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    asset_type: Mapped[AssetType] = mapped_column(SAEnum(AssetType, name="asset_type"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    total_token_supply: Mapped[int] = mapped_column(Integer, nullable=False)
    remaining_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    token_price: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    expected_yield: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0, nullable=False)
    co2_offset_per_year: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contract_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    contract_abi: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[STOStatus] = mapped_column(
        SAEnum(STOStatus, name="sto_status"), default=STOStatus.DRAFTING, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
