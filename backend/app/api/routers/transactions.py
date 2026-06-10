"""거래 내역 라우터 — UC12(View Transaction History).

소상공인은 대출 신청 내역을, 투자자는 토큰 구매 내역을 타임스탬프 내림차순·페이지당 20건으로 조회한다.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.loan import LoanApplication
from app.models.sto import STOAsset
from app.models.transaction import TokenTransaction
from app.models.user import User, UserRole
from app.schemas.history import TransactionHistoryPage, TransactionItem

router = APIRouter(tags=["transactions"])

DEFAULT_PAGE_SIZE = 20


@router.get("/transactions", response_model=TransactionHistoryPage)
def transaction_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransactionHistoryPage:
    """내 거래 내역(역할별, 최신순, 페이지네이션)."""
    offset = (page - 1) * page_size

    if current_user.role == UserRole.INVESTOR:
        total = db.scalar(
            select(func.count())
            .select_from(TokenTransaction)
            .where(TokenTransaction.investor_id == current_user.id)
        )
        rows = db.scalars(
            select(TokenTransaction)
            .where(TokenTransaction.investor_id == current_user.id)
            .order_by(TokenTransaction.created_at.desc())
            .offset(offset)
            .limit(page_size)
        ).all()
        items = [
            TransactionItem(
                type="TOKEN_PURCHASE",
                ref_id=tx.id,
                description=_asset_name(db, tx.sto_asset_id, "STO 토큰 구매"),
                amount=tx.total_amount_paid,
                status=None,
                timestamp=tx.created_at,
            )
            for tx in rows
        ]
    elif current_user.role == UserRole.MERCHANT:
        total = db.scalar(
            select(func.count())
            .select_from(LoanApplication)
            .where(LoanApplication.merchant_id == current_user.id)
        )
        rows = db.scalars(
            select(LoanApplication)
            .where(LoanApplication.merchant_id == current_user.id)
            .order_by(LoanApplication.created_at.desc())
            .offset(offset)
            .limit(page_size)
        ).all()
        items = [
            TransactionItem(
                type="LOAN_APPLICATION",
                ref_id=loan.id,
                description="우대 대출 신청",
                amount=loan.amount,
                status=loan.status.value,
                timestamp=loan.created_at,
            )
            for loan in rows
        ]
    else:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "관리자는 거래 내역 대신 모니터링 콘솔을 사용하세요."
        )

    return TransactionHistoryPage(items=items, page=page, page_size=page_size, total=total or 0)


def _asset_name(db: Session, asset_id: int, fallback: str) -> str:
    asset = db.get(STOAsset, asset_id)
    return f"STO 구매 - {asset.name}" if asset else fallback
