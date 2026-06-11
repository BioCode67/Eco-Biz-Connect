"""거래 내역 라우터 — UC12(View Transaction History).

설계서: 인증된 사용자가 자신과 관련된 '모든 유형'의 거래(토큰 구매 / 배당 수령 / 대출 신청 /
데이터 업로드)를 타임스탬프 내림차순·페이지당 20건으로 통합 조회한다. 유형 필터를 지원한다.
"""

from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.business import BusinessData
from app.models.dividend import Dividend
from app.models.loan import LoanApplication
from app.models.sto import STOAsset
from app.models.transaction import TokenTransaction
from app.models.user import User, UserRole
from app.schemas.history import TransactionHistoryPage, TransactionItem

router = APIRouter(tags=["transactions"])

DEFAULT_PAGE_SIZE = 20


def _asset_name(db: Session, asset_id: int) -> str:
    asset = db.get(STOAsset, asset_id)
    return asset.name if asset else f"자산 #{asset_id}"


def _collect_items(db: Session, user: User) -> list[TransactionItem]:
    """역할에 맞는 모든 활동을 통합 항목 리스트로 수집한다."""
    items: list[TransactionItem] = []

    if user.role == UserRole.INVESTOR:
        # 토큰 구매
        for tx in db.scalars(select(TokenTransaction).where(TokenTransaction.investor_id == user.id)).all():
            items.append(
                TransactionItem(
                    type="TOKEN_PURCHASE",
                    ref_id=tx.id,
                    description=f"STO 구매 · {_asset_name(db, tx.sto_asset_id)}",
                    amount=tx.total_amount_paid,
                    status="COMPLETED",
                    on_chain_tx_hash=tx.on_chain_tx_hash,
                    timestamp=tx.created_at,
                )
            )
        # 배당 수령(보유 자산에 대한 분배 × 내 수량)
        held = db.execute(
            select(TokenTransaction.sto_asset_id, func.sum(TokenTransaction.quantity_purchased))
            .where(TokenTransaction.investor_id == user.id)
            .group_by(TokenTransaction.sto_asset_id)
        ).all()
        held_map = {aid: int(qty) for aid, qty in held}
        if held_map:
            for dv in db.scalars(select(Dividend).where(Dividend.sto_asset_id.in_(held_map.keys()))).all():
                qty = held_map[dv.sto_asset_id]
                items.append(
                    TransactionItem(
                        type="DIVIDEND_RECEIVED",
                        ref_id=dv.id,
                        description=f"배당 수령 · {_asset_name(db, dv.sto_asset_id)}",
                        amount=dv.per_token_amount * qty,
                        status="COMPLETED",
                        on_chain_tx_hash=dv.on_chain_tx_hash,
                        timestamp=dv.distribution_date,
                    )
                )

    elif user.role == UserRole.MERCHANT:
        # 대출 신청
        for loan in db.scalars(select(LoanApplication).where(LoanApplication.merchant_id == user.id)).all():
            items.append(
                TransactionItem(
                    type="LOAN_APPLICATION",
                    ref_id=loan.id,
                    description="우대 대출 신청",
                    amount=Decimal(loan.amount),
                    status=loan.status.value,
                    timestamp=loan.created_at,
                )
            )
        # 데이터 업로드
        for bd in db.scalars(select(BusinessData).where(BusinessData.merchant_id == user.id)).all():
            items.append(
                TransactionItem(
                    type="DATA_UPLOAD",
                    ref_id=bd.id,
                    description=f"데이터 업로드 · {bd.file_name}",
                    amount=Decimal(0),
                    status=bd.processing_status.value,
                    timestamp=bd.created_at,
                )
            )

    return items


@router.get("/transactions", response_model=TransactionHistoryPage)
def transaction_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=100),
    type: str | None = Query(None, description="유형 필터(TOKEN_PURCHASE/DIVIDEND_RECEIVED/LOAN_APPLICATION/DATA_UPLOAD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransactionHistoryPage:
    """내 모든 거래 내역(역할별 통합, 최신순, 유형 필터, 페이지네이션)."""
    items = _collect_items(db, current_user)
    if type:
        items = [i for i in items if i.type == type]

    # 타임스탬프 내림차순 정렬(naive/aware 혼재 대비 isoformat 키 사용)
    items.sort(key=lambda i: i.timestamp.timestamp(), reverse=True)

    total = len(items)
    start = (page - 1) * page_size
    page_items = items[start : start + page_size]
    return TransactionHistoryPage(items=page_items, page=page, page_size=page_size, total=total)
