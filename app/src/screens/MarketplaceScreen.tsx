// 투자 마켓플레이스 (proto_03 모바일). UC9 탐색 · UC10 구매(동적계산·위험고지·KYC).

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useRefresh } from "../lib/useRefresh";

import { AppModal } from "../components/AppModal";
import { Skeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { Badge, Button, EmptyState, ErrorBanner, Field, Section } from "../components/ui";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { num, pct, won } from "../lib/format";
import type { STOAsset } from "../lib/types";
import { colors, shadow } from "../theme";

const ICON: Record<string, string> = { SOLAR: "☀", WIND: "💨", FOREST: "🌲", HYDRO: "💧" };
const LABEL: Record<string, string> = { SOLAR: "태양광", WIND: "풍력", FOREST: "탄소숲", HYDRO: "수력" };

type SortKey = "yield" | "price" | "recent" | "remaining" | "co2";
const TYPE_OPTS: { v: string; label: string }[] = [
  { v: "ALL", label: "전체" }, { v: "SOLAR", label: "태양광" }, { v: "WIND", label: "풍력" }, { v: "FOREST", label: "탄소숲" }, { v: "HYDRO", label: "수력" },
];
const SORT_OPTS: { v: SortKey; label: string }[] = [
  { v: "yield", label: "수익률순" }, { v: "price", label: "최저가순" }, { v: "remaining", label: "잔여량순" }, { v: "co2", label: "CO₂순" }, { v: "recent", label: "최신순" },
];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: active ? colors.brand : colors.border, backgroundColor: active ? colors.brand : "transparent" }}>
      <Text style={{ fontSize: 12.5, fontWeight: "600", color: active ? colors.white : colors.muted }}>{label}</Text>
    </Pressable>
  );
}

