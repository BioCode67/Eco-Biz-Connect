// 소상공인 대시보드 (proto_02 모바일). UC3~7 — 차트·모달·토스트·스켈레톤.

import * as DocumentPicker from "expo-document-picker";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { BarRows, DonutGauge, LineChart } from "../components/charts";
import { Skeleton } from "../components/Skeleton";
import { AppModal } from "../components/AppModal";
import { useToast } from "../components/Toast";
import { Badge, Button, EmptyState, Field, Section, StatCard } from "../components/ui";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { pct, won } from "../lib/format";
import type { AnalysisReport, BusinessData, ESGScore, LoanApplication, MatchedProduct } from "../lib/types";
import { colors } from "../theme";

const statusKo: Record<string, string> = { ESG_COMPLETED: "완료", AI_COMPLETED: "분석완료", UNDER_REVIEW: "심사중", APPROVED: "승인", REJECTED: "거절" };

export default function MerchantScreen() {
  const { refresh } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [datasets, setDatasets] = useState<BusinessData[]>([]);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [esg, setEsg] = useState<ESGScore | null>(null);
  const [products, setProducts] = useState<MatchedProduct[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [applyTarget, setApplyTarget] = useState<MatchedProduct | null>(null);

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

  async function upload() {
    const picked = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel"] });
    if (picked.canceled || !picked.assets?.[0]) return;
    const a = picked.assets[0];
    const form = new FormData();
    form.append("file", { uri: a.uri, name: a.name ?? "upload.csv", type: a.mimeType ?? "text/csv" } as unknown as Blob);
    try {
      await api<BusinessData>("/business-data/upload", { method: "POST", form });
      toast.show("업로드 완료 — 분석·ESG 산출됨", "success");
      await loadAll(); await refresh();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "업로드 실패", "error");
    }
  }

  if (loading) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}><Skeleton height={84} /><Skeleton height={84} /></View>
        <Skeleton height={180} radius={14} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.statRow}>
        <StatCard label="ESG 점수" value={esg ? `${Number(esg.composite_score).toFixed(0)}` : "—"} hint={esg ? `등급 ${esg.score_grade}` : "데이터 필요"} />
        <StatCard label="예상 월매출" value={report ? won(report.sales_forecast.next_3_months[0] * 10000) : "—"} hint="AI 예측" />
      </View>

      {report ? (
        <Section title="30일 매출 예측" subtitle={`단위 ${report.sales_forecast.unit}`}>
          <LineChart values={report.sales_forecast.next_3_months} labels={report.sales_forecast.labels} />
          <Text style={styles.muted}>{report.summary}</Text>
        </Section>
      ) : null}

      {esg ? (
        <Section title="ESG 상생지수" subtitle="환경·사회·지배구조 분해">
          <View style={{ alignItems: "center", marginBottom: 14 }}>
            <DonutGauge value={Number(esg.composite_score)} label={Number(esg.composite_score).toFixed(0)} sub={`등급 ${esg.score_grade}`} />
          </View>
          <BarRows rows={[
            { label: "환경 (E)", value: Number(esg.env_score), color: colors.leaf },
            { label: "사회 (S)", value: Number(esg.social_score), color: colors.sky },
            { label: "지배구조 (G)", value: Number(esg.governance_score), color: colors.gold },
          ]} />
        </Section>
      ) : null}

      <Section title="경영 데이터" subtitle="CSV·Excel 업로드 → 분석 실행">
        <Button title="파일 업로드" onPress={upload} />
        {datasets.length === 0 ? <EmptyState icon="📄" text="업로드한 데이터가 없습니다." /> : datasets.map((d) => (
          <View key={d.id} style={styles.row}>
            <Text style={styles.rowText}>{d.file_name}</Text>
            <Badge tone={d.processing_status === "ESG_COMPLETED" ? "green" : "amber"}>{statusKo[d.processing_status] ?? d.processing_status}</Badge>
          </View>
        ))}
      </Section>

      <Section title="우대 금융 상품" subtitle="ESG 기반 · 실효금리순">
        {products.length === 0 ? <EmptyState icon="🏦" text="먼저 데이터를 업로드하세요." /> : products.map((p) => (
          <View key={p.id} style={styles.product}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bank}>{p.bank_name}</Text>
              <Text style={styles.pname}>{p.product_name}</Text>
              <Text style={styles.muted}>한도 {won(p.max_amount)} · {p.term_months}개월</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.rate}>{pct(p.preferential_rate)}</Text>
              <Button title="신청" onPress={() => setApplyTarget(p)} />
            </View>
          </View>
        ))}
      </Section>

      <Section title="대출 신청 현황">
        {loans.length === 0 ? <EmptyState icon="📋" text="신청 내역이 없습니다." /> : loans.map((l) => (
          <View key={l.id} style={styles.row}>
            <Text style={styles.rowText}>{won(l.amount)} · {pct(l.applied_rate)}</Text>
            <Badge tone={l.status === "APPROVED" ? "green" : l.status === "REJECTED" ? "red" : "amber"}>{statusKo[l.status] ?? l.status}</Badge>
          </View>
        ))}
      </Section>

      <LoanModal product={applyTarget} onClose={() => setApplyTarget(null)} onDone={async () => { setApplyTarget(null); await loadAll(); }} />
    </ScrollView>
  );
}

function LoanModal({ product, onClose, onDone }: { product: MatchedProduct | null; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [amount, setAmount] = useState("10000000");
  const [purpose, setPurpose] = useState("운전자금");
  const [busy, setBusy] = useState(false);
  if (!product) return null;

  async function submit() {
    if (!product) return;
    setBusy(true);
    try {
      await api<LoanApplication>("/loans/apply", { method: "POST", body: { financial_product_id: product.id, amount: Number(amount), term_months: product.term_months, loan_purpose: purpose, consent: true } });
      toast.show("대출 신청 접수됨 (심사 중)", "success");
      onDone();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "신청 실패", "error");
    } finally { setBusy(false); }
  }

  return (
    <AppModal visible={!!product} title="우대 대출 신청" onClose={onClose}>
      <Text style={styles.muted}>{product.bank_name} · {product.product_name} · {pct(product.preferential_rate)}</Text>
      <View style={{ height: 12 }} />
      <Field label={`신청 금액 (최대 ${won(product.max_amount)})`} value={amount} onChangeText={setAmount} keyboardType="number-pad" />
      <Field label="대출 목적" value={purpose} onChangeText={setPurpose} />
      <Button title={busy ? "신청 중…" : "신청 제출 (약관 동의)"} onPress={submit} disabled={busy} />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  statRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9, borderTopColor: colors.border, borderTopWidth: 1 },
  rowText: { fontSize: 13, color: colors.text, flex: 1 },
  muted: { color: colors.muted, fontSize: 12.5, marginTop: 8, lineHeight: 18 },
  product: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopColor: colors.border, borderTopWidth: 1, gap: 8 },
  bank: { fontSize: 11, color: colors.muted },
  pname: { fontSize: 14, fontWeight: "600", color: colors.text },
  rate: { fontSize: 19, fontWeight: "800", color: colors.brand, marginBottom: 4 },
});
