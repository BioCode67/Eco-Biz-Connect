"use client";

// 소상공인 대시보드 (proto_02). UC3 업로드 · UC4 리포트(차트·PDF) · UC5 ESG · UC6 매칭 · UC7 대출.

import { useCallback, useEffect, useRef, useState } from "react";

import { AreaChart, BarRows, DonutGauge } from "@/components/charts";
import DashboardShell from "@/components/DashboardShell";
import { Badge, Button, EmptyState, Section, Skeleton, StatCard } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { api, apiDownload, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { pct, won } from "@/lib/format";
import type { AnalysisReport, BusinessData, ESGScore, LoanApplication, MatchedProduct } from "@/lib/types";

const NAV = [
  { label: "대시보드", href: "#top", icon: "▦", active: true },
  { label: "경영 데이터", href: "#data", icon: "↑" },
  { label: "분석 리포트", href: "#report", icon: "▤" },
  { label: "금융 상품", href: "#products", icon: "₩" },
  { label: "대출 신청", href: "#loans", icon: "✓" },
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
  const [products, setProducts] = useState<MatchedProduct[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [uploading, setUploading] = useState(false);
  const [applyTarget, setApplyTarget] = useState<MatchedProduct | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadAll = useCallback(async () => {
    const [d, r, e, l, p] = await Promise.all([
      api<BusinessData[]>("/business-data").catch(() => []),
      api<AnalysisReport>("/reports/latest").catch(() => null),
      api<ESGScore>("/esg/me").catch(() => null),
      api<LoanApplication[]>("/loans").catch(() => []),
      api<MatchedProduct[]>("/products/match").catch(() => []),
    ]);
    setDatasets(d); setReport(r); setEsg(e); setLoans(l); setProducts(p);
    setLoading(false);
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

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={96} radius={16} />)}
      </div>
    );
  }

  return (
    <div id="top">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        <StatCard label="예상 월매출" value={forecast ? won(forecast.next_3_months[0] * 10000) : "—"} hint="AI 1개월 예측" icon="↗" />
        <StatCard label="EBC ESG 점수" value={esg ? `${Number(esg.composite_score).toFixed(0)}` : "—"} trend={esg ? { dir: "up", text: `등급 ${esg.score_grade}` } : undefined} hint={esg ? undefined : "데이터 필요"} accent />
        <StatCard label="데이터 업로드" value={`${datasets.length}건`} hint="누적" icon="▤" />
        <StatCard label="대출 신청" value={latestLoan ? statusKo(latestLoan.status) : "없음"} hint={latestLoan ? won(latestLoan.amount) : "상품 매칭 후"} icon="₩" />
      </div>

      {/* 리포트: 매출 예측 + ESG */}
      <div id="report" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, marginBottom: 20 }}>
        <Section title="30일 매출 예측" description={forecast ? `신뢰수준 ${(forecast.confidence_level ?? 0.9) * 100}% · 단위 ${forecast.unit}` : "AI 시계열 예측"} action={report ? <Button variant="ghost" onClick={exportPdf}>PDF 내보내기</Button> : undefined}>
          {!forecast ? <EmptyState text="데이터를 업로드하면 매출 예측이 표시됩니다." /> : (
            <>
              <AreaChart values={forecast.next_3_months} labels={forecast.labels} unit="" />
              {report?.summary && <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 12, lineHeight: 1.6 }}>{report.summary}</p>}
            </>
          )}
        </Section>

        <Section title="ESG 상생지수" description="환경·사회·지배구조 분해">
          {!esg ? <EmptyState icon="🌱" text="ESG 점수가 아직 없습니다." /> : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              <DonutGauge value={Number(esg.composite_score)} label={Number(esg.composite_score).toFixed(0)} sub={`등급 ${esg.score_grade}`} />
              <div style={{ width: "100%" }}>
                <BarRows rows={[
                  { label: "환경 (E)", value: Number(esg.env_score), color: "var(--leaf)" },
                  { label: "사회 (S)", value: Number(esg.social_score), color: "var(--sky)" },
                  { label: "지배구조 (G)", value: Number(esg.governance_score), color: "var(--gold)" },
                ]} />
              </div>
              {esg.on_chain_tx_hash && <div style={{ fontSize: 11, color: "var(--ink-soft)", wordBreak: "break-all" }}>⛓ 온체인 앵커: {esg.on_chain_tx_hash.slice(0, 22)}…</div>}
            </div>
          )}
        </Section>
      </div>

      {/* 비용 최적화 + 이상치 */}
      {report && (
        <Section title="AI 비용 최적화 제안" description="우선순위 권장 사항">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
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
        {datasets.length === 0 ? <EmptyState icon="📄" text="아직 업로드한 데이터가 없습니다." /> : (
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
        {products.length === 0 ? <EmptyState icon="🏦" text="먼저 데이터를 업로드해 ESG 점수를 산출하세요." /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
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
      <Section id="loans" title="대출 신청 현황">
        {loans.length === 0 ? <EmptyState icon="📋" text="신청 내역이 없습니다." /> : (
          <table style={{ width: "100%", fontSize: 13.5, borderCollapse: "collapse" }}>
            <thead><tr style={{ textAlign: "left", color: "var(--ink-soft)", fontSize: 11.5 }}>
              <th style={{ padding: "0 0 8px" }}>금액</th><th>금리</th><th>기간</th><th>목적</th><th>상태</th>
            </tr></thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "10px 0" }}>{won(l.amount)}</td>
                  <td>{pct(l.applied_rate)}</td>
                  <td>{l.term_months}개월</td>
                  <td style={{ color: "var(--ink-soft)" }}>{l.loan_purpose || "-"}</td>
                  <td><Badge tone={l.status === "APPROVED" ? "green" : l.status === "REJECTED" ? "red" : "amber"}>{statusKo(l.status)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
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

export function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,36,32,0.4)", backdropFilter: "blur(2px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: 440, padding: 24, boxShadow: "var(--shadow-lg)" }}>
        <h3 className="font-display" style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{title}</h3>
        {children}
      </div>
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
