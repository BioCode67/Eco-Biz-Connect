# 1. Conceptualization

## **Eco-Biz Connect (EBC): AI 및 블록체인 기반 ESG 통합 금융 플랫폼**

### **[ Project Logo ]**
> ![EBC_LOGO](https://via.placeholder.com/150?text=EBC+LOGO)  
> *AI 경영 분석과 블록체인 탄소 투자의 결합*

**Student No:** 22311898  
**Name:** 김주형  
**E-mail:** curie01@yu.ac.kr  

---

### **[ Revision history ]**

| Revision date | Version # | Description | Author |
| :--- | :--- | :--- | :--- |
| 2026/03/27 | 1.0.0 | 초안 작성 (Eco-Biz Connect 통합 기획) | 김주형 |

---

### **= Contents =**

1. **Business purpose** .................................................................................. 1
2. **System context diagram** ....................................................................... 2
3. **Use case list** ......................................................................................... 3
4. **Concept of operation** ............................................................................ 4
5. **Problem statement** ................................................................................ 6
6. **Glossary** ................................................................................................. 7
7. **References** ................................................................................................. 8

---

### **1. Business purpose**

**1.1 Project background**
* [cite_start]현대 금융 시장은 단순 자금 중개를 넘어 사회적 가치(ESG)를 창출하는 방향으로 진화하고 있음. [cite: 1293]
* [cite_start]정보 접근성이 낮은 소상공인의 경영 안정화와 일반 시민의 탄소중립 참여를 기술적으로 연결하는 통합 모델의 필요성 대두. [cite: 1293]

**1.2 Motivation**
* [cite_start]소상공인에게는 AI 기술을 통해 대형 기업 수준의 데이터 기반 경영 분석 능력을 제공함. [cite: 1293]
* [cite_start]발생하는 환경적 이익을 블록체인 기반 토큰증권(STO)으로 가치화하여 지역 공동체가 수익을 공유하는 선순환 구조를 구축하고자 함. [cite: 1293]

**1.3 Goal**
* [cite_start]AI 기반 소상공인 매출 예측 및 스마트 경영 지원 시스템 구축. [cite: 1293]
* [cite_start]블록체인 기반 탄소중립 자산 조각 투자 및 투명한 수익 분배 플랫폼 구현. [cite: 1293]

**1.4 Target market**
* [cite_start]데이터 기반 경영 진단이 필요한 지역 소상공인. [cite: 1293]
* [cite_start]환경 보호 참여와 자산 증식을 동시에 추구하는 개인 가치 투자자 및 MZ세대. [cite: 1293]

---

### **2. System context diagram**

[cite_start]*(이 섹션에는 추후 설계할 다이어그램 이미지를 삽입하세요. 시스템을 중앙에 두고 Actor들을 배치합니다.)* [cite: 1294, 1295]

> 

[cite_start]**Description of terms in the diagram:** [cite: 1296]
* **System (EBC Platform):** 전체 데이터 처리 및 AI 분석, 블록체인 스마트 컨트랙트 로직을 담당하는 핵심 엔진.
* **Merchant (소상공인):** 경영 데이터를 입력하고 분석 리포트 및 금융 매칭 서비스를 수신하는 사용자.
* **Investor (개인 투자자):** 탄소중립 자산에 조각 투자를 진행하고 토큰 소유권을 관리하는 사용자.
* **Bank/Financial API:** 실제 우대 금리 대출 연계 및 투자 자금 결제 처리를 담당하는 외부 금융 시스템.
* **Blockchain Network:** 조각 투자 내역과 수익 분배 과정을 투명하게 기록하는 분산 원장.

---

### **3. Use case list**

| Use Case | Actor | Description |
| :--- | :--- | :--- |
| **1) AI 경영 진단** | Merchant | [cite_start]AI가 과거 매출 및 지출 데이터를 분석하여 향후 경영 전략을 제안함. [cite: 1299] |
| **2) 탄소 자산 STO 발행** | Administrator | [cite_start]신재생 에너지 설비 등을 토큰화하여 앱 내 투자 상품으로 등록함. [cite: 1299] |
| **3) 조각 투자 참여** | Investor | [cite_start]발행된 토큰을 소액으로 구매하여 환경 자산의 소유권을 확보함. [cite: 1299] |
| **4) ESG 우대 대출 매칭** | Merchant, Bank | [cite_start]분석된 경영 리포트와 ESG 활동 점수를 바탕으로 최적의 대출 상품을 연결함. [cite: 1299] |

