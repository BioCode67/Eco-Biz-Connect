"""LoanApplication 모델 — 대출 신청의 전체 생명주기 추적.

설계서 2.2.2 / State machine 4.2: status 가 Draft→Submitting→UnderReview→Approved/Rejected 로 전이.
Merchant 1 ◆— 0..* LoanApplication, FinancialProduct * → 1.
"""

import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class LoanStatus(str, enum.Enum):
    """대출 신청 상태."""

    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class LoanApplication(Base):
    """소상공인의 우대 대출 신청 레코드."""

    __tablename__ = "loan_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    financial_product_id: Mapped[int] = mapped_column(
        ForeignKey("financial_products.id", ondelete="RESTRICT"), nullable=False
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    applied_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    term_months: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[LoanStatus] = mapped_column(
        SAEnum(LoanStatus, name="loan_status"), default=LoanStatus.UNDER_REVIEW, nullable=False
    )
    decision_reason: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
