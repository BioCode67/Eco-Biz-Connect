"""블록체인 검증 엔드포인트 테스트."""

from tests.conftest import auth_headers


def test_verify_esg_anchor(client, merchant_payload):
    headers = auth_headers(client, merchant_payload)
    client.post(
        "/business-data/upload",
        headers=headers,
        files={"file": ("s.csv", b"date,amount\n2026-01-01,1000\n", "text/csv")},
    )
    esg = client.get("/esg/me", headers=headers).json()
    tx = esg["on_chain_tx_hash"]
    res = client.get(f"/chain/verify/{tx}", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["verified"] is True
    assert body["record_type"] == "ESG_ANCHOR"
    assert body["network_id"]


def test_verify_unknown_tx(client, investor_payload):
    headers = auth_headers(client, investor_payload)
    assert client.get("/chain/verify/0xdeadbeef", headers=headers).status_code == 404
