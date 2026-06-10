// 관리자 콘솔 (proto_05 모바일). UC8 발행 · UC13 모니터/사용자관리.

import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Badge, Button, Section } from "../components/ui";
import { api, ApiError } from "../lib/api";
import type { AdminUser, STOAsset, SystemMetrics } from "../lib/types";
import { colors } from "../theme";

const STATUS_TONE: Record<string, "green" | "amber" | "red"> = {
  UP: "green", HEALTHY: "green", SYNCED: "green", DEGRADED: "amber", DOWN: "red",
};

export default function AdminScreen() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [supply, setSupply] = useState("5000");
  const [price, setPrice] = useState("10000");

  const load = useCallback(async () => {
    setMetrics(await api<SystemMetrics>("/admin/monitor").catch(() => null));
    setUsers(await api<AdminUser[]>("/admin/users").catch(() => []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function issueSto() {
    setMsg(null);
    try {
      await api<STOAsset>("/sto", {
        method: "POST",
        body: { asset_type: "SOLAR", name, total_token_supply: Number(supply), token_price: price },
      });
      setMsg(`STO "${name}" 발행 완료.`);
      setName("");
      await load();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "STO 발행 실패");
    }
  }

  async function toggle(u: AdminUser) {
    setMsg(null);
    try {
      await api(`/admin/users/${u.id}/${u.is_active ? "suspend" : "restore"}`, { method: "POST" });
      await load();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "작업 실패");
    }
  }

  const subsystems = metrics?.subsystems ?? {};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}

      <Section title="System Monitor" subtitle="서브시스템 상태(mock)">
        {Object.entries(subsystems).map(([key, val]) => {
          const status = String((val as Record<string, unknown>).status ?? "—");
          return (
            <View key={key} style={styles.row}>
              <Text style={styles.name}>{key.replace(/_/g, " ")}</Text>
              <Badge tone={STATUS_TONE[status] ?? "gray"}>{status}</Badge>
            </View>
          );
        })}
        {metrics ? <Text style={styles.muted}>사용자 {metrics.totals.users ?? 0}명 · 온체인 {metrics.totals.onchain_records ?? 0}건</Text> : null}
      </Section>

      <Section title="Issue New STO (Solar)" subtitle="ERC-1400 컨트랙트 배포 mock">
        <TextInput style={styles.input} placeholder="자산명" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="발행량" placeholderTextColor={colors.muted} keyboardType="number-pad" value={supply} onChangeText={setSupply} />
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="토큰가격" placeholderTextColor={colors.muted} keyboardType="number-pad" value={price} onChangeText={setPrice} />
        </View>
        <Button title="발행" onPress={issueSto} />
      </Section>

      <Section title="User Management" subtitle="계정 정지/복원(감사 로그)">
        {users.map((u) => (
          <View key={u.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{u.email}</Text>
              <Text style={styles.muted}>{u.role}</Text>
            </View>
            <Badge tone={u.is_active ? "green" : "red"}>{u.is_active ? "ACTIVE" : "SUSPENDED"}</Badge>
            <View style={{ marginLeft: 8 }}>
              <Button title={u.is_active ? "정지" : "복원"} variant="ghost" onPress={() => toggle(u)} />
            </View>
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  msg: { backgroundColor: colors.brandLight, color: colors.brandDark, padding: 10, borderRadius: 8, marginBottom: 10, fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderTopColor: colors.border, borderTopWidth: 1 },
  name: { fontSize: 14, fontWeight: "600", color: colors.text, textTransform: "capitalize" },
  muted: { color: colors.muted, fontSize: 12, marginTop: 4 },
  input: { borderColor: colors.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, backgroundColor: colors.bg, marginBottom: 8 },
});
