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
    <div className="card card-hover" style={{ padding: 22, background: accent ? "var(--forest-soft)" : undefined, borderColor: accent ? "#cde8d7" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-soft)" }}>{label}</span>
        {icon && <span style={{ color: "var(--forest)", opacity: 0.9, fontSize: 15 }}>{icon}</span>}
      </div>
      <div className="font-display" style={{ fontSize: 30, fontWeight: 600, color: "var(--ink)", marginTop: 8, lineHeight: 1.05 }}>{value}</div>
      {trend && <div style={{ fontSize: 13, color: trendColor, marginTop: 6, fontWeight: 500 }}>{arrow} {trend.text}</div>}
      {hint && !trend && <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 6 }}>{hint}</div>}
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
    <section id={id} className="card" style={{ marginBottom: 24, padding: "26px 26px 28px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
        <div>
          <h2 className="t-title">{title}</h2>
          {description && <p style={{ fontSize: 14.5, color: "var(--ink-soft)", marginTop: 4 }}>{description}</p>}
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
  gray: { bg: "var(--paper-2)", fg: "var(--ink-soft)" },
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

export function EmptyState({ icon = "🌱", text }: { icon?: string; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 16px", color: "var(--ink-soft)" }}>
      <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.6 }}>{icon}</div>
      <div style={{ fontSize: 14.5 }}>{text}</div>
    </div>
  );
}
