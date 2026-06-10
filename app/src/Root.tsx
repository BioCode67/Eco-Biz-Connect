// 루트 — 인증 상태에 따라 로그인/역할별 화면을 렌더링한다(간단한 탭 네비게이션 포함).

import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "./lib/auth";
import AdminScreen from "./screens/AdminScreen";
import LoginScreen from "./screens/LoginScreen";
import MarketplaceScreen from "./screens/MarketplaceScreen";
import MerchantScreen from "./screens/MerchantScreen";
import PortfolioScreen from "./screens/PortfolioScreen";
import { colors } from "./theme";

const TITLES: Record<string, string> = {
  MERCHANT: "Merchant Dashboard",
  INVESTOR: "Investor",
  ADMIN: "Admin Console",
};

export default function Root() {
  const { user, loading, logout } = useAuth();
  const [investorTab, setInvestorTab] = useState<"marketplace" | "portfolio">("marketplace");

  if (loading) {
    return (
      <SafeAreaView style={styles.splash}>
        <ActivityIndicator color={colors.brand} />
        <Text style={styles.splashText}>Eco-Biz Connect</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.flex}>
        <StatusBar style="dark" />
        <LoginScreen />
      </SafeAreaView>
    );
  }

  let content: React.ReactNode = null;
  if (user.role === "MERCHANT") content = <MerchantScreen />;
  else if (user.role === "ADMIN") content = <AdminScreen />;
  else content = investorTab === "marketplace" ? <MarketplaceScreen /> : <PortfolioScreen />;

  return (
    <SafeAreaView style={styles.flex}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <Text style={styles.title}>{TITLES[user.role]}</Text>
        </View>
        <Pressable onPress={logout}>
          <Text style={styles.logout}>로그아웃</Text>
        </Pressable>
      </View>

      <View style={styles.flex}>{content}</View>

      {user.role === "INVESTOR" ? (
        <View style={styles.tabBar}>
          <TabButton label="마켓플레이스" active={investorTab === "marketplace"} onPress={() => setInvestorTab("marketplace")} />
          <TabButton label="포트폴리오" active={investorTab === "portfolio"} onPress={() => setInvestorTab("portfolio")} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.tab} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  splash: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, gap: 10 },
  splashText: { color: colors.muted },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  logoText: { color: colors.white, fontWeight: "800" },
  title: { fontSize: 16, fontWeight: "700", color: colors.text },
  logout: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  tabBar: { flexDirection: "row", backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 1 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: colors.brand },
});
