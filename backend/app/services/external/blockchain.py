"""블록체인 네트워크 외부연동 — MOCK 구현.

실제로는 Web3 로 스마트 컨트랙트와 통신하지만, 여기서는 SHA-256 기반의 결정적
가짜 트랜잭션 해시/블록 번호를 생성해 앵커링을 흉내 낸다. Phase 5 에서 교체한다.
"""

import hashlib

from sqlalchemy.orm import Session

from app.models.blockchain import BlockchainRecord, RecordType


def _sha256(payload: str) -> str:
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def anchor(db: Session, record_type: RecordType, payload: str) -> BlockchainRecord:
    """payload 의 해시를 온체인에 앵커링(mock)하고 BlockchainRecord 를 생성한다.

    커밋은 호출자가 수행한다(db.flush 로 id 만 확보).
    """
    data_hash = _sha256(payload)
    tx_hash = "0x" + _sha256(payload + record_type.value)[:64]
    block_number = int(data_hash[:8], 16) % 9_000_000 + 1_000_000
    record = BlockchainRecord(
        record_type=record_type,
        data_hash=data_hash,
        tx_hash=tx_hash,
        block_number=block_number,
    )
    db.add(record)
    db.flush()
    return record
