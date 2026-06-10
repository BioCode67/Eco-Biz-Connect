"""토큰 거래/투자자 관련 스키마."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.user import KYCStatus


class PurchaseRequest(BaseModel):
    """STO 토큰 구매 요청."""

    quantity: int = Field(gt=0, description="구매 수량")


class TokenTransactionOut(BaseModel):
    """토큰 거래 응답."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    investor_id: int
    sto_asset_id: int
    quantity_purchased: int
    unit_price: Decimal
    total_amount_paid: Decimal
    on_chain_tx_hash: str | None
    block_number: int | None
    created_at: datetime


class KYCResultOut(BaseModel):
    """KYC 검증 결과 응답."""

    model_config = ConfigDict(from_attributes=True)

    kyc_status: KYCStatus
