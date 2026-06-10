"""AI 분석 리포트 조회 라우터 — UC4(View AI Analysis Report)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.report import AIAnalysisReport
from app.models.user import User, UserRole
from app.schemas.report import AIAnalysisReportOut

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/latest", response_model=AIAnalysisReportOut)
def get_latest_report(
    current_user: User = Depends(require_roles(UserRole.MERCHANT)),
    db: Session = Depends(get_db),
) -> AIAnalysisReport:
    """내 최신 AI 분석 리포트를 조회한다."""
    report = db.scalar(
        select(AIAnalysisReport)
        .where(AIAnalysisReport.merchant_id == current_user.id)
        .order_by(AIAnalysisReport.created_at.desc())
    )
    if report is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "분석 리포트가 없습니다. 먼저 경영 데이터를 업로드하세요."
        )
    return report


@router.get("/by-business-data/{business_data_id}", response_model=AIAnalysisReportOut)
def get_report_by_business_data(
    business_data_id: int,
    current_user: User = Depends(require_roles(UserRole.MERCHANT)),
    db: Session = Depends(get_db),
) -> AIAnalysisReport:
    """특정 업로드 건의 분석 리포트를 조회한다(본인 소유만)."""
    report = db.scalar(
        select(AIAnalysisReport).where(
            AIAnalysisReport.business_data_id == business_data_id,
            AIAnalysisReport.merchant_id == current_user.id,
        )
    )
    if report is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "해당 리포트를 찾을 수 없습니다.")
    return report
