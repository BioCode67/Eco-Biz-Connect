"""실데이터 분석 엔진(analytics) 단위 테스트 — 진짜 계산을 검증한다."""

from app.services import analytics, esg_engine

CSV = b"""\xeb\x82\xa0\xec\xa7\x9c,\xeb\xa7\xa4\xec\xb6\x9c\xec\x95\xa1,\xeb\xa7\xa4\xec\xb6\x9c\xea\xb1\xb4\xec\x88\x98,\xea\xb0\x9d\xeb\x8b\xa8\xea\xb0\x80,\xec\xa7\x80\xec\xb6\x9c_\xec\x9e\xac\xeb\xa3\x8c\xeb\xb9\x84,\xec\xa7\x80\xec\xb6\x9c_\xec\x9d\xb8\xea\xb1\xb4\xeb\xb9\x84,\xec\xa7\x80\xec\xb6\x9c_\xec\x9e\x84\xeb\x8c\x80\xeb\xa3\x8c,\xec\xa7\x80\xec\xb6\x9c_\xea\xb3\xb5\xea\xb3\xbc\xea\xb8\x88
2026-04-01,1000000,80,12500,400000,200000,120000,40000
2026-04-02,1100000,85,12941,440000,200000,120000,40000
2026-04-03,1200000,90,13333,480000,200000,120000,40000
2026-04-04,1300000,95,13684,520000,200000,120000,40000
2026-04-05,1400000,100,14000,560000,200000,120000,40000
"""


def test_parse_real_csv():
    p = analytics.parse_business_csv(CSV)
    assert p is not None
    assert p["rows"] == 5
    assert sum(p["revenues"]) == 6_000_000
    assert p["expense_totals"]["재료비"] == 2_400_000
    assert p["expense_totals"]["인건비"] == 1_000_000


def test_analyze_uses_real_numbers():
    p = analytics.parse_business_csv(CSV)
    a = analytics.analyze(p)
    # 총매출 600만원 → summary 에 반영
    assert "600만원" in a["summary"]
    # 매출이 명확히 상승 추세 → 예측이 증가 방향
    fc = a["sales_forecast"]["next_3_months"]
    assert fc[-1] >= fc[0]
    # 재료비 40% > 권장 35% → 절감 제안 생성
    titles = " ".join(t["title"] for t in a["cost_optimization_tips"])
    assert "재료비" in titles
    # 신뢰구간 lower <= forecast <= upper
    lo = a["sales_forecast"]["confidence_lower"]
    up = a["sales_forecast"]["confidence_upper"]
    assert all(l <= f <= u for l, f, u in zip(lo, fc, up))


def test_analyze_metrics_accurate():
    p = analytics.parse_business_csv(CSV)
    a = analytics.analyze(p)
    m = a["_metrics"]
    assert m["total_revenue"] == 6_000_000
    assert m["days"] == 5
    assert m["expense_ratios"]["재료비"] == 0.4


def test_operating_profit():
    # CSV: 매출 600만, 비용 재료240+인건100+임대60+공과20 = 420만 → 이익 180만(30%)
    p = analytics.parse_business_csv(CSV)
    a = analytics.analyze(p)
    pr = a["profit"]
    assert pr["total_revenue"] == 6_000_000
    assert pr["total_expense"] == 4_200_000
    assert pr["operating_profit"] == 1_800_000
    assert pr["profit_margin"] == 30.0
    assert "영업이익" in a["summary"]


def test_esg_from_real_data():
    p = analytics.parse_business_csv(CSV)
    scores = esg_engine._from_data(p)
    assert scores is not None
    # 가중합 일관성
    expected = round(
        scores["env_score"] * esg_engine.ENV_WEIGHT
        + scores["social_score"] * esg_engine.SOCIAL_WEIGHT
        + scores["governance_score"] * esg_engine.GOVERNANCE_WEIGHT,
        2,
    )
    assert abs(scores["composite_score"] - expected) < 0.01
    assert 45 <= scores["env_score"] <= 95


def test_parse_rejects_non_business_csv():
    assert analytics.parse_business_csv(b"foo,bar\n1,2\n3,4\n") is None
    assert analytics.parse_business_csv(b"\xff\xfe garbage") is None
