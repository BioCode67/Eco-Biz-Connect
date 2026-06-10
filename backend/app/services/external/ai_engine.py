"""AI 분석 엔진 외부연동 — MOCK 구현.

실제로는 LSTM 시계열 예측 모델(PyTorch/TensorFlow)을 호출하지만,
여기서는 결정적인 가짜 분석 결과를 생성해 반환한다. Phase 5 에서 실제 모델로 교체한다.
"""

from app.models.business import BusinessData


def generate_analysis(business_data: BusinessData) -> dict:
    """업로드된 경영 데이터에 대한 AI 분석 결과(mock)를 생성한다."""
    # 파일 크기를 시드처럼 사용해 결정적이지만 데이터마다 다른 값을 만든다.
    seed = business_data.file_size % 100
    base_sales = 1000 + seed * 10
    return {
        "summary": f"최근 매출 추세는 안정적이며, 다음 분기 약 {base_sales + 300}만원 매출이 예상됩니다.",
        "sales_forecast": {
            "unit": "만원",
            "next_3_months": [base_sales, base_sales + 150, base_sales + 300],
        },
        "cost_optimization_tips": [
            "고정비 중 임대료 비중이 높습니다. 재협상을 검토하세요.",
            "비수기 인건비를 탄력 근무로 약 8% 절감할 수 있습니다.",
            "에너지 효율 설비 교체 시 ESG 환경 점수가 상승합니다.",
        ],
        "district_comparison": {
            "your_percentile": 50 + (seed % 40),
            "district_avg_sales": base_sales - 120,
            "note": "동일 상권 동종 업종 대비 상대 위치",
        },
    }
