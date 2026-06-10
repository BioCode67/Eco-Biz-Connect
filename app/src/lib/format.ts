// 표시 포맷 헬퍼(Hermes 호환을 위해 Intl 대신 수동 구현).

function withCommas(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function won(value: string | number | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  return "₩" + withCommas(n || 0);
}

export function num(value: string | number | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  return withCommas(n || 0);
}

export function pct(value: string | number | null | undefined, digits = 2): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  return `${(n || 0).toFixed(digits)}%`;
}

export function shortHash(hash: string | null | undefined): string {
  if (!hash) return "-";
  return hash.length > 14 ? `${hash.slice(0, 8)}…${hash.slice(-4)}` : hash;
}
