"""pytest 공용 픽스처. 인메모리 SQLite 로 격리된 테스트 DB 와 TestClient 를 제공한다."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  (Base.metadata 에 모델 등록)
from app.core.database import Base, get_db
from app.main import app


@pytest.fixture
def client():
    """테스트별 새 인메모리 DB 와 의존성 오버라이드된 클라이언트."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def merchant_payload() -> dict:
    return {
        "email": "merchant@example.com",
        "password": "secret123",
        "role": "MERCHANT",
        "business_reg_no": "123-45-67890",
        "store_name": "그린마트",
        "store_address": "서울시 강남구",
        "business_category": "RETAIL",
    }


@pytest.fixture
def investor_payload() -> dict:
    return {
        "email": "investor@example.com",
        "password": "secret123",
        "role": "INVESTOR",
        "wallet_address": "0xABC123",
    }


@pytest.fixture
def admin_payload() -> dict:
    return {
        "email": "admin@example.com",
        "password": "secret123",
        "role": "ADMIN",
    }


def auth_headers(client, payload: dict) -> dict:
    """주어진 사용자로 가입+로그인 후 Authorization 헤더를 만든다."""
    client.post("/auth/register", json=payload)
    tokens = client.post(
        "/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    ).json()
    return {"Authorization": f"Bearer {tokens['access_token']}"}
