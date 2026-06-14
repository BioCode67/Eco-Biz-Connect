// 투자자 포트폴리오 (proto_04 모바일). UC11 포트폴리오·배당·예정배당 · UC12 거래내역.

import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { ChainHash } from "../components/ChainVerify";
import { DonutBreakdown } from "../components/charts";
import { Skeleton } from "../components/Skeleton";
import { Badge, EmptyState, ErrorBanner, Section, StatCard } from "../components/ui";
import { api } from "../lib/api";
import { dateStr, shortHash, txStatusKo, txTypeKo, won } from "../lib/format";
import { useRefresh } from "../lib/useRefresh";
import type { Dividend, Portfolio, STOAsset, TransactionItem, TransactionPage } from "../lib/types";
import { colors } from "../theme";

const ALLOC_COLORS = [colors.brand, colors.sky, colors.gold, colors.leaf, "#8e8e93", "#5856d6"];

export default function PortfolioScreen() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [assets, setAssets] = useState<STOAsset[]>([]);
  const [tx, setTx] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [netError, setNetError] = useState(false);

  const load = useCallback(async () => {
    const rs = await Promise.allSettled([
      api<Portfolio>("/portfolio"),
      api<Dividend[]>("/dividends"),
      api<TransactionPage>("/transactions"),
      api<STOAsset[]>("/marketplace"),
    ]);
    if (rs.every((r) => r.status === "rejected")) { setNetError(true); setLoading(false); return; }
    const v = <T,>(i: number, def: T): T => (rs[i].status === "fulfilled" ? (rs[i] as PromiseFulfilledResult<T>).value : def);
    setPortfolio(v(0, null as Portfolio | null));
    setDividends(v(1, [] as Dividend[]));
    setTx(v(2, null as TransactionPage | null)?.items ?? []);
    setAssets(v(3, [] as STOAsset[]));
    setNetError(false);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  const { refreshing, onRefresh } = useRefresh(load);

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

  const assetCo2 = new Map(assets.map((a) => [a.id, { co2: Number(a.co2_offset_per_year), supply: a.total_token_supply }]));
  const totalCo2 = holdings.reduce((sum, h) => {
    const a = assetCo2.get(h.sto_asset_id);
    if (!a || !a.supply) return sum;
    return sum + (h.quantity / a.supply) * a.co2;
  }, 0);
  const trees = Math.round(totalCo2 * 45);

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} colors={[colors.brand]} />}>
      {netError ? <ErrorBanner onRetry={() => { setLoading(true); load(); }} /> : null}
      <View style={styles.statRow}>
        <StatCard label="총 투자금" value={won(portfolio?.total_invested)} />
        <StatCard label="평가액" value={won(portfolio?.total_current_value)} />
      </View>
      <View style={styles.statRow}>
        <StatCard label="수익률" value={`${ret >= 0 ? "+" : ""}${ret.toFixed(2)}%`} />
        <StatCard label="누적 배당" value={won(portfolio?.total_dividends_received)} />
      </View>

      {totalCo2 > 0 ? (
        <View style={styles.impact}>
          <View style={styles.impactIcon}><Text style={{ fontSize: 24 }}>🌍</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.impactLabel}>내 ESG 임팩트 · 연간 탄소 상쇄</Text>
            <Text style={styles.impactValue}>{totalCo2.toFixed(2)} <Text style={{ fontSize: 15 }}>tCO₂e / 년</Text></Text>
            <Text style={styles.impactSub}>🌳 나무 약 {trees.toLocaleString()}그루의 연간 흡수량</Text>
          </View>
        </View>
      ) : null}

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
                <View style={{ marginTop: 2 }}><ChainHash hash={d.on_chain_tx_hash} /></View>
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
  impact: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.brandLight, borderRadius: 18, padding: 16, marginTop: 8, marginBottom: 4 },
  impactIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  impactLabel: { fontSize: 12, fontWeight: "600", color: colors.brandDark },
  impactValue: { fontSize: 24, fontWeight: "800", color: colors.brandDark, marginTop: 2 },
  impactSub: { fontSize: 12, color: colors.brandDark, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 11, borderTopColor: colors.border, borderTopWidth: 1 },
  name: { fontSize: 14, fontWeight: "600", color: colors.text },
  value: { fontSize: 14, fontWeight: "700", color: colors.brand },
  muted: { color: colors.muted, fontSize: 12 },
});
