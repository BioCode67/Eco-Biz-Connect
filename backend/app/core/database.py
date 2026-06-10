"""SQLAlchemy 데이터베이스 연결/세션 모듈.

PostgreSQL(운영) 과 SQLite(테스트) 를 모두 지원한다.
Base 는 모든 ORM 모델의 공통 부모이며, get_db 는 FastAPI 의존성으로 요청당 세션을 제공한다.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

# SQLite 는 단일 스레드 기본값이므로 테스트 편의를 위해 옵션을 풀어준다.
_connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=_connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """모든 ORM 모델의 선언적 베이스."""


def get_db() -> Generator[Session, None, None]:
    """요청 단위 DB 세션을 yield 하고 종료 시 닫는다(FastAPI 의존성)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
