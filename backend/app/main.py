"""FastAPI 애플리케이션 엔트리포인트.

헬스체크 + 개발용 CORS + 기능별 라우터(auth 등)를 조립한다.
DB 스키마는 Alembic 마이그레이션으로 관리한다(앱이 자동 생성하지 않음).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import (
    admin,
    auth,
    business_data,
    chain,
    dividends,
    esg,
    investor,
    loans,
    marketplace,
    products,
    reports,
    sto,
    transactions,
)
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.PROJECT_NAME)

# CORS: 명시 오리진 목록(localhost·배포 도메인) + 선택적 정규식(Vercel 등)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=settings.BACKEND_CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 기능별 라우터 등록
app.include_router(auth.router)
app.include_router(business_data.router)
app.include_router(reports.router)
app.include_router(esg.router)
app.include_router(products.router)
app.include_router(loans.router)
app.include_router(sto.router)
app.include_router(marketplace.router)
app.include_router(investor.router)
app.include_router(dividends.router)
app.include_router(transactions.router)
app.include_router(admin.router)
app.include_router(chain.router)


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    """서버 헬스체크. 정상이면 {"status": "ok"} 를 반환한다."""
    return {"status": "ok"}
