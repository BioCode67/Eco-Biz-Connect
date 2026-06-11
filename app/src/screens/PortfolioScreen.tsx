// 투자자 포트폴리오 (proto_04 모바일). UC11.

import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Skeleton } from "../components/Skeleton";
import { EmptyState, Section, StatCard } from "../components/ui";
import { api } from "../lib/api";
import { won } from "../lib/format";
import type { Portfolio } from "../lib/types";
import { colors } from "../theme";

export default function PortfolioScreen() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setPortfolio(await api<Portfolio>("/portfolio").catch(() => null));
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

      {portfolio && portfolio.upcoming_dividends.length > 0 ? (
        <Section title="예정 배당" subtitle="다음 분배 일정">
          {portfolio.upcoming_dividends.map((u) => (
            <View key={u.sto_asset_id} style={styles.row}>
              <Text style={[styles.name, { flex: 1 }]}>{u.asset_name}</Text>
              <Text style={styles.value}>{won(u.estimated_amount)}</Text>
            </View>
          ))}
        </Section>
      ) : null}

      <Section title="보유 자산" subtitle="자산별 평가">
        {!portfolio || portfolio.holdings.length === 0 ? (
          <EmptyState icon="🪙" text="보유 자산이 없습니다. 마켓플레이스에서 투자해보세요." />
        ) : (
          portfolio.holdings.map((h) => (
            <View key={h.sto_asset_id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{h.asset_name}</Text>
                <Text style={styles.muted}>{h.quantity}토큰 · 투자 {won(h.total_paid)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.value}>{won(h.current_value)}</Text>
                <Text style={styles.muted}>배당 {won(h.dividends_received)}</Text>
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
  row: { flexDirection: "row", paddingVertical: 10, borderTopColor: colors.border, borderTopWidth: 1 },
  name: { fontSize: 14, fontWeight: "600", color: colors.text },
  value: { fontSize: 14, fontWeight: "700", color: colors.brand },
  muted: { color: colors.muted, fontSize: 12 },
});
