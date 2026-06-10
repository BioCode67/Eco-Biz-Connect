"""UC5 ESG 점수 산출/조회 테스트."""

from tests.conftest import auth_headers


def _upload(client, headers):
    files = {"file": ("sales.csv", b"date,amount\n2026-01-01,2000\n", "text/csv")}
    return client.post("/business-data/upload", headers=headers, files=files).json()


def test_esg_score_generated_after_upload(client, merchant_payload):
    headers = auth_headers(client, merchant_payload)
    bd = _upload(client, headers)
    # 파이프라인이 ESG 까지 완료
    assert bd["processing_status"] == "ESG_COMPLETED"

    res = client.get("/esg/me", headers=headers)
    assert res.status_code == 200
    body = res.json()
    # 가중 평균 검증: env*0.40 + social*0.35 + gov*0.25
    expected = round(
        float(body["env_score"]) * 0.40
        + float(body["social_score"]) * 0.35
        + float(body["governance_score"]) * 0.25,
        2,
    )
    assert float(body["composite_score"]) == expected
    assert body["score_grade"] in {"A", "B", "C", "D"}
    # 블록체인 앵커링 해시가 연결됨
    assert body["on_chain_tx_hash"].startswith("0x")


def test_esg_updates_merchant_cache(client, merchant_payload):
    headers = auth_headers(client, merchant_payload)
    _upload(client, headers)
    esg = client.get("/esg/me", headers=headers).json()
    me = client.get("/auth/me", headers=headers).json()
    assert float(me["esg_score"]) == float(esg["composite_score"])


def test_esg_404_when_none(client, merchant_payload):
    headers = auth_headers(client, merchant_payload)
    res = client.get("/esg/me", headers=headers)
    assert res.status_code == 404
