"""시스템 모니터링 텔레메트리 — MOCK 구현(UC13).

설계서 3.13: 관리자 콘솔이 AI Engine/Blockchain Network/Bank API 지표를 폴링한다.
실제 텔레메트리 대신 결정적 가짜 지표를 반환하며, 일부 피드는 사용 불가(opt) 상태를 표현한다.
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.blockchain import BlockchainRecord
from app.models.user import User


def collect_metrics(db: Session) -> dict:
    """각 서브시스템의 현재 지표 스냅샷을 수집한다(mock)."""
    user_count = db.scalar(select(func.count()).select_from(User)) or 0
    onchain_count = db.scalar(select(func.count()).select_from(BlockchainRecord)) or 0

    return {
        "subsystems": {
            "ai_engine": {"status": "UP", "queue_depth": 0, "avg_latency_ms": 420},
            "blockchain_network": {
                "status": "UP",
                "anchored_records": onchain_count,
                "avg_block_time_s": 2.1,
            },
            # 일부 피드 사용 불가(opt) 표현 — 외부 Bank API 점검 중 가정
            "bank_api": {"status": "DEGRADED", "note": "정기 점검으로 응답 지연"},
        },
        "totals": {"users": user_count, "onchain_records": onchain_count},
    }
