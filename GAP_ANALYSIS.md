# Eco-Biz Connect — 설계 대비 구현 갭 분석 (Gap Analysis)

작성일: 2026-06-10 · 기준 문서: `Analysis_[22311898_김주형].md`, `Design_[22311898_김주형].md`, UML SVG(class/usecase/seq_uc01~13/state_*/proto_01~05)

본 문서는 **설계서가 요구하는 전체 기능**과 **현재 백엔드/웹/앱 구현 상태**를 비교하여 누락·불완전·불일치를 목록화한다. 상태 범례: ✅ 완료 · 🟡 부분 · ❌ 미구현

---

## A. 도메인 모델 (13개 클래스 필드 대조)

| # | 클래스 | 설계서 필드 | 구현(backend) | 상태 |
|---|--------|------------|---------------|------|
| 1 | User | userId, email, passwordHash, role, verificationStatus, **name**, **phone** | id, email, password_hash, role, verification_status, is_active, failed_login_attempts, locked_until | 🟡 `name`, `phone` 누락; 이메일 인증 흐름 없음 |
| 2 | Merchant | businessRegNo, storeName, storeAddress, businessCategory, esgScore | 모두 존재 | ✅ |
| 3 | Investor | walletAddress, kycStatus, totalInvested | 모두 존재 | ✅ |
| 4 | Administrator | (동작만) | role=ADMIN | ✅ |
| 5 | BusinessData | storageKey, **dataPeriodStart/End**, **encoding**, **parsingSchema**, processingStatus | storage_key, file_name, file_size, processing_status | 🟡 기간/인코딩/스키마 누락 |
| 6 | AIAnalysisReport | salesForecastJson, costOptimizationTips, districtComparisonJson, reportGeneratedAt, **generatePDF()** | summary, sales_forecast, cost_optimization_tips, district_comparison, created_at | 🟡 PDF 생성 없음 |
| 7 | ESGScore | envScore, socialScore, governanceScore, composite, **scoreGrade(A/B+/B/C+/C/D)**, onChainTxHash | env/social/governance/composite/score_grade/on_chain_tx_hash | 🟡 등급 4단계만(A/B/C/D) → 6단계 필요 |
| 8 | FinancialProduct | productId, bankName, productName, annualInterestRate, maxLoanAmount, termMonths, minEsgGrade | 모두 존재(base_rate=annualInterestRate) | ✅ |
| 9 | LoanApplication | requestedAmount, status, **bankReferenceId**, **decisionReceivedAt**, **loanPurpose** | amount, applied_rate, term_months, status, decision_reason | 🟡 bank_reference_id, loan_purpose, decision_received_at 누락 |
| 10 | STOAsset | assetName, assetType, **locationGps**, **installedCapacityMW**, annualCarbonReductionTon, totalTokenSupply, remainingTokens, tokenUnitPriceKRW, expectedAnnualYieldPct, contractAddress, contractABI, **dividendPeriod** | name, asset_type, location, co2_offset_per_year, total/remaining, token_price, expected_yield, contract_address/abi | 🟡 installed_capacity_mw, dividend_period 누락 |
| 11 | TokenTransaction | quantityPurchased, totalAmountPaid, **paymentGatewayRef**, onChainTxHash, blockNumber | quantity_purchased, unit_price, total_amount_paid, on_chain_tx_hash, block_number | 🟡 payment_gateway_ref 누락 |
| 12 | Dividend | **totalDistributedAmount**, perTokenAmount, distributionDate, onChainTxHash | per_token_amount, distribution_date, on_chain_tx_hash | 🟡 total_distributed_amount 누락 |
| 13 | BlockchainRecord | recordType, **associatedEntityId**, txHash, blockNumber, **networkId**, confirmedAt, **verify()** | record_type, data_hash, tx_hash, block_number, created_at | 🟡 associated_entity_id, network_id, verify() 누락 |

---

## B. Use Case 흐름 대조 (UC1~UC13)

