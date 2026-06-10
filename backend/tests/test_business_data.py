"""UC3 경영 데이터 업로드 테스트."""

from tests.conftest import auth_headers


def test_upload_csv_success(client, merchant_payload):
    headers = auth_headers(client, merchant_payload)
    files = {"file": ("sales.csv", b"date,amount\n2026-01-01,1000\n", "text/csv")}
    res = client.post("/business-data/upload", headers=headers, files=files)
    assert res.status_code == 201
    body = res.json()
    assert body["file_name"] == "sales.csv"
    # 파이프라인이 AI 분석까지 진행됨(UC4 확장)
    assert body["processing_status"] == "AI_COMPLETED"


def test_upload_rejects_unsupported_extension(client, merchant_payload):
    headers = auth_headers(client, merchant_payload)
    files = {"file": ("malware.exe", b"x", "application/octet-stream")}
    res = client.post("/business-data/upload", headers=headers, files=files)
    assert res.status_code == 415


def test_upload_rejects_empty_file(client, merchant_payload):
    headers = auth_headers(client, merchant_payload)
    files = {"file": ("empty.csv", b"", "text/csv")}
    res = client.post("/business-data/upload", headers=headers, files=files)
    assert res.status_code == 400


def test_investor_cannot_upload(client, investor_payload):
    headers = auth_headers(client, investor_payload)
    files = {"file": ("sales.csv", b"a,b\n1,2\n", "text/csv")}
    res = client.post("/business-data/upload", headers=headers, files=files)
    assert res.status_code == 403


def test_list_my_business_data(client, merchant_payload):
    headers = auth_headers(client, merchant_payload)
    files = {"file": ("sales.csv", b"a,b\n1,2\n", "text/csv")}
    client.post("/business-data/upload", headers=headers, files=files)
    res = client.get("/business-data", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) == 1
