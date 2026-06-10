"""UC9 마켓플레이스 탐색 테스트."""

from tests.conftest import auth_headers


def _issue_sto(client, admin_payload, asset_type="SOLAR"):
    headers = auth_headers(client, admin_payload)
    body = {
        "asset_type": asset_type,
        "name": f"{asset_type} 자산",
        "total_token_supply": 1000,
        "token_price": "5000.00",
    }
    return client.post("/sto", headers=headers, json=body).json()


def test_investor_browses_listed_products(client, admin_payload, investor_payload):
    _issue_sto(client, admin_payload, "SOLAR")
    _issue_sto(client, admin_payload, "WIND")
    inv_headers = auth_headers(client, investor_payload)
    res = client.get("/marketplace", headers=inv_headers)
    assert res.status_code == 200
    assert len(res.json()) == 2
    assert all(item["status"] == "LISTED" for item in res.json())


def test_filter_by_asset_type(client, admin_payload, investor_payload):
    _issue_sto(client, admin_payload, "SOLAR")
    _issue_sto(client, admin_payload, "WIND")
    inv_headers = auth_headers(client, investor_payload)
    res = client.get("/marketplace?asset_type=WIND", headers=inv_headers)
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["asset_type"] == "WIND"


def test_product_detail(client, admin_payload, investor_payload):
    asset = _issue_sto(client, admin_payload)
    inv_headers = auth_headers(client, investor_payload)
    res = client.get(f"/marketplace/{asset['id']}", headers=inv_headers)
    assert res.status_code == 200
    assert res.json()["id"] == asset["id"]
