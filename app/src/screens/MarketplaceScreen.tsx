// 투자 마켓플레이스 (proto_03 모바일). UC9 탐색 · UC10 구매(KYC 선결).

import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Badge, Button, Section } from "../components/ui";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { num, won } from "../lib/format";
import type { STOAsset } from "../lib/types";
import { colors } from "../theme";

const ICON: Record<string, string> = { SOLAR: "☀", WIND: "💨", FOREST: "🌲", HYDRO: "💧" };

export default function MarketplaceScreen() {
  const { user, refresh } = useAuth();
  const [assets, setAssets] = useState<STOAsset[]>([]);
  const [qty, setQty] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const kycVerified = user?.kyc_status === "VERIFIED";

  const load = useCallback(async () => {
    setAssets(await api<STOAsset[]>("/marketplace").catch(() => []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function verifyKyc() {
    setMsg(null);
    try {
      await api("/investor/kyc/verify", { method: "POST" });
      await refresh();
      setMsg("KYC 인증 완료. 이제 구매할 수 있습니다.");
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "KYC 실패");
    }
  }

  async function buy(asset: STOAsset) {
    const quantity = Number(qty[asset.id] || "1");
    setMsg(null);
    try {
      await api(`/marketplace/${asset.id}/purchase`, { method: "POST", body: { quantity } });
      setMsg(`${asset.name} ${quantity}토큰 구매 완료.`);
      await load();
      await refresh();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "구매 실패");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!kycVerified ? (
        <View style={styles.kyc}>
          <Text style={styles.kycText}>토큰 구매를 위해 KYC 인증이 필요합니다.</Text>
          <Button title="KYC 인증" onPress={verifyKyc} />
        </View>
      ) : null}
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}

      <Section title="Carbon-Neutral STO" subtitle="탄소중립 환경 자산 토큰증권">
        {assets.length === 0 ? (
          <Text style={styles.muted}>공개된 상품이 없습니다.</Text>
        ) : (
          assets.map((a) => {
            const soldOut = a.status === "SOLD_OUT" || a.remaining_tokens <= 0;
            return (
              <View key={a.id} style={styles.product}>
                <View style={styles.productHead}>
                  <Text style={{ fontSize: 26 }}>{ICON[a.asset_type] ?? "🌱"}</Text>
                  <Badge tone="green">{a.asset_type}</Badge>
                </View>
                <Text style={styles.productName}>{a.name}</Text>
                <Text style={styles.muted}>가격 {won(a.token_price)} · 잔여 {num(a.remaining_tokens)}/{num(a.total_token_supply)}</Text>
                <View style={styles.buyRow}>
                  <TextInput
                    style={styles.qty}
                    keyboardType="number-pad"
                    value={qty[a.id] ?? "1"}
                    onChangeText={(v) => setQty({ ...qty, [a.id]: v })}
                    editable={!soldOut && kycVerified}
                  />
                  <Button title={soldOut ? "Sold Out" : "Buy"} onPress={() => buy(a)} disabled={soldOut || !kycVerified} />
                </View>
              </View>
            );
          })
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  kyc: { backgroundColor: "#fbedd4", borderRadius: 10, padding: 12, marginBottom: 10, gap: 8 },
  kycText: { color: colors.warning, fontSize: 13 },
  msg: { backgroundColor: colors.brandLight, color: colors.brandDark, padding: 10, borderRadius: 8, marginBottom: 10, fontSize: 13 },
  muted: { color: colors.muted, fontSize: 13 },
  product: { paddingVertical: 12, borderTopColor: colors.border, borderTopWidth: 1 },
  productHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  productName: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 4 },
  buyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  qty: { width: 64, borderColor: colors.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: colors.text },
});
