"""관리자 라우터 — UC13(Manage System & Monitor). 관리자 전용.

시스템 모니터링, 사용자 관리(정지/복원/역할 변경), 감사 로그 조회를 제공한다.
모든 사용자 관리 작업은 불변 감사 로그에 기록된다.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.user import User, UserRole
from app.schemas.admin import AdminUserOut, AuditLogOut, RoleChangeRequest, SystemMetricsOut
from app.services import audit, monitoring

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/monitor", response_model=SystemMetricsOut)
def monitor_system(
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> dict:
    """서브시스템 지표 스냅샷(mock 폴링)."""
    return monitoring.collect_metrics(db)


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
