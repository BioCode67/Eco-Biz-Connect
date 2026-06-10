"""UC12 거래 내역 조회 테스트."""

from tests.conftest import auth_headers


def test_investor_history_lists_purchases(client, admin_payload, investor_payload):
    admin_headers = auth_headers(client, admin_payload)
    asset = client.post(
        "/sto",
        headers=admin_headers,
        json={"asset_type": "SOLAR", "name": "태양광", "total_token_supply": 1000, "token_price": "5000.00"},
    ).json()
    inv_headers = auth_headers(client, investor_payload)
    client.post("/investor/kyc/verify", headers=inv_headers)
    client.post(f"/marketplace/{asset['id']}/purchase", headers=inv_headers, json={"quantity": 3})

    res = client.get("/transactions", headers=inv_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["type"] == "TOKEN_PURCHASE"
    assert float(body["items"][0]["amount"]) == 15000.0


def test_merchant_history_lists_loans(client, merchant_payload):
    headers = auth_headers(client, merchant_payload)
    client.post(
        "/business-data/upload",
        headers=headers,
        files={"file": ("s.csv", b"a,b\n1,2\n", "text/csv")},
    )
    product = client.get("/products/match", headers=headers).json()[0]
    client.post(
        "/loans/apply",
        headers=headers,
        json={"financial_product_id": product["id"], "amount": 1_000_000, "term_months": 12},
    )
    res = client.get("/transactions", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["type"] == "LOAN_APPLICATION"
    assert body["items"][0]["status"] == "UNDER_REVIEW"


def test_empty_history(client, investor_payload):
    headers = auth_headers(client, investor_payload)
    res = client.get("/transactions", headers=headers)
    assert res.status_code == 200
    assert res.json()["total"] == 0
    assert res.json()["items"] == []


def test_pagination(client, admin_payload, investor_payload):
    admin_headers = auth_headers(client, admin_payload)
    asset = client.post(
        "/sto",
        headers=admin_headers,
        json={"asset_type": "WIND", "name": "풍력", "total_token_supply": 1000, "token_price": "100.00"},
    ).json()
    inv_headers = auth_headers(client, investor_payload)
    client.post("/investor/kyc/verify", headers=inv_headers)
    for _ in range(3):
        client.post(f"/marketplace/{asset['id']}/purchase", headers=inv_headers, json={"quantity": 1})

    page1 = client.get("/transactions?page=1&page_size=2", headers=inv_headers).json()
    assert page1["total"] == 3
    assert len(page1["items"]) == 2
    page2 = client.get("/transactions?page=2&page_size=2", headers=inv_headers).json()
    assert len(page2["items"]) == 1
