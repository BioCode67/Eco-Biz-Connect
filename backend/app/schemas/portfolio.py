"""포트폴리오/배당 응답 스키마."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class DividendDistributeRequest(BaseModel):
    """배당 분배 요청(관리자)."""

    per_token_amount: Decimal = Field(gt=0, description="토큰당 배당액")


class HoldingOut(BaseModel):
    """투자자 보유 자산 요약."""

    sto_asset_id: int
    asset_name: str
    quantity: int
    total_paid: Decimal
    current_value: Decimal
    dividends_received: Decimal


class PortfolioOut(BaseModel):
    """투자자 포트폴리오 요약."""

    total_invested: Decimal
    total_current_value: Decimal
    total_dividends_received: Decimal
    holdings: list[HoldingOut]


class DividendOut(BaseModel):
    """배당 이벤트 + 내 수령액."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    sto_asset_id: int
    asset_name: str
    per_token_amount: Decimal
    my_quantity: int
    my_dividend: Decimal
    distribution_date: datetime
    on_chain_tx_hash: str | None
