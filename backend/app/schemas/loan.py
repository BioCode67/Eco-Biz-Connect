"""대출 신청 요청/응답 스키마."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.loan import LoanStatus


class LoanApplyRequest(BaseModel):
    """대출 신청 요청."""

    financial_product_id: int
    amount: int = Field(gt=0, description="신청 금액(원)")
    term_months: int = Field(gt=0, le=120)
    loan_purpose: str | None = Field(default=None, max_length=255, description="대출 목적")
    consent: bool = Field(default=False, description="약관 동의 여부")


class LoanWebhookRequest(BaseModel):
    """Bank API 비동기 심사 결과 콜백(mock)."""

    decision: LoanStatus  # APPROVED 또는 REJECTED
    reason: str | None = None


class LoanApplicationOut(BaseModel):
    """대출 신청 응답."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: int
    financial_product_id: int
    amount: int
    applied_rate: Decimal
    term_months: int
    loan_purpose: str | None
    bank_reference_id: str | None
    status: LoanStatus
    decision_reason: str | None
    decision_received_at: datetime | None
    created_at: datetime
    updated_at: datetime
