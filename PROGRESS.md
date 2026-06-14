# Eco-Biz Connect — 자율 개선 루프 진행 기록

매 사이클: 실제 클릭 점검 → 우선순위 → 개선 → 검증 → 기록. (회귀 금지)

| # | 발견 | 우선순위 | 개선 | 검증 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | 리포트 API가 상권 비교 지표(매출/재방문율/객단가/리뷰점수 백분위)를 주는데 화면에 미사용 — UC4(Analysis)는 "상권 평균 비교 레이더 차트" 명시 | (b) 설계 기능 누락 + 데이터 시각화 깊이 | `RadarChart` SVG 컴포넌트 + 소상공인 대시보드 "상권 비교 분석" 섹션(레이더 + 종합 순위 + 매출 대비) 추가 | next build 통과 · 4축·상위% 렌더 확인 |
| 2 | 매출 예측이 `confidence_lower/upper`(신뢰구간) 데이터를 받는데 미시각화 + 제목 "30일"인데 데이터는 3개월(불일치) | (b)+(c) 설계 누락 + AI템플릿 티(라벨 불일치) | `AreaChart`에 신뢰구간 음영 밴드 추가, 제목 "90일 매출 예측"으로 정합, 설명에 "신뢰수준 90%(음영)" | build 통과 · 밴드 path·aria 렌더 확인 |
| 3 | proto_03의 "Compare ☐"·UC6의 "최대 3개 비교"가 미구현 | (b) 설계 기능 누락 + 투자자 의사결정 도구 | 카드 비교 체크박스 + 하단 플로팅 바 + 비교 모달(항목별 우위 ★ 강조, 최대 3개) | build 통과 · 2개 선택→비교 모달·★ 렌더 스크린샷 확인 |
| 4 | 포트폴리오가 보유 자산을 표로만 표시, 자산 배분 시각화 없음 | (d) 디테일 + 데이터 시각화 깊이 | 보유 자산 섹션에 평가액 기준 자산 배분 도넛(+범례) 추가(2종목 이상 시) | build 통과 · 도넛·범례 렌더, 표 회귀 없음 확인 |
| 5 | UC13 "알림 패널(타임스탬프 경고·이벤트)"이 미구현(모니터·감사로그만) | (b) 설계 기능 누락 | 관리자 "시스템 알림" 피드 추가 — 서브시스템 경고(Bank API DEGRADED) + 최근 감사 이벤트를 색상 점 타임라인으로 | build 통과 · 경고·이벤트·6점 렌더, 도넛 회귀 없음 확인 |
| 6 | 빈 상태에 다음 행동 안내(CTA) 부재 — 신규 계정 사용자가 막힘 | (d) UX 흐름·온보딩 | 소상공인 빈 상태 4곳에 "경영 데이터 업로드" CTA, 포트폴리오 빈 상태에 "마켓플레이스 둘러보기" 링크 | 신규 merchant 계정으로 CTA 4개 렌더 확인 |
| 7 | (1) 토스트가 스크린리더에 안 읽힘(aria-live 없음) (2) 대출 현황이 배지만 있고 state_loanapplication 흐름 미시각화 | (d) 접근성 + (b) 상태머신 시각화 | 토스트 컨테이너 `role=status aria-live=polite` + 대출 카드에 신청→심사→승인/거절 스테퍼(심사 의견 포함) | build 통과 · 스테퍼·aria-live 렌더 확인 |
| 8 | proto_04·UC11의 "배당 타임라인(현금흐름 시각화)"이 평면 리스트로만 구현 | (b) 설계 + 데이터 시각화 | 배당 내역을 세로 타임라인(연결선+노드+온체인 해시)으로 재구성 | build 통과 · 타임라인 2노드·금액 렌더, 도넛 회귀 없음 확인 |
| 9 | 포트폴리오 자산배분 도넛 범례가 미포맷 원시 숫자(1200000)로 표시 — 다른 곳은 ₩표기와 불일치 | (c) AI템플릿 티(불일치) | DonutBreakdown에 `formatValue` 옵션 추가, 포트폴리오는 `won` 적용(관리자 카운트 도넛은 기본 유지) | build 통과 · ₩1,200,000 포맷 확인, 관리자 도넛 회귀 없음 |
| 10 | 디자인이 "템플릿 티" — 흰 배경 위 흰 카드라 깊이감 없음, 테두리 위주, 녹색 과용 | (c)+(d) 애플급 완성도 | 디자인 시스템 정제: 대시보드 회색 캔버스(#f5f5f7) + 떠 있는 흰 카드 + soft shadow, 정확한 애플 그레이(#86868b), tabular-nums, 라운드 22px, 절제된 녹색 | build 통과 · 1440px 스크린샷으로 깊이감·여백 확인 |
| 11 | 스탯/섹션 여백·숫자 위계가 빡빡 — 프리미엄 "공기감" 부족 | (d) 디테일·여백 | StatCard 패딩 22/24, 값 32px+letter-spacing -0.025em, 아이콘 중성 그레이; Section 28/30, 그리드 갭 20~26px | build 통과 · merchant 대시보드 스크린샷 확인 |
| 12 | 모바일(Expo) 테마 토큰이 구버전 — 웹 정제 후 그레이·라운드·그림자·액센트 불일치 | (c) 플랫폼 간 일관성 | app/theme.ts를 웹과 일치: muted #86868b, 라운드 22/14, soft shadow, forest-soft #f0f7f2, leaf/gold 정렬 | tsc --noEmit 통과(EXIT=0) |
| 12b | 모바일 화면이 테마를 우회한 하드코딩 색 사용(ESG 바 #2b6f8f·#b8893b, placeholder #aab2ac) — 웹과 불일치 | (c) 플랫폼 간 일관성 | MerchantScreen ESG 바를 colors.sky/gold, placeholder를 colors.mutedFaint로 교체(웹 sky/gold와 정확 일치) | tsc --noEmit 통과(EXIT=0) |
| 13 | 관리자 모니터가 서브시스템명을 일반 capitalize로 표기 → "Ai Engine"·"Bank Api"(약어 깨짐), 메트릭 키는 snake_case raw | (c) AI템플릿 티(미완성 디테일) | 약어 보존 라벨맵(AI Engine/Bank API/Blockchain Network) + 메트릭 키 underscore 제거 | build 통과 · 브라우저에서 "AI Engine"/"Bank API"·"queue depth" 확인 |
| 14 | 공개 링크 공유/열람 시 링크 미리보기(OG) 메타·이미지 부재 — 완성도 저하 | (d) 배포 완성도 | next/og ImageResponse로 브랜드 OG 이미지(1200×630) + openGraph/twitter 메타 + metadataBase(NEXT_PUBLIC_SITE_URL), 문서화 | build 통과 · /opengraph-image 200 image/png 1200×630 확인, head 메타 출력 확인 |
| 15 | 커스텀 404·에러 페이지 부재 → 잘못된 URL·런타임 오류 시 기본 Next 화면 노출 | (d) 완성도·UX | 브랜드 톤 not-found.tsx(404)·error.tsx(복구 버튼) 추가 | build 통과 · /존재안함 경로에서 404 카드·"처음으로" CTA 렌더 확인 |
| 16 | 포트폴리오 거래상태(COMPLETED/PENDING)·관리자 역할(ADMIN/MERCHANT)이 영문 enum raw 노출 — 전부 한글 UI에서 튐 | (c) AI템플릿 티(불일치) | format.ts에 txStatusKo·roleKo 공유 헬퍼 추가, 포트폴리오·관리자에 적용 | build 통과 · 관리자 표 역할 "관리자/소상공인" 렌더 확인 |
| 17 | **치명적:** Render startCommand가 시드를 안 해 배포 DB가 비어 있음 → 공개 링크에 로그인할 데모 계정조차 없음. 기존 시드는 reset(drop_all)이라 재기동마다 데이터 소멸 위험 | (a) 배포 차단 결함 | seed에 `--if-empty` 멱등 모드(비었을 때만 시드·drop 안 함) 추가, render startCommand에 연결, DEPLOYMENT.md에 자동시드·테스트계정 명시 | 임시 sqlite로 빈DB→시드/채워진DB→건너뜀 검증, 구매 플로우 E2E(KYC→구매201→포트폴리오+₩10k) 확인, pytest 64개 통과 |
| 18 | 상세 모달이 `title=""`이라 dialog 접근명이 비고, 빈 `<h3>` 헤더 여백 발생 | (d) 접근성 | Modal에 `ariaLabel` 옵션 + 빈 title일 때 헤더 생략(닫기만 우측 정렬), DetailModal은 `${자산명} 상세` 전달 | build 통과 · 모달 열어 aria-label="포항 해상풍력 1단지 상세"·빈 h3 없음·닫기 접근명 확인 |
| 19 | 핵심 데모 4대 동작 미검증(가정 금지 원칙) | (검증) | 로그인·STO구매·CSV업로드·관리자 4역할 E2E 실행 | 업로드 201→파이프라인 ESG_COMPLETED→리포트200, pytest 64개 통과, 핵심 API 전역할 200. 테스트로 변경된 로컬 _e2e.db는 재시드로 pristine 복원(ESG 81.75/B+, 투자금 1.65M) |
| 20 | 모바일 로그인이 전부 한글인 앱에서 제목만 영어(Welcome Back/Sign In), 카드에 그림자 없음(테마 shadow 미적용); 포트폴리오 라벨 영어(Invested/Valuation/Holdings) | (c) 플랫폼 일관성·(d) 깊이감 | LoginScreen 제목·버튼·서브타이틀 한글화 + 카드에 `...shadow`; PortfolioScreen StatCard·Section 라벨 한글화(웹과 동일) | tsc 통과, expo export ios 통과(710 modules) |
| 21 | 모바일 앱 메타가 미브랜딩(name/slug "app"), app.json이 web 선언하나 deps 없어 export 혼란; native export 통과 여부 미검증 | (d) 완성도·(검증) | app.json name "Eco-Biz Connect"·slug·scheme 브랜딩, 미사용 web 타깃 제거 | `expo export --platform ios` 통과(710 modules)로 README "expo export 통과" 사실 확인 |
| 22 | **모바일 버그:** 관리자 `name` 스타일의 `textTransform:"capitalize"`가 이메일에도 적용돼 "Merchant@ebc.com"으로 깨짐; 서브시스템 "Ai Engine"·역할 영문 raw | (c) 버그·일관성 | format.ts에 subsystemName·roleKo 추가, capitalize 제거, AdminScreen 적용(웹과 동일) | tsc 통과, expo export 통과 |
| 23 | 모바일 매출예측 제목이 "30일"인데 데이터는 3개월(웹은 이미 90일로 수정됨) — 라벨-데이터 불일치 | (c) AI템플릿 티(불일치) | "90일 매출 예측 · AI 예측"으로 정합 | tsc 통과, expo export ios 통과(710 modules) |
| 24 | 배포 startCommand가 끝까지 동작하는지 미검증(마이그레이션 체인·시드↔스키마 호환은 대표적 배포 실패 지점) | (검증) | 빈 DB에서 운영 순서 그대로 재현: `alembic upgrade head` → `seed --if-empty` → 데이터 확인 → 재실행 | 12개 마이그레이션 무결 적용, alembic 스키마 위 시드 성공(users 8·STO 5), 재실행 시 건너뜀. 배포 end-to-end de-risk |
| 25 | 교수님이 클릭할 기능들의 실제 산출물 미검증(PDF·대출 상태머신 등) | (검증) | PDF 내보내기·대출신청(30일가드)·은행웹훅 전이를 실제 호출로 점검 | PDF 200·유효 PDF1.4·내용 정확(매출 1100/1250/1400·ESG 81.75 B+) 렌더 확인; 대출 재신청 409(30일 중복가드 작동); 웹훅 UNDER_REVIEW→APPROVED 200(decision_received_at 기록). 테스트 변경분 재시드로 복원 |
| 26 | 교수님이 휴대폰으로 공개 링크를 열 수 있으나 웹 모바일 반응형 미검증 | (검증) | 390px 뷰포트에서 로그인·대시보드 점검(오버플로·드로어·햄버거·카드 스택) | 가로 오버플로 0, 사이드바→드로어 전환·햄버거 오픈(overlay+transform 0)·나비링크 닫힘 동작, 스탯카드 단일컬럼 스택, 로그인 카드 346px 정상 — 스크린샷으로 시각 확인 |
| 27 | 다크 모드 부재 — 라이트 전용 | (업그레이드) 디자인 | CSS 변수 기반 애플급 다크 테마: `[data-theme=dark]` 토큰 재정의(애플 다크 그레이·밝은 액센트), 플래시 방지 인라인 스크립트(localStorage→prefers-color-scheme), 토글 버튼(해/달, 대시보드·로그인 헤더), 하드코딩 표면 토큰화(글래스 헤더·fill·세그먼트·차트 트랙·진행바·배지·인버스 pill·sky-soft) | next build·tsc 통과, 로그인·대시보드(도넛·E/S/G바·예측)·마켓(카드·필터·진행바)·관리자(표·배지) 다크 스크린샷 검증 — 전 화면 가독성·대비·깊이감 양호 |
| 28 | 앱이 web 타깃 미지원(시뮬레이터 없이 못 봄) | (업그레이드) | react-dom·react-native-web·@expo/metro-runtime 추가로 expo web 활성화 — 브라우저에서 모바일 UI 구동 | web 번들 364모듈·native 710모듈 컴파일 0오류, 타이틀 "Eco-Biz Connect" 확인 |
| 29 | 앱↔웹 기능 불일치: 모바일 포트폴리오에 배분 도넛·배당 타임라인·거래내역 없음(웹엔 있음) | (c) 파리티 | 모바일 charts에 DonutBreakdown 추가, PortfolioScreen에 배분 도넛(2종목+)·배당 타임라인(온체인 해시)·거래내역(/transactions) 추가, format에 dateStr·txStatusKo·txTypeKo 추가 | tsc·expo export(710) 통과 |
| 30 | 모바일 마켓에 검색·타입필터·정렬 없음(웹엔 있음) | (c) 파리티 | MarketplaceScreen에 검색바·타입 칩(전체/태양광/풍력/탄소숲/수력)·정렬 칩(수익률/최저가/잔여/최신) + useMemo 필터 | tsc·expo export(710) 통과 |
| 31 | 모바일 소상공인에 상권비교 레이더·대출 스테퍼 없음(웹엔 있음) | (c) 파리티 | 모바일 charts에 RadarChart 추가, MerchantScreen에 상권 비교(UC4 레이더)·대출 상태머신 스테퍼(신청→심사→승인/거절+의견) 추가 | tsc·expo export(710) 통과 |
| 32 | `/esg/history` 엔드포인트가 있으나 어디서도 미시각화 + 데모 이력 2점뿐(추이 빈약) | (업그레이드)+mock | 시드에 ESG 상승 추이 백필(70→81.75, 6점), 웹·앱 소상공인 ESG 섹션에 "ESG 점수 추이" 라인/영역 차트 추가 | 시드 재실행 후 /esg/history 6점 확인, web tsc·app expo export 통과, **웹 프리뷰 UI 로그인→/merchant에서 추이 차트(70→82 상승) 스크린샷 시각 검증** |
| 33 | 앱 소상공인에 AI 비용 최적화 팁 미표시(웹엔 있음) | (c) 파리티 | MerchantScreen에 "AI 비용 최적화 제안" 섹션(제목·상세·임팩트 배지) 추가 | 리포트 3팁 데이터 확인, tsc·expo export(710) 통과 |
| 34 | 앱 관리자에 시스템 알림 피드 미구현(웹 UC13엔 있음) | (c) 파리티 | AuditLog 타입 추가, /admin/audit-log 페치, "시스템 알림" 피드(서브시스템 경고+최근 감사 이벤트, 색상 점) 추가 | audit-log 8건 확인, tsc·expo export(710) 통과 |
| 35 | 앱 web 타깃 활성화 후에도 README에 실행법 없음 | (d) 문서 | README 빠른 실행에 `npx expo start`(Expo Go QR)·`--web`(브라우저 미리보기) 추가 | — |
| 36 | (QA) 다크용 토큰 대거 변경 후 라이트 회귀 미확인 | (검증) | 웹 프리뷰에서 소상공인(ESG 추이 차트 포함)·포트폴리오(배분 도넛) 라이트 렌더 점검 | 스크린샷 확인 — 차트 트랙(--fill)·도넛·배지·accent 카드 정상, 라이트 회귀 0. 전 화면 라이트/다크 모두 검증 완료 |
| 37 | ESG 플랫폼인데 투자자의 실제 환경 기여(탄소 상쇄)가 어디에도 안 보임 | (업그레이드) ESG 핵심가치 | 포트폴리오에 "내 ESG 임팩트" 추가 — 보유 STO 지분(보유량/총발행) × 연 CO₂저감 합산 → tCO₂e/년 + 나무 그루 환산. 웹·앱 모두 | web tsc·프리뷰 스크린샷(1.34 tCO₂e=나무 60그루) 시각 검증, app expo export(710) 통과 |
| — | 신규기능 추가 후 배포 산출물 무결성 확인 | (검증) | 웹 프로덕션 `next build` 클린 빌드 | ✓ Compiled, 11페이지 0오류 — 배포 산출물 견고 |
| 38 | 투자자 개인 탄소 임팩트의 짝으로 플랫폼 전체 임팩트가 없음 | (업그레이드) ESG 핵심가치 | 백엔드 `/admin/stats`에 `total_co2_offset`(발행 STO 연 CO₂ 합) 추가, 웹·앱 관리자에 "플랫폼 누적 탄소 임팩트" 배너 | live 365 tCO₂e 확인, pytest 64개 통과, web/app tsc·expo export(710) 통과 |
| 39 | 앱 마켓플레이스에 비교 기능(UC6 "최대 3개") 없음 — 웹↔앱 마지막 파리티 갭 | (c) 파리티·설계 기능 | 카드 비교 체크박스 + 하단 플로팅 바 + 비교 시트(항목별 최적값 ★, 가로 스크롤 표) 추가 | tsc·expo export(710) 통과 — 앱이 4개 화면 모두 웹과 완전 파리티 달성 |
| 40 | (야간 검증 스윕) 실기능·API연결·mock 전수 점검 | (검증) | 프런트↔백엔드 API 대조·외부 mock 연동·27엔드포인트 E2E·입력검증8종·접근제어·웹 콘솔로그·카본계산 정확도 | 끊긴 API 0, mock 5종 self-contained+wiring 확인, 27/27 엔드포인트 정상, 검증 8/8, 콘솔 에러 0. QA_REVIEW.md 갱신 |
| 41 | 웹 콘솔에 Next "scroll-behavior smooth" 경고 반복 | (d) 품질 신호 | `<html>`에 `data-scroll-behavior="smooth"` 추가(Next 권고) | 서버 렌더 HTML에 속성 적용 확인 — 경고 해소 |
| 42 | (문서 충실성 감사) 제출 설계서 vs 구현 대조 | (검증) | 13개 도메인클래스·ESG가중치(0.40/0.35/0.25)·Bank API 흐름·ERC-1400·SHA-256 앵커링·상태머신(LoanStatus·STOStatus)·웹훅 전수 대조 | 전부 설계서와 일치 확인. 외부 API는 문서가 규정한 인터페이스대로 mock 구현(실연동은 Phase 5, 문서상 불요) |
| 43 | Design UC11 "배당 항목 클릭 시 블록체인 익스플로러 연결"이 정적 해시 표시로만 구현 | (업그레이드) 설계 기능·블록체인 깊이 | 온체인 해시 클릭 → `/chain/verify`(BlockchainRecord.verify()) 호출하는 검증 모달(record_type·block·network·SHA-256·검증배지) 컴포넌트 추가, 포트폴리오 배당·소상공인 ESG 앵커에 연결. 공용 Modal을 별도 모듈로 추출(순환 import 해소) | next build 12p·tsc 통과, 프리뷰에서 배당 해시 클릭→"✓ 검증됨·배당 분배·블록#·해시" 모달 시각 검증 |
| 44 | **핵심: AI 분석이 업로드 CSV를 실제로 분석하지 않고 file_size 해시로 가짜값 생성** — "모양만 있는" 대표 결함(내용이 파이프라인에 전달조차 안 됨) | (a) 실기능 미작동 | `analytics.py` 신설: 실제 CSV 파싱→매출 추세 회귀 3개월 예측+변동성 신뢰구간, 실제 비용비율(재료비/인건비/임대료/공과금) 기반 절감 제안, z-score 이상치 탐지, 실데이터 ESG(공과금→환경·인건비→사회·매출안정성→지배). 업로드 라우터→파이프라인→ai_engine/esg_engine에 parsed 전달(시드는 합성 폴백 유지). UI는 정직한 예측방법 라벨 | 샘플 CSV E2E: 총매출 3,301만원·예측 [3156,3017,2884]·"재료비 42%>권장35%→231만원 절감"·이상치 탐지·ESG 76.5(B) 전부 실측. analytics 5개 테스트+기존 64개 통과 |
| 45 | 이상치 탐지가 계산되나 리포트 모델에 컬럼이 없어 저장·표시 안 됨(웹 UI는 이미 존재) | (a) 실기능 미연결 | AIAnalysisReport에 `anomalies` JSON 컬럼 추가(마이그레이션 0013), 스키마·파이프라인 연결 — 탐지된 매출 급증/급감일이 UI에 노출 | 신선DB 마이그레이션 적용·컬럼 확인, 리포트 API에 anomalies 필드 직렬화, 테스트 10개 통과 |
| 46 | (시각 증명) 실데이터 분석이 브라우저 대시보드에 제대로 렌더되는지 | (검증) | 샘플 CSV 업로드 후 머천트 대시보드 스크린샷 | 예측[3156,3017,2884]·"총매출 3,301만원"·"재료비 42%"·ESG 77(B, E95/S60/G70 실데이터)·추이차트·온체인앵커 모두 실측 렌더 확인. README 구현설명 정직하게 갱신 |
| 44 | "AI 분석"이 업로드 CSV를 안 읽고 file_size 해시로 가짜값 생성 — 대표적 "모양만 있는" 기능 | (업그레이드) 실작동 | `analytics.py` 신설: 실제 CSV 파싱→매출 추세 회귀 3개월 예측·변동성 신뢰구간·실비용비율 기반 절감제안·z-score 이상치. upload→pipeline→ai_engine/esg_engine 배선(실데이터 우선, 없으면 합성) | pytest 통과, 샘플 CSV로 총매출 3,301만원·예측 검증 |
| 45 | 소상공인 핵심지표인 영업이익/이익률 부재 | (업그레이드) 실작동·전문성 | analytics에 영업이익=매출-실비용·이익률 계산, report에 `profit` JSON 영속화(마이그레이션 0014), 웹·앱 대시보드에 영업이익·이익률 전용 카드 | 마이그레이션 0014 체인 검증·pytest 70 통과·API profit 반환(영업이익 484만/44%)·웹 카드 시각 검증 |
