// 관리자 콘솔 (proto_05 모바일). UC8 발행 · UC13 모니터·통계·사용자관리.

import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { useRefresh } from "../lib/useRefresh";

import { MiniBars } from "../components/charts";
import { AppModal } from "../components/AppModal";
import { Skeleton } from "../components/Skeleton";
import { useToast } from "../components/Toast";
import { Badge, Button, EmptyState, Field, Section, StatCard } from "../components/ui";
import { api, ApiError } from "../lib/api";
import { dateStr, roleKo, subsystemName } from "../lib/format";
import type { AdminStats, AdminUser, AuditLog, STOAsset, SystemMetrics } from "../lib/types";
import { colors } from "../theme";

const STATUS_TONE: Record<string, "green" | "amber" | "red"> = { UP: "green", HEALTHY: "green", SYNCED: "green", DEGRADED: "amber", DOWN: "red" };

export default function AdminScreen() {
  const toast = useToast();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIssue, setShowIssue] = useState(false);

  const load = useCallback(async () => {
    const [m, s, u, l] = await Promise.all([
      api<SystemMetrics>("/admin/monitor").catch(() => null),
      api<AdminStats>("/admin/stats").catch(() => null),
      api<AdminUser[]>("/admin/users").catch(() => []),
      api<AuditLog[]>("/admin/audit-log").catch(() => [] as AuditLog[]),
    ]);
    setMetrics(m); setStats(s); setUsers(u); setLogs(l); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);
  const { refreshing, onRefresh } = useRefresh(load);

  async function toggle(u: AdminUser) {
    try {
      await api(`/admin/users/${u.id}/${u.is_active ? "suspend" : "restore"}`, { method: "POST" });
      toast.show(`${u.email} ${u.is_active ? "정지" : "복원"}됨`, "success");
      await load();
    } catch (err) { toast.show(err instanceof ApiError ? err.message : "작업 실패", "error"); }
  }

  if (loading) return <ScrollView contentContainerStyle={styles.container}><Skeleton height={90} radius={14} /><View style={{ height: 12 }} /><Skeleton height={140} radius={14} /></ScrollView>;

  const subsystems = metrics?.subsystems ?? {};
  const volume = stats?.tx_volume_7d ?? [];

  type Alert = { level: "danger" | "warn" | "info"; title: string; detail: string; time: string };
  const alerts: Alert[] = [];
  Object.entries(subsystems).forEach(([key, val]) => {
    const status = String((val as Record<string, unknown>).status ?? "");
    if (status === "DEGRADED" || status === "DOWN") {
      alerts.push({ level: status === "DOWN" ? "danger" : "warn", title: `${subsystemName(key)} · ${status}`, detail: String((val as Record<string, unknown>).note ?? "응답 지연 감지"), time: "실시간" });
    }
  });
  logs.slice(0, 5).forEach((l) => alerts.push({ level: "info", title: l.action.replace(/_/g, " "), detail: l.target_type ? `${l.target_type}#${l.target_id}` : "관리 작업", time: dateStr(l.created_at) }));
  const dotColor = (lv: string) => (lv === "danger" ? colors.danger : lv === "warn" ? colors.warning : colors.sky);

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} colors={[colors.brand]} />}>
      <Section title="시스템 모니터" subtitle="서브시스템 상태(mock)">
        {Object.entries(subsystems).map(([key, val]) => {
          const status = String((val as Record<string, unknown>).status ?? "—");
          return (
            <View key={key} style={styles.row}>
              <Text style={styles.name}>{subsystemName(key)}</Text>
              <Badge tone={STATUS_TONE[status] ?? "gray"}>{status}</Badge>
            </View>
          );
        })}
      </Section>

      {alerts.length > 0 ? (
        <Section title="시스템 알림" subtitle="실시간 경고 및 최근 이벤트">
          {alerts.map((a, i) => (
            <View key={i} style={[styles.row, { alignItems: "flex-start" }]}>
              <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: dotColor(a.level), marginTop: 5, marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{a.title}</Text>
                <Text style={styles.muted}>{a.detail}</Text>
              </View>
              <Text style={[styles.muted, { marginTop: 0 }]}>{a.time}</Text>
            </View>
          ))}
        </Section>
      ) : null}

      <Section title="거래량 (최근 7일)" subtitle="플랫폼 STO 거래 금액">
        {volume.length === 0 ? <EmptyState text="거래 데이터가 없습니다." /> : <MiniBars values={volume.map((v) => v.amount)} labels={volume.map((v) => v.label)} />}
      </Section>

      <View style={styles.statRow}>
        <StatCard label="소상공인" value={String(stats?.merchants ?? 0)} />
        <StatCard label="투자자" value={String(stats?.investors ?? 0)} />
      </View>
      <View style={styles.statRow}>
        <StatCard label="STO 자산" value={String(stats?.total_sto ?? 0)} />
        <StatCard label="온체인" value={String(stats?.onchain_records ?? 0)} />
      </View>

      {(stats?.total_co2_offset ?? 0) > 0 ? (
        <View style={styles.impact}>
          <View style={styles.impactIcon}><Text style={{ fontSize: 22 }}>🌍</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.impactLabel}>플랫폼 누적 탄소 임팩트 · 발행 STO 연 저감 합</Text>
            <Text style={styles.impactValue}>{(stats?.total_co2_offset ?? 0).toLocaleString()} <Text style={{ fontSize: 14 }}>tCO₂e / 년</Text></Text>
            <Text style={styles.impactSub}>🌳 나무 약 {Math.round((stats?.total_co2_offset ?? 0) * 45).toLocaleString()}그루의 연간 흡수량</Text>
          </View>
        </View>
      ) : null}

      <Section title="STO 발행" subtitle="ERC-1400 컨트랙트 배포">
        <Button title="+ 새 STO 발행" onPress={() => setShowIssue(true)} />
      </Section>

      <Section title="사용자 관리" subtitle="정지 / 복원 (감사 로그)">
        {users.map((u) => (
          <View key={u.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{u.email}</Text>
              <Text style={styles.muted}>{roleKo(u.role)}</Text>
            </View>
            <Badge tone={u.is_active ? "green" : "red"}>{u.is_active ? "활성" : "정지"}</Badge>
            <View style={{ marginLeft: 8 }}><Button title={u.is_active ? "정지" : "복원"} variant="ghost" onPress={() => toggle(u)} /></View>
          </View>
        ))}
      </Section>

      <IssueModal visible={showIssue} onClose={() => setShowIssue(false)} onDone={async () => { setShowIssue(false); await load(); }} />
    </ScrollView>
  );
}

