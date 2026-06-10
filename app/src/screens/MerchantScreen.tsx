// 소상공인 대시보드 (proto_02 모바일). UC3~7.

import * as DocumentPicker from "expo-document-picker";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Badge, Button, Section, StatCard } from "../components/ui";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { pct, won } from "../lib/format";
import type { BusinessData, ESGScore, LoanApplication, MatchedProduct } from "../lib/types";
import { colors } from "../theme";

export default function MerchantScreen() {
  const { refresh } = useAuth();
  const [datasets, setDatasets] = useState<BusinessData[]>([]);
  const [esg, setEsg] = useState<ESGScore | null>(null);
  const [products, setProducts] = useState<MatchedProduct[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setDatasets(await api<BusinessData[]>("/business-data").catch(() => []));
    setEsg(await api<ESGScore>("/esg/me").catch(() => null));
    setLoans(await api<LoanApplication[]>("/loans").catch(() => []));
    setProducts(await api<MatchedProduct[]>("/products/match").catch(() => []));
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function upload() {
    setMsg(null);
    const picked = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel"] });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    const form = new FormData();
    // RN multipart 파일 업로드 형식
    form.append("file", { uri: asset.uri, name: asset.name ?? "upload.csv", type: asset.mimeType ?? "text/csv" } as unknown as Blob);
    try {
      await api<BusinessData>("/business-data/upload", { method: "POST", form });
      setMsg("업로드 완료 — AI 분석/ESG 산출 완료.");
      await loadAll();
      await refresh();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "업로드 실패");
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}

      <View style={styles.statRow}>
        <StatCard label="ESG Score" value={esg ? `${Number(esg.composite_score).toFixed(0)}/100` : "—"} hint={esg ? `Grade ${esg.score_grade}` : "업로드 필요"} />
        <StatCard label="Uploads" value={`${datasets.length}건`} />
      </View>

      <Section title="Business Data" subtitle="CSV/Excel 업로드 → 분석 파이프라인 실행">
        <Button title="파일 업로드" onPress={upload} />
        {datasets.map((d) => (
          <View key={d.id} style={styles.row}>
            <Text style={styles.rowText}>{d.file_name}</Text>
            <Badge tone={d.processing_status === "ESG_COMPLETED" ? "green" : "amber"}>{d.processing_status}</Badge>
          </View>
        ))}
      </Section>

      <Section title="Financial Products" subtitle="ESG 기반 우대 대출(실효금리 오름차순)">
        {products.length === 0 ? (
          <Text style={styles.muted}>매칭된 상품이 없습니다. 먼저 데이터를 업로드하세요.</Text>
        ) : (
          products.map((p) => (
            <View key={p.id} style={styles.product}>
              <View style={{ flex: 1 }}>
                <Text style={styles.productBank}>{p.bank_name}</Text>
                <Text style={styles.productName}>{p.product_name}</Text>
                <Text style={styles.muted}>한도 {won(p.max_amount)} · {p.term_months}개월</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.rate}>{pct(p.preferential_rate)}</Text>
                <Button title="신청" onPress={() => applyLoan(p)} />
              </View>
            </View>
          ))
        )}
      </Section>

      <Section title="Applications" subtitle="대출 신청 현황">
        {loans.length === 0 ? (
          <Text style={styles.muted}>신청 내역이 없습니다.</Text>
        ) : (
          loans.map((l) => (
            <View key={l.id} style={styles.row}>
              <Text style={styles.rowText}>{won(l.amount)} · {pct(l.applied_rate)}</Text>
              <Badge tone={l.status === "APPROVED" ? "green" : l.status === "REJECTED" ? "red" : "amber"}>{l.status}</Badge>
            </View>
          ))
        )}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  msg: { backgroundColor: colors.brandLight, color: colors.brandDark, padding: 10, borderRadius: 8, marginBottom: 10, fontSize: 13 },
  statRow: { flexDirection: "row", marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderTopColor: colors.border, borderTopWidth: 1 },
  rowText: { fontSize: 13, color: colors.text, flex: 1 },
  muted: { color: colors.muted, fontSize: 13 },
  product: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopColor: colors.border, borderTopWidth: 1, gap: 8 },
  productBank: { fontSize: 11, color: colors.muted },
  productName: { fontSize: 14, fontWeight: "600", color: colors.text },
  rate: { fontSize: 20, fontWeight: "800", color: colors.brand, marginBottom: 4 },
});
