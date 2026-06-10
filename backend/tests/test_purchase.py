"""UC10 STO 토큰 구매 테스트."""

from tests.conftest import auth_headers


def _issue_sto(client, admin_payload, supply=1000):
    headers = auth_headers(client, admin_payload)
    body = {
        "asset_type": "SOLAR",
        "name": "태양광 1호",
        "total_token_supply": supply,
        "token_price": "5000.00",
    }
    return client.post("/sto", headers=headers, json=body).json()


def _verified_investor(client, investor_payload):
    headers = auth_headers(client, investor_payload)
    client.post("/investor/kyc/verify", headers=headers)
    return headers


def test_purchase_requires_kyc(client, admin_payload, investor_payload):
    asset = _issue_sto(client, admin_payload)
    headers = auth_headers(client, investor_payload)  # KYC 미인증
    res = client.post(f"/marketplace/{asset['id']}/purchase", headers=headers, json={"quantity": 10})
    assert res.status_code == 403


def test_purchase_success_decrements_supply(client, admin_payload, investor_payload):
    asset = _issue_sto(client, admin_payload, supply=1000)
    headers = _verified_investor(client, investor_payload)
    res = client.post(f"/marketplace/{asset['id']}/purchase", headers=headers, json={"quantity": 10})
    assert res.status_code == 201
    body = res.json()
    assert body["quantity_purchased"] == 10
    assert float(body["total_amount_paid"]) == 50000.0
    assert body["on_chain_tx_hash"].startswith("0x")
    # 잔여 토큰 차감 확인
    detail = client.get(f"/marketplace/{asset['id']}", headers=headers).json()
    assert detail["remaining_tokens"] == 990
    # 투자자 총 투자액 갱신
    me = client.get("/auth/me", headers=headers).json()
    assert float(me["total_invested"]) == 50000.0


def test_purchase_exceeds_supply(client, admin_payload, investor_payload):
    asset = _issue_sto(client, admin_payload, supply=5)
    headers = _verified_investor(client, investor_payload)
    res = client.post(f"/marketplace/{asset['id']}/purchase", headers=headers, json={"quantity": 10})
    assert res.status_code == 409


def test_buying_all_marks_sold_out(client, admin_payload, investor_payload):
    asset = _issue_sto(client, admin_payload, supply=5)
    headers = _verified_investor(client, investor_payload)
    res = client.post(f"/marketplace/{asset['id']}/purchase", headers=headers, json={"quantity": 5})
    assert res.status_code == 201
    detail = client.get(f"/marketplace/{asset['id']}", headers=headers).json()
    assert detail["status"] == "SOLD_OUT"
    assert detail["remaining_tokens"] == 0
