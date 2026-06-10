"""인증 관련 요청/응답 스키마(pydantic).

UC1(Register), UC2(Login) 의 입출력을 검증한다.
"""

from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import KYCStatus, UserRole, VerificationStatus


class RegisterRequest(BaseModel):
    """회원가입 요청. role 에 따라 Merchant/Investor 전용 필드를 선택적으로 받는다."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128, description="8자 이상")
    role: UserRole

    # Merchant 전용
    business_reg_no: str | None = Field(default=None, description="사업자등록번호(Merchant 필수)")
    store_name: str | None = None
    store_address: str | None = None
    business_category: str | None = None

    # Investor 전용
    wallet_address: str | None = None


class LoginRequest(BaseModel):
    """로그인 요청."""

    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    """리프레시 토큰으로 액세스 토큰 재발급 요청."""

    refresh_token: str


class TokenResponse(BaseModel):
    """JWT 토큰 응답."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    """사용자 공개 정보 응답(비밀번호 해시 등 민감정보 제외)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    role: UserRole
    verification_status: VerificationStatus

    business_reg_no: str | None = None
    store_name: str | None = None
    store_address: str | None = None
    business_category: str | None = None
    esg_score: Decimal | None = None

    wallet_address: str | None = None
    kyc_status: KYCStatus | None = None
    total_invested: Decimal | None = None
