"""블록체인 검증 라우터 — BlockchainRecord.verify() 대응.

저장된 온체인 레코드를 트랜잭션 해시로 조회하고, 확정 여부·네트워크·블록 정보를 반환한다.
설계서의 불변 감사성(앵커링 교차확인)을 사용자에게 노출한다.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.blockchain import BlockchainRecord
from app.models.user import User

router = APIRouter(prefix="/chain", tags=["chain"])


class ChainVerifyOut(BaseModel):
    tx_hash: str
    record_type: str
    block_number: int
    network_id: str
    data_hash: str
    confirmed_at: datetime | None
    verified: bool


@router.get("/verify/{tx_hash}", response_model=ChainVerifyOut)
def verify_record(
    tx_hash: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChainVerifyOut:
    """트랜잭션 해시로 온체인 앵커 레코드를 검증 조회한다."""
    record = db.scalar(select(BlockchainRecord).where(BlockchainRecord.tx_hash == tx_hash))
    if record is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "온체인 레코드를 찾을 수 없습니다.")
    return ChainVerifyOut(
        tx_hash=record.tx_hash,
        record_type=record.record_type.value,
        block_number=record.block_number,
        network_id=record.network_id,
        data_hash=record.data_hash,
        confirmed_at=record.confirmed_at,
        verified=record.confirmed_at is not None,
    )
