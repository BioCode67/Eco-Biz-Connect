"use client";

// 소상공인 대시보드 (proto_02_merchant_dashboard).
// UC3 업로드 · UC4 리포트 · UC5 ESG · UC6 상품매칭 · UC7 대출신청 을 한 화면에서 다룬다.

import { useCallback, useEffect, useRef, useState } from "react";

import DashboardShell from "@/components/DashboardShell";
import { Badge, Button, Section, StatCard } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { pct, won } from "@/lib/format";
import type { AnalysisReport, BusinessData, ESGScore, LoanApplication, MatchedProduct } from "@/lib/types";

const NAV = [
  { label: "Dashboard", href: "#top", active: true },
  { label: "Business Data", href: "#data" },
  { label: "Analysis Report", href: "#report" },
  { label: "Financial Products", href: "#products" },
  { label: "Applications", href: "#loans" },
];

export default function MerchantPage() {
  return (
    <DashboardShell role="MERCHANT" nav={NAV} title="Merchant Dashboard" subtitle="소상공인 통합 대시보드">
      <MerchantBody />
    </DashboardShell>
  );
}

function MerchantBody() {
  const { refresh } = useAuth();
  const [datasets, setDatasets] = useState<BusinessData[]>([]);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [esg, setEsg] = useState<ESGScore | null>(null);
  const [products, setProducts] = useState<MatchedProduct[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadAll = useCallback(async () => {
    setDatasets(await api<BusinessData[]>("/business-data").catch(() => []));
    setReport(await api<AnalysisReport>("/reports/latest").catch(() => null));
    setEsg(await api<ESGScore>("/esg/me").catch(() => null));
    setLoans(await api<LoanApplication[]>("/loans").catch(() => []));
    setProducts(await api<MatchedProduct[]>("/products/match").catch(() => []));
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    const form = new FormData();
    form.append("file", file);
    try {
      await api<BusinessData>("/business-data/upload", { method: "POST", form });
      setMsg("업로드 완료 — AI 분석과 ESG 점수가 산출되었습니다.");
      await loadAll();
      await refresh();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "업로드 실패");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function applyLoan(product: MatchedProduct) {
    setMsg(null);
    try {
      await api<LoanApplication>("/loans/apply", {
        method: "POST",
        body: { financial_product_id: product.id, amount: Math.min(10_000_000, product.max_amount), term_months: 24 },
      });
      setMsg(`${product.product_name} 대출을 신청했습니다.`);
      await loadAll();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "대출 신청 실패");
    }
  }

  const latestLoan = loans[0];

  return (
    <div id="top">
      {msg && <div className="mb-4 rounded-lg bg-brand-light px-4 py-2 text-sm text-brand-dark">{msg}</div>}

      {/* KPI 카드 */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Monthly Revenue"
          value={report ? won(report.sales_forecast.next_3_months[0] * 10000) : "—"}
          hint="AI 매출 예측(1개월)"
        />
        <StatCard
          label="EBC ESG Score"
          value={esg ? `${Number(esg.composite_score).toFixed(0)} / 100` : "—"}
          hint={esg ? `Grade ${esg.score_grade}` : "데이터 업로드 필요"}
          accent
        />
        <StatCard label="Data Uploads" value={`${datasets.length} datasets`} hint="누적 업로드" />
        <StatCard
          label="Loan Application"
          value={latestLoan ? latestLoan.status : "없음"}
          hint={latestLoan ? `${won(latestLoan.amount)} 신청` : "상품 매칭 후 신청"}
        />
      </div>

      {/* 업로드 */}
      <Section
        id="data"
        title="Business Data"
        description="매출/지출 데이터를 CSV·Excel 로 업로드하면 분석 파이프라인이 실행됩니다."
        action={
          <>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={onUpload} />
            <Button onClick={() => fileRef.current?.click()}>파일 업로드</Button>
          </>
        }
      >
        {datasets.length === 0 ? (
          <p className="text-sm text-muted">아직 업로드한 데이터가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {datasets.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2">
                <span>{d.file_name}</span>
                <Badge tone={d.processing_status === "ESG_COMPLETED" ? "green" : "amber"}>
                  {d.processing_status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* AI 리포트 */}
      <Section id="report" title="AI Analysis Report" description="AI 기반 매출 예측 · 비용 최적화 · 상권 비교">
        {!report ? (
          <p className="text-sm text-muted">리포트가 없습니다. 데이터를 업로드하세요.</p>
        ) : (
          <div className="space-y-4">
            <p className="rounded-lg bg-brand-light/60 px-4 py-3 text-sm text-brand-dark">{report.summary}</p>
            <div>
              <div className="mb-2 text-sm font-semibold">30일 매출 예측 (단위: {report.sales_forecast.unit})</div>
              <ForecastBars values={report.sales_forecast.next_3_months} />
            </div>
            <div>
              <div className="mb-1 text-sm font-semibold">비용 최적화 제안</div>
              <ul className="list-inside list-disc text-sm text-muted">
                {report.cost_optimization_tips.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
            {esg && (
              <div className="text-xs text-muted">
                ESG 온체인 앵커: <span className="font-mono">{esg.on_chain_tx_hash}</span>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* 우대 상품 */}
      <Section id="products" title="Financial Products" description="ESG 점수 기반 우대 대출 상품(실효금리 오름차순)">
        {products.length === 0 ? (
          <p className="text-sm text-muted">매칭된 상품이 없습니다. 먼저 ESG 점수를 산출하세요.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="ebc-card p-4">
                <div className="text-xs text-muted">{p.bank_name}</div>
                <div className="font-semibold">{p.product_name}</div>
                <div className="mt-2 text-2xl font-bold text-brand">{pct(p.preferential_rate)}</div>
                <div className="text-xs text-muted line-through">기본 {pct(p.base_rate)}</div>
                <div className="mt-1 text-xs text-muted">한도 {won(p.max_amount)} · {p.term_months}개월</div>
                <div className="mt-3">
                  <Button onClick={() => applyLoan(p)}>대출 신청</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* 대출 신청 내역 */}
      <Section id="loans" title="Loan Applications" description="대출 신청 현황">
        {loans.length === 0 ? (
          <p className="text-sm text-muted">신청 내역이 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted">
                <th className="py-2">금액</th>
                <th>적용금리</th>
                <th>기간</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="py-2">{won(l.amount)}</td>
                  <td>{pct(l.applied_rate)}</td>
                  <td>{l.term_months}개월</td>
                  <td>
                    <Badge tone={l.status === "APPROVED" ? "green" : l.status === "REJECTED" ? "red" : "amber"}>
                      {l.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

function ForecastBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const labels = ["1개월", "2개월", "3개월"];
  return (
    <div className="flex items-end gap-4 h-32">
      {values.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end">
          <div className="text-xs text-muted">{v.toLocaleString()}</div>
          <div className="w-full rounded-t bg-brand" style={{ height: `${(v / max) * 100}%` }} />
          <div className="mt-1 text-xs text-muted">{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}
