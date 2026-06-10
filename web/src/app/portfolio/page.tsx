"use client";

// 투자자 포트폴리오 (proto_04_portfolio). UC11 포트폴리오/배당 · UC12 거래내역.

import { useEffect, useState } from "react";

import DashboardShell from "@/components/DashboardShell";
import { Badge, Section, StatCard } from "@/components/ui";
import { api } from "@/lib/api";
import { dateStr, shortHash, won } from "@/lib/format";
import type { Dividend, Portfolio, TransactionPage } from "@/lib/types";

const NAV = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Portfolio", href: "/portfolio", active: true },
];

export default function PortfolioPage() {
  return (
    <DashboardShell role="INVESTOR" nav={NAV} title="Investor Portfolio" subtitle="My Investment Portfolio">
      <PortfolioBody />
    </DashboardShell>
  );
}

function PortfolioBody() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [tx, setTx] = useState<TransactionPage | null>(null);

  useEffect(() => {
    (async () => {
      setPortfolio(await api<Portfolio>("/portfolio").catch(() => null));
      setDividends(await api<Dividend[]>("/dividends").catch(() => []));
      setTx(await api<TransactionPage>("/transactions").catch(() => null));
    })();
  }, []);

  const invested = Number(portfolio?.total_invested ?? 0);
  const current = Number(portfolio?.total_current_value ?? 0);
  const ret = invested > 0 ? ((current - invested) / invested) * 100 : 0;

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Total Invested" value={won(portfolio?.total_invested)} />
        <StatCard label="Current Valuation" value={won(portfolio?.total_current_value)} accent />
        <StatCard label="Total Return" value={`${ret >= 0 ? "+" : ""}${ret.toFixed(2)}%`} />
        <StatCard label="Total Dividends" value={won(portfolio?.total_dividends_received)} />
      </div>

      <Section title="Holdings" description="보유 자산 현황">
        {!portfolio || portfolio.holdings.length === 0 ? (
          <p className="text-sm text-muted">보유 자산이 없습니다. 마켓플레이스에서 투자해보세요.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted">
                <th className="py-2">자산</th>
                <th>수량</th>
                <th>투자금</th>
                <th>평가액</th>
                <th>배당</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.holdings.map((h) => (
                <tr key={h.sto_asset_id} className="border-t border-border">
                  <td className="py-2 font-medium">{h.asset_name}</td>
                  <td>{h.quantity.toLocaleString()}</td>
                  <td>{won(h.total_paid)}</td>
                  <td>{won(h.current_value)}</td>
                  <td>{won(h.dividends_received)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Dividend History" description="배당 수령 내역">
        {dividends.length === 0 ? (
          <p className="text-sm text-muted">배당 내역이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {dividends.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium">{d.asset_name}</div>
                  <div className="text-xs text-muted">
                    {dateStr(d.distribution_date)} · 토큰당 {won(d.per_token_amount)} · {d.my_quantity}토큰
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-brand">{won(d.my_dividend)}</div>
                  <div className="font-mono text-xs text-muted">{shortHash(d.on_chain_tx_hash)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Transactions" description="거래 내역">
        {!tx || tx.items.length === 0 ? (
          <p className="text-sm text-muted">거래 내역이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {tx.items.map((t) => (
              <li key={`${t.type}-${t.ref_id}`} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium">{t.description}</div>
                  <div className="text-xs text-muted">{dateStr(t.timestamp)}</div>
                </div>
                <div className="flex items-center gap-2">
                  {t.status && <Badge tone="amber">{t.status}</Badge>}
                  <span className="font-semibold">{won(t.amount)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
