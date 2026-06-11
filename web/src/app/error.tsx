"use client";

// 런타임 오류 경계 — 예기치 못한 클라이언트 오류 시 브랜드 톤으로 복구 안내.
import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // 운영 환경에서는 모니터링으로 전송될 자리(현재는 콘솔 기록).
    console.error(error);
  }, [error]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper-2)", padding: 24 }}>
      <div className="card" style={{ maxWidth: 440, width: "100%", textAlign: "center", padding: "48px 36px", boxShadow: "var(--shadow-md)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 22px", background: "var(--danger-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }} aria-hidden>
          ⚠
        </div>
        <h1 className="t-title" style={{ marginBottom: 10 }}>문제가 발생했습니다</h1>
        <p style={{ fontSize: 15.5, color: "var(--ink-soft)", margin: "0 0 26px", lineHeight: 1.5 }}>
          일시적인 오류로 화면을 표시할 수 없습니다.<br />다시 시도하거나 처음으로 돌아가세요.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={reset} className="btn btn-primary btn-lg">다시 시도</button>
          <Link href="/" className="btn btn-ghost btn-lg">처음으로</Link>
        </div>
      </div>
    </div>
  );
}
