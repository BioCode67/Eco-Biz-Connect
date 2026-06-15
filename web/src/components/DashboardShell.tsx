"use client";

// 역할별 대시보드 공통 레이아웃 — 반응형 사이드바(모바일 드로어) + 상단바 + 역할 가드.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth";
import type { Role, User } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  active?: boolean;
}

const ROLE_HOME: Record<Role, string> = {
  MERCHANT: "/merchant",
  INVESTOR: "/marketplace",
  ADMIN: "/admin",
};

const ROLE_LABEL: Record<Role, string> = { MERCHANT: "소상공인", INVESTOR: "투자자", ADMIN: "관리자" };

export default function DashboardShell({
  role,
  nav,
  title,
  subtitle,
  badge,
  children,
}: {
  role: Role;
  nav: NavItem[];
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role !== role) router.replace(ROLE_HOME[user.role]);
  }, [user, loading, role, router]);

  if (loading || !user || user.role !== role) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", color: "var(--ink-soft)" }}>
        <span className="font-display" style={{ fontSize: 18 }}>Eco-Biz Connect…</span>
      </div>
    );
  }

  const name = user.store_name || user.name || user.email.split("@")[0];

  return (
    <div className="shell bg-grain">
      <div className={`shell-overlay ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} aria-hidden />

      <aside className={`shell-aside ${drawerOpen ? "open" : ""}`} aria-label="주 메뉴">
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "22px 20px 18px" }}>
          <Wordmark />
        </div>
        <nav style={{ flex: 1, padding: "6px 12px" }} aria-label={`${ROLE_LABEL[role]} 메뉴`}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", color: "var(--ink-soft)", textTransform: "uppercase", padding: "8px 12px 6px" }}>
            {ROLE_LABEL[role]} 메뉴
          </div>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              aria-current={item.active ? "page" : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 11, borderRadius: 10, padding: "9px 12px", marginBottom: 2,
                fontSize: 13.5, fontWeight: item.active ? 600 : 500,
                color: item.active ? "var(--forest-deep)" : "var(--ink-soft)",
                background: item.active ? "var(--forest-soft)" : "transparent", textDecoration: "none",
              }}
            >
              <span aria-hidden style={{ display: "inline-flex", width: 18, opacity: item.active ? 1 : 0.65 }}><Icon name={item.icon} /></span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ borderTop: "1px solid var(--line)", padding: 12 }}>
          <button
            onClick={() => setShowProfile(true)}
            aria-label="내 계정 정보 보기"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 10px", width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", borderRadius: 10 }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 999, background: "var(--forest-soft)", color: "var(--forest-deep)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              {name[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{user.email} · 내 정보 →</div>
            </div>
          </button>
          <button onClick={logout} className="btn btn-ghost" style={{ width: "100%", justifyContent: "flex-start" }}>
            <span aria-hidden style={{ opacity: 0.7 }}>⏻</span> 로그아웃
          </button>
        </div>
      </aside>

      <main className="shell-main">
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "clamp(14px,2.5vw,20px) clamp(16px,3vw,32px)", borderBottom: "1px solid var(--line)", background: "var(--glass)", backdropFilter: "saturate(180%) blur(12px)", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <button className="shell-hamburger" onClick={() => setDrawerOpen(true)} aria-label="메뉴 열기">☰</button>
            <div style={{ minWidth: 0 }}>
              <h1 className="font-display" style={{ fontSize: "clamp(18px,2.5vw,23px)", fontWeight: 600, color: "var(--ink)", lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</h1>
              {subtitle && <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</p>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {badge}
            <ThemeToggle />
          </div>
        </header>
        <div className="shell-content">{children}</div>
      </main>

      {showProfile && <ProfileModal user={user} roleLabel={ROLE_LABEL[role]} onClose={() => setShowProfile(false)} />}
    </div>
  );
}

function ProfileModal({ user, roleLabel, onClose }: { user: User; roleLabel: string; onClose: () => void }) {
  const badge = (text: string, ok: boolean) => (
    <span style={{ fontSize: 11.5, fontWeight: 600, padding: "2px 9px", borderRadius: 999, background: ok ? "var(--forest-soft)" : "var(--paper-2)", color: ok ? "var(--forest-deep)" : "var(--ink-soft)" }}>{text}</span>
  );
  const rows: [string, React.ReactNode][] = [
    ["이름", user.name || "—"],
    ["이메일", user.email],
    ["역할", roleLabel],
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

  return (
    <Modal onClose={onClose} title="내 계정 정보">
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {badge(`계정 ${user.verification_status === "VERIFIED" ? "인증됨" : user.verification_status}`, user.verification_status === "VERIFIED")}
        {user.role === "INVESTOR" && badge(`KYC ${user.kyc_status === "VERIFIED" ? "인증됨" : user.kyc_status === "PENDING" ? "대기" : (user.kyc_status ?? "미인증")}`, user.kyc_status === "VERIFIED")}
      </div>
      <div className="card" style={{ padding: "4px 16px", background: "var(--paper)" }}>
        {rows.map(([label, value], i) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "11px 0", borderTop: i === 0 ? "none" : "1px solid var(--line)", fontSize: 13.5 }}>
            <span style={{ color: "var(--ink-soft)", flexShrink: 0 }}>{label}</span>
            <span style={{ fontWeight: 500, textAlign: "right", wordBreak: "break-all" }}>{value}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 12, lineHeight: 1.5 }}>계정 정보 수정은 고객센터를 통해 요청할 수 있습니다(데모).</p>
    </Modal>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(145deg, var(--leaf), var(--forest-deep))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "var(--shadow-sm)" }}>
        <LeafMark />
      </div>
      <div style={{ lineHeight: 1.05 }}>
        <div className="font-display" style={{ fontSize: 16, fontWeight: 600, color: light ? "#fff" : "var(--ink)" }}>Eco-Biz Connect</div>
        <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: light ? "rgba(255,255,255,0.6)" : "var(--ink-soft)" }}>ESG · AI · Chain</div>
      </div>
    </div>
  );
}

function LeafMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path d="M12 21c-5 0-8-3.5-8-8.5C4 7 8 3 13 3c3 0 6 1 7 2-1 8-4 16-8 16z" fill="#fff" fillOpacity="0.95" />
      <path d="M12 18c0-5 2-8 6-10" stroke="var(--forest-deep)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
