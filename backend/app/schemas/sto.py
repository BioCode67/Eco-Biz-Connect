"""STO 자산 요청/응답 스키마."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.sto import AssetType, STOStatus


class STOCreateRequest(BaseModel):
    """STO 발행 요청(관리자)."""

    asset_type: AssetType
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    total_token_supply: int = Field(gt=0)
    token_price: Decimal = Field(gt=0)
    expected_yield: Decimal = Field(default=0, ge=0, le=100)
    co2_offset_per_year: int = Field(default=0, ge=0)
    location: str | None = None
    installed_capacity_mw: Decimal | None = Field(default=None, ge=0)
    dividend_period_months: int = Field(default=3, ge=1, le=12)


class STOAssetOut(BaseModel):
    """STO 자산 응답."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    issuer_id: int
    asset_type: AssetType
    name: str
    description: str | None
    total_token_supply: int
    remaining_tokens: int
    token_price: Decimal
    expected_yield: Decimal
    co2_offset_per_year: int
    location: str | None
    installed_capacity_mw: Decimal | None
    dividend_period_months: int
    contract_address: str | None
    status: STOStatus
    created_at: datetime
