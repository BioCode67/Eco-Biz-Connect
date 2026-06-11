"""인증 라우터 — UC1(Register), UC2(Login) 및 토큰 재발급/내 정보 조회.

외부연동(사업자번호 검증)은 services.external.bank_api 의 mock 을 사용한다.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import KYCStatus, User, UserRole, VerificationStatus
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)
from app.services.external.bank_api import verify_business_registration

router = APIRouter(prefix="/auth", tags=["auth"])

# UC2: 로그인 실패 잠금 정책
MAX_FAILED_ATTEMPTS = 5
LOCK_DURATION_MINUTES = 15


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _as_aware(value: datetime | None) -> datetime | None:
    """저장소(SQLite 등)에서 naive 로 읽힌 시각을 UTC aware 로 정규화한다."""
    if value is not None and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> User:
    """신규 사용자 가입(UC1). 이메일 중복 확인 + 비밀번호 bcrypt 해시 + role 지정."""
    # 이메일 중복 확인
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "이미 가입된 이메일입니다.")

    verification_status = VerificationStatus.PENDING

    if payload.role == UserRole.MERCHANT:
        # Merchant 는 사업자등록번호 필수 + 외부(Bank API) 검증(mock): 번호 + 대표자명 대조
        if not payload.business_reg_no:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "사업자등록번호는 필수입니다.")
        result = await verify_business_registration(payload.business_reg_no, payload.representative_name)
        if result == "NOT_FOUND":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "사업자 등록번호를 찾을 수 없습니다. 확인 후 다시 입력해 주세요.")
        if result == "NAME_MISMATCH":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "대표자명이 일치하지 않습니다.")
        verification_status = VerificationStatus.VERIFIED

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        verification_status=verification_status,
        name=payload.name,
        phone=payload.phone,
    )

    if payload.role == UserRole.MERCHANT:
        user.business_reg_no = payload.business_reg_no
        user.store_name = payload.store_name
        user.store_address = payload.store_address
        user.business_category = payload.business_category
    elif payload.role == UserRole.INVESTOR:
        user.wallet_address = payload.wallet_address
        user.kyc_status = KYCStatus.PENDING
        user.total_invested = 0

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """이메일·비밀번호 인증 후 JWT access/refresh 발급(UC2)."""
    user = db.scalar(select(User).where(User.email == payload.email))

    # 계정 잠금 확인
    locked_until = _as_aware(user.locked_until) if user is not None else None
    if locked_until is not None and locked_until > _now():
        raise HTTPException(
            status.HTTP_423_LOCKED,
            "로그인 시도가 5회 초과되어 계정이 일시적으로 잠겼습니다. 잠시 후 다시 시도하세요.",
        )

    # 일반화된 오류: 사용자 없음/비밀번호 불일치를 동일 메시지로 처리
    if user is None or not verify_password(payload.password, user.password_hash):
        if user is not None:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
                user.locked_until = _now() + timedelta(minutes=LOCK_DURATION_MINUTES)
            db.commit()
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.")

    # 정지된 계정 차단(UC13 관리자 정지)
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "정지된 계정입니다. 관리자에게 문의하세요.")

    # 인증 성공: 실패 카운터 초기화
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    return TokenResponse(
        access_token=create_access_token(user.id, user.role.value),
        refresh_token=create_refresh_token(user.id, user.role.value),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """리프레시 토큰을 검증하고 새 access/refresh 토큰을 발급한다."""
    try:
        token_payload = decode_token(payload.refresh_token)
        if token_payload.get("type") != "refresh":
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "리프레시 토큰이 아닙니다.")
        user_id = int(token_payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "유효하지 않은 리프레시 토큰입니다.")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "사용자를 찾을 수 없습니다.")

    return TokenResponse(
        access_token=create_access_token(user.id, user.role.value),
        refresh_token=create_refresh_token(user.id, user.role.value),
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> User:
    """현재 인증된 사용자 정보를 반환한다(인증 필요)."""
    return current_user
