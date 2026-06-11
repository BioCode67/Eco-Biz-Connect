"use client";

// 로그인/회원가입 화면 (proto_01) — 에디토리얼 히어로 + 정교한 인증 카드.

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Wordmark } from "@/components/DashboardShell";
import { useToast } from "@/components/Toast";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";

const ROLE_HOME = { MERCHANT: "/merchant", INVESTOR: "/marketplace", ADMIN: "/admin" } as const;

const FEATURES = [
  { t: "AI 매출 예측 · 비용 최적화", d: "업로드 한 번으로 경영 인사이트" },
  { t: "ESG 상생지수 · 우대금융 매칭", d: "비재무 신용으로 더 낮은 금리" },
  { t: "탄소중립 STO 조각투자", d: "환경 자산을 토큰으로 소유" },
  { t: "블록체인 소유·배당 증명", d: "위변조 없는 온체인 기록" },
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
        toast.show("가입이 완료되었습니다. 환영합니다!", "success");
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
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* 좌측 에디토리얼 히어로 */}
      <div
        className="bg-grain"
        style={{ width: "52%", padding: "48px 56px", color: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "linear-gradient(160deg, #15603a 0%, #0e482c 70%, #0a3a22 100%)", position: "relative", overflow: "hidden" }}
      >
        <div style={{ position: "absolute", right: -80, top: -60, width: 320, height: 320, borderRadius: 999, background: "radial-gradient(circle, rgba(58,155,99,0.45), transparent 65%)" }} />
        <Wordmark light />

        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", marginBottom: 16 }}>AI · ESG Financial Platform</div>
          <h1 className="font-display" style={{ fontSize: 46, fontWeight: 600, lineHeight: 1.08, marginBottom: 18 }}>
            비즈니스를 키우고,<br />지구를 지키는 금융.
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", maxWidth: 440, lineHeight: 1.6, marginBottom: 30 }}>
            소상공인 AI 경영 분석과 개인 투자자 탄소 STO 투자를 하나로 잇는 통합 ESG 금융 플랫폼.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 480 }}>
            {FEATURES.map((f) => (
              <div key={f.t} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{f.t}</div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.62)" }}>{f.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", position: "relative" }}>© 2026 Eco-Biz Connect · 22311898 김주형</div>
      </div>

      {/* 우측 인증 카드 */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 28 }} className="bg-grain">
        <div className="card" style={{ width: "100%", maxWidth: 412, padding: 32, boxShadow: "var(--shadow-lg)" }}>
          <h2 className="font-display" style={{ fontSize: 25, fontWeight: 600 }}>{mode === "login" ? "다시 오신 걸 환영해요" : "계정 만들기"}</h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginTop: 4, marginBottom: 22 }}>
            {mode === "login" ? "EBC 계정으로 로그인하세요" : "역할을 선택하고 가입하세요"}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, background: "var(--paper-2)", borderRadius: 11, padding: 5, marginBottom: 20 }}>
            {roles.map((r) => (
              <button
                key={r.v}
                type="button"
                onClick={() => setRole(r.v)}
                style={{
                  borderRadius: 8, padding: "8px 0", fontSize: 12.5, fontWeight: 600, cursor: "pointer", border: "none",
                  background: role === r.v ? "linear-gradient(180deg, var(--forest), var(--forest-deep))" : "transparent",
                  color: role === r.v ? "#fff" : "var(--ink-soft)",
                  boxShadow: role === r.v ? "var(--shadow-sm)" : "none",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="이메일">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field" />
            </Field>
            <Field label="비밀번호">
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8자 이상" className="field" />
            </Field>

            {mode === "register" && role === "MERCHANT" && (
              <>
                <Field label="사업자등록번호">
                  <input required value={businessRegNo} onChange={(e) => setBusinessRegNo(e.target.value)} placeholder="123-45-67890" className="field" />
                </Field>
                <Field label="상호명">
                  <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="그린마트" className="field" />
                </Field>
              </>
            )}
            {mode === "register" && role === "INVESTOR" && (
              <Field label="지갑 주소">
                <input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x…" className="field" />
              </Field>
            )}

            <button type="submit" disabled={busy} className="btn btn-primary" style={{ marginTop: 4, padding: "11px" }}>
              {busy ? "처리 중…" : mode === "login" ? "로그인" : "가입하기"}
            </button>
          </form>

          <div style={{ textAlign: "center", fontSize: 13, color: "var(--ink-soft)", marginTop: 20 }}>
            {mode === "login" ? "계정이 없으신가요? " : "이미 계정이 있나요? "}
            <button onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ background: "none", border: "none", color: "var(--forest)", fontWeight: 700, cursor: "pointer" }}>
              {mode === "login" ? "회원가입 →" : "← 로그인"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 5 }}>{label}</span>
      {children}
    </label>
  );
}
