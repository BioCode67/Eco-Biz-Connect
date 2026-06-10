"""ESG 점수 조회 라우터 — UC5(Calculate ESG Score) 결과 조회.

점수 산출은 업로드 파이프라인(services.pipeline)에서 자동 수행되며, 여기서는 조회만 제공한다.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.esg import ESGScore
from app.models.user import User, UserRole
from app.schemas.esg import ESGScoreOut

router = APIRouter(prefix="/esg", tags=["esg"])


@router.get("/me", response_model=ESGScoreOut)
def get_my_latest_esg(
    current_user: User = Depends(require_roles(UserRole.MERCHANT)),
    db: Session = Depends(get_db),
) -> ESGScore:
    """내 최신 ESG 점수를 조회한다."""
    score = db.scalar(
        select(ESGScore)
        .where(ESGScore.merchant_id == current_user.id)
        .order_by(ESGScore.created_at.desc())
    )
    if score is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "산출된 ESG 점수가 없습니다.")
    return score


@router.get("/history", response_model=list[ESGScoreOut])
def get_my_esg_history(
    current_user: User = Depends(require_roles(UserRole.MERCHANT)),
    db: Session = Depends(get_db),
) -> list[ESGScore]:
    """내 ESG 점수 이력(최신순)."""
    rows = db.scalars(
        select(ESGScore)
        .where(ESGScore.merchant_id == current_user.id)
        .order_by(ESGScore.created_at.desc())
    ).all()
    return list(rows)
