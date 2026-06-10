"""우대 금융 상품 매칭 라우터 — UC6(Match Financial Product).

소상공인의 ESG 점수를 기반으로 Bank API(mock) 에서 우대 대출 상품을 조회하고,
실효 연이자율 기준 오름차순으로 정렬해 반환한다.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.database import get_db
from app.models.esg import ESGScore
from app.models.finance import FinancialProduct
from app.models.user import User, UserRole
from app.schemas.finance import MatchedProductOut
from app.services.external import bank_api

router = APIRouter(prefix="/products", tags=["products"])


def _cache_catalog(db: Session) -> dict[str, FinancialProduct]:
    """은행 카탈로그(mock)를 DB 캐시에 동기화하고 product_code→row 매핑을 반환한다."""
    catalog = bank_api.fetch_loan_products()
    by_code: dict[str, FinancialProduct] = {}
    for item in catalog:
        product = db.scalar(
            select(FinancialProduct).where(FinancialProduct.product_code == item["product_code"])
        )
        if product is None:
            product = FinancialProduct(**item)
            db.add(product)
        by_code[item["product_code"]] = product
    db.commit()
    for product in by_code.values():
        db.refresh(product)
    return by_code


@router.get("/match", response_model=list[MatchedProductOut])
def match_products(
    current_user: User = Depends(require_roles(UserRole.MERCHANT)),
    db: Session = Depends(get_db),
) -> list[dict]:
    """내 ESG 점수에 맞는 우대 대출 상품 목록(실효 금리 오름차순)."""
    esg = db.scalar(
        select(ESGScore)
        .where(ESGScore.merchant_id == current_user.id)
        .order_by(ESGScore.created_at.desc())
    )
    if esg is None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "ESG 점수가 없습니다. 먼저 경영 데이터를 업로드해 점수를 산출하세요."
        )

    composite = float(esg.composite_score)
    my_grade_rank = bank_api.GRADE_ORDER.get(esg.score_grade, 0)

    catalog = _cache_catalog(db)
    results = []
    for product in catalog.values():
        # 상품이 요구하는 최소 등급을 충족하는 경우만 매칭
        if my_grade_rank < bank_api.GRADE_ORDER.get(product.min_esg_grade, 0):
            continue
        preferential = bank_api.compute_preferential_rate(float(product.base_rate), composite)
        results.append(
            {
                "id": product.id,
                "product_code": product.product_code,
                "bank_name": product.bank_name,
                "product_name": product.product_name,
                "base_rate": product.base_rate,
                "preferential_rate": preferential,
                "max_amount": product.max_amount,
                "term_months": product.term_months,
                "min_esg_grade": product.min_esg_grade,
            }
        )

    results.sort(key=lambda r: r["preferential_rate"])
    return results
