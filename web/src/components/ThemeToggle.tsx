"use client";

// 라이트/다크 테마 토글 — data-theme 속성 + localStorage 저장. 레이아웃의 인라인 스크립트와 짝.
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const cur = (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
    setTheme(cur);
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("ebc-theme", next);
    } catch {
      /* 저장 불가 환경 무시 */
    }
  }

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      title={isDark ? "라이트 모드" : "다크 모드"}
      style={{
        width: 38,
        height: 38,
        borderRadius: 999,
        border: "1px solid var(--hairline)",
        background: "var(--card)",
        color: "var(--ink-soft)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        boxShadow: "var(--shadow-sm)",
        // 마운트 전에는 서버/클라이언트 아이콘 불일치 방지를 위해 투명 처리
        opacity: mounted ? 1 : 0,
        transition: "opacity 0.2s ease, background 0.2s ease, color 0.2s ease",
      }}
    >
      {isDark ? (
        // 해(라이트로 전환)
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
            <line
              key={d}
              x1="12"
              y1="2.6"
              x2="12"
              y2="5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              transform={`rotate(${d} 12 12)`}
            />
          ))}
        </svg>
      ) : (
        // 달(다크로 전환)
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
          <path
            d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
