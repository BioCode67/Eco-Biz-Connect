"""감사 로그 기록 서비스."""

from sqlalchemy.orm import Session

from app.models.audit import AuditLog


def record_action(
    db: Session,
    actor_id: int | None,
    action: str,
    target_type: str | None = None,
    target_id: int | None = None,
    detail: dict | None = None,
) -> AuditLog:
    """관리자 작업을 감사 로그에 추가한다(커밋은 호출자가 수행)."""
    log = AuditLog(
        actor_id=actor_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        detail=detail,
    )
    db.add(log)
    db.flush()
    return log
