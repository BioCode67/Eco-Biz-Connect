"""AI 분석 리포트 조회 라우터 — UC4(View AI Analysis Report)."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.esg import ESGScore
from app.models.report import AIAnalysisReport
from app.models.user import User, UserRole
from app.schemas.report import AIAnalysisReportOut
from app.services.pdf import build_report_pdf

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
        .order_by(AIAnalysisReport.created_at.desc(), AIAnalysisReport.id.desc())
    )
    if report is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "분석 리포트가 없습니다. 먼저 경영 데이터를 업로드하세요."
        )
    return report


@router.get("/latest/pdf")
def export_latest_report_pdf(
    current_user: User = Depends(require_roles(UserRole.MERCHANT)),
    db: Session = Depends(get_db),
) -> Response:
    """최신 분석 리포트를 PDF로 내보낸다(설계서 generatePDF())."""
    report = db.scalar(
        select(AIAnalysisReport)
        .where(AIAnalysisReport.merchant_id == current_user.id)
        .order_by(AIAnalysisReport.created_at.desc(), AIAnalysisReport.id.desc())
    )
    if report is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "내보낼 리포트가 없습니다.")
    esg = db.scalar(
        select(ESGScore).where(ESGScore.merchant_id == current_user.id).order_by(ESGScore.created_at.desc(), ESGScore.id.desc())
    )

    forecast = report.sales_forecast.get("next_3_months", [])
    lines = [
        f"Merchant ID: {current_user.id}",
        f"Report ID: {report.id}    Generated: {report.created_at:%Y-%m-%d}",
        "",
        "[ Sales Forecast (10k KRW) ]",
        f"  Next 3 months: {', '.join(str(v) for v in forecast)}",
        "",
        "[ EBC ESG Score ]",
        f"  Composite: {esg.composite_score if esg else 'N/A'}    Grade: {esg.score_grade if esg else 'N/A'}",
        f"  E/S/G: {esg.env_score}/{esg.social_score}/{esg.governance_score}" if esg else "  E/S/G: N/A",
        "",
        "[ Cost Optimization Tips ]",
        f"  {len(report.cost_optimization_tips)} recommendations included.",
        "",
        "Eco-Biz Connect - AI & ESG Financial Platform",
    ]
    pdf = build_report_pdf("EBC AI Analysis Report", lines)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ebc_report_{report.id}.pdf"},
    )


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
