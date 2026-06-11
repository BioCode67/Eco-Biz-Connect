# Eco-Biz Connect — 배포 가이드 (Render + Vercel, 무료)

이 문서는 **백엔드(FastAPI)를 Render**, **웹(Next.js)을 Vercel**에 무료로 배포해
교수님이 공개 링크로 접속·평가하실 수 있게 만드는 단계별 가이드다.

```
[브라우저] → Vercel(웹, Next.js) → Render(백엔드, FastAPI) → Render PostgreSQL
```

## 0. 사전 준비
- GitHub 저장소: `https://github.com/BioCode67/Eco-Biz-Connect` (이미 푸시 완료)
- 무료 계정 2개: **Render**(render.com), **Vercel**(vercel.com) — GitHub 로그인 권장
- 배포 순서: **① Render 백엔드 먼저 → ② Vercel 웹** (웹이 백엔드 URL을 알아야 하므로)

---

## 1. Render — 백엔드 + PostgreSQL (Blueprint 방식, 권장)

저장소 루트의 `render.yaml`이 백엔드 서비스와 PostgreSQL을 자동 정의한다.

1. **render.com 로그인** → 우측 상단 **New +** → **Blueprint**
2. **Connect a repository** → `BioCode67/Eco-Biz-Connect` 선택 (처음이면 GitHub 연동 허용)
3. Render가 `render.yaml`을 자동 인식 → 생성될 리소스 미리보기:
   - `ebc-db` (PostgreSQL, Free)
   - `ebc-backend` (Web Service, Python, Free)
4. **Apply / Create** 클릭 → 빌드 시작 (3~5분 소요)
   - 빌드: `pip install -r requirements.txt`
   - 시작: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - `alembic upgrade head`가 11개 테이블을 자동 생성한다.
5. **환경변수는 대부분 자동 설정됨** (render.yaml):

   | 키 | 값 | 비고 |
   |----|----|------|
   | `DATABASE_URL` | (자동) | ebc-db 접속 문자열 자동 주입 |
   | `JWT_SECRET` | (자동 랜덤) | Render가 안전하게 생성 |
   | `JWT_ALGORITHM` | `HS256` | |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | |
   | `REFRESH_TOKEN_EXPIRE_MINUTES` | `10080` | 7일 |
   | `BACKEND_CORS_ORIGIN_REGEX` | `https://.*\.vercel\.app` | Vercel 도메인 일괄 허용 |
   | `PYTHON_VERSION` | `3.12.7` | (3.13 사용 금지) |

6. 배포 완료 후 백엔드 URL 확인 — 보통 **`https://ebc-backend.onrender.com`**
   (이름이 겹치면 뒤에 임의 문자열이 붙는다. 서비스 상단에 표시되는 실제 URL을 사용.)
7. **헬스체크**: 브라우저로 `https://ebc-backend.onrender.com/health` 접속 →
   `{"status":"ok"}` 가 보이면 백엔드 정상. API 문서는 `/docs`.

> **수동 방식(블루프린트 대신):** New → PostgreSQL(Free) 생성 후, New → Web Service에서
> 같은 repo 선택 · **Root Directory = `backend`** · Build `pip install -r requirements.txt` ·
> Start `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT` ·
> 환경변수 위 표대로 입력(`DATABASE_URL`은 PostgreSQL의 Internal Database URL 복사).

---

## 2. Vercel — 웹 (Next.js)

1. **vercel.com 로그인** → **Add New...** → **Project**
2. `BioCode67/Eco-Biz-Connect` **Import**
3. **Root Directory** 를 **`web`** 로 변경 (Edit 클릭 → web 폴더 선택) ← **중요**
4. Framework Preset: **Next.js** (자동 감지)
5. **Environment Variables** 추가:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_API_BASE` | `https://ebc-backend.onrender.com` (1단계의 Render URL, **끝 슬래시 없이**) |
   | `NEXT_PUBLIC_SITE_URL` | `https://<프로젝트이름>.vercel.app` (배포 후 발급되는 본인 Vercel 주소, **끝 슬래시 없이** — 링크 미리보기 이미지용) |

6. **Deploy** 클릭 → 1~2분 후 **`https://<프로젝트이름>.vercel.app`** 발급
   - 이 주소가 **교수님께 드릴 최종 평가 링크**다.

> `NEXT_PUBLIC_*` 값은 **빌드 시점에 번들에 박힌다.** 나중에 백엔드 URL을 바꾸면
> Vercel에서 **Redeploy** 해야 반영된다.

---

## 3. 연결 확인 (CORS · API)

1. Vercel 링크 접속 → **회원가입 → 로그인** 시도.
2. 브라우저 **개발자도구(F12) → Network** 탭에서:
   - `…/auth/register`, `…/auth/login` 요청이 **200**인지
   - **CORS 에러가 없는지** (콘솔에 `blocked by CORS` 메시지 없어야 함)
3. CORS가 막히면:
   - Vercel 기본 도메인(`*.vercel.app`)은 `BACKEND_CORS_ORIGIN_REGEX`로 이미 허용됨.
   - **커스텀 도메인**을 쓰면 Render → ebc-backend → Environment에
     `BACKEND_CORS_ORIGINS = https://내도메인` 추가 후 **재배포(Manual Deploy)**.
4. API 주소가 틀리면(404/연결불가): Vercel `NEXT_PUBLIC_API_BASE` 값을 점검하고 Redeploy.

---

## 4. 데모 데이터 채우기 (선택, 권장)

첫 배포 시 DB가 비어 있다. 교수님이 마켓플레이스에서 상품을 보시려면 STO가 필요하다.

1. Vercel 링크에서 **관리자(Administrator)로 회원가입** (역할: 관리자)
2. 로그인 → 관리자 콘솔 → **새 STO 발행**으로 상품 2~3개 발행
   (예: 경주 태양광 / 포항 풍력 / 강원 탄소숲)
3. 이제 **투자자**로 가입하면 마켓플레이스에서 상품이 보인다.
4. **소상공인**으로 가입 후 CSV 업로드 시 AI 분석·ESG 점수가 산출된다.
   (간단한 CSV 예: `date,amount` 한두 줄)

> 교수님께는 "회원가입 후 3가지 역할(소상공인/투자자/관리자)을 각각 체험"하시도록 안내하면 된다.

---

## 5. 무료 플랜 주의사항
- **Render 백엔드(Free)는 약 15분 무활동 시 잠들고**, 다음 첫 요청에서 깨어나는 데
  **30~60초**가 걸린다. 평가 직전 `…/health`에 한 번 접속해 미리 깨워두면 매끄럽다.
- **Render PostgreSQL(Free)은 생성 후 90일이면 만료**된다. 평가 일정에 유의.
- 콜드 스타트 외에는 기능 제한 없이 모든 UC가 동작한다.

---

## 최종 산출물
| 항목 | URL |
|------|-----|
| **웹 (교수님 평가 링크)** | `https://<프로젝트>.vercel.app` |
| 백엔드 API | `https://ebc-backend.onrender.com` |
| API 문서(Swagger) | `https://ebc-backend.onrender.com/docs` |
| 헬스체크 | `https://ebc-backend.onrender.com/health` |
