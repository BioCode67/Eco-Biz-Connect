"""User 도메인 모델.

설계서의 User(추상)→Merchant/Investor/Administrator 상속 구조를
단일 테이블 + role 컬럼(Single Table Inheritance 스타일)으로 구현한다.
역할별 속성은 nullable 컬럼으로 한 테이블에 보관한다.
"""

import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class UserRole(str, enum.Enum):
    """사용자 역할. 인증 후 접근 가능한 동작을 결정한다."""

    MERCHANT = "MERCHANT"
    INVESTOR = "INVESTOR"
    ADMIN = "ADMIN"


class VerificationStatus(str, enum.Enum):
    """공통 신원 검증 상태."""

    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class KYCStatus(str, enum.Enum):
    """투자자 KYC 상태. 토큰 구매 전 VERIFIED 가 필수다."""

    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class User(Base):
    """모든 인간 Actor 를 표현하는 단일 사용자 테이블."""

    __tablename__ = "users"

    # ----- 공통 신원 속성 (User 추상 클래스) -----
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole, name="user_role"), nullable=False)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        SAEnum(VerificationStatus, name="verification_status"),
        default=VerificationStatus.PENDING,
        nullable=False,
    )
    # 계정 활성 여부(관리자 정지/복원 대상, UC13)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ----- 로그인 보안 (UC2: 5회 실패 시 15분 잠금) -----
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ----- Merchant 전용 속성 -----
    business_reg_no: Mapped[str | None] = mapped_column(String(32), nullable=True)
    store_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    store_address: Mapped[str | None] = mapped_column(String(512), nullable=True)
    business_category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    esg_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)

    # ----- Investor 전용 속성 -----
    wallet_address: Mapped[str | None] = mapped_column(String(128), nullable=True)
    kyc_status: Mapped[KYCStatus | None] = mapped_column(
        SAEnum(KYCStatus, name="kyc_status"), nullable=True
    )
    total_invested: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)

    # ----- 메타 -----
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