---

### **4. Concept of operation**

[cite_start]**1) AI 경영 진단** [cite: 1300]
| 항목 | 내용 |
| :--- | :--- |
| **Purpose** | [cite_start]데이터 기반의 객관적인 경영 지표를 소상공인에게 제공하여 자생력 강화 [cite: 1300] |
| **Approach** | [cite_start]매출 정보를 입력받아 AI 예측 모델을 통해 경영 개선안 및 자금 흐름 리포트를 서버에서 도출 [cite: 1300] |
| **Dynamics** | [cite_start]사용자가 앱 메인 화면에서 '경영 리포트 생성' 버튼을 클릭할 때 작동 [cite: 1301] |
| **Goals** | [cite_start]소상공인의 경영 전략 수립 지원 및 금융권 제출용 공신력 있는 데이터 확보 [cite: 1301] |

[cite_start]**2) 탄소중립 자산 조각 투자** [cite: 1300]
| 항목 | 내용 |
| :--- | :--- |
| **Purpose** | [cite_start]고액의 환경 자산에 대한 개인 투자 진입장벽을 낮추고 시민 참여형 ESG 실현 [cite: 1300] |
| **Approach** | [cite_start]블록체인 스마트 컨트랙트를 통해 투명한 소유권 분배 및 수익 자동 정산 시스템 구축 [cite: 1300] |
| **Dynamics** | [cite_start]투자자가 특정 프로젝트를 선택하고 '토큰 구매'를 확정할 때 발생 [cite: 1301] |
| **Goals** | [cite_start]투명한 자산 운용 기록 확보 및 환경 가치 투자의 대중화 [cite: 1301] |

---

### **5. Problem statement**

[cite_start]**5.1 Overview** [cite: 1301]
* [cite_start]AI 분석의 정밀도와 블록체인 거래의 신뢰성을 동시에 확보하여 실질적인 금융 서비스로서의 가치를 증명해야 함. [cite: 1301]

[cite_start]**5.2 Technical Difficulties** [cite: 1301]
* [cite_start]**Problem #1:** 금융 데이터와 비정형 환경 데이터를 결합하여 실시간으로 분석 결과를 도출하는 연산 부하 최적화 문제. [cite: 1301]
* [cite_start]**Problem #2:** 블록체인 가스비(수수료) 문제 및 대량의 트랜잭션 발생 시 네트워크 지연 시간 단축 방안. [cite: 1301]

[cite_start]**5.3 Non-Functional Requirements (NFRs)** [cite: 1302]
* [cite_start]**① 성능:** 경영 분석 결과 도출 및 화면 로딩 시간은 최대 3초 이내여야 함. [cite: 1302]
* [cite_start]**② 보안:** 모든 사용자 데이터는 AES-256 방식으로 암호화하며, 블록체인상에 개인정보를 직접 노출하지 않음. [cite: 1302]
* [cite_start]**③ 호환성:** 시스템은 안드로이드와 iOS 모바일 환경에서 동일한 UX를 제공해야 함. [cite: 1302]

---

### **6. Glossary**

* [cite_start]**STO (Token Securities):** 블록체인 기술을 활용해 실물 자산을 디지털 토큰으로 발행한 증권형 자산. [cite: 1302]
* [cite_start]**Smart Contract:** 블록체인 네트워크상에서 조건 충족 시 자동으로 계약이 이행되는 프로그램 코드. [cite: 1302]
* [cite_start]**ESG:** 환경(Environmental), 사회(Social), 지배구조(Governance)의 약자로, 기업의 비재무적 가치 척도. [cite: 1302]

---

### **7. References**

* [cite_start]하나금융그룹, "제1회 하나 청년 금융인재 양성 프로젝트" 참가 가이드라인 (2026). [cite: 1303]
* [cite_start]영남대학교 컴퓨터공학부, "소프트웨어 공학 - Conceptualization 표준 템플릿". [cite: 1303]
* [cite_start]금융위원회, "토큰 증권(STO) 발행 및 유통 규율 체계 정비 방안" (2025). [cite: 1303]
