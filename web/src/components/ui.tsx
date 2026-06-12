// 재사용 UI 프리미티브 — Apple 스타일 디자인 시스템.

export function StatCard({
  label,
  value,
  hint,
  trend,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: { dir: "up" | "down" | "flat"; text: string };
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  const trendColor = trend?.dir === "up" ? "var(--leaf)" : trend?.dir === "down" ? "var(--danger)" : "var(--ink-soft)";
  const arrow = trend?.dir === "up" ? "↑" : trend?.dir === "down" ? "↓" : "→";
  return (
    <div className="card card-hover" style={{ padding: "22px 24px 24px", background: accent ? "var(--forest-soft)" : undefined, borderColor: accent ? "transparent" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-soft)", letterSpacing: "-0.01em" }}>{label}</span>
        {icon && <span style={{ color: "var(--ink-faint)", fontSize: 15 }}>{icon}</span>}
      </div>
      <div className="font-display" style={{ fontSize: 32, fontWeight: 600, color: "var(--ink)", marginTop: 10, lineHeight: 1.04, letterSpacing: "-0.025em" }}>{value}</div>
      {trend && <div style={{ fontSize: 13, color: trendColor, marginTop: 7, fontWeight: 500 }}>{arrow} {trend.text}</div>}
      {hint && !trend && <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 7 }}>{hint}</div>}
    </div>
  );
}

export function Section({
  title,
  description,
  action,
  children,
  id,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="card" style={{ marginBottom: 28, padding: "28px 30px 30px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
        <div>
          <h2 className="t-title">{title}</h2>
          {description && <p style={{ fontSize: 14.5, color: "var(--ink-soft)", marginTop: 5 }}>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const TONES: Record<string, { bg: string; fg: string }> = {
  green: { bg: "var(--forest-soft)", fg: "var(--forest-deep)" },
  gold: { bg: "var(--gold-soft)", fg: "var(--gold)" },
  amber: { bg: "var(--warn-soft)", fg: "var(--warn)" },
  red: { bg: "var(--danger-soft)", fg: "var(--danger)" },
  blue: { bg: "#e8f1fd", fg: "var(--sky)" },
  gray: { bg: "var(--fill)", fg: "var(--ink-soft)" },
};

export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: keyof typeof TONES }) {
  const t = TONES[tone];
  return (
    <span className="chip" style={{ background: t.bg, color: t.fg }}>
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  type = "button",
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  type?: "button" | "submit";
  size?: "md" | "lg";
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`btn ${variant === "primary" ? "btn-primary" : "btn-ghost"} ${size === "lg" ? "btn-lg" : ""}`}>
      {children}
    </button>
  );
}

export function Skeleton({ height = 16, width = "100%", radius = 12 }: { height?: number; width?: number | string; radius?: number }) {
  return <div className="skeleton" style={{ height, width, borderRadius: radius }} />;
}

export function ErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 20px", marginBottom: 20, background: "var(--danger-soft)", borderColor: "#f3cfca" }}>
      <span style={{ fontSize: 14.5, color: "var(--danger)" }}>⚠ 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.</span>
      <Button variant="ghost" onClick={onRetry}>다시 시도</Button>
    </div>
  );
}

export function EmptyState({ icon = "🌱", text, action }: { icon?: string; text: string; action?: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 16px", color: "var(--ink-soft)" }}>
      <div style={{ position: "relative", width: 84, height: 84, margin: "0 auto 16px" }}>
        <svg width="84" height="84" viewBox="0 0 84 84" style={{ position: "absolute", inset: 0 }} aria-hidden>
          <circle cx="42" cy="42" r="40" fill="var(--paper-2)" />
          <circle cx="42" cy="42" r="40" fill="none" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="4 6" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, opacity: 0.85 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 14.5, maxWidth: 320, margin: "0 auto" }}>{text}</div>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
