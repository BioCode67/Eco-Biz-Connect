"""AI 분석 엔진 외부연동 — MOCK 구현.

실제로는 LSTM 시계열 예측 모델(PyTorch/TensorFlow)을 호출하지만,
여기서는 결정적인 가짜 분석 결과를 생성해 반환한다. Phase 5 에서 실제 모델로 교체한다.
"""

from app.models.business import BusinessData


def generate_analysis(business_data: BusinessData) -> dict:
    """업로드된 경영 데이터에 대한 AI 분석 결과(mock)를 생성한다.

    설계서(UC4)의 출력 형태를 따른다: 신뢰 구간이 포함된 매출 예측,
    이상치 플래그가 표시된 비용 항목, 상권 비교, 등.
    """
    # 파일 크기를 시드처럼 사용해 결정적이지만 데이터마다 다른 값을 만든다.
    seed = business_data.file_size % 100
    base_sales = 1000 + seed * 10
    forecast = [base_sales, base_sales + 150, base_sales + 300]
    # 신뢰 구간(±12%) — LSTM 앙상블 예측 불확실성 표현(mock)
    lower = [round(v * 0.88) for v in forecast]
    upper = [round(v * 1.12) for v in forecast]

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
    }
