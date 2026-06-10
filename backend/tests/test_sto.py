"""UC8 탄소 STO 발행 테스트."""

from tests.conftest import auth_headers


def _sto_body() -> dict:
    return {
        "asset_type": "SOLAR",
        "name": "영남 태양광 1호",
        "description": "옥상 태양광 발전 자산",
        "total_token_supply": 10000,
        "token_price": "5000.00",
    }


def test_admin_issues_sto(client, admin_payload):
    headers = auth_headers(client, admin_payload)
    res = client.post("/sto", headers=headers, json=_sto_body())
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "LISTED"
    assert body["remaining_tokens"] == 10000
    assert body["contract_address"].startswith("0x")


def test_merchant_cannot_issue_sto(client, merchant_payload):
    headers = auth_headers(client, merchant_payload)
    res = client.post("/sto", headers=headers, json=_sto_body())
    assert res.status_code == 403


def test_admin_lists_sto(client, admin_payload):
    headers = auth_headers(client, admin_payload)
    client.post("/sto", headers=headers, json=_sto_body())
    res = client.get("/sto", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 1
