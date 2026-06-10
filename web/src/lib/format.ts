// 표시용 포맷 헬퍼.

export function won(value: string | number | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  return "₩" + (n || 0).toLocaleString("ko-KR");
}

export function pct(value: string | number | null | undefined, digits = 2): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  return `${(n || 0).toFixed(digits)}%`;
}

export function shortHash(hash: string | null | undefined): string {
  if (!hash) return "-";
  return hash.length > 14 ? `${hash.slice(0, 8)}…${hash.slice(-4)}` : hash;
}

export function dateStr(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}
