"""경영 데이터 처리 파이프라인 — MOCK 오케스트레이션.

설계서상 업로드 성공 시 AI 분석 파이프라인이 비동기로 트리거된다(UC3→UC4→UC5).
실제 비동기 큐/워커 대신, 여기서는 동기적으로 상태를 진행시키는 mock 으로 구현한다.
각 UC 구현이 진행되며 단계가 확장된다(UC4: 리포트 생성, UC5: ESG 산출/앵커링).
"""

from sqlalchemy.orm import Session

from app.models.business import BusinessData, ProcessingStatus


def run_pipeline(db: Session, business_data: BusinessData) -> None:
    """업로드된 데이터를 분석 큐에 올리고 상태를 AI_QUEUED 까지 진행한다(mock).

    UC4/UC5 에서 리포트 생성·ESG 산출 단계가 이 함수에 연결된다.
    """
    business_data.processing_status = ProcessingStatus.PARSING
    # (mock) 파싱 성공 가정
    business_data.processing_status = ProcessingStatus.PARSED
    business_data.processing_status = ProcessingStatus.AI_QUEUED
    db.commit()
    db.refresh(business_data)
