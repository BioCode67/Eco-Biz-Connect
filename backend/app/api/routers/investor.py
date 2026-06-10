"""투자자 라우터 — KYC 검증 및 STO 토큰 구매(UC10).

구매 전 KYC 가 VERIFIED 여야 한다(설계서 2.2.1 Investor).
"""

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.sto import STOAsset, STOStatus
from app.models.transaction import TokenTransaction
from app.models.user import KYCStatus, User, UserRole
from app.schemas.transaction import KYCResultOut, PurchaseRequest, TokenTransactionOut
from app.services.external import bank_api, blockchain, kyc

router = APIRouter(tags=["investor"])


@router.post("/investor/kyc/verify", response_model=KYCResultOut)
async def verify_kyc(
    current_user: User = Depends(require_roles(UserRole.INVESTOR)),
    db: Session = Depends(get_db),
) -> User:
    """투자자 KYC 검증(mock). 통과 시 kyc_status 를 VERIFIED 로 갱신한다."""
    passed = await kyc.verify_identity(current_user.wallet_address)
    current_user.kyc_status = KYCStatus.VERIFIED if passed else KYCStatus.REJECTED
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post(
    "/marketplace/{asset_id}/purchase",
    response_model=TokenTransactionOut,
    status_code=status.HTTP_201_CREATED,
)
async def purchase_token(
    asset_id: int,
    payload: PurchaseRequest,
    current_user: User = Depends(require_roles(UserRole.INVESTOR)),
    db: Session = Depends(get_db),
) -> TokenTransaction:
    """STO 토큰 구매(UC10). 결제(mock) → 온체인 구매(mock) → 잔여 토큰 차감."""
    # KYC 선결 조건
    if current_user.kyc_status != KYCStatus.VERIFIED:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "토큰 구매 전 KYC 인증이 필요합니다(/investor/kyc/verify)."
        )

    asset = db.get(STOAsset, asset_id)
    if asset is None or asset.status not in (STOStatus.LISTED, STOStatus.SOLD_OUT):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "해당 상품을 찾을 수 없습니다.")
    if asset.status == STOStatus.SOLD_OUT or asset.remaining_tokens <= 0:
        raise HTTPException(status.HTTP_409_CONFLICT, "이미 매진된 상품입니다.")
    if payload.quantity > asset.remaining_tokens:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"잔여 토큰({asset.remaining_tokens}개)보다 많은 수량을 구매할 수 없습니다.",
        )

    total = asset.token_price * payload.quantity

    # 결제 처리(mock)
    payment = await bank_api.process_payment(
        {"investor_id": current_user.id, "amount": int(total)}
    )
    if not payment.get("success"):
        raise HTTPException(status.HTTP_402_PAYMENT_REQUIRED, "결제에 실패했습니다.")

    # 온체인 구매(mock) — 실패 시 환불(여기서는 결제 mock 이 항상 성공)
    record = blockchain.purchase_tokens(
        db, asset.contract_address or "0x0", current_user.wallet_address or "0x0", payload.quantity
    )

    # 잔여 토큰 차감 및 매진 처리
    asset.remaining_tokens -= payload.quantity
    if asset.remaining_tokens == 0:
        asset.status = STOStatus.SOLD_OUT

    transaction = TokenTransaction(
        investor_id=current_user.id,
        sto_asset_id=asset.id,
        quantity_purchased=payload.quantity,
        unit_price=asset.token_price,
        total_amount_paid=total,
        on_chain_tx_hash=record.tx_hash,
        block_number=record.block_number,
    )
    db.add(transaction)

    # 투자자 총 투자액 갱신
    current_user.total_invested = (current_user.total_invested or Decimal("0")) + total

    db.commit()
    db.refresh(transaction)
    return transaction
