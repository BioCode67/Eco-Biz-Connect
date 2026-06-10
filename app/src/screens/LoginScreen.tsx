// 로그인/회원가입 화면 (proto_01 모바일 버전).

import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "../components/ui";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Role } from "../lib/types";
import { colors, radius } from "../theme";

const ROLES: Role[] = ["MERCHANT", "INVESTOR", "ADMIN"];
const ROLE_LABEL: Record<Role, string> = { MERCHANT: "소상공인", INVESTOR: "투자자", ADMIN: "관리자" };

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("MERCHANT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessRegNo, setBusinessRegNo] = useState("");
  const [storeName, setStoreName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setError(null);
    setBusy(true);
    try {
      if (mode === "register") {
        await register({
          email,
          password,
          role,
          business_reg_no: role === "MERCHANT" ? businessRegNo : undefined,
          store_name: role === "MERCHANT" ? storeName : undefined,
          wallet_address: role === "INVESTOR" ? walletAddress : undefined,
        });
      }
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <Text style={styles.brandTitle}>Eco-Biz Connect</Text>
          <Text style={styles.brandSubtitle}>AI & ESG Financial Platform</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{mode === "login" ? "Welcome Back" : "Create Account"}</Text>

          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <Text
                key={r}
                onPress={() => setRole(r)}
                style={[styles.roleChip, role === r && styles.roleChipActive]}
              >
                {ROLE_LABEL[r]}
              </Text>
            ))}
          </View>

          <Field label="이메일" value={email} onChange={setEmail} placeholder="you@example.com" keyboardType="email-address" />
          <Field label="비밀번호" value={password} onChange={setPassword} placeholder="••••••••" secure />

          {mode === "register" && role === "MERCHANT" && (
            <>
              <Field label="사업자등록번호" value={businessRegNo} onChange={setBusinessRegNo} placeholder="123-45-67890" />
              <Field label="상호명" value={storeName} onChange={setStoreName} placeholder="그린마트" />
            </>
          )}
          {mode === "register" && role === "INVESTOR" && (
            <Field label="지갑 주소" value={walletAddress} onChange={setWalletAddress} placeholder="0x…" />
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={{ marginTop: 8 }}>
            <Button title={busy ? "처리 중…" : mode === "login" ? "Sign In" : "Create Account"} onPress={onSubmit} disabled={busy} />
          </View>

          <Text style={styles.switch} onPress={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}>
            {mode === "login" ? "계정이 없으신가요? 회원가입 →" : "← 로그인으로"}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  secure,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: "default" | "email-address";
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secure}
        autoCapitalize="none"
        keyboardType={keyboardType ?? "default"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 72, backgroundColor: colors.bg, flexGrow: 1 },
  brand: { alignItems: "center", marginBottom: 24 },
  logo: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  logoText: { color: colors.white, fontSize: 28, fontWeight: "800" },
  brandTitle: { fontSize: 20, fontWeight: "800", color: colors.brandDark, marginTop: 10 },
  brandSubtitle: { fontSize: 12, color: colors.muted },
  card: { backgroundColor: colors.card, borderRadius: radius, borderColor: colors.border, borderWidth: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 14 },
  roleRow: { flexDirection: "row", backgroundColor: colors.brandLight, borderRadius: 10, padding: 4, marginBottom: 16 },
  roleChip: { flex: 1, textAlign: "center", paddingVertical: 8, fontSize: 12, fontWeight: "700", color: colors.muted, borderRadius: 8, overflow: "hidden" },
  roleChipActive: { backgroundColor: colors.brand, color: colors.white },
  label: { fontSize: 12, color: colors.muted, marginBottom: 4 },
  input: { borderColor: colors.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text, backgroundColor: colors.bg },
  error: { color: colors.danger, fontSize: 13, marginVertical: 6 },
  switch: { textAlign: "center", color: colors.brand, fontWeight: "700", marginTop: 16, fontSize: 13 },
});
