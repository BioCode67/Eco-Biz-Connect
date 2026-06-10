# Eco-Biz Connect (EBC) — 프로젝트 개발 지침

이 파일은 프로젝트의 개발 규칙서다. 작업을 시작할 때 항상 먼저 읽는다.

## 프로젝트 개요
Eco-Biz Connect (EBC) — AI·블록체인 기반 ESG 통합 금융 웹/앱 플랫폼.
- 소상공인(Merchant): 경영 데이터 업로드 → AI 분석 리포트 → ESG 점수 → 우대 금융 매칭/신청
- 투자자(Investor): 탄소중립 STO 상품 탐색 → 토큰 구매 → 배당 수령
- 관리자(Administrator): STO 발행, 시스템 모니터링, 감사 로그

설계 문서는 프로젝트 루트에 있다. 새 기능을 만들기 전에 항상 루트의 Design_[22311898_김주형].md와 Analysis_[22311898_김주형].md를 먼저 참조할 것. UML 다이어그램 SVG들도 루트에 있다.

## 기술 스택 (변경 금지)
- 백엔드: FastAPI (Python 3.11+) + PostgreSQL + SQLAlchemy + Alembic
- 웹: Next.js (App Router) + TypeScript + Tailwind CSS
- 앱: React Native + Expo + TypeScript
- 인증: JWT (access + refresh)
- 외부연동(블록체인, AI 분석, Bank API): 처음에는 전부 mock 구현. 인터페이스만 설계서대로 맞추고 내부는 가짜 데이터/지연 응답으로 대체. 절대 처음부터 실제 연동하지 말 것.

## 폴더 구조
- 루트: 설계 문서(.md, .pdf), UML SVG, logo, proto SVG, README — 기존 파일 그대로 유지하고 옮기지 않는다.
- backend/ : FastAPI 서버 (앞으로 생성)
- web/ : Next.js 웹앱 (앞으로 생성)
- app/ : Expo 모바일앱 (앞으로 생성)

## 절대 규칙
1. 한 번에 하나의 기능만 구현한다. 여러 기능을 동시에 건드리지 않는다.
2. 기능 단위가 끝날 때마다 반드시 git 커밋한다. 커밋 메시지는 영어로 feat:, fix:, chore:, docs: 접두어를 쓴다. 커밋 메시지에 AI/생성도구 서명을 절대 넣지 않는다.
3. 커밋 전 항상 무엇을 했는지 한국어로 요약해서 사용자에게 보고한다.
4. 기존 설계 문서(.md, .pdf)와 SVG 파일은 절대 옮기거나 수정하지 않는다. 코드는 backend/, web/, app/ 안에서만 만든다.
5. DB 스키마는 Design 문서의 13개 도메인 클래스를 따른다: User(추상)→Merchant/Investor/Administrator, BusinessData, AIAnalysisReport, ESGScore, FinancialProduct, LoanApplication, STOAsset, TokenTransaction, Dividend, BlockchainRecord.
6. API 엔드포인트는 Design 문서의 13개 시퀀스 다이어그램(UC1~UC13) 흐름을 따른다.
7. 민감정보(비밀번호)는 bcrypt 해시. API 키·시크릿은 .env에 두고 절대 커밋하지 않는다(.gitignore 필수).
8. 모르거나 설계서에 없는 결정이 필요하면 임의로 진행하지 말고 사용자에게 먼저 물어본다.

## 코드 스타일
- 주석과 사용자 보고는 한국어, 코드·커밋메시지·변수명은 영어.
- 백엔드: 타입힌트 필수, pydantic 스키마로 요청/응답 검증.
- 프론트: 함수형 컴포넌트, 명확한 타입. 과도한 추상화 금지.

## 진행 로드맵 (이 순서대로)
- [ ] Phase 0: 프로젝트 뼈대 + docker-compose(PostgreSQL) + 헬스체크
- [ ] Phase 1: 인증 (회원가입 UC1, 로그인 UC2) — 백엔드 API
- [ ] Phase 2: 나머지 백엔드 API (UC3~UC13, 외부연동은 mock)
- [ ] Phase 3: 웹앱 (Next.js) — proto SVG 5개 기반 화면
- [ ] Phase 4: 모바일앱 (Expo)
- [ ] Phase 5: 외부연동 실제화 (블록체인/AI/Bank) — 맨 마지막

작업 단계를 시작할 때 이 체크리스트에서 어디인지 확인하고 진행한다.
