"""AI 분석 엔진 — 업로드 데이터 실측 분석 + 합성 폴백.

실제 CSV가 파싱된 경우 `analytics` 모듈이 매출 추세 회귀 예측·비용 비율 분석·이상치
탐지를 수행한다(진짜 데이터 기반). 파싱 데이터가 없으면(시드/데모) 설계서(UC4) 출력
형태를 따르는 결정적 합성값을 반환한다. (외부 ML 모델 실연동은 Phase 5)
"""

from app.models.business import BusinessData
from app.services import analytics


def generate_analysis(business_data: BusinessData, parsed: dict | None = None) -> dict:
    """업로드된 경영 데이터에 대한 분석 결과를 생성한다.

    `parsed`(실제 CSV 파싱 결과)가 있으면 실측 분석을, 없으면 합성 분석을 반환한다.
    """
    if parsed is not None:
        return analytics.analyze(parsed)
    return _synthetic(business_data)


def _synthetic(business_data: BusinessData) -> dict:
    """파싱 데이터가 없을 때의 결정적 합성 분석(시드/데모용, 설계 UC4 형태)."""
    # 파일 크기를 시드처럼 사용해 결정적이지만 데이터마다 다른 값을 만든다.
    seed = business_data.file_size % 100
    base_sales = 1000 + seed * 10
    forecast = [base_sales, base_sales + 150, base_sales + 300]
    # 신뢰 구간(±12%) — 예측 불확실성 표현(mock)
    lower = [round(v * 0.88) for v in forecast]
    upper = [round(v * 1.12) for v in forecast]
    # 합성 손익(월 매출 추정의 약 38% 이익률) — 데모 일관성용
    monthly_rev_won = base_sales * 10000
    margin = 0.34 + (seed % 12) / 100  # 34~45%
    op_profit = round(monthly_rev_won * margin)
    total_exp = monthly_rev_won - op_profit
    # 합성 비용 구조(업종 통상 비중) — 데모용
    _exp_w = {"재료비": 0.46, "인건비": 0.30, "임대료": 0.16, "공과금": 0.08}
    profit = {
        "total_revenue": monthly_rev_won,
        "total_expense": total_exp,
        "operating_profit": op_profit,
        "profit_margin": round(margin * 100, 1),
        "has_expense": True,
        "expense_breakdown": [
            {"label": k, "amount": round(total_exp * w), "ratio": round(total_exp * w / monthly_rev_won * 100, 1)}
            for k, w in _exp_w.items()
        ],
    }

    return {
        "summary": (
            f"최근 매출은 안정적 상승세이며, 90일 내 약 {base_sales + 300}만원까지 성장이 예상됩니다. "
            f"임대료·인건비 최적화 시 영업이익률 추가 개선 여지가 있습니다."
        ),
        "sales_forecast": {
            "unit": "만원",
            "labels": ["1개월", "2개월", "3개월"],
            "next_3_months": forecast,
            "confidence_lower": lower,
            "confidence_upper": upper,
            "confidence_level": 0.9,
        },
        "cost_optimization_tips": [
            {"title": "임대료 재협상", "detail": "고정비 중 임대료 비중이 업종 평균 대비 높습니다.", "impact": "월 약 6% 절감"},
            {"title": "탄력 근무 도입", "detail": "비수기 인건비를 탄력 근무로 조정할 수 있습니다.", "impact": "월 약 8% 절감"},
            {"title": "에너지 효율 설비", "detail": "고효율 설비 교체 시 ESG 환경 점수가 상승합니다.", "impact": "ESG +3pt"},
        ],
        "anomalies": [
            {"category": "공과금", "month": "최근월", "severity": "high", "note": "전월 대비 +38% 급증 — 검토 필요"},
        ]
        if seed % 3 == 0
        else [],
        "district_comparison": {
            "your_percentile": 50 + (seed % 40),
            "district_avg_sales": base_sales - 120,
            "your_sales": base_sales,
            "metrics": {
                "매출": 50 + (seed % 40),
                "재방문율": 40 + (seed % 50),
                "객단가": 45 + (seed % 45),
                "리뷰점수": 55 + (seed % 35),
            },
            "note": "동일 상권 동종 업종 대비 백분위",
        },
        "profit": profit,
    }
