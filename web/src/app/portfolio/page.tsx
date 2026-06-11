"use client";

// 투자자 포트폴리오 (proto_04). UC11 포트폴리오·배당·예정배당 · UC12 거래내역(필터·CSV).

import { useCallback, useEffect, useState } from "react";

import { DonutBreakdown } from "@/components/charts";
import DashboardShell from "@/components/DashboardShell";
import { Badge, Button, EmptyState, ErrorBanner, Section, Skeleton, StatCard } from "@/components/ui";
import { api, downloadCsv, safe } from "@/lib/api";
import { dateStr, shortHash, won } from "@/lib/format";
import type { Dividend, Portfolio, TransactionPage } from "@/lib/types";

const NAV = [
  { label: "마켓플레이스", href: "/marketplace", icon: "market" },
  { label: "포트폴리오", href: "/portfolio", icon: "portfolio", active: true },
];

const TYPE_KO: Record<string, string> = {
  TOKEN_PURCHASE: "토큰 구매", DIVIDEND_RECEIVED: "배당 수령", LOAN_APPLICATION: "대출 신청", DATA_UPLOAD: "데이터 업로드",
};

const ALLOC_COLORS = ["var(--forest)", "var(--sky)", "var(--gold)", "var(--leaf)", "#8e8e93", "#5856d6"];

export default function PortfolioPage() {
  return (
    <DashboardShell role="INVESTOR" nav={NAV} title="내 포트폴리오" subtitle="보유 자산 · 수익 · 배당">
      <PortfolioBody />
    </DashboardShell>
  );
}