export default function MarketplaceScreen() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [assets, setAssets] = useState<STOAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyTarget, setBuyTarget] = useState<STOAsset | null>(null);
  const [detailTarget, setDetailTarget] = useState<STOAsset | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sort, setSort] = useState<SortKey>("yield");
  const [compareList, setCompareList] = useState<STOAsset[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [netError, setNetError] = useState(false);
  const kycVerified = user?.kyc_status === "VERIFIED";

  function toggleCompare(a: STOAsset) {
    setCompareList((prev) => {
      if (prev.some((x) => x.id === a.id)) return prev.filter((x) => x.id !== a.id);
      if (prev.length >= 3) { toast.show("최대 3개까지 비교할 수 있습니다.", "info"); return prev; }
      return [...prev, a];
    });
  }

  const load = useCallback(async () => {
    try {
      setAssets(await api<STOAsset[]>("/marketplace"));
      setNetError(false);
    } catch {
      setNetError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  const { refreshing, onRefresh } = useRefresh(load);

  const visible = useMemo(() => {
    let list = assets.filter((a) => typeFilter === "ALL" || a.asset_type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q) || (a.location ?? "").toLowerCase().includes(q));
    }
    const s = [...list];
    if (sort === "yield") s.sort((a, b) => Number(b.expected_yield) - Number(a.expected_yield));
    else if (sort === "price") s.sort((a, b) => Number(a.token_price) - Number(b.token_price));
    else if (sort === "remaining") s.sort((a, b) => b.remaining_tokens - a.remaining_tokens);
    else if (sort === "co2") s.sort((a, b) => b.co2_offset_per_year - a.co2_offset_per_year);
    else s.sort((a, b) => b.id - a.id);
    return s;
  }, [assets, typeFilter, search, sort]);

  async function verifyKyc() {
    try {
      await api("/investor/kyc/verify", { method: "POST" });
      await refresh();
      toast.show("KYC 인증 완료 — 투자 가능", "success");
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "KYC 실패", "error");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} colors={[colors.brand]} />}>
      {netError ? <ErrorBanner onRetry={() => { setLoading(true); load(); }} /> : null}
      {!kycVerified ? (
        <View style={styles.kyc}>
          <Text style={styles.kycText}>토큰 투자를 위해 KYC 인증이 필요합니다.</Text>
          <Button title="KYC 인증" onPress={verifyKyc} />
        </View>
      ) : null}

      <View style={styles.filterBar}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="🔍 상품·지역 검색"
          placeholderTextColor={colors.mutedFaint}
          autoCapitalize="none"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
          {TYPE_OPTS.map((t) => <Chip key={t.v} label={t.label} active={typeFilter === t.v} onPress={() => setTypeFilter(t.v)} />)}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
          {SORT_OPTS.map((o) => <Chip key={o.v} label={o.label} active={sort === o.v} onPress={() => setSort(o.v)} />)}
        </ScrollView>
      </View>

      <Section title="탄소중립 STO 상품" subtitle={`${visible.length}개 상품`}>
        {loading ? (
          <View style={{ gap: 10 }}><Skeleton height={120} radius={12} /><Skeleton height={120} radius={12} /></View>
        ) : visible.length === 0 ? (
          <EmptyState icon="🪙" text="조건에 맞는 상품이 없습니다." />
        ) : (
          visible.map((a) => {
            const soldOut = a.status === "SOLD_OUT" || a.remaining_tokens <= 0;
            const soldPct = (1 - a.remaining_tokens / a.total_token_supply) * 100;
            return (
              <Pressable key={a.id} style={styles.product} onPress={() => setDetailTarget(a)}>
                <View style={styles.head}>
                  <Text style={{ fontSize: 26 }}>{ICON[a.asset_type] ?? "🌱"}</Text>
                  <Badge tone="green">{LABEL[a.asset_type] ?? a.asset_type}</Badge>
                </View>
                <Text style={styles.pname}>{a.name}</Text>
                {a.location ? <Text style={styles.muted}>📍 {a.location}</Text> : null}
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 6 }}>
                  <Text style={styles.yieldTxt}>{pct(a.expected_yield)}</Text>
                  <Text style={styles.muted}>예상 연수익률</Text>
                </View>
                <Text style={styles.muted}>토큰 {won(a.token_price)} · CO₂ {a.co2_offset_per_year}t/년</Text>
                <View style={styles.barOuter}><View style={[styles.barInner, { width: `${100 - soldPct}%` }]} /></View>
                <Text style={styles.muted}>잔여 {num(a.remaining_tokens)} / {num(a.total_token_supply)}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 }}>
                  <Button title={soldOut ? "판매 완료" : "토큰 구매"} onPress={() => setBuyTarget(a)} disabled={soldOut || !kycVerified} />
                  <Text style={styles.detailLink}>상세보기 ›</Text>
                  <Pressable onPress={() => toggleCompare(a)} hitSlop={8} style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <View style={[styles.checkbox, compareList.some((x) => x.id === a.id) && styles.checkboxOn]}>
                      {compareList.some((x) => x.id === a.id) ? <Text style={{ color: colors.white, fontSize: 11, fontWeight: "800" }}>✓</Text> : null}
                    </View>
                    <Text style={styles.muted}>비교</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          })
        )}
      </Section>

      <DetailSheet asset={detailTarget} kycVerified={kycVerified} onClose={() => setDetailTarget(null)} onBuy={() => { setBuyTarget(detailTarget); setDetailTarget(null); }} />
      <PurchaseModal asset={buyTarget} onClose={() => setBuyTarget(null)} onDone={async () => { setBuyTarget(null); await load(); await refresh(); }} />
      <CompareSheet assets={compareList} visible={showCompare} onClose={() => setShowCompare(false)} />

      {compareList.length > 0 ? (
        <View style={styles.compareBar}>
          <Text style={{ color: colors.white, fontSize: 13.5, flex: 1 }}>{compareList.length}개 선택됨</Text>
          <Pressable onPress={() => setShowCompare(true)} disabled={compareList.length < 2} style={[styles.compareBtn, compareList.length < 2 && { opacity: 0.5 }]}>
            <Text style={{ color: colors.brand, fontWeight: "700", fontSize: 13 }}>비교하기</Text>
          </Pressable>
          <Pressable onPress={() => setCompareList([])} hitSlop={8}><Text style={{ color: colors.white, fontSize: 18, opacity: 0.7 }}>✕</Text></Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

function DetailSheet({ asset, kycVerified, onClose, onBuy }: { asset: STOAsset | null; kycVerified: boolean; onClose: () => void; onBuy: () => void }) {
  if (!asset) return null;
  const soldOut = asset.status === "SOLD_OUT" || asset.remaining_tokens <= 0;
  const facts: [string, string][] = [
    ["예상 연수익률", pct(asset.expected_yield)],
    ["토큰 단가", won(asset.token_price)],
    ["연 CO₂ 저감", `${asset.co2_offset_per_year} ton`],
    ["설비 용량", asset.installed_capacity_mw ? `${asset.installed_capacity_mw} MW` : "—"],
    ["배당 주기", `${asset.dividend_period_months}개월`],
    ["총 발행량", num(asset.total_token_supply)],
    ["잔여 토큰", num(asset.remaining_tokens)],
  ];
  return (
    <AppModal visible={!!asset} title={asset.name} onClose={onClose}>
      <Text style={styles.muted}>{LABEL[asset.asset_type] ?? asset.asset_type}{asset.location ? ` · 📍 ${asset.location}` : ""}</Text>
      {asset.description ? <Text style={[styles.muted, { marginTop: 8, lineHeight: 19 }]}>{asset.description}</Text> : null}
      <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: colors.border }}>
        {facts.map(([k, v]) => (
          <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{k}</Text>
            <Text style={{ color: colors.text, fontSize: 13.5, fontWeight: "600" }}>{v}</Text>
          </View>
        ))}
      </View>
      {asset.contract_address ? <Text style={[styles.muted, { marginTop: 12, fontSize: 11 }]}>⛓ ERC-1400: {asset.contract_address.slice(0, 24)}…</Text> : null}
      <View style={{ marginTop: 16 }}>
        <Button title={soldOut ? "판매 완료" : "토큰 구매"} onPress={onBuy} disabled={soldOut || !kycVerified} />
      </View>
    </AppModal>
  );
}

