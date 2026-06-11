"""거래 내역 응답 스키마(역할 통합)."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class TransactionItem(BaseModel):
    """단일 거래 내역 항목(역할별 모든 활동을 정규화한 형태)."""

    type: str  # TOKEN_PURCHASE | DIVIDEND_RECEIVED | LOAN_APPLICATION | DATA_UPLOAD
    ref_id: int
    description: str
    amount: Decimal
    status: str | None
    on_chain_tx_hash: str | None = None
    timestamp: datetime


class TransactionHistoryPage(BaseModel):
    """페이지네이션된 거래 내역."""

    items: list[TransactionItem]
    page: int
    page_size: int
    total: int
