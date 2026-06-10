"""BusinessData 관련 응답 스키마."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.business import ProcessingStatus


class BusinessDataOut(BaseModel):
    """업로드된 경영 데이터 응답."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: int
    file_name: str
    file_size: int
    processing_status: ProcessingStatus
    created_at: datetime
