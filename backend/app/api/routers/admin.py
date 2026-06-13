"""관리자 라우터 — UC13(Manage System & Monitor). 관리자 전용.

시스템 모니터링, 사용자 관리(정지/복원/역할 변경), 감사 로그 조회를 제공한다.
모든 사용자 관리 작업은 불변 감사 로그에 기록된다.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.blockchain import BlockchainRecord
from app.models.loan import LoanApplication
from app.models.sto import STOAsset
from app.models.transaction import TokenTransaction
from app.models.user import User, UserRole
from app.schemas.admin import (
    AdminStatsOut,
    AdminUserOut,
    AuditLogOut,
    RoleChangeRequest,
    SystemMetricsOut,
)
from app.services import audit, monitoring

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/monitor", response_model=SystemMetricsOut)
def monitor_system(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> dict:
    """서브시스템 지표 스냅샷(mock 폴링)."""
    return monitoring.collect_metrics(db)


@router.get("/stats", response_model=AdminStatsOut)
def admin_stats(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> AdminStatsOut:
    """대시보드 통계(역할별 사용자 수, 거래량 7일 추이 등)."""
    def count(model, *where) -> int:
        stmt = select(func.count()).select_from(model)
        for w in where:
            stmt = stmt.where(w)
        return db.scalar(stmt) or 0

    # 최근 7일 거래량 버킷(포터블하게 파이썬에서 집계)
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=6)
    txs = db.execute(
        select(TokenTransaction.total_amount_paid, TokenTransaction.created_at)
    ).all()
    buckets: dict[str, float] = {}
    for i in range(7):
        day = (since + timedelta(days=i)).strftime("%m/%d")
        buckets[day] = 0.0
    for amount, created in txs:
        if created is None:
            continue
        c = created if created.tzinfo else created.replace(tzinfo=timezone.utc)
        if c >= since.replace(hour=0, minute=0, second=0, microsecond=0):
            key = c.strftime("%m/%d")
            if key in buckets:
                buckets[key] += float(amount)
    tx_volume = [{"label": k, "amount": round(v)} for k, v in buckets.items()]

    # 플랫폼 전체 연 CO₂ 저감(발행된 모든 STO 자산의 합)
    total_co2 = float(db.scalar(select(func.coalesce(func.sum(STOAsset.co2_offset_per_year), 0))) or 0)

    return AdminStatsOut(
        merchants=count(User, User.role == UserRole.MERCHANT),
        investors=count(User, User.role == UserRole.INVESTOR),
        admins=count(User, User.role == UserRole.ADMIN),
        total_users=count(User),
        total_sto=count(STOAsset),
        total_transactions=count(TokenTransaction),
        total_loans=count(LoanApplication),
        onchain_records=count(BlockchainRecord),
        total_co2_offset=total_co2,
        tx_volume_7d=tx_volume,
    )


@router.get("/users", response_model=list[AdminUserOut])
def list_users(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> list[User]:
    """전체 사용자 목록."""
    return list(db.scalars(select(User).order_by(User.id)).all())


def _get_target(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "사용자를 찾을 수 없습니다.")
    return user


@router.post("/users/{user_id}/suspend", response_model=AdminUserOut)
def suspend_user(
    user_id: int,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> User:
    """계정 정지."""
    user = _get_target(db, user_id)
    user.is_active = False
    audit.record_action(db, current_user.id, "SUSPEND_USER", "User", user_id)
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/restore", response_model=AdminUserOut)
def restore_user(
    user_id: int,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> User:
    """계정 복원."""
    user = _get_target(db, user_id)
    user.is_active = True
    audit.record_action(db, current_user.id, "RESTORE_USER", "User", user_id)
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/role", response_model=AdminUserOut)
def change_role(
    user_id: int,
    payload: RoleChangeRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> User:
    """사용자 역할 변경."""
    user = _get_target(db, user_id)
    old_role = user.role.value
    user.role = payload.role
    audit.record_action(
        db,
        current_user.id,
        "CHANGE_ROLE",
        "User",
        user_id,
        detail={"from": old_role, "to": payload.role.value},
    )
    db.commit()
    db.refresh(user)
    return user


@router.get("/audit-log", response_model=list[AuditLogOut])
def get_audit_log(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> list[AuditLog]:
    """감사 로그 조회(최신순)."""
    return list(db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc(), AuditLog.id.desc())).all())
