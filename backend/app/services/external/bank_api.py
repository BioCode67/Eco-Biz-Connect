"""Bank API 외부연동 — MOCK 구현.

설계서 규칙에 따라 처음에는 실제 연동하지 않고 인터페이스만 맞춘 가짜 구현을 둔다.
실제 연동은 Phase 5 에서 교체한다(인터페이스 시그니처는 유지).
"""

import asyncio
import re

# ESG 등급 순서(높을수록 우대). 매칭 가능 여부 비교에 사용한다.
GRADE_ORDER = {"D": 0, "C": 1, "B": 2, "A": 3}

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


async def verify_business_registration(business_reg_no: str | None) -> bool:
    """사업자등록번호 유효성 검증(MOCK).

    실제로는 정부 등록부(국세청 등)와 대조하지만, 여기서는 숫자 10자리이면 유효한 것으로 간주한다.
    네트워크 지연을 흉내 내기 위해 짧게 대기한다.
    """
    await asyncio.sleep(0.01)  # 외부 호출 지연 시뮬레이션
    digits = re.sub(r"\D", "", business_reg_no or "")
    return len(digits) == 10


def fetch_loan_products() -> list[dict]:
    """은행 대출 상품 카탈로그를 조회한다(MOCK)."""
    return [dict(product) for product in _LOAN_PRODUCT_CATALOG]


def compute_preferential_rate(base_rate: float, composite_score: float) -> float:
    """ESG 종합 점수에 따른 우대(실효) 연이자율을 계산한다(MOCK).

    점수가 높을수록 할인폭이 커진다(최대 약 2%p). 하한 3.0%.
    """
    discount = round(composite_score * 0.02, 2)  # 최대 ~1.8%p
    return max(round(base_rate - discount, 2), 3.0)
