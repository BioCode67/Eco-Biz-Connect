"""FastAPI 애플리케이션 엔트리포인트.

Phase 0: 개발 환경 뼈대만 구성한다. 비즈니스 로직(인증 등)은 아직 없다.
헬스체크 엔드포인트와 개발용 CORS 미들웨어만 제공한다.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    """서버 헬스체크. 정상이면 {"status": "ok"} 를 반환한다."""
    return {"status": "ok"}
