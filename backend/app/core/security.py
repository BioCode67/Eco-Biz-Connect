"""보안 유틸리티 — 비밀번호 해시(bcrypt) 와 JWT(access/refresh) 발급·검증.

설계 규칙: 모든 비밀번호는 bcrypt 해시로 저장한다. JWT 는 sub(userId), role, type, exp 를 담는다.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from jose import jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TokenType = Literal["access", "refresh"]


def hash_password(plain_password: str) -> str:
    """평문 비밀번호를 bcrypt 해시로 변환한다."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """평문 비밀번호가 저장된 해시와 일치하는지 검증한다."""
    return pwd_context.verify(plain_password, password_hash)


def _create_token(subject: int, role: str, expires_delta: timedelta, token_type: TokenType) -> str:
    """공통 토큰 생성 로직."""
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_access_token(subject: int, role: str) -> str:
    """단기 액세스 토큰을 발급한다."""
    return _create_token(subject, role, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES), "access")


def create_refresh_token(subject: int, role: str) -> str:
    """장기 리프레시 토큰을 발급한다."""
    return _create_token(subject, role, timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES), "refresh")


def decode_token(token: str) -> dict[str, Any]:
    """JWT 를 디코드/검증하고 페이로드를 반환한다(만료·서명 오류 시 JWTError 발생)."""
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
