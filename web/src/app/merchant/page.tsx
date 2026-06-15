"use client";

// 소상공인 대시보드 (proto_02). UC3 업로드 · UC4 리포트(차트·PDF) · UC5 ESG · UC6 매칭 · UC7 대출.

import { Fragment, useCallback, useEffect, useRef, useState } from "react";

import { AreaChart, BarRows, DonutGauge, RadarChart } from "@/components/charts";
import { ChainHash } from "@/components/ChainVerify";
import { Modal } from "@/components/Modal";
import DashboardShell from "@/components/DashboardShell";
import { Badge, Button, EmptyState, ErrorBanner, Section, Skeleton, StatCard } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { api, apiDownload, ApiError, safe } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { pct, won } from "@/lib/format";
import type { AnalysisReport, BusinessData, ESGScore, LoanApplication, MatchedProduct } from "@/lib/types";

const COST_COLORS = ["var(--forest)", "var(--sky)", "var(--gold)", "var(--leaf)"];

const NAV = [
  { label: "대시보드", href: "#top", icon: "grid", active: true },
  { label: "경영 데이터", href: "#data", icon: "upload" },
  { label: "분석 리포트", href: "#report", icon: "report" },
  { label: "금융 상품", href: "#products", icon: "won" },
  { label: "대출 신청", href: "#loans", icon: "check" },
];

export default function MerchantPage() {
  const { user } = useAuth();
  return (
    <DashboardShell
      role="MERCHANT"
      nav={NAV}
      title="소상공인 대시보드"
      subtitle={user?.store_name ? `${user.store_name} · 환영합니다` : "AI 경영 분석 · ESG 우대금융"}
      badge={user?.esg_score ? <ScoreBadge score={Number(user.esg_score)} /> : null}
    >
      <MerchantBody />
    </DashboardShell>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "var(--forest-soft)", borderColor: "#cfe2d6" }}>
      <span style={{ fontSize: 11, color: "var(--forest-deep)", fontWeight: 600 }}>EBC 상생지수</span>
      <span className="font-display" style={{ fontSize: 20, fontWeight: 600, color: "var(--forest-deep)" }}>{score.toFixed(0)}</span>
    </div>
  );
}