function PurchaseModal({ asset, onClose, onDone }: { asset: STOAsset | null; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [qty, setQty] = useState("1");
  const [busy, setBusy] = useState(false);
  if (!asset) return null;
  const q = Math.max(1, Number(qty) || 1);
  const total = Number(asset.token_price) * q;
  const expReturn = total * (Number(asset.expected_yield) / 100);

  async function submit() {
    if (!asset) return;
    setBusy(true);
    try {
      await api(`/marketplace/${asset.id}/purchase`, { method: "POST", body: { quantity: q } });
      toast.show(`${asset.name} ${q}토큰 구매 완료`, "success");
      onDone();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "구매 실패", "error");
    } finally { setBusy(false); }
  }

  return (
    <AppModal visible={!!asset} title={`${asset.name} 투자`} onClose={onClose}>
      <Field label={`구매 수량 (잔여 ${num(asset.remaining_tokens)})`} value={qty} onChangeText={setQty} keyboardType="number-pad" />
      <View style={styles.calc}>
        <Row label="총 결제 금액" value={won(total)} strong />
        <Row label="예상 연 수익" value={`${won(expReturn)} (${pct(asset.expected_yield)})`} />
        <Row label="탄소 저감 환산" value={`${((asset.co2_offset_per_year * q) / asset.total_token_supply).toFixed(2)} t/년`} />
      </View>
      <Text style={styles.warn}>본 투자는 원금 손실이 발생할 수 있습니다.</Text>
      <Button title={busy ? "결제 중…" : "결제 및 투자"} onPress={submit} disabled={busy} />
    </AppModal>
  );
}

