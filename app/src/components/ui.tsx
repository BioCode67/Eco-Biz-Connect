// 재사용 RN UI 프리미티브.

import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius, shadow } from "../theme";

export function EmptyState({ icon = "🌱", text }: { icon?: string; text: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 26 }}>
      <Text style={{ fontSize: 28, marginBottom: 6, opacity: 0.7 }}>{icon}</Text>
      <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>{text}</Text>
    </View>
  );
}

export function Field({ label, value, onChangeText, placeholder, keyboardType, secure }: { label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; keyboardType?: "default" | "email-address" | "number-pad"; secure?: boolean }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 5 }}>{label}</Text>
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#aab2ac"
        keyboardType={keyboardType ?? "default"}
        secureTextEntry={secure}
        autoCapitalize="none"
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  input: { borderColor: colors.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: colors.text, backgroundColor: colors.bg },
});

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={[styles.card, styles.stat]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

export function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={[styles.card, styles.section]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      <View style={{ marginTop: 10 }}>{children}</View>
    </View>
  );
}

const TONES: Record<string, { bg: string; fg: string }> = {
  green: { bg: colors.brandLight, fg: colors.brandDark },
  amber: { bg: "#fbedd4", fg: colors.warning },
  red: { bg: "#f7dada", fg: colors.danger },
  gray: { bg: colors.border, fg: colors.muted },
};

export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: keyof typeof TONES }) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{children}</Text>
    </View>
  );
}

export function Button({
  title,
  onPress,
  disabled,
  variant = "primary",
}: {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
}) {
  const isGhost = variant === "ghost";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        isGhost ? styles.buttonGhost : styles.buttonPrimary,
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.buttonText, isGhost && { color: colors.muted }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius,
    padding: 16,
    ...shadow,
  },
  stat: { flex: 1, minWidth: 140, margin: 4 },
  statLabel: { fontSize: 11, color: colors.muted, textTransform: "uppercase" },
  statValue: { fontSize: 20, fontWeight: "700", color: colors.text, marginTop: 2 },
  statHint: { fontSize: 11, color: colors.muted, marginTop: 2 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  sectionSubtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  button: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, alignItems: "center" },
  buttonPrimary: { backgroundColor: colors.brand },
  buttonGhost: { borderColor: colors.border, borderWidth: 1 },
  buttonText: { color: colors.white, fontWeight: "700", fontSize: 14 },
});
