"""UC4 AI 분석 리포트 조회 테스트."""

from tests.conftest import auth_headers


def _upload(client, headers):
    files = {"file": ("sales.csv", b"date,amount\n2026-01-01,1500\n", "text/csv")}
    return client.post("/business-data/upload", headers=headers, files=files).json()


def test_latest_report_after_upload(client, merchant_payload):
    headers = auth_headers(client, merchant_payload)
    bd = _upload(client, headers)
    res = client.get("/reports/latest", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["business_data_id"] == bd["id"]
    assert "next_3_months" in body["sales_forecast"]
    assert len(body["cost_optimization_tips"]) >= 1


def test_report_by_business_data(client, merchant_payload):
    headers = auth_headers(client, merchant_payload)
    bd = _upload(client, headers)
    res = client.get(f"/reports/by-business-data/{bd['id']}", headers=headers)
    assert res.status_code == 200
    assert res.json()["business_data_id"] == bd["id"]


def test_latest_report_404_when_none(client, merchant_payload):
    headers = auth_headers(client, merchant_payload)
    res = client.get("/reports/latest", headers=headers)
    assert res.status_code == 404


def test_investor_cannot_access_reports(client, investor_payload):
    headers = auth_headers(client, investor_payload)
    res = client.get("/reports/latest", headers=headers)
    assert res.status_code == 403
