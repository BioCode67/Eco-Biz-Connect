# Eco-Biz Connect — 백엔드 (FastAPI)

Phase 0 뼈대. 헬스체크와 설정/CORS 만 있고 비즈니스 로직은 아직 없다.

## 사전 준비
- Python 3.11 이상
- Docker / Docker Compose (PostgreSQL 실행용)

## 1. 데이터베이스 띄우기 (docker-compose)
프로젝트 루트(이 폴더의 상위)에서 실행한다.

```bash
# 루트에 .env 가 필요하다. backend/.env.example 를 참고해 만든다.
cp backend/.env.example .env

# PostgreSQL 16 컨테이너 시작 (백그라운드)
docker compose up -d

# 상태 확인
docker compose ps

# 종료
docker compose down
```

데이터는 `pgdata` 볼륨에 영속화되므로 컨테이너를 내려도 보존된다.

## 2. 가상환경 + 의존성 설치
`backend/` 폴더에서 실행한다.

```bash
cd backend

# 가상환경 생성 및 활성화
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 의존성 설치
pip install --upgrade pip
pip install -r requirements.txt

# 백엔드 설정용 .env 준비 (값은 예시 그대로 로컬 개발에 사용 가능)
cp .env.example .env
```

## 3. DB 마이그레이션 (Alembic)
DB(docker compose) 가 떠 있는 상태에서 `backend/` 폴더, 가상환경 활성화 후:

```bash
alembic upgrade head      # 최신 스키마 적용 (users 테이블 생성)
# 모델 변경 후 새 마이그레이션 생성:
# alembic revision --autogenerate -m "메시지"
```

## 4. 서버 실행
```bash
# backend/ 폴더, 가상환경 활성화 상태에서
uvicorn app.main:app --reload --port 8000
```

- API 문서(Swagger): http://localhost:8000/docs
- 헬스체크: http://localhost:8000/health

## 5. 헬스체크 동작 확인
서버가 뜬 뒤 다른 터미널에서:

```bash
curl http://localhost:8000/health
# 기대 결과: {"status":"ok"}
```

또는 브라우저로 http://localhost:8000/health 접속.

## 6. 테스트 실행
```bash
# backend/ 폴더, 가상환경 활성화 상태에서 (DB 불필요 — 인메모리 SQLite 사용)
pytest -q
```

## API 개요 (UC1~UC13)

### 인증 (Phase 1, UC1·UC2)
| 메서드 | 경로 | 설명 |
| :--- | :--- | :--- |
| POST | `/auth/register` | 회원가입(UC1). 이메일 중복 확인, bcrypt 해시, role 지정. Merchant 사업자번호 mock 검증. |
| POST | `/auth/login` | 로그인(UC2). JWT access/refresh. 5회 실패 시 15분 잠금, 정지 계정 차단. |
| POST | `/auth/refresh` | 리프레시 토큰으로 재발급. |
| GET | `/auth/me` | 현재 사용자 조회. |

### 소상공인 (Phase 2, UC3~UC7)
| 메서드 | 경로 | UC | 설명 |
| :--- | :--- | :--- | :--- |
| POST | `/business-data/upload` | UC3 | 경영 데이터 업로드(CSV/Excel) → 분석 파이프라인 트리거. |
| GET | `/business-data` | UC3 | 내 업로드 목록. |
| GET | `/reports/latest`, `/reports/by-business-data/{id}` | UC4 | AI 분석 리포트 조회. |
| GET | `/esg/me`, `/esg/history` | UC5 | ESG 점수 조회(블록체인 앵커링). |
| GET | `/products/match` | UC6 | ESG 기반 우대 대출 상품 매칭. |
| POST | `/loans/apply`, `GET /loans`, `GET /loans/{id}` | UC7 | 대출 신청/조회. |
| POST | `/loans/{id}/bank-webhook` | UC7 | 은행 심사 결과 콜백(mock). |

### 투자자·관리자 (Phase 2, UC8~UC13)
| 메서드 | 경로 | UC | 설명 |
| :--- | :--- | :--- | :--- |
| POST | `/sto`, `GET /sto` | UC8 | STO 발행/목록(관리자). ERC-1400 컨트랙트 배포 mock. |
| GET | `/marketplace`, `/marketplace/{id}` | UC9 | STO 상품 탐색(투자자). |
| POST | `/investor/kyc/verify` | UC10 | KYC 검증(mock). |
| POST | `/marketplace/{id}/purchase` | UC10 | 토큰 구매(결제·온체인 mock). |
| POST | `/sto/{id}/dividend` | UC11 | 배당 분배(관리자). |
| GET | `/portfolio`, `/dividends` | UC11 | 포트폴리오·배당 조회(투자자). |
| GET | `/transactions` | UC12 | 거래 내역(역할별, 페이지네이션). |
| GET | `/admin/monitor` | UC13 | 시스템 모니터링(관리자). |
| GET/POST | `/admin/users`, `/admin/users/{id}/suspend\|restore\|role` | UC13 | 사용자 관리(감사 로그 기록). |
| GET | `/admin/audit-log` | UC13 | 감사 로그 조회. |

> 모든 외부연동(Bank API, AI 엔진, 블록체인, KYC, 오브젝트 스토리지)은 `app/services/external/` 의 **mock** 이다. Phase 5 에서 실제 연동으로 교체한다.

## 폴더 구조
```
backend/
  app/
    main.py            # FastAPI 인스턴스, /health, CORS, 라우터 등록
    core/
      config.py        # pydantic-settings 로 .env 읽는 설정
      database.py      # SQLAlchemy 엔진/세션/Base/get_db
      security.py      # bcrypt 해시, JWT 발급·검증
    models/
      user.py          # User 단일 테이블 + role(MERCHANT/INVESTOR/ADMIN)
    schemas/
      auth.py          # 회원가입/로그인/토큰 pydantic 스키마
    api/
      deps.py          # get_current_user, require_roles 의존성
      routers/
        auth.py        # /auth/register, /login, /refresh, /me
    services/
      external/
        bank_api.py    # 사업자번호 검증 (mock)
  alembic/             # DB 마이그레이션 (env.py, versions/)
  alembic.ini
  tests/               # pytest (health, auth)
  requirements.txt
  .env.example         # 환경변수 키/예시 (실제 비밀값 없음)
  README.md
```
