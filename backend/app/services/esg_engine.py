"""ESG 점수 산출 엔진 — MOCK 구현.

설계서 3.5: 종합 점수 = 환경×0.40 + 사회×0.35 + 지배구조×0.25 (가중 평균).
실제 산출 입력값 추출 로직 대신, 분석 결과로부터 결정적인 가짜 점수를 만든다.
"""

from app.models.business import BusinessData

ENV_WEIGHT = 0.40
SOCIAL_WEIGHT = 0.35
GOVERNANCE_WEIGHT = 0.25


def _grade(composite: float) -> str:
    """종합 점수를 등급으로 변환한다(설계서 6단계: A/B+/B/C+/C/D)."""
    if composite >= 90:
        return "A"
    if composite >= 80:
        return "B+"
    if composite >= 70:
        return "B"
    if composite >= 60:
        return "C+"
    if composite >= 50:
        return "C"
    return "D"


def calculate(business_data: BusinessData) -> dict:
    """경영 데이터로부터 ESG 점수를 산출한다(mock, 결정적)."""
    seed = business_data.file_size
    env = 60 + seed % 30
    social = 55 + seed % 35
    governance = 50 + seed % 40
    composite = round(env * ENV_WEIGHT + social * SOCIAL_WEIGHT + governance * GOVERNANCE_WEIGHT, 2)
    return {
        "env_score": float(env),
        "social_score": float(social),
        "governance_score": float(governance),
        "composite_score": composite,
        "score_grade": _grade(composite),
    }
