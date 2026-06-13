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

// 날짜 포맷(Hermes 호환 — Intl 의존 없이 ISO 문자열 파싱). 예: 2026. 6. 13.
export function dateStr(iso: string | null | undefined): string {
  if (!iso) return "-";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[1]}. ${Number(m[2])}. ${Number(m[3])}.`;
}

const TX_STATUS_KO: Record<string, string> = {
  COMPLETED: "완료", PENDING: "대기", PROCESSING: "처리중", FAILED: "실패", CANCELLED: "취소",
};
export function txStatusKo(status: string | null | undefined): string {
  if (!status) return "-";
  return TX_STATUS_KO[status] ?? status;
}

const TX_TYPE_KO: Record<string, string> = {
  TOKEN_PURCHASE: "토큰 구매", DIVIDEND_RECEIVED: "배당 수령", LOAN_APPLICATION: "대출 신청", DATA_UPLOAD: "데이터 업로드",
};
export function txTypeKo(type: string): string {
  return TX_TYPE_KO[type] ?? type;
}

// 서브시스템 표시명 — 약어 보존(AI/API). 미정의 키는 단어별 첫 글자만 대문자.
const SUBSYSTEM_LABEL: Record<string, string> = {
  ai_engine: "AI Engine",
  blockchain_network: "Blockchain Network",
  bank_api: "Bank API",
};
export function subsystemName(key: string): string {
  return SUBSYSTEM_LABEL[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const ROLE_KO: Record<string, string> = {
  ADMIN: "관리자", MERCHANT: "소상공인", INVESTOR: "투자자",
};
export function roleKo(role: string | null | undefined): string {
  if (!role) return "-";
  return ROLE_KO[role] ?? role;
}
