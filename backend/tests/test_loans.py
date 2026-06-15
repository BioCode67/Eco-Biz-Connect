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
        json={"financial_product_id": product["id"], "amount": 10_000_000, "term_months": 24, "consent": True},
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
        json={"financial_product_id": product["id"], "amount": 10_000_000_000, "term_months": 24, "consent": True},
    )
    assert res.status_code == 400


def test_apply_loan_requires_consent(client, merchant_payload):
    headers, product = _prepare_merchant_with_match(client, merchant_payload)
    res = client.post(
        "/loans/apply",
        headers=headers,
        json={"financial_product_id": product["id"], "amount": 5_000_000, "term_months": 12, "consent": False},
    )
    assert res.status_code == 400


def test_apply_loan_duplicate_blocked(client, merchant_payload):
    headers, product = _prepare_merchant_with_match(client, merchant_payload)
    body = {"financial_product_id": product["id"], "amount": 5_000_000, "term_months": 12, "consent": True}
    assert client.post("/loans/apply", headers=headers, json=body).status_code == 201
    assert client.post("/loans/apply", headers=headers, json=body).status_code == 409


def test_bank_webhook_updates_status(client, merchant_payload):
    headers, product = _prepare_merchant_with_match(client, merchant_payload)
    loan = client.post(
        "/loans/apply",
        headers=headers,
        json={"financial_product_id": product["id"], "amount": 5_000_000, "term_months": 12, "consent": True},
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


def test_bank_webhook_cannot_overturn_final_decision(client, merchant_payload):
    """확정(APPROVED/REJECTED)된 대출은 웹훅 재전송으로 번복되지 않는다(멱등성)."""
    headers, product = _prepare_merchant_with_match(client, merchant_payload)
    loan = client.post(
        "/loans/apply",
        headers=headers,
        json={"financial_product_id": product["id"], "amount": 5_000_000, "term_months": 12, "consent": True},
    ).json()
    client.post(f"/loans/{loan['id']}/bank-webhook", json={"decision": "APPROVED", "reason": "신용 양호"})
    # 이미 APPROVED → REJECTED 로 뒤집기 시도
    res = client.post(f"/loans/{loan['id']}/bank-webhook", json={"decision": "REJECTED", "reason": "번복 시도"})
    assert res.status_code == 409
    # 원래 결정이 보존됨
    assert client.get(f"/loans/{loan['id']}", headers=headers).json()["status"] == "APPROVED"


def test_cannot_view_others_loan(client, merchant_payload, investor_payload):
    headers, product = _prepare_merchant_with_match(client, merchant_payload)
    loan = client.post(
        "/loans/apply",
        headers=headers,
        json={"financial_product_id": product["id"], "amount": 5_000_000, "term_months": 12, "consent": True},
    ).json()
    other = {
        "email": "merchant2@example.com",
        "password": "Secret123!",
        "role": "MERCHANT",
        "business_reg_no": "999-88-77665",
    }
    other_headers = auth_headers(client, other)
    res = client.get(f"/loans/{loan['id']}", headers=other_headers)
    assert res.status_code == 404
