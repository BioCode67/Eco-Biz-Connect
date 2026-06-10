"""UC11 포트폴리오/배당 테스트."""

from tests.conftest import auth_headers


def _issue_sto(client, admin_headers, supply=1000, price="5000.00"):
    body = {"asset_type": "SOLAR", "name": "태양광 1호", "total_token_supply": supply, "token_price": price}
    return client.post("/sto", headers=admin_headers, json=body).json()


def _buy(client, inv_headers, asset_id, qty):
    return client.post(f"/marketplace/{asset_id}/purchase", headers=inv_headers, json={"quantity": qty})


def test_portfolio_reflects_holdings(client, admin_payload, investor_payload):
    admin_headers = auth_headers(client, admin_payload)
    asset = _issue_sto(client, admin_headers)
    inv_headers = auth_headers(client, investor_payload)
    client.post("/investor/kyc/verify", headers=inv_headers)
    _buy(client, inv_headers, asset["id"], 10)

    res = client.get("/portfolio", headers=inv_headers)
    assert res.status_code == 200
    body = res.json()
    assert float(body["total_invested"]) == 50000.0
    assert len(body["holdings"]) == 1
    assert body["holdings"][0]["quantity"] == 10


def test_dividend_distribution_and_entitlement(client, admin_payload, investor_payload):
    admin_headers = auth_headers(client, admin_payload)
    asset = _issue_sto(client, admin_headers)
    inv_headers = auth_headers(client, investor_payload)
    client.post("/investor/kyc/verify", headers=inv_headers)
    _buy(client, inv_headers, asset["id"], 10)

    # 관리자 배당 분배: 토큰당 100원
    dist = client.post(
        f"/sto/{asset['id']}/dividend", headers=admin_headers, json={"per_token_amount": "100.00"}
    )
    assert dist.status_code == 201
    assert dist.json()["on_chain_tx_hash"].startswith("0x")

    # 투자자 배당 내역: 10토큰 × 100원 = 1000원
    divs = client.get("/dividends", headers=inv_headers).json()
    assert len(divs) == 1
    assert divs[0]["my_quantity"] == 10
    assert float(divs[0]["my_dividend"]) == 1000.0

    # 포트폴리오 배당 합계 반영
    portfolio = client.get("/portfolio", headers=inv_headers).json()
    assert float(portfolio["total_dividends_received"]) == 1000.0


def test_merchant_cannot_distribute_dividend(client, admin_payload, merchant_payload):
    admin_headers = auth_headers(client, admin_payload)
    asset = _issue_sto(client, admin_headers)
    merchant_headers = auth_headers(client, merchant_payload)
    res = client.post(
        f"/sto/{asset['id']}/dividend", headers=merchant_headers, json={"per_token_amount": "100.00"}
    )
    assert res.status_code == 403
