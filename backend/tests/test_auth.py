"""인증 API 테스트 — 회원가입(UC1), 로그인(UC2), 토큰, 내 정보."""


def test_register_merchant_success(client, merchant_payload):
    res = client.post("/auth/register", json=merchant_payload)
    assert res.status_code == 201
    body = res.json()
    assert body["email"] == merchant_payload["email"]
    assert body["role"] == "MERCHANT"
    # 사업자번호 mock 검증 통과 → VERIFIED
    assert body["verification_status"] == "VERIFIED"
    # 응답에 비밀번호 관련 필드가 없어야 한다
    assert "password" not in body and "password_hash" not in body


def test_register_investor_success(client, investor_payload):
    res = client.post("/auth/register", json=investor_payload)
    assert res.status_code == 201
    body = res.json()
    assert body["role"] == "INVESTOR"
    assert body["kyc_status"] == "PENDING"


def test_register_duplicate_email(client, merchant_payload):
    assert client.post("/auth/register", json=merchant_payload).status_code == 201
    dup = client.post("/auth/register", json=merchant_payload)
    assert dup.status_code == 409


def test_register_merchant_invalid_business_reg(client, merchant_payload):
    merchant_payload["business_reg_no"] = "abc"  # 숫자 10자리 아님 → mock 검증 실패
    res = client.post("/auth/register", json=merchant_payload)
    assert res.status_code == 400


def test_register_merchant_missing_business_reg(client, merchant_payload):
    del merchant_payload["business_reg_no"]
    res = client.post("/auth/register", json=merchant_payload)
    assert res.status_code == 422


def test_register_short_password(client, investor_payload):
    investor_payload["password"] = "123"
    res = client.post("/auth/register", json=investor_payload)
    assert res.status_code == 422


def test_login_success(client, investor_payload):
    client.post("/auth/register", json=investor_payload)
    res = client.post(
        "/auth/login",
        json={"email": investor_payload["email"], "password": investor_payload["password"]},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["access_token"] and body["refresh_token"]
    assert body["token_type"] == "bearer"


def test_login_wrong_password(client, investor_payload):
    client.post("/auth/register", json=investor_payload)
    res = client.post(
        "/auth/login",
        json={"email": investor_payload["email"], "password": "wrongpass"},
    )
    assert res.status_code == 401


def test_login_lockout_after_five_failures(client, investor_payload):
    client.post("/auth/register", json=investor_payload)
    for _ in range(5):
        client.post(
            "/auth/login",
            json={"email": investor_payload["email"], "password": "wrongpass"},
        )
    # 6번째 시도(올바른 비밀번호여도)는 잠금 상태여야 한다
    res = client.post(
        "/auth/login",
        json={"email": investor_payload["email"], "password": investor_payload["password"]},
    )
    assert res.status_code == 423


def test_me_requires_auth(client):
    # Authorization 헤더 없음 → 인증 실패(401/403)
    assert client.get("/auth/me").status_code in (401, 403)


def test_me_returns_current_user(client, investor_payload):
    client.post("/auth/register", json=investor_payload)
    tokens = client.post(
        "/auth/login",
        json={"email": investor_payload["email"], "password": investor_payload["password"]},
    ).json()
    res = client.get("/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    assert res.status_code == 200
    assert res.json()["email"] == investor_payload["email"]


def test_refresh_issues_new_tokens(client, investor_payload):
    client.post("/auth/register", json=investor_payload)
    tokens = client.post(
        "/auth/login",
        json={"email": investor_payload["email"], "password": investor_payload["password"]},
    ).json()
    res = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert res.status_code == 200
    assert res.json()["access_token"]


def test_refresh_rejects_access_token(client, investor_payload):
    client.post("/auth/register", json=investor_payload)
    tokens = client.post(
        "/auth/login",
        json={"email": investor_payload["email"], "password": investor_payload["password"]},
    ).json()
    # access 토큰을 refresh 로 쓰면 거부되어야 한다
    res = client.post("/auth/refresh", json={"refresh_token": tokens["access_token"]})
    assert res.status_code == 401
