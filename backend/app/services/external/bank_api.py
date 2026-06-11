"""Bank API 외부연동 — MOCK 구현.

설계서 규칙에 따라 처음에는 실제 연동하지 않고 인터페이스만 맞춘 가짜 구현을 둔다.
실제 연동은 Phase 5 에서 교체한다(인터페이스 시그니처는 유지).
"""

import asyncio
import re

# ESG 등급 순서(높을수록 우대). 매칭 가능 여부 비교에 사용한다.
GRADE_ORDER = {"D": 0, "C": 1, "C+": 2, "B": 3, "B+": 4, "A": 5}

# 은행 대출 상품 카탈로그(MOCK). 실제로는 Bank API 응답.
_LOAN_PRODUCT_CATALOG = [
    {
        "product_code": "EBC-GREEN-A",
        "bank_name": "그린은행",
        "product_name": "ESG 우대 사업자 대출 (프라임)",
        "base_rate": 6.50,
        "max_amount": 100_000_000,
        "term_months": 60,
        "min_esg_grade": "B",
    },
    {
        "product_code": "EBC-ECO-B",
        "bank_name": "에코뱅크",
        "product_name": "소상공인 친환경 운전자금",
        "base_rate": 7.20,
        "max_amount": 50_000_000,
        "term_months": 36,
        "min_esg_grade": "C",
    },
    {
        "product_code": "EBC-START-D",
        "bank_name": "상생금융",
        "product_name": "신규 소상공인 보증부 대출",
        "base_rate": 8.40,
        "max_amount": 30_000_000,
        "term_months": 24,
        "min_esg_grade": "D",
    },
]


async def verify_business_registration(
    business_reg_no: str | None, representative_name: str | None = None
) -> str:
    """사업자등록번호 + 대표자명 검증(MOCK).

    실제로는 국세청 사업자등록 상태조회 API 와 대조한다. 여기서는:
    - 숫자 10자리가 아니면 "NOT_FOUND"
    - 대표자명을 제출했고 사업자번호가 000 으로 시작하면(시뮬레이션) "NAME_MISMATCH"
    - 그 외 "OK"
    반환값은 설계서 UC1 확장 흐름(5a/5b)을 따른다.
    """
    await asyncio.sleep(0.01)  # 외부 호출 지연 시뮬레이션
    digits = re.sub(r"\D", "", business_reg_no or "")
    if len(digits) != 10:
        return "NOT_FOUND"
    if representative_name is not None and digits.startswith("000"):
        return "NAME_MISMATCH"
    return "OK"


def fetch_loan_products() -> list[dict]:
    """은행 대출 상품 카탈로그를 조회한다(MOCK)."""
    return [dict(product) for product in _LOAN_PRODUCT_CATALOG]


def compute_preferential_rate(base_rate: float, composite_score: float) -> float:
    """ESG 종합 점수에 따른 우대(실효) 연이자율을 계산한다(MOCK).

    점수가 높을수록 할인폭이 커진다(최대 약 2%p). 하한 3.0%.
    """
    discount = round(composite_score * 0.02, 2)  # 최대 ~1.8%p
    return max(round(base_rate - discount, 2), 3.0)


async def process_payment(payload: dict) -> dict:
    """결제를 처리한다(MOCK).

    실제로는 PG/은행 결제를 호출하지만, 여기서는 항상 성공으로 처리하고 결제 참조번호를 반환한다.
    """
    await asyncio.sleep(0.01)
    ref = f"PAY-{payload.get('investor_id', 0)}-{payload.get('amount', 0)}"
    return {"success": True, "payment_ref": ref}


async def submit_loan_application(payload: dict) -> dict:
    """대출 신청을 Bank API 로 제출한다(MOCK).

    실제로는 ESG 증명서를 포함해 은행 심사 시스템에 제출하고 외부 접수번호를 받는다.
    여기서는 항상 접수 성공으로 처리하고 결정적 접수번호를 반환한다.
    """
    await asyncio.sleep(0.01)
    ref = f"BANK-REF-{payload.get('merchant_id', 0)}-{payload.get('product_code', 'NA')}"
    return {"accepted": True, "external_ref": ref}
