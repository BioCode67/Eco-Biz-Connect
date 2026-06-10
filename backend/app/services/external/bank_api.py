"""Bank API 외부연동 — MOCK 구현.

설계서 규칙에 따라 처음에는 실제 연동하지 않고 인터페이스만 맞춘 가짜 구현을 둔다.
실제 연동은 Phase 5 에서 교체한다(인터페이스 시그니처는 유지).
"""

import asyncio
import re


async def verify_business_registration(business_reg_no: str | None) -> bool:
    """사업자등록번호 유효성 검증(MOCK).

    실제로는 정부 등록부(국세청 등)와 대조하지만, 여기서는 숫자 10자리이면 유효한 것으로 간주한다.
    네트워크 지연을 흉내 내기 위해 짧게 대기한다.
    """
    await asyncio.sleep(0.01)  # 외부 호출 지연 시뮬레이션
    digits = re.sub(r"\D", "", business_reg_no or "")
    return len(digits) == 10
