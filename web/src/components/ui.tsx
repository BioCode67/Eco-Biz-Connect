// 재사용 UI 프리미티브 (정교한 디자인 시스템 기반).

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
  const arrow = trend?.dir === "up" ? "▲" : trend?.dir === "down" ? "▼" : "■";
  return (
    <div className="card card-hover" style={{ padding: 18, background: accent ? "var(--forest-soft)" : undefined, borderColor: accent ? "#cfe2d6" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-soft)" }}>{label}</span>
        {icon && <span style={{ color: "var(--leaf)", opacity: 0.85 }}>{icon}</span>}
      </div>
      <div className="font-display" style={{ fontSize: 26, fontWeight: 600, color: "var(--ink)", marginTop: 6, lineHeight: 1.1 }}>{value}</div>
      {trend && <div style={{ fontSize: 12, color: trendColor, marginTop: 4, fontWeight: 600 }}>{arrow} {trend.text}</div>}
      {hint && !trend && <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>{hint}</div>}
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
    <section id={id} className="card" style={{ marginBottom: 20, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
        <div>
          <h2 className="font-display" style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>{title}</h2>
          {description && <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>{description}</p>}
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
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  type?: "button" | "submit";
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`btn ${variant === "primary" ? "btn-primary" : "btn-ghost"}`}>
      {children}
    </button>
  );
}

export function Skeleton({ height = 16, width = "100%", radius = 8 }: { height?: number; width?: number | string; radius?: number }) {
  return <div className="skeleton" style={{ height, width, borderRadius: radius }} />;
}

export function EmptyState({ icon = "🌱", text }: { icon?: string; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "28px 12px", color: "var(--ink-soft)" }}>
      <div style={{ fontSize: 30, marginBottom: 8, opacity: 0.7 }}>{icon}</div>
      <div style={{ fontSize: 13.5 }}>{text}</div>
    </div>
  );
}