| UC | 설계 핵심 흐름 | 현재 구현 | 상태 |
|----|--------------|-----------|------|
| 1 Register | 역할별 폼(이름·전화·상호·사업자번호), 비밀번호 강도(8+/대문자/숫자/특수), 사업자번호+대표자명 검증, 이메일 인증발송 | email/pw/role + 사업자번호(10자리 mock) | 🟡 name/phone, 비밀번호 복잡도, 대표자명, 이메일 인증 누락 |
| 2 Login | bcrypt 비교, JWT(1h)+refresh(7d), 5회 실패 15분 잠금, 미인증 차단, IP 레이트리밋 | JWT, 5회 잠금 ✅ | 🟡 이메일 미인증 차단·IP 제한 없음 |
| 3 Upload | csv/xlsx, 50MB, 기간설정, 인코딩/스키마검증, 큐 등록 | 확장자/크기/빈파일 + 파이프라인 | 🟡 기간/인코딩/스키마 검증 없음 |
| 4 Report | 매출예측·비용·상권레이더·ESG카드, 드릴다운, PDF 내보내기 | 데이터 + 웹 차트(개편중) | 🟡 PDF 내보내기 없음 |
| 5 ESG | E×0.40+S×0.35+G×0.25, 6등급, 부분데이터 플래그, 앵커링 | 가중평균 ✅ + 앵커링 ✅ | 🟡 6등급/부분데이터 플래그 |
| 6 Match | ESG 기반 조회, 실효금리 정렬, 비교(최대3), 점수향상 카드 | 매칭+정렬 ✅ | 🟡 비교/점수향상 카드 없음 |
| 7 Apply | 자동완성, 대출목적·금액, 동의, 참조번호, 웹훅, 30일 중복차단 | 금액/기간 + 웹훅(mock) | 🟡 목적/동의/중복차단/참조번호 누락 |
| 8 Issue STO | 자산상세(용량·탄소·수익률·배당주기), 문서, 컨트랙트 미리보기, 배포 | 발행+컨트랙트배포(mock)+수익률/CO2 | 🟡 용량/배당주기/미리보기 누락 |
| 9 Browse | 필터(유형·수익률·가격·잔여), 정렬, 상세페이지, 수익률·CO2·진행바 | 마켓 + 유형필터(개편중) | 🟡 다중필터/정렬/상세 페이지 부족 |
| 10 Purchase | 총액·예상수익·CO2 동적계산, 위험고지 모달+동의, 결제, 환불 | 수량/KYC/결제(mock)/차감 | 🟡 동적계산·위험고지 모달 없음 |
| 11 Portfolio | 요약·보유·배당타임라인·예정배당 | 요약+보유+배당 | 🟡 예정 배당 없음 |
| 12 History | 전 유형 통합(구매/배당/대출/업로드), 필터·검색, 행펼침, CSV | 역할별 단일유형, 페이지네이션 | 🟡 통합/필터/검색/CSV 누락 |
| 13 Admin | 4패널 모니터, 알림피드, 사용자관리, 감사로그 | 모니터+사용자관리+감사+통계 | 🟡 알림 피드 없음 |

---

## C. 상태 머신 대조 (state_*)

| 상태머신 | 설계 전이 | 구현 | 상태 |
|----------|-----------|------|------|
| BusinessData | Uploaded→Parsing→Parsed→(AIQueued→AICompleted ∥ ESGCompleted) | 파이프라인이 순차 진행(AI→ESG) | 🟡 병렬표현은 mock 순차 |
| LoanApplication | Draft→Submitting→UnderReview→Approved/Rejected, 재시도 | UNDER_REVIEW→APPROVED/REJECTED(웹훅) | 🟡 Draft/Submitting/재시도 단계 없음 |
| STOAsset | Drafting→Compiling→Deploying→Listed→(SoldOut)→Closed | DEPLOYING→LISTED→SOLD_OUT | 🟡 Drafting/Compiling/Closed 미세분화 |
| Overall(세션) | 역할별 직교영역 화면 흐름 | 웹/앱 역할 라우팅 | ✅ |

---

## D. 플랫폼별(웹/앱) 화면 대조 (proto_01~05)

| 화면 | 설계(proto) | 웹 | 앱 |
|------|-------------|-----|-----|
| 로그인 | 분할패널 브랜드+폼 | 🟡 개편중 | 🟡 기본 |
| 소상공인 대시보드 | 매출예측·비용표·상품2·ESG바 | 🟡 차트 보강중 | 🟡 |
| 마켓플레이스 | 필터사이드바+카드그리드 | 🟡 필터 보강 필요 | 🟡 |
| 포트폴리오 | 요약·보유표·배당타임라인 | 🟡 | 🟡 |
| 관리자 콘솔 | 다중패널+알림피드 | 🟡 통계 보강 | 🟡 |

---

## E. 외부연동 (mock 유지, 입출력 형태만 정확히)

| 연동 | 설계 입출력 | 현재 mock | 보강 필요 |
|------|------------|-----------|-----------|
| Bank API(사업자검증) | 번호+대표자명 → 유효/대표자일치 | 10자리 → bool | 대표자명 일치 응답 형태 |
| Bank API(상품/대출/결제/웹훅) | JSON 상품목록, 참조번호, 웹훅 | 구현됨 | 결제 참조·웹훅 페이로드 정교화 |
| AI 엔진 | salesForecast/cost/district JSON | 결정적 더미 | 신뢰구간·이상치 플래그 추가 |
| 블록체인 | txHash/blockNumber/앵커 | SHA-256+nonce | verify(), networkId, confirmedAt |
| KYC | 신원확인 → VERIFIED | 지갑존재 → bool | 입출력 형태 유지 |

---

## F. 구현 우선순위 (2단계 작업 계획)

1. **도메인 필드 보강**: User(name/phone), STOAsset(installed_capacity_mw/dividend_period), LoanApplication(loan_purpose/bank_reference_id), Dividend(total_distributed_amount), TokenTransaction(payment_gateway_ref), BlockchainRecord(associated_entity_id/network_id) — 마이그레이션 포함
2. **ESG 6등급화** (A/B+/B/C+/C/D) + 부분데이터 플래그
3. **UC1 회원가입 강화**: 이름/전화, 비밀번호 복잡도, 대표자명 mock 검증
4. **UC7 대출 강화**: 대출목적·동의·30일 중복차단·참조번호
5. **UC9/10 마켓·구매 강화**: 다중 필터·정렬·상세, 동적 계산·위험고지
6. **UC12 거래내역 통합**: 전 유형 통합 + 필터·검색 + CSV 내보내기
7. **UC11 예정 배당** + **UC4 PDF 내보내기**(서버 생성 mock)
8. **AI/블록체인 mock 정교화**: 신뢰구간·이상치, verify()/confirmedAt
9. **디자인 상용화**(3단계) + **E2E 검증**(4단계)

각 항목은 기능 단위로 구현·커밋한다.