function CompareSheet({ assets, visible, onClose }: { assets: STOAsset[]; visible: boolean; onClose: () => void }) {
  if (!visible || assets.length === 0) return null;
  const rows: { label: string; get: (a: STOAsset) => string; n: (a: STOAsset) => number; best?: "max" | "min" }[] = [
    { label: "예상 연수익률", get: (a) => pct(a.expected_yield), n: (a) => Number(a.expected_yield), best: "max" },
    { label: "토큰 단가", get: (a) => won(a.token_price), n: (a) => Number(a.token_price), best: "min" },
    { label: "연 CO₂ 저감", get: (a) => `${a.co2_offset_per_year}t`, n: (a) => a.co2_offset_per_year, best: "max" },
    { label: "배당 주기", get: (a) => `${a.dividend_period_months}개월`, n: (a) => a.dividend_period_months, best: "min" },
    { label: "잔여 토큰", get: (a) => num(a.remaining_tokens), n: (a) => a.remaining_tokens, best: "max" },
  ];
  const cellW = 110;
  return (
    <AppModal visible={visible} title="상품 비교" onClose={onClose}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={[styles.cmpRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Text style={[styles.cmpLabel, { width: 88 }]}>항목</Text>
            {assets.map((a) => <Text key={a.id} style={[styles.cmpHead, { width: cellW }]} numberOfLines={2}>{a.name}</Text>)}
          </View>
          {rows.map((r) => {
            const nums = assets.map(r.n);
            const best = r.best === "max" ? Math.max(...nums) : r.best === "min" ? Math.min(...nums) : NaN;
            return (
              <View key={r.label} style={styles.cmpRow}>
                <Text style={[styles.cmpLabel, { width: 88 }]}>{r.label}</Text>
                {assets.map((a, i) => {
                  const isBest = r.best != null && nums[i] === best && assets.length > 1;
                  return <Text key={a.id} style={[styles.cmpCell, { width: cellW }, isBest && styles.cmpBest]}>{r.get(a)}{isBest ? " ★" : ""}</Text>;
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </AppModal>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 }}>
      <Text style={{ fontSize: strong ? 14 : 12.5, color: strong ? colors.text : colors.muted, fontWeight: strong ? "700" : "400" }}>{label}</Text>
      <Text style={{ fontSize: strong ? 14 : 12.5, color: strong ? colors.brand : colors.text, fontWeight: strong ? "700" : "400" }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  filterBar: { gap: 8, marginBottom: 12 },
  search: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.text },
  kyc: { backgroundColor: "#fbedd4", borderRadius: 12, padding: 14, marginBottom: 12, gap: 8 },
  kycText: { color: colors.warning, fontSize: 13 },
  muted: { color: colors.muted, fontSize: 12, marginTop: 3 },
  product: { paddingVertical: 12, borderTopColor: colors.border, borderTopWidth: 1 },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pname: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 4 },
  yieldTxt: { fontSize: 22, fontWeight: "800", color: colors.brand },
  detailLink: { color: colors.sky, fontSize: 13, fontWeight: "600" },
  barOuter: { height: 7, borderRadius: 999, backgroundColor: colors.border, overflow: "hidden", marginTop: 8 },
  barInner: { height: "100%", borderRadius: 999, backgroundColor: colors.brand },
  calc: { backgroundColor: colors.bg, borderRadius: 12, padding: 14, marginVertical: 12 },
  warn: { fontSize: 12, color: colors.muted, marginBottom: 12, lineHeight: 17 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  checkboxOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  compareBar: { position: "absolute", left: 16, right: 16, bottom: 20, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.text, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18, ...shadow },
  compareBtn: { backgroundColor: colors.white, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 16 },
  cmpRow: { flexDirection: "row", alignItems: "center", paddingVertical: 9 },
  cmpLabel: { fontSize: 12, color: colors.muted },
  cmpHead: { fontSize: 12.5, fontWeight: "700", color: colors.text, paddingHorizontal: 4 },
  cmpCell: { fontSize: 13, color: colors.text, paddingHorizontal: 4 },
  cmpBest: { color: colors.brandDark, fontWeight: "700" },
});
