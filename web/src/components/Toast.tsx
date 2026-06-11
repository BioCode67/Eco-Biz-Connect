"use client";

// 가벼운 토스트 알림 시스템 — 인라인 메시지 대신 우하단 토스트로 피드백.

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const STYLES: Record<ToastKind, { dot: string; icon: string }> = {
  success: { dot: "var(--leaf)", icon: "✓" },
  error: { dot: "var(--danger)", icon: "!" },
  info: { dot: "var(--sky)", icon: "i" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string, kind: ToastKind = "info") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 60, display: "flex", flexDirection: "column", gap: 10 }}>
        {toasts.map((t) => {
          const s = STYLES[t.kind];
          return (
            <div
              key={t.id}
              className="toast-in card"
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", minWidth: 260, maxWidth: 380, boxShadow: "var(--shadow-lg)" }}
            >
              <span
                style={{ width: 22, height: 22, borderRadius: 999, background: s.dot, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}
              >
                {s.icon}
              </span>
              <span style={{ fontSize: 13.5, color: "var(--ink)" }}>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) return { show: () => {} };
  return ctx;
}