function IssueModal({ visible, onClose, onDone }: { visible: boolean; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [supply, setSupply] = useState("5000");
  const [price, setPrice] = useState("10000");
  const [yld, setYld] = useState("6.0");
  const [co2, setCo2] = useState("40");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) { toast.show("자산명을 입력하세요.", "error"); return; }
    setBusy(true);
    try {
      await api<STOAsset>("/sto", { method: "POST", body: { asset_type: "SOLAR", name, location, total_token_supply: Number(supply), token_price: price, expected_yield: yld, co2_offset_per_year: Number(co2), dividend_period_months: 3 } });
      toast.show(`STO "${name}" 발행 완료`, "success");
      onDone();
    } catch (err) { toast.show(err instanceof ApiError ? err.message : "발행 실패", "error"); }
    finally { setBusy(false); }
  }

  return (
    <AppModal visible={visible} title="새 STO 발행 (Solar)" onClose={onClose}>
      <Field label="자산명" value={name} onChangeText={setName} />
      <Field label="위치" value={location} onChangeText={setLocation} />
      <Field label="총 발행량" value={supply} onChangeText={setSupply} keyboardType="number-pad" />
      <Field label="토큰 단가 (원)" value={price} onChangeText={setPrice} keyboardType="number-pad" />
      <Field label="예상 수익률 (%)" value={yld} onChangeText={setYld} keyboardType="number-pad" />
      <Field label="연 CO₂ 저감 (t)" value={co2} onChangeText={setCo2} keyboardType="number-pad" />
      <Button title={busy ? "배포 중…" : "배포 및 발행"} onPress={submit} disabled={busy} />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  statRow: { flexDirection: "row", gap: 10 },
  impact: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.brandLight, borderRadius: 18, padding: 16, marginTop: 12 },
  impactIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  impactLabel: { fontSize: 11.5, fontWeight: "600", color: colors.brandDark },
  impactValue: { fontSize: 22, fontWeight: "800", color: colors.brandDark, marginTop: 2 },
  impactSub: { fontSize: 11.5, color: colors.brandDark, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopColor: colors.border, borderTopWidth: 1 },
  name: { fontSize: 14, fontWeight: "600", color: colors.text },
  muted: { color: colors.muted, fontSize: 12, marginTop: 3 },
});
