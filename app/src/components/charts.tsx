// 모바일 SVG 차트 — 웹과 동일한 시각 언어(도넛/막대/라인).

import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { colors } from "../theme";

/** ESG 종합 점수 도넛 게이지 */
export function DonutGauge({ value, max = 100, label, sub }: { value: number; max?: number; label: string; sub?: string }) {
  const size = 132;
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, value / max));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.brand}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c * frac} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={{ fontSize: 30, fontWeight: "700", color: colors.text }}>{label}</Text>
      {sub ? <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{sub}</Text> : null}
    </View>
  );
}

/** 가로 막대 그룹 (E/S/G 분해) */
export function BarRows({ rows }: { rows: { label: string; value: number; max?: number; color?: string }[] }) {
  return (
    <View style={{ gap: 12 }}>
      {rows.map((r) => {
        const pctVal = Math.max(0, Math.min(100, (r.value / (r.max ?? 100)) * 100));
        return (
          <View key={r.label}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 12.5, color: colors.muted }}>{r.label}</Text>
              <Text style={{ fontSize: 12.5, fontWeight: "700", color: colors.text }}>{r.value.toFixed(0)}</Text>
            </View>
            <View style={{ height: 8, borderRadius: 999, backgroundColor: colors.border, overflow: "hidden" }}>
              <View style={{ height: "100%", width: `${pctVal}%`, borderRadius: 999, backgroundColor: r.color ?? colors.leaf }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** 다중 세그먼트 도넛 + 범례 (자산 배분 등) */
export function DonutBreakdown({
  segments,
  centerLabel,
  centerSub,
  formatValue,
}: {
  segments: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerSub?: string;
  formatValue?: (n: number) => string;
}) {
  const fmt = formatValue ?? ((n: number) => String(n));
  const size = 148;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 18 }}>
      <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size} style={{ position: "absolute" }}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
          {segments.map((s) => {
            const frac = s.value / total;
            const el = (
              <Circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={s.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${c * frac} ${c}`}
                strokeDashoffset={-offset * c}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
            offset += frac;
            return el;
          })}
        </Svg>
        <Text style={{ fontSize: 26, fontWeight: "700", color: colors.text }}>{centerLabel}</Text>
        {centerSub ? <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{centerSub}</Text> : null}
      </View>
      <View style={{ flex: 1, minWidth: 130, gap: 8 }}>
        {segments.map((s) => (
          <View key={s.label} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.color }} />
            <Text style={{ flex: 1, fontSize: 13, color: colors.muted }} numberOfLines={1}>{s.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>{fmt(s.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** 라인 차트 (매출 예측) */
export function LineChart({ values, labels, height = 120 }: { values: number[]; labels?: string[]; height?: number }) {
  const w = 300;
  const pad = { l: 10, r: 10, t: 16, b: 22 };
  const innerW = w - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const max = Math.max(...values) * 1.12 || 1;
  const min = Math.min(...values, 0);
  const pts = values.map((v, i) => ({
    x: pad.l + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW),
    y: pad.t + innerH - ((v - min) / (max - min || 1)) * innerH,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${line} L ${pts[pts.length - 1].x} ${pad.t + innerH} L ${pts[0].x} ${pad.t + innerH} Z`;
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`}>
      <Defs>
        <LinearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.brand} stopOpacity={0.22} />
          <Stop offset="1" stopColor={colors.brand} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#g)" />
      <Path d={line} stroke={colors.brand} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      {pts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={4} fill="#fff" stroke={colors.brand} strokeWidth={2.5} />
      ))}
    </Svg>
  );
}

/** 미니 막대 (거래량) */
export function MiniBars({ values, labels, height = 110 }: { values: number[]; labels?: string[]; height?: number }) {
  const max = Math.max(...values, 1);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height, gap: 6 }}>
      {values.map((v, i) => (
        <View key={i} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
          <View style={{ width: "100%", borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: colors.brand, opacity: 0.35 + 0.65 * (v / max), height: `${(v / max) * 80}%`, minHeight: 4 }} />
          {labels ? <Text style={{ fontSize: 9, color: colors.muted, marginTop: 5 }}>{labels[i]}</Text> : null}
        </View>
      ))}
    </View>
  );
}