function PortfolioBody() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [tx, setTx] = useState<TransactionPage | null>(null);
  const [txType, setTxType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [netError, setNetError] = useState(false);

  const loadTx = useCallback(async (type: string) => {
    const q = type === "ALL" ? "" : `?type=${type}`;
    setTx(await safe(api<TransactionPage | null>(`/transactions${q}`), null));
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [p, d] = await Promise.all([
        safe(api<Portfolio | null>("/portfolio"), null),
        safe(api<Dividend[]>("/dividends"), [] as Dividend[]),
      ]);
      setPortfolio(p); setDividends(d);
      await loadTx("ALL");
      setNetError(false);
    } catch {
      setNetError(true);
    } finally {
      setLoading(false);
    }
  }, [loadTx]);

  useEffect(() => { loadAll(); }, [loadAll]);

  function exportCsv() {
    if (!tx) return;
    const rows: (string | number)[][] = [["일시", "유형", "내용", "금액", "상태", "Tx해시"]];
    tx.items.forEach((i) => rows.push([dateStr(i.timestamp), TYPE_KO[i.type] ?? i.type, i.description, i.amount, i.status ?? "", i.on_chain_tx_hash ?? ""]));
    downloadCsv("ebc_transactions.csv", rows);
  }

  if (loading) return <div className="grid-stats">{[0, 1, 2, 3].map((i) => <Skeleton key={i} height={96} radius={16} />)}</div>;

  const ret = portfolio?.total_return_pct ?? 0;

  return (
    <div>
      {netError && <ErrorBanner onRetry={() => { setLoading(true); loadAll(); }} />}
      <div className="grid-stats" style={{ marginBottom: 20 }}>
        <StatCard label="총 투자금" value={won(portfolio?.total_invested)} icon="₩" />
        <StatCard label="현재 평가액" value={won(portfolio?.total_current_value)} accent icon="↗" />
        <StatCard label="총 수익률" value={`${ret >= 0 ? "+" : ""}${ret.toFixed(2)}%`} trend={{ dir: ret >= 0 ? "up" : "down", text: ret >= 0 ? "수익" : "손실" }} />
        <StatCard label="누적 배당" value={won(portfolio?.total_dividends_received)} icon="◆" />
      </div>

      <div className="grid-2">
        <Section title="보유 자산" description="자산별 평가">
          {!portfolio || portfolio.holdings.length === 0 ? <EmptyState icon="🪙" text="보유 자산이 없습니다. 마켓플레이스에서 투자해보세요." /> : (
            <>
            {portfolio.holdings.length > 1 && (
              <div style={{ paddingBottom: 18, marginBottom: 6, borderBottom: "1px solid var(--line)" }}>
                <DonutBreakdown
                  segments={portfolio.holdings.map((h, i) => ({ label: h.asset_name, value: Math.round(Number(h.current_value)), color: ALLOC_COLORS[i % ALLOC_COLORS.length] }))}
                  centerLabel={`${portfolio.holdings.length}`}
                  centerSub="보유 종목"
                />
              </div>
            )}
            <table style={{ width: "100%", fontSize: 13.5, borderCollapse: "collapse" }}>
              <thead><tr style={{ textAlign: "left", color: "var(--ink-soft)", fontSize: 11.5 }}>
                <th style={{ padding: "0 0 8px" }}>자산</th><th>수량</th><th>투자금</th><th>평가액</th><th>배당</th>
              </tr></thead>
              <tbody>
                {portfolio.holdings.map((h) => {
                  const gain = Number(h.current_value) - Number(h.total_paid);
                  return (
                    <tr key={h.sto_asset_id} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={{ padding: "10px 0", fontWeight: 600 }}>{h.asset_name}</td>
                      <td>{h.quantity.toLocaleString()}</td>
                      <td>{won(h.total_paid)}</td>
                      <td>{won(h.current_value)} <span style={{ color: gain >= 0 ? "var(--leaf)" : "var(--danger)", fontSize: 11 }}>{gain >= 0 ? "▲" : "▼"}</span></td>
                      <td>{won(h.dividends_received)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </>
          )}
        </Section>

        <Section title="예정 배당" description="다음 분배 일정">
          {!portfolio || portfolio.upcoming_dividends.length === 0 ? <EmptyState icon="📅" text="예정된 배당이 없습니다." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {portfolio.upcoming_dividends.map((u) => (
                <div key={u.sto_asset_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "var(--paper)" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{u.asset_name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{dateStr(u.next_distribution_date)}</div>
                  </div>
                  <span style={{ fontWeight: 700, color: "var(--forest)" }}>{won(u.estimated_amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section title="배당 내역" description="수령한 배당">
        {dividends.length === 0 ? <EmptyState icon="◆" text="배당 내역이 없습니다." /> : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {dividends.map((d) => (
              <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "1px solid var(--line)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{d.asset_name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{dateStr(d.distribution_date)} · 토큰당 {won(d.per_token_amount)} · {d.my_quantity}토큰</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "var(--forest)" }}>{won(d.my_dividend)}</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-soft)", fontFamily: "monospace" }}>⛓ {shortHash(d.on_chain_tx_hash)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="거래 내역" description="전체 활동" action={tx && tx.items.length > 0 ? <Button variant="ghost" onClick={exportCsv}>CSV 내보내기</Button> : undefined}>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {["ALL", "TOKEN_PURCHASE", "DIVIDEND_RECEIVED"].map((t) => (
            <button key={t} onClick={() => { setTxType(t); loadTx(t); }} className="chip" style={{ cursor: "pointer", border: "1px solid var(--line)", background: txType === t ? "var(--forest)" : "transparent", color: txType === t ? "#fff" : "var(--ink-soft)", padding: "6px 11px" }}>
              {t === "ALL" ? "전체" : TYPE_KO[t]}
            </button>
          ))}
        </div>
        {!tx || tx.items.length === 0 ? <EmptyState icon="📋" text="거래 내역이 없습니다." /> : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {tx.items.map((t) => (
              <div key={`${t.type}-${t.ref_id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderTop: "1px solid var(--line)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.description}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{TYPE_KO[t.type] ?? t.type} · {dateStr(t.timestamp)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {t.status && <Badge tone={t.status === "COMPLETED" ? "green" : "amber"}>{t.status}</Badge>}
                  <span style={{ fontWeight: 700 }}>{won(t.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
