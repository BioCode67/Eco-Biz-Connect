# Eco-Biz Connect — 웹앱 (Next.js)

Phase 3. proto SVG 5종 기반 화면을 백엔드 API(UC1~UC13)와 연동한 SPA.

## 기술 스택
- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- JWT 인증(localStorage), 클라이언트 렌더링(CSR) + 역할 기반 라우팅

## 화면 (proto 매핑)
| 경로 | 역할 | proto | 내용 |
| :--- | :--- | :--- | :--- |
| `/login` | 공통 | proto_01 | 로그인/회원가입(Merchant/Investor/Admin) |
| `/merchant` | Merchant | proto_02 | 데이터 업로드·AI 리포트·ESG·우대상품·대출(UC3~7) |
| `/marketplace` | Investor | proto_03 | STO 탐색·KYC·토큰 구매(UC9·10) |
| `/portfolio` | Investor | proto_04 | 보유자산·배당·거래내역(UC11·12) |
| `/admin` | Admin | proto_05 | 모니터링·STO 발행·사용자관리·감사로그(UC8·13) |

## 실행
백엔드(`../backend`)가 http://localhost:8000 에서 떠 있어야 한다.

```bash
# Node 가 nvm 으로 설치된 경우 (없으면 일반 PATH)
export PATH="$HOME/.nvm/versions/node/<버전>/bin:$PATH"

npm install          # 최초 1회
npm run dev          # http://localhost:3000
```

API 주소는 `.env.local` 의 `NEXT_PUBLIC_API_BASE` 로 변경할 수 있다(기본 http://localhost:8000).

## 빌드
```bash
npm run build && npm run start
```

## 구조
```
src/
  app/
    layout.tsx           # AuthProvider 래핑
    page.tsx             # 역할별 홈으로 리다이렉트
    login/page.tsx       # proto_01
    merchant/page.tsx    # proto_02
    marketplace/page.tsx # proto_03
    portfolio/page.tsx   # proto_04
    admin/page.tsx       # proto_05
  components/
    DashboardShell.tsx   # 사이드바 + 역할 가드
    ui.tsx               # StatCard/Section/Badge/Button
  lib/
    api.ts               # fetch 클라이언트(JWT)
    auth.tsx             # 인증 컨텍스트
    types.ts             # 백엔드 응답 타입
    format.ts            # 표시 포맷 헬퍼
```
