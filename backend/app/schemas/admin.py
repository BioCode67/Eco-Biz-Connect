"""관리자(시스템 관리/모니터링) 스키마."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.user import UserRole


class AdminUserOut(BaseModel):
    """관리자 화면용 사용자 요약."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    role: UserRole
    is_active: bool


class RoleChangeRequest(BaseModel):
    """역할 변경 요청."""

    role: UserRole


class SystemMetricsOut(BaseModel):
    """시스템 모니터링 지표."""

    subsystems: dict
    totals: dict


class AdminStatsOut(BaseModel):
    """관리자 대시보드 통계."""

    merchants: int
    investors: int
    admins: int
    total_users: int
    total_sto: int
    total_transactions: int
    total_loans: int
    onchain_records: int
    total_co2_offset: float = 0.0  # 전체 발행 STO의 연 CO₂ 저감 합(tCO₂e/년)
    tx_volume_7d: list[dict]  # [{label, amount}]


class AuditLogOut(BaseModel):
    """감사 로그 항목."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_id: int | None
    action: str
    target_type: str | None
    target_id: int | None
    detail: dict | None
    created_at: datetime
