"""배당/포트폴리오 라우터 — UC11(Check Revenue & Dividend).

- 관리자: STO 자산에 대해 배당을 분배한다(스마트 컨트랙트 트리거 mock).
- 투자자: 포트폴리오 성과와 배당 내역을 조회한다.
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.dividend import Dividend
from app.models.sto import STOAsset, STOStatus
from app.models.transaction import TokenTransaction
from app.models.user import User, UserRole
from app.schemas.portfolio import (
    DividendDistributeRequest,
    DividendOut,
    HoldingOut,
    PortfolioOut,
    UpcomingDividendOut,
)
from app.services import audit
from app.services.external import blockchain

router = APIRouter(tags=["dividend"])


@router.post("/sto/{asset_id}/dividend", response_model=DividendOut, status_code=status.HTTP_201_CREATED)
def distribute_dividend(
    asset_id: int,
    payload: DividendDistributeRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> DividendOut:
    """STO 자산 배당 분배(관리자, 스마트 컨트랙트 트리거 mock)."""
    asset = db.get(STOAsset, asset_id)
    if asset is None or asset.status not in (STOStatus.LISTED, STOStatus.SOLD_OUT):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "배당 대상 STO 자산을 찾을 수 없습니다.")

    record = blockchain.distribute_dividend(
        db, asset.contract_address or "0x0", float(payload.per_token_amount)
    )
    # 분배 총액 = 토큰당 배당액 × 판매된 토큰 수
    sold_tokens = asset.total_token_supply - asset.remaining_tokens
    total_distributed = payload.per_token_amount * sold_tokens
    dividend = Dividend(
        sto_asset_id=asset.id,
        per_token_amount=payload.per_token_amount,
        total_distributed_amount=total_distributed,
        on_chain_tx_hash=record.tx_hash,
    )
    db.add(dividend)
    audit.record_action(
        db,
        actor_id=current_user.id,
        action="DISTRIBUTE_DIVIDEND",
        target_type="STOAsset",
        target_id=asset.id,
        detail={"per_token_amount": str(payload.per_token_amount)},
    )
    db.commit()
    db.refresh(dividend)

    return DividendOut(
        id=dividend.id,
        sto_asset_id=asset.id,
        asset_name=asset.name,
        per_token_amount=dividend.per_token_amount,
        my_quantity=0,
        my_dividend=Decimal("0"),
        distribution_date=dividend.distribution_date,
        on_chain_tx_hash=dividend.on_chain_tx_hash,
    )


def _holdings_by_asset(db: Session, investor_id: int) -> dict[int, dict]:
    """투자자의 자산별 보유 수량/투자액 집계를 반환한다."""
    rows = db.execute(
        select(
            TokenTransaction.sto_asset_id,
            func.sum(TokenTransaction.quantity_purchased),
            func.sum(TokenTransaction.total_amount_paid),
        )
        .where(TokenTransaction.investor_id == investor_id)
        .group_by(TokenTransaction.sto_asset_id)
    ).all()
    return {
        asset_id: {"quantity": int(qty), "total_paid": Decimal(str(paid))}
        for asset_id, qty, paid in rows
    }


@router.get("/portfolio", response_model=PortfolioOut)
def get_portfolio(
    current_user: User = Depends(require_roles(UserRole.INVESTOR)),
    db: Session = Depends(get_db),
) -> PortfolioOut:
    """투자자 포트폴리오 요약(보유 자산/평가액/배당)."""
    holdings_map = _holdings_by_asset(db, current_user.id)

    holdings: list[HoldingOut] = []
    upcoming: list[UpcomingDividendOut] = []
    total_invested = Decimal("0")
    total_current_value = Decimal("0")
    total_dividends = Decimal("0")
    now = datetime.now(timezone.utc)

    for asset_id, agg in holdings_map.items():
        asset = db.get(STOAsset, asset_id)
        if asset is None:
            continue
        quantity = agg["quantity"]
        current_value = asset.token_price * quantity

        # 예정 배당: 마지막 분배(또는 상장일) + 배당주기, 예상액 = 연수익률 기반 분기 환산
        last_dv = db.scalar(
            select(Dividend)
            .where(Dividend.sto_asset_id == asset_id)
            .order_by(Dividend.distribution_date.desc())
        )
        base_date = last_dv.distribution_date if last_dv else asset.created_at
        if base_date.tzinfo is None:
            base_date = base_date.replace(tzinfo=timezone.utc)
        period = asset.dividend_period_months or 3
        next_date = base_date + timedelta(days=30 * period)
        if last_dv is not None:
            est = last_dv.per_token_amount * quantity
        else:
            annual = current_value * (asset.expected_yield / Decimal("100"))
            est = (annual * Decimal(period) / Decimal("12")).quantize(Decimal("1"))
        upcoming.append(
            UpcomingDividendOut(
                sto_asset_id=asset_id,
                asset_name=asset.name,
                next_distribution_date=next_date,
                estimated_amount=est,
            )
        )

        # 해당 자산의 토큰당 배당 총합 × 보유 수량
        per_token_total = db.scalar(
            select(func.coalesce(func.sum(Dividend.per_token_amount), 0)).where(
                Dividend.sto_asset_id == asset_id
            )
        )
        dividends_received = Decimal(str(per_token_total)) * quantity

        total_invested += agg["total_paid"]
        total_current_value += current_value
        total_dividends += dividends_received

        holdings.append(
            HoldingOut(
                sto_asset_id=asset_id,
                asset_name=asset.name,
                quantity=quantity,
                total_paid=agg["total_paid"],
                current_value=current_value,
                dividends_received=dividends_received,
            )
        )

    total_return_pct = (
        float((total_current_value - total_invested) / total_invested * 100) if total_invested > 0 else 0.0
    )
    return PortfolioOut(
        total_invested=total_invested,
        total_current_value=total_current_value,
        total_dividends_received=total_dividends,
        total_return_pct=round(total_return_pct, 2),
        holdings=holdings,
        upcoming_dividends=upcoming,
    )


@router.get("/dividends", response_model=list[DividendOut])
def list_my_dividends(
    current_user: User = Depends(require_roles(UserRole.INVESTOR)),
    db: Session = Depends(get_db),
) -> list[DividendOut]:
    """내가 보유한 자산의 배당 내역(내 수령액 포함, 최신순)."""
    holdings_map = _holdings_by_asset(db, current_user.id)
    if not holdings_map:
        return []

    dividends = db.scalars(
        select(Dividend)
        .where(Dividend.sto_asset_id.in_(holdings_map.keys()))
        .order_by(Dividend.distribution_date.desc())
    ).all()

    results: list[DividendOut] = []
    for dividend in dividends:
        asset = db.get(STOAsset, dividend.sto_asset_id)
        quantity = holdings_map[dividend.sto_asset_id]["quantity"]
        results.append(
            DividendOut(
                id=dividend.id,
                sto_asset_id=dividend.sto_asset_id,
                asset_name=asset.name if asset else "",
                per_token_amount=dividend.per_token_amount,
                my_quantity=quantity,
                my_dividend=dividend.per_token_amount * quantity,
                distribution_date=dividend.distribution_date,
                on_chain_tx_hash=dividend.on_chain_tx_hash,
            )
        )
    return results
