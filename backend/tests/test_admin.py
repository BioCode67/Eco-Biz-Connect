"""UC13 시스템 관리/모니터링 테스트."""

from tests.conftest import auth_headers


def test_monitor_returns_metrics(client, admin_payload):
    headers = auth_headers(client, admin_payload)
    res = client.get("/admin/monitor", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert "ai_engine" in body["subsystems"]
    assert "blockchain_network" in body["subsystems"]
    assert "bank_api" in body["subsystems"]


def test_non_admin_cannot_monitor(client, investor_payload):
    headers = auth_headers(client, investor_payload)
    assert client.get("/admin/monitor", headers=headers).status_code == 403


def test_admin_stats(client, admin_payload, merchant_payload, investor_payload):
    headers = auth_headers(client, admin_payload)
    auth_headers(client, merchant_payload)
    auth_headers(client, investor_payload)
    res = client.get("/admin/stats", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["merchants"] == 1
    assert body["investors"] == 1
    assert body["admins"] == 1
    assert body["total_users"] == 3
    assert len(body["tx_volume_7d"]) == 7


def test_suspend_blocks_login(client, admin_payload, merchant_payload):
    admin_headers = auth_headers(client, admin_payload)
    # 소상공인 가입
    auth_headers(client, merchant_payload)
    users = client.get("/admin/users", headers=admin_headers).json()
    target = next(u for u in users if u["email"] == merchant_payload["email"])

    res = client.post(f"/admin/users/{target['id']}/suspend", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["is_active"] is False

    # 정지된 계정 로그인 차단
    login = client.post(
        "/auth/login",
        json={"email": merchant_payload["email"], "password": merchant_payload["password"]},
    )
    assert login.status_code == 403

    # 복원 후 로그인 가능
    client.post(f"/admin/users/{target['id']}/restore", headers=admin_headers)
    login2 = client.post(
        "/auth/login",
        json={"email": merchant_payload["email"], "password": merchant_payload["password"]},
    )
    assert login2.status_code == 200


def test_change_role_and_audit_log(client, admin_payload, investor_payload):
    admin_headers = auth_headers(client, admin_payload)
    auth_headers(client, investor_payload)
    users = client.get("/admin/users", headers=admin_headers).json()
    target = next(u for u in users if u["email"] == investor_payload["email"])

    res = client.post(
        f"/admin/users/{target['id']}/role", headers=admin_headers, json={"role": "MERCHANT"}
    )
    assert res.status_code == 200
    assert res.json()["role"] == "MERCHANT"

    # 감사 로그에 역할 변경 기록
    logs = client.get("/admin/audit-log", headers=admin_headers).json()
    actions = [log["action"] for log in logs]
    assert "CHANGE_ROLE" in actions
