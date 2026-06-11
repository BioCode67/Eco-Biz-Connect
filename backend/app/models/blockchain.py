"""BlockchainRecord 모델 — 모든 아웃바운드 블록체인 상호작용의 내부 원장.

설계서 2.2.4: ESGScore/TokenTransaction/Dividend/STOAsset 가 이 클래스에 «anchor» 의존한다.
recordType, txHash, blockNumber, dataHash(SHA-256) 를 보관하고 verify() 로 교차 확인한다.
"""

import enum
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum as SAEnum, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RecordType(str, enum.Enum):
    """블록체인 레코드 유형."""

    ESG_ANCHOR = "ESG_ANCHOR"
    TOKEN_PURCHASE = "TOKEN_PURCHASE"
    DIVIDEND = "DIVIDEND"
    STO_DEPLOY = "STO_DEPLOY"


class BlockchainRecord(Base):
    """온체인 앵커링 레코드(데이터 해시 + 트랜잭션 정보)."""

    __tablename__ = "blockchain_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    record_type: Mapped[RecordType] = mapped_column(
        SAEnum(RecordType, name="blockchain_record_type"), nullable=False
    )
    data_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    tx_hash: Mapped[str] = mapped_column(String(66), unique=True, nullable=False)
    block_number: Mapped[int] = mapped_column(BigInteger, nullable=False)
    associated_entity_type: Mapped[str | None] = mapped_column(String(48), nullable=True)
    associated_entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    network_id: Mapped[str] = mapped_column(String(32), default="ebc-l2-testnet", nullable=False)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
