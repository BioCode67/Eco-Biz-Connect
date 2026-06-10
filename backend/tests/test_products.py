"""UC6 우대 금융 상품 매칭 테스트."""

from tests.conftest import auth_headers


def _upload(client, headers):
    files = {"file": ("sales.csv", b"date,amount\n2026-01-01,3000\n", "text/csv")}
    return client.post("/business-data/upload", headers=headers, files=files).json()


def test_match_requires_esg(client, merchant_payload):
    headers = auth_headers(client, merchant_payload)
    res = client.get("/products/match", headers=headers)
    assert res.status_code == 409  # ESG 점수 없음


def test_match_returns_sorted_products(client, merchant_payload):
    headers = auth_headers(client, merchant_payload)
    _upload(client, headers)  # ESG 산출
    res = client.get("/products/match", headers=headers)
    assert res.status_code == 200
    products = res.json()
    assert len(products) >= 1
    # 실효 금리 오름차순 정렬 확인
    rates = [p["preferential_rate"] for p in products]
    assert rates == sorted(rates)
    # 우대 금리는 기본 금리 이하
    for p in products:
        assert p["preferential_rate"] <= float(p["base_rate"])


def test_investor_cannot_match(client, investor_payload):
    headers = auth_headers(client, investor_payload)
    res = client.get("/products/match", headers=headers)
    assert res.status_code == 403
