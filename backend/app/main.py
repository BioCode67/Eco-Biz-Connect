"""FastAPI 애플리케이션 엔트리포인트.

헬스체크 + 개발용 CORS + 기능별 라우터(auth 등)를 조립한다.
DB 스키마는 Alembic 마이그레이션으로 관리한다(앱이 자동 생성하지 않음).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import auth, business_data, esg, reports
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.PROJECT_NAME)

# 개발용 CORS: 웹(Next.js 3000), Expo(8081) 등 localhost 오리진 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 기능별 라우터 등록
app.include_router(auth.router)
app.include_router(business_data.router)
app.include_router(reports.router)
app.include_router(esg.router)


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    """서버 헬스체크. 정상이면 {"status": "ok"} 를 반환한다."""
    return {"status": "ok"}
