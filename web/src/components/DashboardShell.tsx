"use client";

// 역할별 대시보드 공통 레이아웃 — 사이드바 + 상단바 + 클라이언트 역할 가드.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

const ROLE_HOME: Record<Role, string> = {
  MERCHANT: "/merchant",
  INVESTOR: "/marketplace",
  ADMIN: "/admin",
};

export default function DashboardShell({
  role,
  nav,
  title,
  subtitle,
  children,
}: {
  role: Role;
  nav: NavItem[];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role !== role) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [user, loading, role, router]);

  if (loading || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">불러오는 중…</div>
    );
  }

  const label = user.store_name || user.email.split("@")[0];

  return (
    <div className="flex min-h-screen">
      {/* 사이드바 */}
      <aside className="flex w-60 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-bold text-white">
            E
          </div>
          <div className="leading-tight">
            <div className="font-bold text-brand-dark">Eco-Biz</div>
            <div className="text-xs text-muted">Connect</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 block rounded-lg px-3 py-2 text-sm font-medium transition ${
                item.active
                  ? "bg-brand-light text-brand-dark"
                  : "text-muted hover:bg-brand-light/50 hover:text-brand-dark"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border px-3 py-3">
          <div className="mb-2 flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light font-semibold text-brand-dark">
              {label[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold">{label}</div>
              <div className="text-xs capitalize text-muted">{user.role.toLowerCase()}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-brand-light/50 hover:text-danger"
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 */}
      <main className="flex-1 overflow-x-hidden">
        <header className="flex items-center justify-between border-b border-border bg-card px-8 py-5">
          <div>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          </div>
          {user.esg_score && (
            <div className="rounded-full bg-brand-light px-4 py-1.5 text-sm font-semibold text-brand-dark">
              EBC Score: {Number(user.esg_score).toFixed(0)}
            </div>
          )}
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
