// 의존성 없는 SVG 차트 컴포넌트 모음 — 손으로 그린 듯한 정교한 데이터 시각화.

interface Pt {
  x: number;
  y: number;
}

function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return "";
  const d: string[] = [`M ${pts[0].x} ${pts[0].y}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d.push(`C ${cx} ${p0.y} ${cx} ${p1.y} ${p1.x} ${p1.y}`);
  }
  return d.join(" ");
}

/** 영역 라인 차트 (매출 예측 등) */
export function AreaChart({
  values,
  labels,
  height = 140,
  color = "var(--forest)",
  unit = "",
}: {
  values: number[];
  labels?: string[];
  height?: number;
  color?: string;
  unit?: string;
}) {
  const w = 520;
  const pad = { l: 8, r: 8, t: 14, b: 22 };
  const max = Math.max(...values) * 1.12 || 1;
  const min = Math.min(...values, 0);
  const innerW = w - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const pts: Pt[] = values.map((v, i) => ({
    x: pad.l + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW),
    y: pad.t + innerH - ((v - min) / (max - min || 1)) * innerH,
  }));
  const line = smoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1].x} ${pad.t + innerH} L ${pts[0].x} ${pad.t + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={pad.l} x2={w - pad.r} y1={pad.t + innerH * g} y2={pad.t + innerH * g} stroke="var(--line)" strokeWidth="1" strokeDasharray="3 4" />
      ))}
      <path d={area} fill="url(#areaFill)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke={color} strokeWidth="2.5" />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink)">
            {values[i].toLocaleString()}{unit}
          </text>
          {labels && (
            <text x={p.x} y={height - 6} textAnchor="middle" fontSize="10.5" fill="var(--ink-soft)">
              {labels[i]}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/** 도넛 게이지 (ESG 종합 점수 등) */
export function DonutGauge({ value, max = 100, label, sub, color = "var(--forest)" }: { value: number; max?: number; label: string; sub?: string; color?: string }) {
  const size = 132;
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, value / max));
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--paper-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * frac} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span className="font-display" style={{ fontSize: 30, fontWeight: 600, color: "var(--ink)", lineHeight: 1 }}>{label}</span>
        {sub && <span style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>{sub}</span>}
      </div>
    </div>
  );
}

/** 가로 막대 그룹 (ESG 환경/사회/지배구조 분해) */
export function BarRows({ rows }: { rows: { label: string; value: number; max?: number; color?: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rows.map((r) => {
        const pctVal = Math.max(0, Math.min(100, (r.value / (r.max ?? 100)) * 100));
        return (
          <div key={r.label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
              <span style={{ color: "var(--ink-soft)" }}>{r.label}</span>
              <span style={{ fontWeight: 700, color: "var(--ink)" }}>{r.value.toFixed(0)}</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "var(--paper-2)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pctVal}%`, borderRadius: 999, background: r.color ?? "var(--leaf)", transition: "width 0.5s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 미니 막대 차트 (관리자 거래량 등) */
export function MiniBars({ values, labels, color = "var(--forest)", height = 120 }: { values: number[]; labels?: string[]; color?: string; height?: number }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height }}>
      {values.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
          <div style={{ width: "100%", borderRadius: "6px 6px 0 0", background: color, opacity: 0.35 + 0.65 * (v / max), height: `${(v / max) * 78}%`, minHeight: 4 }} />
          {labels && <span style={{ fontSize: 10, color: "var(--ink-soft)", marginTop: 6 }}>{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}
