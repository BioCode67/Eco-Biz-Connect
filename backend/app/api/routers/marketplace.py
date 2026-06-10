"""마켓플레이스 라우터 — UC9(Browse Investment Products). 투자자 전용.

공개(LISTED/SOLD_OUT) STO 자산을 탐색한다. 잔여 토큰 수는 컨트랙트와 동기화된 값(mock)을 사용한다.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.models.sto import AssetType, STOAsset, STOStatus
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.sto import STOAssetOut

router = APIRouter(prefix="/marketplace", tags=["marketplace"])

# 마켓플레이스에 공개되는 상태
_VISIBLE_STATUSES = (STOStatus.LISTED, STOStatus.SOLD_OUT)


@router.get("", response_model=list[STOAssetOut])
def browse_products(
    asset_type: AssetType | None = None,
    current_user: User = Depends(require_roles(UserRole.INVESTOR)),
    db: Session = Depends(get_db),
) -> list[STOAsset]:
    """공개된 STO 상품 탐색(자산 유형 필터 가능)."""
    stmt = select(STOAsset).where(STOAsset.status.in_(_VISIBLE_STATUSES))
    if asset_type is not None:
        stmt = stmt.where(STOAsset.asset_type == asset_type)
    stmt = stmt.order_by(STOAsset.created_at.desc())
    return list(db.scalars(stmt).all())


@router.get("/{asset_id}", response_model=STOAssetOut)
def product_detail(
    asset_id: int,
    current_user: User = Depends(require_roles(UserRole.INVESTOR)),
    db: Session = Depends(get_db),
) -> STOAsset:
    """STO 상품 상세."""
    asset = db.get(STOAsset, asset_id)
    if asset is None or asset.status not in _VISIBLE_STATUSES:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "해당 상품을 찾을 수 없습니다.")
    return asset
