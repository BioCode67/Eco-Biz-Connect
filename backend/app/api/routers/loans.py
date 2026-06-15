"""대출 신청 라우터 — UC7(Apply for Preferential Loan).

소상공인이 매칭된 상품에 비대면으로 대출을 신청한다. Bank API(mock) 제출 후 UNDER_REVIEW 로
저장하며, 심사 결과는 비동기 웹훅(mock)으로 수신해 상태를 갱신한다.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.esg import ESGScore
from app.models.finance import FinancialProduct
from app.models.loan import LoanApplication, LoanStatus
from app.models.user import User, UserRole
from app.schemas.loan import LoanApplicationOut, LoanApplyRequest, LoanWebhookRequest
from app.services.external import bank_api

router = APIRouter(prefix="/loans", tags=["loans"])


@router.post("/apply", response_model=LoanApplicationOut, status_code=status.HTTP_201_CREATED)
async def apply_for_loan(
    payload: LoanApplyRequest,
    current_user: User = Depends(require_roles(UserRole.MERCHANT)),
    db: Session = Depends(get_db),
) -> LoanApplication:
    """우대 대출 신청(소상공인 전용)."""
    product = db.get(FinancialProduct, payload.financial_product_id)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "대출 상품을 찾을 수 없습니다.")
    if payload.amount > product.max_amount:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"신청 금액이 상품 최대 한도({product.max_amount:,}원)를 초과했습니다.",
        )
    if not payload.consent:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "대출 신청 약관에 동의해야 합니다.")

    # 최근 30일 이내 동일 상품 중복 신청 차단(UC7 전제조건)
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    duplicate = db.scalar(
        select(LoanApplication).where(
            LoanApplication.merchant_id == current_user.id,
            LoanApplication.financial_product_id == product.id,
            LoanApplication.created_at >= cutoff,
        )
    )
    if duplicate is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "이 상품에 이미 최근 신청 이력이 있습니다(30일 이내).")

    esg = db.scalar(
        select(ESGScore)
        .where(ESGScore.merchant_id == current_user.id)
        .order_by(ESGScore.created_at.desc(), ESGScore.id.desc())
    )
    if esg is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "ESG 점수가 없어 우대 대출을 신청할 수 없습니다.")

    applied_rate = bank_api.compute_preferential_rate(
        float(product.base_rate), float(esg.composite_score)
    )

    # Bank API 제출(mock)
    result = await bank_api.submit_loan_application(
        {"merchant_id": current_user.id, "product_code": product.product_code, "amount": payload.amount}
    )
    if not result.get("accepted"):
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "은행 시스템 제출에 실패했습니다. 잠시 후 재시도하세요.")

    application = LoanApplication(
        merchant_id=current_user.id,
        financial_product_id=product.id,
        amount=payload.amount,
        applied_rate=applied_rate,
        term_months=payload.term_months,
        loan_purpose=payload.loan_purpose,
        bank_reference_id=result.get("external_ref"),
        status=LoanStatus.UNDER_REVIEW,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("", response_model=list[LoanApplicationOut])
def list_loans(
    current_user: User = Depends(require_roles(UserRole.MERCHANT)),
    db: Session = Depends(get_db),
) -> list[LoanApplication]:
    """내 대출 신청 목록(최신순)."""
    rows = db.scalars(
        select(LoanApplication)
        .where(LoanApplication.merchant_id == current_user.id)
        .order_by(LoanApplication.created_at.desc(), LoanApplication.id.desc())
    ).all()
    return list(rows)


@router.get("/{loan_id}", response_model=LoanApplicationOut)
def get_loan(
    loan_id: int,
    current_user: User = Depends(require_roles(UserRole.MERCHANT)),
    db: Session = Depends(get_db),
) -> LoanApplication:
    """대출 신청 상세(본인 소유만)."""
    application = db.get(LoanApplication, loan_id)
    if application is None or application.merchant_id != current_user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "대출 신청을 찾을 수 없습니다.")
    return application


@router.post("/{loan_id}/bank-webhook", response_model=LoanApplicationOut)
def bank_decision_webhook(
    loan_id: int,
    payload: LoanWebhookRequest,
    db: Session = Depends(get_db),
) -> LoanApplication:
    """Bank API 심사 결과 콜백(MOCK).

    실제로는 은행 서명 검증이 필요한 외부 웹훅이다. 여기서는 심사 결과로 상태만 갱신한다.
    """
    if payload.decision not in (LoanStatus.APPROVED, LoanStatus.REJECTED):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "decision 은 APPROVED 또는 REJECTED 여야 합니다.")

    application = db.get(LoanApplication, loan_id)
    if application is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "대출 신청을 찾을 수 없습니다.")

    # 확정(APPROVED/REJECTED)된 대출은 final — 웹훅 재전송·번복으로 덮어쓰지 않는다(멱등성).
    if application.status in (LoanStatus.APPROVED, LoanStatus.REJECTED):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"이미 심사가 완료된 대출입니다(현재 상태: {application.status.value}).",
        )

    application.status = payload.decision
    application.decision_reason = payload.reason
    application.decision_received_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(application)
    return application
