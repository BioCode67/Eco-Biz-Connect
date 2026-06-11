"use client";

// 역할별 대시보드 공통 레이아웃 — 정교한 사이드바 + 상단바 + 클라이언트 역할 가드.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

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

  const name = user.store_name || user.email.split("@")[0];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }} className="bg-grain">
      {/* 사이드바 */}
      <aside style={{ width: 248, flexShrink: 0, background: "var(--card)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "22px 20px 18px" }}>
          <Wordmark />
        </div>

        <nav style={{ flex: 1, padding: "6px 12px" }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", color: "var(--ink-soft)", textTransform: "uppercase", padding: "8px 12px 6px" }}>
            {ROLE_LABEL[role]} 메뉴
          </div>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                borderRadius: 10,
                padding: "9px 12px",
                marginBottom: 2,
                fontSize: 13.5,
                fontWeight: item.active ? 600 : 500,
                color: item.active ? "var(--forest-deep)" : "var(--ink-soft)",
                background: item.active ? "var(--forest-soft)" : "transparent",
                textDecoration: "none",
              }}
            >
              <span style={{ width: 18, textAlign: "center", opacity: item.active ? 1 : 0.7 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ borderTop: "1px solid var(--line)", padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 10px" }}>
            <div style={{ width: 34, height: 34, borderRadius: 999, background: "var(--forest-soft)", color: "var(--forest-deep)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              {name[0]?.toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
              <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>{user.email}</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-ghost" style={{ width: "100%", justifyContent: "flex-start" }}>
            <span style={{ opacity: 0.7 }}>⏻</span> 로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 20 }}>
          <div>
            <h1 className="font-display" style={{ fontSize: 23, fontWeight: 600, color: "var(--ink)", lineHeight: 1.15 }}>{title}</h1>
            {subtitle && <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 1 }}>{subtitle}</p>}
          </div>
          {badge}
        </header>
        <div style={{ padding: 32, maxWidth: 1160 }}>{children}</div>
      </main>
    </div>
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 21c-5 0-8-3.5-8-8.5C4 7 8 3 13 3c3 0 6 1 7 2-1 8-4 16-8 16z" fill="#fff" fillOpacity="0.95" />
      <path d="M12 18c0-5 2-8 6-10" stroke="var(--forest-deep)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
