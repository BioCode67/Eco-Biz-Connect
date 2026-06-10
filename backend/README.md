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

## 3. 서버 실행
```bash
# backend/ 폴더, 가상환경 활성화 상태에서
uvicorn app.main:app --reload --port 8000
```

- API 문서(Swagger): http://localhost:8000/docs
- 헬스체크: http://localhost:8000/health

## 4. 헬스체크 동작 확인
서버가 뜬 뒤 다른 터미널에서:

```bash
curl http://localhost:8000/health
# 기대 결과: {"status":"ok"}
```

또는 브라우저로 http://localhost:8000/health 접속.

## 폴더 구조
```
backend/
  app/
    main.py          # FastAPI 인스턴스, /health, CORS
    core/
      config.py      # pydantic-settings 로 .env 읽는 설정
  requirements.txt
  .env.example       # 환경변수 키/예시 (실제 비밀값 없음)
  README.md
```
