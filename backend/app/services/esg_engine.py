"""ESG 점수 산출 엔진.

설계서 3.5: 종합 점수 = 환경×0.40 + 사회×0.35 + 지배구조×0.25 (가중 평균).
실제 CSV가 파싱된 경우 데이터 신호로 각 차원을 산출한다:
  - 환경(E): 공과금(에너지) 비중이 낮을수록 ↑ (에너지 효율)
  - 사회(S): 인건비 비중이 높을수록 ↑ (지역 고용 기여)
  - 지배구조(G): 매출 변동성이 낮을수록 ↑ (안정적·예측가능 경영)
파싱 데이터가 없으면(시드) 결정적 합성값을 사용한다.
"""

import math

from app.models.business import BusinessData

ENV_WEIGHT = 0.40
SOCIAL_WEIGHT = 0.35
GOVERNANCE_WEIGHT = 0.25


def _clamp(v: float, lo: float = 45.0, hi: float = 95.0) -> float:
    return round(max(lo, min(hi, v)), 2)


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


def calculate(business_data: BusinessData, parsed: dict | None = None) -> dict:
    """경영 데이터로부터 ESG 점수를 산출한다.

    `parsed`(실제 CSV 파싱 결과)가 있으면 비용 비율·매출 안정성 신호로 산출하고,
    없으면 결정적 합성값으로 대체한다.
    """
    if parsed is not None:
        result = _from_data(parsed)
        if result is not None:
            return result

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


def _from_data(parsed: dict) -> dict | None:
    """실제 매출·지출 데이터 신호로 ESG 3축을 산출한다."""
    revenues = parsed.get("revenues") or []
    total_rev = sum(revenues)
    if total_rev <= 0 or len(revenues) < 2:
        return None
    exp = parsed.get("expense_totals", {})

    # 환경: 공과금(에너지) 비중이 낮을수록 효율적 → 높은 점수 (기준 4%)
    util_ratio = exp.get("공과금", 0.0) / total_rev
    env = _clamp(90 - (util_ratio - 0.04) * 600)

    # 사회: 인건비 비중이 높을수록 지역 고용 기여 ↑ (기준 25% → 78점 근방)
    labor_ratio = exp.get("인건비", 0.0) / total_rev
    social = _clamp(55 + labor_ratio * 110) if labor_ratio > 0 else 60.0

    # 지배구조: 매출 변동성(변동계수)이 낮을수록 안정·예측가능 경영 → 높은 점수
    mean = total_rev / len(revenues)
    var = sum((r - mean) ** 2 for r in revenues) / len(revenues)
    cv = (math.sqrt(var) / mean) if mean else 0.5
    governance = _clamp(92 - cv * 120)

    composite = round(env * ENV_WEIGHT + social * SOCIAL_WEIGHT + governance * GOVERNANCE_WEIGHT, 2)
    return {
        "env_score": env,
        "social_score": social,
        "governance_score": governance,
        "composite_score": composite,
        "score_grade": _grade(composite),
    }
