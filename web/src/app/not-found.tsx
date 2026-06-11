import Link from "next/link";

// 404 — 존재하지 않는 경로. 브랜드 톤의 미니멀 안내.
export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper-2)", padding: 24 }}>
      <div className="card" style={{ maxWidth: 440, width: "100%", textAlign: "center", padding: "48px 36px", boxShadow: "var(--shadow-md)" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 22px", background: "linear-gradient(145deg, var(--leaf), var(--forest-deep))", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 21c-5 0-8-3.5-8-8.5C4 7 8 3 13 3c3 0 6 1 7 2-1 8-4 16-8 16z" fill="#fff" fillOpacity="0.95" />
          </svg>
        </div>
        <div className="font-display" style={{ fontSize: 52, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--ink)" }}>404</div>
        <p style={{ fontSize: 15.5, color: "var(--ink-soft)", margin: "10px 0 26px", lineHeight: 1.5 }}>
          요청하신 페이지를 찾을 수 없습니다.<br />주소를 확인하거나 처음으로 돌아가세요.
        </p>
        <Link href="/" className="btn btn-primary btn-lg">처음으로</Link>
      </div>
    </div>
  );
}
