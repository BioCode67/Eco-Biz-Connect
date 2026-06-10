"""ESGScore 응답 스키마."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ESGScoreOut(BaseModel):
    """ESG 상생 지수 응답."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: int
    business_data_id: int
    env_score: Decimal
    social_score: Decimal
    governance_score: Decimal
    composite_score: Decimal
    score_grade: str
    on_chain_tx_hash: str | None
    created_at: datetime
