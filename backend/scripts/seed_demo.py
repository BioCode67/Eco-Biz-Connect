"""데모용 시드 스크립트 — 빈 화면 없이 현실적인 평가 시나리오를 채운다.

설계서의 실제 서비스(파이프라인·블록체인 앵커·ESG 엔진)를 그대로 호출해 충실도를 유지한다.

실행:
  python -m scripts.seed_demo             # 개발용: 전체 초기화 후 재시드
  python -m scripts.seed_demo --if-empty  # 운영 부팅용: 비어 있을 때만 시드(초기화 안 함, 멱등)
"""

import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
import app.models  # noqa: F401  (모든 모델 등록)
from app.models.audit import AuditLog
from app.models.blockchain import RecordType
from app.models.business import BusinessData, ProcessingStatus
from app.models.dividend import Dividend
from app.models.esg import ESGScore
from app.models.finance import FinancialProduct
from app.models.loan import LoanApplication, LoanStatus
from app.models.sto import AssetType, STOAsset, STOStatus
from app.models.transaction import TokenTransaction
from app.models.user import KYCStatus, User, UserRole, VerificationStatus
from app.services import esg_engine, pipeline
from app.services.external import ai_engine, blockchain
from app.services.external.bank_api import compute_preferential_rate


def reset() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def make_user(db, email, pw, role, **kw) -> User:
    u = User(email=email, password_hash=hash_password(pw), role=role, **kw)
    db.add(u)
    db.flush()
    return u


def upload_and_process(db, merchant: User, file_name: str, size_seed: int) -> BusinessData:
    """업로드 + 실제 파이프라인(AI 리포트 + ESG + 온체인 앵커) 실행."""
    bd = BusinessData(
        merchant_id=merchant.id,
        file_name=file_name,
        file_size=size_seed,
        storage_key=f"merchant/{merchant.id}/{file_name}",
        processing_status=ProcessingStatus.UPLOADED,
    )
    db.add(bd)
    db.flush()
    pipeline.run_pipeline(db, bd)  # 리포트·ESG·블록체인 생성 + Merchant.esg_score 갱신
    return bd


def backfill_esg_history(db, merchant: User, business_data_id: int, composites: list[float], months_ago_start: int) -> None:
    """데모용 ESG 과거 추이(mock) — 상승 흐름이 보이도록 백데이트 점수 기록을 삽입한다."""
    now = datetime.now(timezone.utc)
    for idx, comp in enumerate(composites):
        ts = now - timedelta(days=30 * (months_ago_start - idx))
        db.add(ESGScore(
            merchant_id=merchant.id,
            business_data_id=business_data_id,
            env_score=Decimal(str(round(comp - 2, 2))),
            social_score=Decimal(str(round(comp + 3, 2))),
            governance_score=Decimal(str(round(comp - 1, 2))),
            composite_score=Decimal(str(comp)),
            score_grade=esg_engine._grade(comp),
            on_chain_tx_hash=f"0x{(idx + 1) * 11111111:064x}",
            created_at=ts,
        ))
    db.flush()


def issue_sto(db, admin: User, **kw) -> STOAsset:
    asset = STOAsset(issuer_id=admin.id, status=STOStatus.DEPLOYING, remaining_tokens=kw["total_token_supply"], **kw)
    db.add(asset)
    db.flush()
    addr, abi, _ = blockchain.deploy_contract(db, f"sto:{asset.id}:{asset.name}")
    asset.contract_address = addr
    asset.contract_abi = abi
    asset.status = STOStatus.LISTED
    db.add(AuditLog(actor_id=admin.id, action="ISSUE_STO", target_type="STOAsset", target_id=asset.id,
                    detail={"name": asset.name, "supply": asset.total_token_supply}))
    db.flush()
    return asset


def purchase(db, investor: User, asset: STOAsset, qty: int) -> None:
    total = asset.token_price * qty
    rec = blockchain.purchase_tokens(db, asset.contract_address or "0x0", investor.wallet_address or "0x0", qty)
    asset.remaining_tokens -= qty
    if asset.remaining_tokens == 0:
        asset.status = STOStatus.SOLD_OUT
    db.add(TokenTransaction(investor_id=investor.id, sto_asset_id=asset.id, quantity_purchased=qty,
                            unit_price=asset.token_price, total_amount_paid=total,
                            payment_gateway_ref=f"PAY-{investor.id}-{int(total)}",
                            on_chain_tx_hash=rec.tx_hash, block_number=rec.block_number))
    investor.total_invested = (investor.total_invested or Decimal("0")) + total
    db.flush()


