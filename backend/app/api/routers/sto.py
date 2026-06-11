"""STO 발행 라우터 — UC8(Issue Carbon STO). 관리자 전용.

자산 정보를 입력받아 ERC-1400 컨트랙트를 배포(mock)하고 마켓플레이스에 공개(LISTED)한다.
모든 발행 작업은 감사 로그에 기록된다.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.sto import STOAsset, STOStatus
from app.models.user import User, UserRole
from app.schemas.sto import STOAssetOut, STOCreateRequest
from app.services import audit
from app.services.external import blockchain

router = APIRouter(prefix="/sto", tags=["sto"])


@router.post("", response_model=STOAssetOut, status_code=status.HTTP_201_CREATED)
def issue_sto(
    payload: STOCreateRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> STOAsset:
    """탄소 STO 발행(관리자 전용)."""
    asset = STOAsset(
        issuer_id=current_user.id,
        asset_type=payload.asset_type,
        name=payload.name,
        description=payload.description,
        total_token_supply=payload.total_token_supply,
        remaining_tokens=payload.total_token_supply,
        token_price=payload.token_price,
        expected_yield=payload.expected_yield,
        co2_offset_per_year=payload.co2_offset_per_year,
        location=payload.location,
        installed_capacity_mw=payload.installed_capacity_mw,
        dividend_period_months=payload.dividend_period_months,
        status=STOStatus.DEPLOYING,
    )
    db.add(asset)
    db.flush()  # asset.id 확보

    # ERC-1400 컨트랙트 배포(mock) + 온체인 앵커링
    deploy_payload = f"sto:{asset.id}:{asset.name}:{asset.total_token_supply}"
    contract_address, contract_abi, _record = blockchain.deploy_contract(db, deploy_payload)
    asset.contract_address = contract_address
    asset.contract_abi = contract_abi
    asset.status = STOStatus.LISTED

    audit.record_action(
        db,
        actor_id=current_user.id,
        action="ISSUE_STO",
        target_type="STOAsset",
        target_id=asset.id,
        detail={"name": asset.name, "supply": asset.total_token_supply},
    )

    db.commit()
    db.refresh(asset)
    return asset


@router.get("", response_model=list[STOAssetOut])
def list_all_sto(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> list[STOAsset]:
    """발행된 전체 STO 자산 목록(관리자)."""
    rows = db.scalars(select(STOAsset).order_by(STOAsset.created_at.desc())).all()
    return list(rows)
