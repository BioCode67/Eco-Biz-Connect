# Eco-Biz Connect (EBC)

> **AI 및 블록체인 기반 ESG 통합 금융 플랫폼**
> AI 경영 분석과 블록체인 탄소중립 투자(STO)를 결합한 소상공인·투자자 대상 ESG 금융 웹 플랫폼

영남대학교 컴퓨터공학부 · 오픈소스SW설계 · 22311898 김주형 (curie01@yu.ac.kr)

---

## 📚 소프트웨어 공학 단계별 산출물

| 단계 | 문서 | 핵심 내용 |
| :--- | :--- | :--- |
| **1. Conceptualization** | [`Conceptualization_[22311898_김주형].md`](./Conceptualization_[22311898_김주형].md) | 기획 배경, 시스템 컨텍스트, Use Case List |
| **2. Analysis** | [`Analysis_[22311898_김주형].md`](./Analysis_[22311898_김주형].md) | Use Case 분석(13), Domain 분석(13), UI 프로토타입(5) |
| **3. Design** | [`Design_[22311898_김주형].md`](./Design_[22311898_김주형].md) | Class · Sequence(13) · State machine(4) diagram |

> Use Case Diagram은 Analysis 단계 산출물이므로 Design 문서에는 포함하지 않습니다 (`usecase_diagram_ebc.svg`는 Analysis 참고용).

> 📌 각 `.md` 문서는 같은 폴더의 SVG 다이어그램을 상대경로로 참조하며, GitHub에서 자동 렌더링됩니다.
> 📎 제출용 PDF: [`Design_[22311898_김주형].pdf`](./Design_[22311898_김주형].pdf) (다이어그램 포함, 20p)

---

## 🏗️ 시스템 개요

- **소상공인 (Merchant)** — POS·상권 데이터 업로드 → AI 경영 분석 리포트 → ESG 상생 지수 산출 → 우대 금융 상품 매칭/신청
- **투자자 (Investor)** — 탄소중립 STO 상품 탐색 → 토큰 조각 구매 → 스마트 컨트랙트 기반 자동 배당
- **관리자 (Administrator)** — STO 발행, 시스템 모니터링, 감사 로그 관리
- **외부 연동** — Bank API(금융 심사·결제), Blockchain Network(STO·ESG 앵커링)

**기술 스택:** `FastAPI` · `PostgreSQL` · `Redis` · `LSTM(PyTorch)` · `Solidity / ERC-1400` · `Layer 2` · `TypeScript SPA`

---

## 📐 Design 단계 다이어그램 (UML 2.5)

### Class Diagram
![Class Diagram](./class_diagram_ebc.svg)

### Sequence Diagrams — UC #1 ~ #13 (전체)
| UC | 파일 | UC | 파일 |
| :--- | :--- | :--- | :--- |
| #1 Register & Authenticate | [`seq_uc01_register.svg`](./seq_uc01_register.svg) | #8 Issue Carbon STO | [`seq_uc08_issuesto.svg`](./seq_uc08_issuesto.svg) |
| #2 Login | [`seq_uc02_login.svg`](./seq_uc02_login.svg) | #9 Browse Investment Products | [`seq_uc09_browse.svg`](./seq_uc09_browse.svg) |
| #3 Upload Business Data | [`seq_uc03_upload.svg`](./seq_uc03_upload.svg) | #10 Purchase STO Token | [`seq_uc10_purchase.svg`](./seq_uc10_purchase.svg) |
| #4 View AI Analysis Report | [`seq_uc04_viewreport.svg`](./seq_uc04_viewreport.svg) | #11 Check Revenue & Dividend | [`seq_uc11_dividend.svg`](./seq_uc11_dividend.svg) |
| #5 Calculate ESG Score | [`seq_uc05_esgscore.svg`](./seq_uc05_esgscore.svg) | #12 View Transaction History | [`seq_uc12_history.svg`](./seq_uc12_history.svg) |
| #6 Match Financial Product | [`seq_uc06_match.svg`](./seq_uc06_match.svg) | #13 Manage System & Monitor | [`seq_uc13_monitor.svg`](./seq_uc13_monitor.svg) |
| #7 Apply for Preferential Loan | [`seq_uc07_loan.svg`](./seq_uc07_loan.svg) | | |

### State Machine Diagrams
| 대상 | 파일 |
| :--- | :--- |
| BusinessData 처리 생명주기 | [`state_businessdata.svg`](./state_businessdata.svg) |
| LoanApplication 생명주기 | [`state_loanapplication.svg`](./state_loanapplication.svg) |
| STOAsset 생명주기 | [`state_stoasset.svg`](./state_stoasset.svg) |
| 전체 시스템 (User Session, composite) | [`state_overall.svg`](./state_overall.svg) |

---

## 🖼️ Analysis 단계 UI 프로토타입

| 화면 | 파일 |
| :--- | :--- |
| 로그인 페이지 | [`proto_01_login.svg`](./proto_01_login.svg) |
| 소상공인 대시보드 | [`proto_02_merchant_dashboard.svg`](./proto_02_merchant_dashboard.svg) |
| 투자 마켓플레이스 | [`proto_03_marketplace.svg`](./proto_03_marketplace.svg) |
| 투자자 포트폴리오 | [`proto_04_portfolio.svg`](./proto_04_portfolio.svg) |
| 관리자 콘솔 | [`proto_05_admin_console.svg`](./proto_05_admin_console.svg) |

---

## 📁 파일 구조

```
Eco-Biz-Connect/
├── Conceptualization_[22311898_김주형].md   # 1단계
├── Analysis_[22311898_김주형].md            # 2단계
├── Design_[22311898_김주형].md              # 3단계 (본문)
├── Design_[22311898_김주형].pdf             # 3단계 제출용 PDF
├── class_diagram_ebc.svg                    # Class Diagram
├── seq_uc01_register.svg ~ seq_uc13_monitor.svg   # Sequence (13)
├── state_*.svg                              # State Machine (4)
├── proto_01_login.svg ~ proto_05_admin_console.svg # UI 프로토타입 (5)
├── logo.png  /  logo_univ.png               # 로고
└── README.md
```
