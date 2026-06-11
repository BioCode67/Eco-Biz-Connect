"""블록체인 네트워크 외부연동 — MOCK 구현.

실제로는 Web3 로 스마트 컨트랙트와 통신하지만, 여기서는 SHA-256 기반의 결정적
가짜 트랜잭션 해시/블록 번호를 생성해 앵커링을 흉내 낸다. Phase 5 에서 교체한다.
"""

import hashlib
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.blockchain import BlockchainRecord, RecordType

NETWORK_ID = "ebc-l2-testnet"


def _sha256(payload: str) -> str:
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def anchor(
    db: Session,
    record_type: RecordType,
    payload: str,
    entity_type: str | None = None,
    entity_id: int | None = None,
) -> BlockchainRecord:
    """payload 의 해시를 온체인에 앵커링(mock)하고 BlockchainRecord 를 생성한다.

    data_hash 는 payload 에 대해 결정적이지만, tx_hash 는 매 트랜잭션마다 고유해야 하므로
    nonce 를 섞는다(동일 내용의 반복 거래도 서로 다른 트랜잭션). 커밋은 호출자가 수행한다.
    """
    data_hash = _sha256(payload)
    nonce = uuid.uuid4().hex
    tx_hash = "0x" + _sha256(payload + record_type.value + nonce)[:64]
    block_number = int(_sha256(nonce)[:8], 16) % 9_000_000 + 1_000_000
    record = BlockchainRecord(
        record_type=record_type,
        data_hash=data_hash,
        tx_hash=tx_hash,
        block_number=block_number,
        associated_entity_type=entity_type,
        associated_entity_id=entity_id,
        network_id=NETWORK_ID,
        confirmed_at=datetime.now(timezone.utc),  # mock: 즉시 확정
    )
    db.add(record)
    db.flush()
    return record


def verify(record: BlockchainRecord, payload: str) -> bool:
    """저장된 data_hash 를 payload 의 라이브 해시와 교차 확인한다(설계서 verify())."""
    return record.data_hash == _sha256(payload)


def deploy_contract(db: Session, payload: str) -> tuple[str, dict, BlockchainRecord]:
    """ERC-1400 보안 토큰 컨트랙트를 배포(mock)하고 주소/ABI/앵커 레코드를 반환한다.

    실제로는 Solidity 컴파일 + 네트워크 배포가 일어나지만, 여기서는 결정적 가짜 주소/ABI 를 만든다.
    """
    record = anchor(db, RecordType.STO_DEPLOY, payload)
    contract_address = "0x" + _sha256("contract:" + payload)[:40]
    contract_abi = {
        "standard": "ERC-1400",
        "functions": ["issue", "purchase", "distributeDividend", "balanceOf", "totalSupply"],
    }
    return contract_address, contract_abi, record


def purchase_tokens(db: Session, contract_address: str, buyer: str, quantity: int) -> BlockchainRecord:
    """컨트랙트의 purchase 함수 호출(mock)을 앵커링한다."""
    payload = f"purchase:{contract_address}:{buyer}:{quantity}"
    return anchor(db, RecordType.TOKEN_PURCHASE, payload)


def distribute_dividend(db: Session, contract_address: str, per_token_amount: float) -> BlockchainRecord:
    """컨트랙트의 distributeDividend 호출(mock)을 앵커링한다."""
    payload = f"dividend:{contract_address}:{per_token_amount}"
    return anchor(db, RecordType.DIVIDEND, payload)
