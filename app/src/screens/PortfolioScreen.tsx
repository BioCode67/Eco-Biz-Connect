// 투자자 포트폴리오 (proto_04 모바일). UC11 포트폴리오·배당·예정배당 · UC12 거래내역.

import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { DonutBreakdown } from "../components/charts";
import { Skeleton } from "../components/Skeleton";
import { Badge, EmptyState, Section, StatCard } from "../components/ui";
import { api } from "../lib/api";
import { dateStr, shortHash, txStatusKo, txTypeKo, won } from "../lib/format";
import type { Dividend, Portfolio, TransactionItem, TransactionPage } from "../lib/types";
import { colors } from "../theme";

const ALLOC_COLORS = [colors.brand, colors.sky, colors.gold, colors.leaf, "#8e8e93", "#5856d6"];

export default function PortfolioScreen() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [tx, setTx] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, d, t] = await Promise.all([
        api<Portfolio>("/portfolio").catch(() => null),
        api<Dividend[]>("/dividends").catch(() => [] as Dividend[]),
        api<TransactionPage>("/transactions").catch(() => null),
      ]);
      setPortfolio(p);
      setDividends(d);
      setTx(t?.items ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}><Skeleton height={84} /><Skeleton height={84} /></View>
        <Skeleton height={160} radius={14} />
      </ScrollView>
    );
  }

  const invested = Number(portfolio?.total_invested ?? 0);
  const current = Number(portfolio?.total_current_value ?? 0);
  const ret = invested > 0 ? ((current - invested) / invested) * 100 : 0;
  const holdings = portfolio?.holdings ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.statRow}>
        <StatCard label="총 투자금" value={won(portfolio?.total_invested)} />
        <StatCard label="평가액" value={won(portfolio?.total_current_value)} />
      </View>
      <View style={styles.statRow}>
        <StatCard label="수익률" value={`${ret >= 0 ? "+" : ""}${ret.toFixed(2)}%`} />
        <StatCard label="누적 배당" value={won(portfolio?.total_dividends_received)} />
      </View>

      <Section title="보유 자산" subtitle="자산별 평가">
        {holdings.length === 0 ? (
          <EmptyState icon="🪙" text="보유 자산이 없습니다. 마켓플레이스에서 투자해보세요." />
        ) : (
          <>
            {holdings.length > 1 ? (
              <View style={{ paddingBottom: 16, marginBottom: 4, borderBottomColor: colors.border, borderBottomWidth: 1 }}>
                <DonutBreakdown
                  segments={holdings.map((h, i) => ({ label: h.asset_name, value: Math.round(Number(h.current_value)), color: ALLOC_COLORS[i % ALLOC_COLORS.length] }))}
                  centerLabel={`${holdings.length}`}
                  centerSub="보유 종목"
                  formatValue={won}
                />
              </View>
            ) : null}
            {holdings.map((h) => {
              const gain = Number(h.current_value) - Number(h.total_paid);
              return (
                <View key={h.sto_asset_id} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{h.asset_name}</Text>
                    <Text style={styles.muted}>{h.quantity}토큰 · 투자 {won(h.total_paid)}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.value}>{won(h.current_value)} <Text style={{ color: gain >= 0 ? colors.leaf : colors.danger, fontSize: 11 }}>{gain >= 0 ? "▲" : "▼"}</Text></Text>
                    <Text style={styles.muted}>배당 {won(h.dividends_received)}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </Section>

      {portfolio && portfolio.upcoming_dividends.length > 0 ? (
        <Section title="예정 배당" subtitle="다음 분배 일정">
          {portfolio.upcoming_dividends.map((u) => (
            <View key={u.sto_asset_id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{u.asset_name}</Text>
                <Text style={styles.muted}>{dateStr(u.next_distribution_date)}</Text>
              </View>
              <Text style={styles.value}>{won(u.estimated_amount)}</Text>
            </View>
          ))}
        </Section>
      ) : null}

      <Section title="배당 타임라인" subtitle="수령한 배당 현금 흐름 (온체인 검증)">
        {dividends.length === 0 ? (
          <EmptyState icon="◆" text="아직 수령한 배당이 없습니다." />
        ) : (
          dividends.map((d) => (
            <View key={d.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{d.asset_name}</Text>
                <Text style={styles.muted}>{dateStr(d.distribution_date)} · 토큰당 {won(d.per_token_amount)} × {d.my_quantity}</Text>
                <Text style={[styles.muted, { fontSize: 10.5 }]}>⛓ {shortHash(d.on_chain_tx_hash)}</Text>
              </View>
              <Text style={[styles.value, { fontSize: 15 }]}>+{won(d.my_dividend)}</Text>
            </View>
          ))
        )}
      </Section>

      <Section title="거래 내역" subtitle="전체 활동">
        {tx.length === 0 ? (
          <EmptyState icon="📋" text="거래 내역이 없습니다." />
        ) : (
          tx.map((t) => (
            <View key={`${t.type}-${t.ref_id}`} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{t.description}</Text>
                <Text style={styles.muted}>{txTypeKo(t.type)} · {dateStr(t.timestamp)}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                {t.status ? <Badge tone={t.status === "COMPLETED" ? "green" : "amber"}>{txStatusKo(t.status)}</Badge> : null}
                <Text style={styles.value}>{won(t.amount)}</Text>
              </View>
            </View>
          ))
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  statRow: { flexDirection: "row" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 11, borderTopColor: colors.border, borderTopWidth: 1 },
  name: { fontSize: 14, fontWeight: "600", color: colors.text },
  value: { fontSize: 14, fontWeight: "700", color: colors.brand },
  muted: { color: colors.muted, fontSize: 12 },
});
