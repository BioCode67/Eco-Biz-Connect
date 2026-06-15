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
from app.services import analytics, pipeline
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

    # .csv 는 사용자가 명시적으로 준 데이터다 — 매출 컬럼조차 없는 파일(HTML·무관 표 등)은
    # 합성 분석으로 가장하지 않고 저장 전에 거절한다(고아 레코드 방지).
    if ext == ".csv" and not analytics.is_business_csv(content):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "CSV에서 매출 데이터를 찾을 수 없습니다. '날짜', '매출액' 등의 컬럼이 포함된 경영 데이터 파일을 올려주세요.",
        )

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

    # 업로드된 CSV 를 실제로 파싱(실패 시 None → 합성 분석으로 폴백)
    parsed = analytics.parse_business_csv(content) if ext == ".csv" else None

    # 분석 파이프라인 트리거(실데이터 우선)
    pipeline.run_pipeline(db, business_data, parsed)
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
