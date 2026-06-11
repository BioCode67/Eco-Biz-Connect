"""애플리케이션 설정 모듈.

.env 파일의 환경변수를 pydantic-settings로 읽어 타입 안전한 설정 객체로 제공한다.
민감값(JWT_SECRET 등)은 .env 에만 두고 절대 커밋하지 않는다.
"""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """환경변수 기반 설정 클래스."""

    # 프로젝트 메타
    PROJECT_NAME: str = "Eco-Biz Connect API"
    API_V1_PREFIX: str = "/api/v1"

    # 데이터베이스
    DATABASE_URL: str = "postgresql+psycopg2://ebc:ebc@localhost:5432/ebc"

    # JWT 인증
    JWT_SECRET: str = "change-me-in-env"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7일

    # CORS — 콤마로 구분된 허용 오리진 목록 + (선택) 정규식
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8081"
    # 예: https://.*\.vercel\.app  (Vercel 프리뷰/프로덕션 도메인 일괄 허용)
    BACKEND_CORS_ORIGIN_REGEX: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator("DATABASE_URL")
    @classmethod
    def _normalize_database_url(cls, v: str) -> str:
        """Render 등이 주는 `postgres://` 스킴을 SQLAlchemy 호환 `postgresql://` 로 정규화한다."""
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        """콤마로 구분된 CORS 오리진 문자열을 리스트로 변환한다."""
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """설정 싱글턴을 반환한다(프로세스당 1회만 로드)."""
    return Settings()
