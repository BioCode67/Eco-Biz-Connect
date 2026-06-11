"""경영 데이터 업로드 라우터 — UC3(Upload Business Data).

소상공인이 CSV/Excel 매출·지출 데이터를 업로드한다. 확장자·크기 사전 검증 후
오브젝트 스토리지(mock)에 저장하고 분석 파이프라인(mock)을 트리거한다.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.business import BusinessData
from app.models.user import User, UserRole
from app.schemas.business import BusinessDataOut
from app.services import pipeline
from app.services.external import object_storage

router = APIRouter(prefix="/business-data", tags=["business-data"])

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


@router.post("/upload", response_model=BusinessDataOut, status_code=status.HTTP_201_CREATED)
async def upload_business_data(
    file: UploadFile,
    current_user: User = Depends(require_roles(UserRole.MERCHANT)),
    db: Session = Depends(get_db),
) -> BusinessData:
    """경영 데이터 파일 업로드(소상공인 전용)."""
    file_name = file.filename or "upload"
    ext = file_name[file_name.rfind(".") :].lower() if "." in file_name else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            f"지원하지 않는 형식입니다. 허용: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "빈 파일은 업로드할 수 없습니다.")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "파일 크기가 50MB 를 초과했습니다.")

    storage_key = object_storage.store_file(current_user.id, file_name, content)
    business_data = BusinessData(
        merchant_id=current_user.id,
        file_name=file_name,
        file_size=len(content),
        storage_key=storage_key,
    )
    db.add(business_data)
    db.commit()
    db.refresh(business_data)

    # 분석 파이프라인 트리거(mock)
    pipeline.run_pipeline(db, business_data)
    return business_data


@router.get("", response_model=list[BusinessDataOut])
def list_business_data(
    current_user: User = Depends(require_roles(UserRole.MERCHANT)),
    db: Session = Depends(get_db),
) -> list[BusinessData]:
    """내가 업로드한 경영 데이터 목록(최신순)."""
    rows = db.scalars(
        select(BusinessData)
        .where(BusinessData.merchant_id == current_user.id)
        .order_by(BusinessData.created_at.desc(), BusinessData.id.desc())
    ).all()
    return list(rows)
