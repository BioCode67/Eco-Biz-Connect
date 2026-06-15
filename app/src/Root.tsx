// 루트 — 인증 상태에 따라 로그인/역할별 화면을 렌더링한다(간단한 탭 네비게이션 포함).

import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppModal } from "./components/AppModal";
import { useAuth } from "./lib/auth";
import type { User } from "./lib/types";
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
  const [showProfile, setShowProfile] = useState(false);

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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <Pressable onPress={() => setShowProfile(true)} accessibilityRole="button">
            <Text style={styles.profileLink}>내 정보</Text>
          </Pressable>
          <Pressable onPress={logout} accessibilityRole="button">
            <Text style={styles.logout}>로그아웃</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.flex}>{content}</View>

      <ProfileModal user={user} visible={showProfile} onClose={() => setShowProfile(false)} />

      {user.role === "INVESTOR" ? (
        <View style={styles.tabBar}>
          <TabButton label="마켓플레이스" active={investorTab === "marketplace"} onPress={() => setInvestorTab("marketplace")} />
          <TabButton label="포트폴리오" active={investorTab === "portfolio"} onPress={() => setInvestorTab("portfolio")} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const ROLE_KO: Record<string, string> = { MERCHANT: "소상공인", INVESTOR: "투자자", ADMIN: "관리자" };

function ProfileModal({ user, visible, onClose }: { user: User; visible: boolean; onClose: () => void }) {
  const rows: [string, string][] = [
    ["이름", user.name || "—"],
    ["이메일", user.email],
    ["역할", ROLE_KO[user.role] ?? user.role],
    ["전화번호", user.phone || "—"],
  ];
  if (user.role === "MERCHANT") {
    rows.push(
      ["상호명", user.store_name || "—"],
      ["사업자등록번호", user.business_reg_no || "—"],
      ["사업장 주소", user.store_address || "—"],
      ["업종", user.business_category || "—"],
      ["ESG 상생지수", user.esg_score ? `${Math.round(Number(user.esg_score))}점` : "데이터 필요"],
    );
  } else if (user.role === "INVESTOR") {
    rows.push(
      ["지갑 주소", user.wallet_address || "—"],
      ["누적 투자금", user.total_invested ? `₩${Number(user.total_invested).toLocaleString()}` : "₩0"],
    );
  }
  const verified = user.verification_status === "VERIFIED";
  const kyc = user.kyc_status;

  return (
    <AppModal visible={visible} title="내 계정 정보" onClose={onClose}>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <View style={[styles.badge, verified ? styles.badgeOk : styles.badgeMuted]}>
          <Text style={[styles.badgeText, verified ? styles.badgeTextOk : styles.badgeTextMuted]}>계정 {verified ? "인증됨" : user.verification_status}</Text>
        </View>
        {user.role === "INVESTOR" ? (
          <View style={[styles.badge, kyc === "VERIFIED" ? styles.badgeOk : styles.badgeMuted]}>
            <Text style={[styles.badgeText, kyc === "VERIFIED" ? styles.badgeTextOk : styles.badgeTextMuted]}>KYC {kyc === "VERIFIED" ? "인증됨" : kyc === "PENDING" ? "대기" : (kyc ?? "미인증")}</Text>
          </View>
        ) : null}
      </View>
      {rows.map(([label, value], i) => (
        <View key={label} style={[styles.profileRow, i === 0 && { borderTopWidth: 0 }]}>
          <Text style={styles.profileLabel}>{label}</Text>
          <Text style={styles.profileValue}>{value}</Text>
        </View>
      ))}
    </AppModal>
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
  profileLink: { color: colors.brand, fontSize: 13, fontWeight: "600" },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  badgeOk: { backgroundColor: colors.brandLight },
  badgeMuted: { backgroundColor: colors.bg },
  badgeText: { fontSize: 11.5, fontWeight: "700" },
  badgeTextOk: { color: colors.brandDark },
  badgeTextMuted: { color: colors.muted },
  profileRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16, paddingVertical: 11, borderTopColor: colors.border, borderTopWidth: 1 },
  profileLabel: { color: colors.muted, fontSize: 13.5, flexShrink: 0 },
  profileValue: { color: colors.text, fontSize: 13.5, fontWeight: "500", textAlign: "right", flexShrink: 1 },
  tabBar: { flexDirection: "row", backgroundColor: colors.card, borderTopColor: colors.border, borderTopWidth: 1 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  tabTextActive: { color: colors.brand },
});