def distribute(db, admin: User, asset: STOAsset, per_token: str) -> None:
    rec = blockchain.distribute_dividend(db, asset.contract_address or "0x0", float(per_token))
    sold = asset.total_token_supply - asset.remaining_tokens
    db.add(Dividend(sto_asset_id=asset.id, per_token_amount=Decimal(per_token),
                    total_distributed_amount=Decimal(per_token) * sold, on_chain_tx_hash=rec.tx_hash))
    db.add(AuditLog(actor_id=admin.id, action="DISTRIBUTE_DIVIDEND", target_type="STOAsset", target_id=asset.id,
                    detail={"per_token_amount": per_token}))
    db.flush()


def main(if_empty: bool = False) -> None:
    if if_empty:
        # 운영 부팅용: 스키마는 alembic 이 관리하므로 drop 하지 않는다.
        # 이미 데이터가 있으면 건너뛴다(재기동마다 안전·멱등).
        Base.metadata.create_all(bind=engine)
        probe = SessionLocal()
        try:
            if probe.query(User).first() is not None:
                print("ℹ️  기존 데이터 존재 — 시드 건너뜀")
                return
        finally:
            probe.close()
    else:
        reset()
    db = SessionLocal()
    try:
        # ── 관리자 ──
        admin = make_user(db, "admin@ebc.com", "Admin123!", UserRole.ADMIN, name="운영자 관리자",
                          verification_status=VerificationStatus.VERIFIED)

        # ── 소상공인 3명 (업로드 → ESG 산출) ──
        m1 = make_user(db, "merchant@ebc.com", "Merch123!", UserRole.MERCHANT, name="김상점",
                       phone="010-1234-5678", business_reg_no="123-45-67890", store_name="그린마트",
                       store_address="서울 강남구 테헤란로 12", business_category="친환경 식료품",
                       verification_status=VerificationStatus.VERIFIED)
        m2 = make_user(db, "cafe@ebc.com", "Cafe123!", UserRole.MERCHANT, name="박바리스타",
                       phone="010-2222-3333", business_reg_no="222-33-44455", store_name="에코 카페",
                       store_address="부산 해운대구 마린시티 3", business_category="카페·디저트",
                       verification_status=VerificationStatus.VERIFIED)
        m3 = make_user(db, "bakery@ebc.com", "Bake123!", UserRole.MERCHANT, name="이제빵",
                       phone="010-4444-5555", business_reg_no="333-44-55566", store_name="우리동네 빵집",
                       store_address="대구 중구 동성로 8", business_category="베이커리",
                       verification_status=VerificationStatus.VERIFIED)
        m1_bd = upload_and_process(db, m1, "2026Q1_매출.csv", 4820)
        upload_and_process(db, m1, "2026_04_매출지출.csv", 7310)
        # 데모용 ESG 상승 추이(과거 4개월 mock) — 추이 차트가 풍부해지도록 백필
        backfill_esg_history(db, m1, m1_bd.id, [70.0, 72.5, 74.5, 76.0], months_ago_start=5)
        upload_and_process(db, m2, "카페_매출데이터.csv", 5550)
        upload_and_process(db, m3, "빵집_월매출.csv", 3120)

        # ── 투자자 4명 (KYC) ──
        i1 = make_user(db, "investor@ebc.com", "Invest123!", UserRole.INVESTOR, name="이투자",
                       wallet_address="0xINV001", kyc_status=KYCStatus.VERIFIED, total_invested=Decimal("0"),
                       verification_status=VerificationStatus.VERIFIED)
        i2 = make_user(db, "demo@ebc.com", "Demo1234!", UserRole.INVESTOR, name="데모투자자",
                       wallet_address="0xDEMO", kyc_status=KYCStatus.VERIFIED, total_invested=Decimal("0"))
        i3 = make_user(db, "kim@ebc.com", "Kim12345!", UserRole.INVESTOR, name="김그린",
                       wallet_address="0xKIM77", kyc_status=KYCStatus.VERIFIED, total_invested=Decimal("0"))
        make_user(db, "new@ebc.com", "Newbie12!", UserRole.INVESTOR, name="신규투자자",
                  wallet_address="0xNEW", kyc_status=KYCStatus.PENDING, total_invested=Decimal("0"))

        # ── STO 자산 5종 (관리자 발행) ──
        a1 = issue_sto(db, admin, asset_type=AssetType.SOLAR, name="경주 태양광 발전소 3호", description="경주 산업단지 옥상 태양광 발전 자산",
                       location="경북 경주", total_token_supply=5000, token_price=Decimal("10000"),
                       expected_yield=Decimal("6.20"), co2_offset_per_year=42, installed_capacity_mw=Decimal("3.50"), dividend_period_months=3)
        a2 = issue_sto(db, admin, asset_type=AssetType.WIND, name="포항 해상풍력 1단지", description="포항 영일만 해상풍력 발전 단지",
                       location="경북 포항", total_token_supply=8000, token_price=Decimal("15000"),
                       expected_yield=Decimal("7.50"), co2_offset_per_year=88, installed_capacity_mw=Decimal("6.00"), dividend_period_months=6)
        a3 = issue_sto(db, admin, asset_type=AssetType.FOREST, name="강원 탄소흡수 숲", description="강원도 산림 탄소 크레딧 자산",
                       location="강원 평창", total_token_supply=3000, token_price=Decimal("5000"),
                       expected_yield=Decimal("4.80"), co2_offset_per_year=120, dividend_period_months=12)
        a4 = issue_sto(db, admin, asset_type=AssetType.HYDRO, name="제주 소수력 발전", description="제주 하천 소수력 발전 자산",
                       location="제주", total_token_supply=4000, token_price=Decimal("12000"),
                       expected_yield=Decimal("5.40"), co2_offset_per_year=64, installed_capacity_mw=Decimal("2.20"), dividend_period_months=6)
        a5 = issue_sto(db, admin, asset_type=AssetType.SOLAR, name="영월 태양광 2호", description="영월 폐광부지 태양광 발전",
                       location="강원 영월", total_token_supply=6000, token_price=Decimal("8000"),
                       expected_yield=Decimal("6.90"), co2_offset_per_year=51, installed_capacity_mw=Decimal("4.10"), dividend_period_months=3)

        # ── 투자(구매) ──
        purchase(db, i1, a1, 120)
        purchase(db, i1, a2, 30)
        purchase(db, i2, a1, 80)
        purchase(db, i2, a5, 200)
        purchase(db, i3, a3, 150)
        purchase(db, i3, a4, 40)

        # ── 배당 분배 ──
        distribute(db, admin, a1, "120")
        distribute(db, admin, a2, "200")
        distribute(db, admin, a5, "60")

        # ── 금융 상품 카탈로그(매칭/대출용) ──
        from app.services.external.bank_api import fetch_loan_products
        prod_map = {}
        for item in fetch_loan_products():
            p = FinancialProduct(**item)
            db.add(p)
            db.flush()
            prod_map[item["product_code"]] = p

        # ── 대출 신청 (심사중 / 승인 / 거절 다양하게) ──
        esg1 = m1.esg_score or Decimal("70")
        prod = prod_map["EBC-GREEN-A"]
        rate = compute_preferential_rate(float(prod.base_rate), float(esg1))
        loan1 = LoanApplication(merchant_id=m1.id, financial_product_id=prod.id, amount=10_000_000,
                                applied_rate=Decimal(str(rate)), term_months=24, loan_purpose="시설자금",
                                bank_reference_id="BANK-REF-1", status=LoanStatus.UNDER_REVIEW)
        db.add(loan1)
        prod2 = prod_map["EBC-ECO-B"]
        rate2 = compute_preferential_rate(float(prod2.base_rate), float(esg1))
        loan2 = LoanApplication(merchant_id=m1.id, financial_product_id=prod2.id, amount=5_000_000,
                                applied_rate=Decimal(str(rate2)), term_months=12, loan_purpose="운전자금",
                                bank_reference_id="BANK-REF-2", status=LoanStatus.APPROVED,
                                decision_reason="신용 양호", decision_received_at=datetime.now(timezone.utc))
        db.add(loan2)
        esg2 = m2.esg_score or Decimal("60")
        prod3 = prod_map["EBC-START-D"]
        rate3 = compute_preferential_rate(float(prod3.base_rate), float(esg2))
        loan3 = LoanApplication(merchant_id=m2.id, financial_product_id=prod3.id, amount=3_000_000,
                                applied_rate=Decimal(str(rate3)), term_months=24, loan_purpose="창업자금",
                                bank_reference_id="BANK-REF-3", status=LoanStatus.REJECTED,
                                decision_reason="담보 부족", decision_received_at=datetime.now(timezone.utc))
        db.add(loan3)

        db.commit()

        # 요약 출력
        print("✅ 시드 완료")
        print(f"  사용자: 관리자 1, 소상공인 3, 투자자 4")
        print(f"  STO 자산: 5 (LISTED)")
        print(f"  토큰 거래: 6, 배당: 3, 대출: 3(심사중/승인/거절)")
        print(f"  업로드/리포트/ESG: 4건 (m1 ESG={m1.esg_score})")
    finally:
        db.close()


if __name__ == "__main__":
    main(if_empty="--if-empty" in sys.argv)
