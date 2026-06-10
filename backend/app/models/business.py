"""소상공인 도메인 모델 — BusinessData(경영 데이터 업로드 이벤트).

설계서 2.2.2: Merchant 1 ◆— 0..* BusinessData (합성).
processing_status 가 Uploaded→Parsing→Parsed→AIQueued→AICompleted→ESGCompleted 파이프라인을 추적한다.
"""

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ProcessingStatus(str, enum.Enum):
    """BusinessData 처리 파이프라인 상태(설계서 State machine 4.1)."""

    UPLOADED = "UPLOADED"
    PARSING = "PARSING"
    PARSED = "PARSED"
    AI_QUEUED = "AI_QUEUED"
    AI_COMPLETED = "AI_COMPLETED"
    ESG_COMPLETED = "ESG_COMPLETED"
    FAILED = "FAILED"


class BusinessData(Base):
    """소상공인의 단일 데이터 업로드 이벤트."""

    __tablename__ = "business_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    processing_status: Mapped[ProcessingStatus] = mapped_column(
        SAEnum(ProcessingStatus, name="processing_status"),
        default=ProcessingStatus.UPLOADED,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
