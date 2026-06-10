"""UC7 우대 대출 신청 테스트."""

from tests.conftest import auth_headers


def _prepare_merchant_with_match(client, merchant_payload):
    headers = auth_headers(client, merchant_payload)
    files = {"file": ("sales.csv", b"date,amount\n2026-01-01,3000\n", "text/csv")}
    client.post("/business-data/upload", headers=headers, files=files)
    products = client.get("/products/match", headers=headers).json()
    return headers, products[0]


def test_apply_loan_success(client, merchant_payload):
    headers, product = _prepare_merchant_with_match(client, merchant_payload)
    res = client.post(
        "/loans/apply",
        headers=headers,
        json={"financial_product_id": product["id"], "amount": 10_000_000, "term_months": 24},
    )
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "UNDER_REVIEW"
    assert float(body["applied_rate"]) == product["preferential_rate"]


def test_apply_loan_exceeds_max_amount(client, merchant_payload):
    headers, product = _prepare_merchant_with_match(client, merchant_payload)
    res = client.post(
        "/loans/apply",
        headers=headers,
        json={"financial_product_id": product["id"], "amount": 10_000_000_000, "term_months": 24},
    )
    assert res.status_code == 400


def test_bank_webhook_updates_status(client, merchant_payload):
    headers, product = _prepare_merchant_with_match(client, merchant_payload)
    loan = client.post(
        "/loans/apply",
        headers=headers,
        json={"financial_product_id": product["id"], "amount": 5_000_000, "term_months": 12},
    ).json()
    res = client.post(
        f"/loans/{loan['id']}/bank-webhook",
        json={"decision": "APPROVED", "reason": "신용 양호"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "APPROVED"
    # 조회 시에도 반영
    got = client.get(f"/loans/{loan['id']}", headers=headers).json()
    assert got["status"] == "APPROVED"


def test_cannot_view_others_loan(client, merchant_payload, investor_payload):
    headers, product = _prepare_merchant_with_match(client, merchant_payload)
    loan = client.post(
        "/loans/apply",
        headers=headers,
        json={"financial_product_id": product["id"], "amount": 5_000_000, "term_months": 12},
    ).json()
    other = {
        "email": "merchant2@example.com",
        "password": "secret123",
        "role": "MERCHANT",
        "business_reg_no": "999-88-77665",
    }
    other_headers = auth_headers(client, other)
    res = client.get(f"/loans/{loan['id']}", headers=other_headers)
    assert res.status_code == 404
