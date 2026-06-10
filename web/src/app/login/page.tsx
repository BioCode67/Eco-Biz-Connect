"use client";

// 로그인/회원가입 화면 (proto_01_login). Merchant/Investor 토글 + 인증 폼.

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

const ROLE_HOME = {
  MERCHANT: "/merchant",
  INVESTOR: "/marketplace",
  ADMIN: "/admin",
} as const;

const FEATURES = [
  "AI Sales Forecasting & Cost Optimization",
  "ESG Score & Preferential Loan Matching",
  "Carbon-Neutral STO Fractional Investment",
  "Blockchain Proof of Ownership & Dividends",
];

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("MERCHANT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessRegNo, setBusinessRegNo] = useState("");
  const [storeName, setStoreName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      const user = await login(email, password);
      router.replace(ROLE_HOME[user.role]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* 좌측 브랜드 히어로 */}
      <div className="hidden w-1/2 flex-col justify-between bg-brand-dark p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-bold text-brand-dark">
            E
          </div>
          <div>
            <div className="text-lg font-bold">Eco-Biz Connect</div>
            <div className="text-xs text-white/70">AI & ESG Financial Platform</div>
          </div>
        </div>
        <div>
          <h1 className="mb-3 text-4xl font-bold leading-tight">
            Empowering Businesses,
            <br />
            Sustaining the Planet.
          </h1>
          <p className="mb-8 max-w-md text-white/80">
            AI-driven business analytics and blockchain carbon investment — in one platform.
          </p>
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs">
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-xs text-white/50">© 2026 Eco-Biz Connect. All rights reserved.</div>
      </div>

      {/* 우측 인증 카드 */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="ebc-card w-full max-w-md p-8">
          <h2 className="text-2xl font-bold">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mb-6 text-sm text-muted">
            {mode === "login" ? "Sign in to your EBC account" : "EBC 계정을 만드세요"}
          </p>

          {/* 역할 토글 */}
          <div className="mb-5 grid grid-cols-3 gap-2 rounded-lg bg-brand-light/60 p-1">
            {(["MERCHANT", "INVESTOR", "ADMIN"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-md py-2 text-xs font-semibold transition ${
                  role === r ? "bg-brand text-white" : "text-muted hover:text-brand-dark"
                }`}
              >
                {r === "MERCHANT" ? "Merchant" : r === "INVESTOR" ? "Investor" : "Admin"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Email Address">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="ebc-input"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="ebc-input"
              />
            </Field>

            {mode === "register" && role === "MERCHANT" && (
              <>
                <Field label="사업자등록번호">
                  <input
                    required
                    value={businessRegNo}
                    onChange={(e) => setBusinessRegNo(e.target.value)}
                    placeholder="123-45-67890"
                    className="ebc-input"
                  />
                </Field>
                <Field label="상호명">
                  <input
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="그린마트"
                    className="ebc-input"
                  />
                </Field>
              </>
            )}
            {mode === "register" && role === "INVESTOR" && (
              <Field label="지갑 주소">
                <input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x…"
                  className="ebc-input"
                />
              </Field>
            )}

            {error && (
              <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {busy ? "처리 중…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            {mode === "login" ? "Don't have an account? " : "이미 계정이 있나요? "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
              className="font-semibold text-brand hover:underline"
            >
              {mode === "login" ? "Create Account →" : "← Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
