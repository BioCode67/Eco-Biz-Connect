"""경영 데이터 처리 파이프라인 — MOCK 오케스트레이션.

설계서상 업로드 성공 시 AI 분석 파이프라인이 비동기로 트리거된다(UC3→UC4→UC5).
실제 비동기 큐/워커 대신, 여기서는 동기적으로 상태를 진행시키는 mock 으로 구현한다.

단계:
  UC3: Uploaded → Parsing → Parsed → AIQueued
  UC4: AI 분석 리포트 생성 → AICompleted
  UC5: ESG 점수 산출 + 블록체인 앵커링 → ESGCompleted
"""

from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.blockchain import RecordType
from app.models.business import BusinessData, ProcessingStatus
from app.models.esg import ESGScore
from app.models.report import AIAnalysisReport
from app.models.user import User
from app.services import esg_engine
from app.services.external import ai_engine, blockchain


def run_pipeline(db: Session, business_data: BusinessData) -> None:
    """업로드된 데이터를 분석 파이프라인에 통과시킨다(mock, 동기 실행)."""
    business_data.processing_status = ProcessingStatus.PARSING
    business_data.processing_status = ProcessingStatus.PARSED
    business_data.processing_status = ProcessingStatus.AI_QUEUED

    # UC4: AI 분석 리포트 생성
    analysis = ai_engine.generate_analysis(business_data)
    report = AIAnalysisReport(
        business_data_id=business_data.id,
        merchant_id=business_data.merchant_id,
        summary=analysis["summary"],
        sales_forecast=analysis["sales_forecast"],
        cost_optimization_tips=analysis["cost_optimization_tips"],
        district_comparison=analysis["district_comparison"],
    )
    db.add(report)
    business_data.processing_status = ProcessingStatus.AI_COMPLETED

    # UC5: ESG 점수 산출 + 블록체인 앵커링
    scores = esg_engine.calculate(business_data)
    payload = f"esg:{business_data.id}:{scores['composite_score']}"
    record = blockchain.anchor(db, RecordType.ESG_ANCHOR, payload)
    esg = ESGScore(
        merchant_id=business_data.merchant_id,
        business_data_id=business_data.id,
        env_score=scores["env_score"],
        social_score=scores["social_score"],
        governance_score=scores["governance_score"],
        composite_score=scores["composite_score"],
        score_grade=scores["score_grade"],
        on_chain_tx_hash=record.tx_hash,
    )
    db.add(esg)

    # Merchant 의 최신 ESG 점수 캐시 갱신
    merchant = db.get(User, business_data.merchant_id)
    if merchant is not None:
        merchant.esg_score = Decimal(str(scores["composite_score"]))

    business_data.processing_status = ProcessingStatus.ESG_COMPLETED

    db.commit()
    db.refresh(business_data)