function MerchantBody() {
  const { refresh } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState<BusinessData[]>([]);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [esg, setEsg] = useState<ESGScore | null>(null);
  const [esgHistory, setEsgHistory] = useState<ESGScore[]>([]);
  const [products, setProducts] = useState<MatchedProduct[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [uploading, setUploading] = useState(false);
  const [applyTarget, setApplyTarget] = useState<MatchedProduct | null>(null);
  const [netError, setNetError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadAll = useCallback(async () => {
    try {
      const [d, r, e, l, p, h] = await Promise.all([
        safe(api<BusinessData[]>("/business-data"), [] as BusinessData[]),
        safe(api<AnalysisReport | null>("/reports/latest"), null),
        safe(api<ESGScore | null>("/esg/me"), null),
        safe(api<LoanApplication[]>("/loans"), [] as LoanApplication[]),
        safe(api<MatchedProduct[]>("/products/match"), [] as MatchedProduct[]),
        safe(api<ESGScore[]>("/esg/history"), [] as ESGScore[]),
      ]);
      setDatasets(d); setReport(r); setEsg(e); setLoans(l); setProducts(p); setEsgHistory(h);
      setNetError(false);
    } catch {
      setNetError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      await api<BusinessData>("/business-data/upload", { method: "POST", form });
      toast.show("업로드 완료 — AI 분석과 ESG 점수가 산출되었습니다.", "success");
      await loadAll();
      await refresh();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "업로드 실패", "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function exportPdf() {
    try {
      await apiDownload("/reports/latest/pdf", "ebc_report.pdf");
      toast.show("PDF를 다운로드했습니다.", "success");
    } catch {
      toast.show("PDF 내보내기에 실패했습니다.", "error");
    }
  }

  const latestLoan = loans[0];
  const forecast = report?.sales_forecast;

  // ESG 추이: 같은 달에 점수가 여러 개면 최신 1개만 — 월별 깔끔한 추세선으로 표시(oldest→newest)
  const esgMonthly = (() => {
    const seen = new Set<string>();
    const picked: ESGScore[] = [];
    for (const s of esgHistory) { // API 는 최신순
      const key = String(s.created_at).slice(0, 7); // YYYY-MM
      if (seen.has(key)) continue;
      seen.add(key);
      picked.push(s);
    }
    return picked.reverse();
  })();

  if (loading) {
    return (
      <div className="grid-stats">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={96} radius={16} />)}
      </div>
    );
  }

  return (
    <div id="top">
      {netError && <ErrorBanner onRetry={() => { setLoading(true); loadAll(); }} />}
      {!netError && datasets.length === 0 && (
        <div className="card" style={{ marginBottom: 20, padding: "20px 24px", background: "var(--forest-soft)", borderColor: "transparent", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--forest-deep)" }}>👋 시작하기 — 경영 데이터를 업로드하세요</div>
            <div style={{ fontSize: 13.5, color: "var(--forest-deep)", marginTop: 4, lineHeight: 1.5 }}>매출·지출 CSV를 올리면 AI 매출 예측·영업이익·비용 구조·ESG 점수·우대 대출이 자동으로 분석됩니다. (저장소의 <b>sample_business_data.csv</b>로 바로 체험)</div>
          </div>
          <Button onClick={() => fileRef.current?.click()}>{uploading ? "분석 중…" : "경영 데이터 업로드"}</Button>
        </div>
      )}
      <div className="grid-stats" style={{ marginBottom: 20 }}>
        <StatCard label="예상 월매출" value={forecast ? won(forecast.next_3_months[0] * 10000) : "—"} hint="AI 1개월 예측" icon="↗" />
        <StatCard label="EBC ESG 점수" value={esg ? `${Number(esg.composite_score).toFixed(0)}` : "—"} trend={esg ? { dir: "up", text: `등급 ${esg.score_grade}` } : undefined} hint={esg ? undefined : "데이터 필요"} accent />
        <StatCard label="데이터 업로드" value={`${datasets.length}건`} hint="누적" icon="▤" />
        <StatCard label="대출 신청" value={latestLoan ? statusKo(latestLoan.status) : "없음"} hint={latestLoan ? won(latestLoan.amount) : "상품 매칭 후"} icon="₩" />
      </div>

      {/* 리포트: 매출 예측 + ESG */}
      <div id="report" className="grid-2" style={{ marginBottom: 20 }}>
        <Section title="90일 매출 예측" description={forecast ? `${forecast.method ?? "시계열 추세 분석"} · 신뢰수준 ${Math.round((forecast.confidence_level ?? 0.9) * 100)}% (음영) · 단위 ${forecast.unit}` : "AI 시계열 예측"} action={report ? <Button variant="ghost" onClick={exportPdf}>PDF 내보내기</Button> : undefined}>
          {!forecast ? <EmptyState text="경영 데이터를 업로드하면 AI 매출 예측이 표시됩니다." action={<Button onClick={() => fileRef.current?.click()}>경영 데이터 업로드</Button>} /> : (
            <>
              <AreaChart values={forecast.next_3_months} labels={forecast.labels} lower={forecast.confidence_lower} upper={forecast.confidence_upper} unit="" />
              {report?.profit?.has_expense && (
                <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
                  <div style={{ flex: 1, padding: "12px 14px", borderRadius: 14, background: "var(--fill)" }}>
                    <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>분석기간 영업이익</div>
                    <div className="font-display" style={{ fontSize: 21, fontWeight: 600, color: report.profit.operating_profit >= 0 ? "var(--forest-deep)" : "var(--danger)", letterSpacing: "-0.02em", marginTop: 2 }}>{won(report.profit.operating_profit)}</div>
                  </div>
                  <div style={{ flex: 1, padding: "12px 14px", borderRadius: 14, background: "var(--fill)" }}>
                    <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>영업이익률</div>
                    <div className="font-display" style={{ fontSize: 21, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em", marginTop: 2 }}>{report.profit.profit_margin.toFixed(1)}%</div>
                  </div>
                </div>
              )}
              {report?.profit?.expense_breakdown && report.profit.expense_breakdown.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 8 }}>비용 구조 (매출 대비)</div>
                  <BarRows rows={report.profit.expense_breakdown.map((e, i) => ({ label: e.label, value: e.ratio, max: 60, color: COST_COLORS[i % COST_COLORS.length] }))} />
                </div>
              )}
              {report?.summary && <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 12, lineHeight: 1.6 }}>{report.summary}</p>}
            </>
          )}
        </Section>

        <Section title="ESG 상생지수" description="환경·사회·지배구조 분해">
          {!esg ? <EmptyState icon="🌱" text="데이터 업로드 시 ESG 상생지수가 산출됩니다." action={<Button onClick={() => fileRef.current?.click()}>경영 데이터 업로드</Button>} /> : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              <DonutGauge value={Number(esg.composite_score)} label={Number(esg.composite_score).toFixed(0)} sub={`등급 ${esg.score_grade}`} />
              <div style={{ width: "100%" }}>
                <BarRows rows={[
                  { label: "환경 (E)", value: Number(esg.env_score), color: "var(--leaf)" },
                  { label: "사회 (S)", value: Number(esg.social_score), color: "var(--sky)" },
                  { label: "지배구조 (G)", value: Number(esg.governance_score), color: "var(--gold)" },
                ]} />
              </div>
              {esgMonthly.length >= 2 && (
                <div style={{ width: "100%", paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 6 }}>ESG 점수 추이 · 최근 {esgMonthly.length}개월</div>
                  <AreaChart
                    values={esgMonthly.map((s) => Math.round(Number(s.composite_score)))}
                    labels={esgMonthly.map((s) => `${new Date(s.created_at).getMonth() + 1}월`)}
                    color="var(--forest)"
                    unit=""
                  />
                </div>
              )}
              {esg.on_chain_tx_hash && <div style={{ fontSize: 11 }}><span style={{ color: "var(--ink-soft)" }}>온체인 앵커 </span><ChainHash hash={esg.on_chain_tx_hash} /></div>}
            </div>
          )}
        </Section>
      </div>

      {/* 상권 비교 (UC4 레이더) */}
      {report?.district_comparison?.metrics && (
        <Section title="상권 비교 분석" description="동일 상권 동종 업종 대비 백분위 (점선 = 상권 평균)">
          <div className="grid-2-even" style={{ alignItems: "center" }}>
            <RadarChart axes={Object.entries(report.district_comparison.metrics).map(([label, value]) => ({ label, value: Number(value) }))} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="card" style={{ padding: 16, background: "var(--forest-soft)", borderColor: "#cde8d7" }}>
                <div style={{ fontSize: 13, color: "var(--forest-deep)" }}>종합 상권 순위</div>
                <div className="font-display" style={{ fontSize: 30, fontWeight: 600, color: "var(--forest-deep)" }}>상위 {100 - (report.district_comparison.your_percentile ?? 50)}%</div>
              </div>
              {report.district_comparison.your_sales != null && (
                <div style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.6 }}>
                  내 매장 매출 <b style={{ color: "var(--ink)" }}>{won((report.district_comparison.your_sales ?? 0) * 10000)}</b> ·
                  상권 평균 <b style={{ color: "var(--ink)" }}>{won((report.district_comparison.district_avg_sales ?? 0) * 10000)}</b>
                  <br />{report.district_comparison.note}
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* 비용 최적화 + 이상치 */}
      {report && (
        <Section title="AI 비용 최적화 제안" description="우선순위 권장 사항">
          <div className="grid-3">
            {report.cost_optimization_tips.map((t, i) => (
              <div key={i} className="card card-hover" style={{ padding: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "6px 0", lineHeight: 1.5 }}>{t.detail}</div>
                <Badge tone="green">{t.impact}</Badge>
              </div>
            ))}
          </div>
          {report.anomalies && report.anomalies.length > 0 && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13 }}>
              ⚠ 이상치 감지: {report.anomalies.map((a) => `${a.category} ${a.note}`).join(" / ")}
            </div>
          )}
        </Section>
      )}

      {/* 업로드 */}
      <Section id="data" title="경영 데이터" description="CSV·Excel 업로드 → 분석 파이프라인 자동 실행"
        action={<><input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={onUpload} /><Button onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? "업로드 중…" : "파일 업로드"}</Button></>}>
        {datasets.length === 0 ? <EmptyState icon="📄" text="아직 업로드한 데이터가 없습니다. CSV·Excel로 시작하세요." action={<Button onClick={() => fileRef.current?.click()}>경영 데이터 업로드</Button>} /> : (
          <table style={{ width: "100%", fontSize: 13.5, borderCollapse: "collapse" }}>
            <tbody>
              {datasets.map((d) => (
                <tr key={d.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px 0" }}>{d.file_name}</td>
                  <td style={{ textAlign: "right" }}><Badge tone={d.processing_status === "ESG_COMPLETED" ? "green" : "amber"}>{statusKo(d.processing_status)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* 우대 상품 */}
      <Section id="products" title="우대 금융 상품" description="ESG 점수 기반 매칭 · 실효금리 오름차순">
        {products.length === 0 ? <EmptyState icon="🏦" text="ESG 점수가 산출되면 우대 대출 상품이 매칭됩니다." action={<Button onClick={() => fileRef.current?.click()}>경영 데이터 업로드</Button>} /> : (
          <div className="grid-3">
            {products.map((p, i) => (
              <div key={p.id} className="card card-hover" style={{ padding: 16, position: "relative" }}>
                {i === 0 && <div style={{ position: "absolute", top: 12, right: 12 }}><Badge tone="gold">최저금리</Badge></div>}
                <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{p.bank_name}</div>
                <div style={{ fontWeight: 600, fontSize: 14.5, marginTop: 2 }}>{p.product_name}</div>
                <div className="font-display" style={{ fontSize: 28, fontWeight: 600, color: "var(--forest)", marginTop: 10 }}>{pct(p.preferential_rate)}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", textDecoration: "line-through" }}>기본 {pct(p.base_rate)}</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>한도 {won(p.max_amount)} · {p.term_months}개월 · 최소 {p.min_esg_grade}</div>
                <div style={{ marginTop: 12 }}><Button onClick={() => setApplyTarget(p)}>대출 신청</Button></div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 대출 내역 */}
      <Section id="loans" title="대출 신청 현황" description="신청 → 심사 → 결과 흐름">
        {loans.length === 0 ? <EmptyState icon="📋" text="신청 내역이 없습니다. 우대 상품에서 신청해보세요." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {loans.map((l) => (
              <div key={l.id} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{won(l.amount)} <span style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 400 }}>· {pct(l.applied_rate)} · {l.term_months}개월</span></div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2 }}>{l.loan_purpose || "목적 미입력"}{l.bank_reference_id ? ` · 접수번호 ${l.bank_reference_id}` : ""}</div>
                  </div>
                  <Badge tone={l.status === "APPROVED" ? "green" : l.status === "REJECTED" ? "red" : "amber"}>{statusKo(l.status)}</Badge>
                </div>
                <div style={{ marginTop: 14 }}><LoanStepper status={l.status} reason={l.decision_reason} /></div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {applyTarget && <LoanModal product={applyTarget} onClose={() => setApplyTarget(null)} onDone={async () => { setApplyTarget(null); await loadAll(); }} />}
    </div>
  );
}

function LoanModal({ product, onClose, onDone }: { product: MatchedProduct; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [amount, setAmount] = useState(Math.min(10_000_000, product.max_amount));
  const [purpose, setPurpose] = useState("운전자금");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!consent) { toast.show("약관에 동의해야 합니다.", "error"); return; }
    setBusy(true);
    try {
      await api<LoanApplication>("/loans/apply", { method: "POST", body: { financial_product_id: product.id, amount, term_months: product.term_months, loan_purpose: purpose, consent } });
      toast.show("대출 신청이 접수되었습니다 (심사 중).", "success");
      onDone();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "신청 실패", "error");
    } finally { setBusy(false); }
  }

  return (
    <Modal onClose={onClose} title="우대 대출 신청">
      <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 14 }}>{product.bank_name} · {product.product_name} · 실효금리 {pct(product.preferential_rate)}</div>
      <label style={{ display: "block", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>신청 금액 (최대 {won(product.max_amount)})</span>
        <input type="number" className="field" value={amount} max={product.max_amount} min={1} onChange={(e) => setAmount(Number(e.target.value))} />
      </label>
      <label style={{ display: "block", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>대출 목적</span>
        <select className="field" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
          <option>운전자금</option><option>시설자금</option><option>창업자금</option><option>긴급자금</option>
        </select>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 16, cursor: "pointer" }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        대출 신청 약관 및 신용정보 제공에 동의합니다.
      </label>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={onClose}>취소</Button>
        <Button onClick={submit} disabled={busy}>{busy ? "신청 중…" : "신청 제출"}</Button>
      </div>
    </Modal>
  );
}


function LoanStepper({ status, reason }: { status: string; reason: string | null }) {
  const decided = status === "APPROVED" || status === "REJECTED";
  const approved = status === "APPROVED";
  const steps = [
    { label: "신청 완료", state: "done" as const },
    { label: "은행 심사", state: (decided ? "done" : "active") as "done" | "active" },
    { label: approved ? "승인" : status === "REJECTED" ? "거절" : "결과 대기", state: (decided ? (approved ? "done" : "rejected") : "pending") as "done" | "rejected" | "pending" },
  ];
  const color = (s: string) => (s === "done" ? "var(--forest)" : s === "active" ? "var(--warn)" : s === "rejected" ? "var(--danger)" : "var(--line)");
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {steps.map((st, i) => (
          <Fragment key={i}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
              <div style={{ width: 22, height: 22, borderRadius: 999, background: st.state === "pending" ? "var(--fill)" : color(st.state), color: st.state === "pending" ? "var(--ink-soft)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                {st.state === "done" ? "✓" : st.state === "rejected" ? "✕" : i + 1}
              </div>
              <span style={{ fontSize: 11.5, marginTop: 5, color: st.state === "pending" ? "var(--ink-soft)" : "var(--ink)", whiteSpace: "nowrap" }}>{st.label}</span>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: steps[i + 1].state === "pending" ? "var(--line)" : color(steps[i + 1].state), margin: "10px 8px 0" }} />}
          </Fragment>
        ))}
      </div>
      {decided && reason && <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 10 }}>심사 의견: {reason}</div>}
    </div>
  );
}

function statusKo(s: string): string {
  const m: Record<string, string> = {
    UPLOADED: "업로드됨", PARSING: "파싱중", PARSED: "파싱됨", AI_QUEUED: "분석대기", AI_COMPLETED: "분석완료", ESG_COMPLETED: "완료",
    UNDER_REVIEW: "심사중", APPROVED: "승인", REJECTED: "거절", SUBMITTED: "제출됨",
  };
  return m[s] || s;
}
