"use client";

// 공용 모달 — ESC 닫기·바디 스크롤 잠금·dialog 접근성. (여러 화면이 공유)
import { useEffect } from "react";

export function Modal({ title, children, onClose, ariaLabel }: { title: string; children: React.ReactNode; onClose: () => void; ariaLabel?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,36,32,0.4)", backdropFilter: "blur(2px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div role="dialog" aria-modal="true" aria-label={title || ariaLabel} onClick={(e) => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: 460, padding: 24, boxShadow: "var(--shadow-lg)", maxHeight: "90vh", overflowY: "auto" }}>
        {title ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 className="font-display" style={{ fontSize: 18, fontWeight: 600 }}>{title}</h3>
            <button onClick={onClose} aria-label="닫기" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--ink-soft)", lineHeight: 1 }}>×</button>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
            <button onClick={onClose} aria-label="닫기" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--ink-soft)", lineHeight: 1 }}>×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
