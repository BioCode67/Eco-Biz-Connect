"""FinancialProduct 모델 — Bank API 에서 조회된 대출 상품 캐시.

설계서 2.2.2: 최대 24시간 로컬 캐시되는 임시 클래스. 우대(실효) 금리는 소상공인 ESG 에 따라
요청 시점에 계산되어 응답으로 반환되며, 본 테이블에는 은행 카탈로그 기본 정보만 저장한다.
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class FinancialProduct(Base):
    """은행 대출 상품 카탈로그(캐시)."""

    __tablename__ = "financial_products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    bank_name: Mapped[str] = mapped_column(String(128), nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    base_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    max_amount: Mapped[int] = mapped_column(Integer, nullable=False)
    term_months: Mapped[int] = mapped_column(Integer, nullable=False)
    min_esg_grade: Mapped[str] = mapped_column(String(2), nullable=False)
    cached_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
