"""금융 상품/대출 관련 응답 스키마."""

from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class MatchedProductOut(BaseModel):
    """ESG 기반 매칭된 우대 대출 상품(실효 금리 포함)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    product_code: str
    bank_name: str
    product_name: str
    base_rate: Decimal
    preferential_rate: float
    max_amount: int
    term_months: int
    min_esg_grade: str
