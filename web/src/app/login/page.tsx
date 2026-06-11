"use client";

// 로그인/회원가입 (proto_01) — Apple 스타일: 흰 배경, 큰 헤드라인, 미니멀 카드.

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Reveal } from "@/components/Reveal";
import { useToast } from "@/components/Toast";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

const ROLE_HOME = { MERCHANT: "/merchant", INVESTOR: "/marketplace", ADMIN: "/admin" } as const;

const FEATURES = [
  { k: "AI", t: "AI 경영 분석", d: "매출 예측과 비용 최적화를 자동으로." },
  { k: "ESG", t: "상생지수 우대금융", d: "비재무 신용으로 더 낮은 금리를." },
  { k: "STO", t: "탄소중립 조각투자", d: "환경 자산을 토큰으로 소유하세요." },
];

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("MERCHANT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessRegNo, setBusinessRegNo] = useState("");
  const [storeName, setStoreName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        toast.show("가입이 완료되었습니다. 환영합니다.", "success");
      }
      const user = await login(email, password);
      router.replace(ROLE_HOME[user.role]);
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "오류가 발생했습니다.", "error");
    } finally {
      setBusy(false);
    }
  }

  const roles: { v: Role; label: string }[] = [
    { v: "MERCHANT", label: "소상공인" },
    { v: "INVESTOR", label: "투자자" },
    { v: "ADMIN", label: "관리자" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      {/* 상단 미니 내비 */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(255,255,255,0.8)", backdropFilter: "saturate(180%) blur(20px)", borderBottom: "1px solid var(--line)" }}>
        <div className="container" style={{ height: 52, display: "flex", alignItems: "center", gap: 9 }}>
          <LeafLogo />
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>Eco-Biz Connect</span>
        </div>
      </header>

      {/* 히어로 + 폼 */}
      <main className="container" style={{ paddingTop: "clamp(40px, 8vw, 92px)", paddingBottom: 80 }}>
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 44px" }}>
          <Reveal>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--forest)", letterSpacing: "0.02em", marginBottom: 14 }}>AI · ESG · Blockchain</p>
            <h1 className="t-display" style={{ marginBottom: 18 }}>
              비즈니스를 키우고,<br />지구를 지키는 금융.
            </h1>
            <p className="t-lead" style={{ maxWidth: 560, margin: "0 auto" }}>
              소상공인 AI 경영 분석과 개인 투자자 탄소 STO 투자를 하나로 잇는 통합 ESG 금융 플랫폼.
            </p>
          </Reveal>
        </div>

        {/* 인증 카드 */}
        <Reveal delay={80}>
          <div className="card" style={{ width: "100%", maxWidth: 440, margin: "0 auto", padding: "32px 30px", boxShadow: "var(--shadow-md)" }}>
            <h2 className="t-title" style={{ textAlign: "center", marginBottom: 6 }}>{mode === "login" ? "로그인" : "계정 만들기"}</h2>
            <p style={{ textAlign: "center", fontSize: 14, color: "var(--ink-soft)", marginBottom: 22 }}>
              {mode === "login" ? "EBC 계정으로 계속하기" : "역할을 선택하고 가입하세요"}
            </p>

            {/* 세그먼트 컨트롤 */}
            <div role="group" aria-label="역할 선택" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, background: "var(--paper-2)", borderRadius: 980, padding: 4, marginBottom: 22 }}>
              {roles.map((r) => (
                <button key={r.v} type="button" onClick={() => setRole(r.v)} aria-pressed={role === r.v}
                  style={{ borderRadius: 980, padding: "8px 0", fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none",
                    background: role === r.v ? "#fff" : "transparent", color: role === r.v ? "var(--ink)" : "var(--ink-soft)",
                    boxShadow: role === r.v ? "var(--shadow-sm)" : "none", transition: "all .2s" }}>
                  {r.label}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="이메일"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field" /></Field>
              <Field label="비밀번호"><input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8자 이상 · 대문자·숫자·특수문자" className="field" /></Field>

              {mode === "register" && role === "MERCHANT" && (
                <>
                  <Field label="사업자등록번호"><input required value={businessRegNo} onChange={(e) => setBusinessRegNo(e.target.value)} placeholder="123-45-67890" className="field" /></Field>
                  <Field label="상호명"><input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="그린마트" className="field" /></Field>
                </>
              )}
              {mode === "register" && role === "INVESTOR" && (
                <Field label="지갑 주소"><input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x…" className="field" /></Field>
              )}

              <button type="submit" disabled={busy} className="btn btn-primary btn-lg" style={{ marginTop: 6, width: "100%" }}>
                {busy ? "처리 중…" : mode === "login" ? "로그인" : "가입하기"}
              </button>
            </form>

            <div style={{ textAlign: "center", fontSize: 14, color: "var(--ink-soft)", marginTop: 20 }}>
              {mode === "login" ? "계정이 없으신가요? " : "이미 계정이 있나요? "}
              <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="link">
                {mode === "login" ? "회원가입" : "로그인"}
              </button>
            </div>
          </div>
        </Reveal>

        {/* 특징 스트립 */}
        <div className="grid-3" style={{ maxWidth: 980, margin: "84px auto 0" }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.k} delay={i * 90}>
              <div style={{ textAlign: "center", padding: "12px 16px" }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "var(--forest-soft)", color: "var(--forest-deep)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, margin: "0 auto 16px" }}>{f.k}</div>
                <div className="t-title" style={{ fontSize: 20, marginBottom: 6 }}>{f.t}</div>
                <p style={{ fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </main>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "22px 0", textAlign: "center", fontSize: 12.5, color: "var(--ink-soft)" }}>
        © 2026 Eco-Biz Connect · 22311898 김주형
      </footer>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink-soft)", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}

function LeafLogo() {
  return (
    <div style={{ width: 26, height: 26, borderRadius: 8, background: "linear-gradient(145deg, var(--leaf), var(--forest-deep))", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 21c-5 0-8-3.5-8-8.5C4 7 8 3 13 3c3 0 6 1 7 2-1 8-4 16-8 16z" fill="#fff" fillOpacity="0.95" />
      </svg>
    </div>
  );
}
