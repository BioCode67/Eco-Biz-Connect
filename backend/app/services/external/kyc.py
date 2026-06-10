"""KYC(고객 신원 확인) 외부연동 — MOCK 구현.

실제로는 본인확인기관/CDD 절차를 거치지만, 여기서는 항상 통과로 처리한다.
Phase 5 에서 실제 KYC 공급자로 교체한다.
"""

import asyncio


async def verify_identity(wallet_address: str | None) -> bool:
    """투자자 신원을 검증한다(MOCK). 지갑 주소가 있으면 통과."""
    await asyncio.sleep(0.01)
    return bool(wallet_address)
