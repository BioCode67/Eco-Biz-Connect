// 백엔드(FastAPI) 호출 클라이언트. JWT access 토큰을 localStorage 에 보관한다.

const BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const TOKEN_KEY = "ebc_token";
const REFRESH_KEY = "ebc_refresh";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function setRefresh(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(REFRESH_KEY, token);
  else window.localStorage.removeItem(REFRESH_KEY);
}

function getRefresh(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

/** access 토큰 만료 시 refresh 토큰으로 재발급(성공 시 true). */
async function tryRefresh(): Promise<boolean> {
  const rt = getRefresh();
  if (!rt) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setToken(data.access_token);
    setRefresh(data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  form?: FormData;
}

async function rawFetch(path: string, options: RequestOptions): Promise<Response> {
  const { method = "GET", body, auth = true, form } = options;
  const headers: Record<string, string> = {};
  const token = getToken();
  if (auth && token) headers["Authorization"] = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (form) {
    payload = form; // multipart, Content-Type 자동 설정
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  return fetch(`${BASE}${path}`, { method, headers, body: payload });
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await rawFetch(path, options);
  } catch {
    throw new ApiError(0, "서버에 연결할 수 없습니다. 네트워크를 확인해 주세요.");
  }

  // access 만료 → refresh 후 1회 재시도 (인증 호출 자체는 제외)
  if (res.status === 401 && options.auth !== false && !path.startsWith("/auth/")) {
    if (await tryRefresh()) {
      try {
        res = await rawFetch(path, options);
      } catch {
        throw new ApiError(0, "서버에 연결할 수 없습니다.");
      }
    }
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data
        ? typeof data.detail === "string"
          ? data.detail
          : JSON.stringify(data.detail)
        : `요청 실패 (${res.status})`;
    throw new ApiError(res.status, detail);
  }
  return data as T;
}

/** 예상된 오류(404 등)는 fallback 으로 흡수하되, 네트워크 오류(status 0)는 다시 던진다.
 *  → 화면에서 "빈 데이터"와 "연결 실패"를 구분할 수 있게 한다. */
export async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    if (e instanceof ApiError && e.status === 0) throw e; // 네트워크 오류는 전파
    return fallback;
  }
}

/** 인증 헤더와 함께 바이너리(예: PDF)를 받아 브라우저 다운로드를 트리거한다. */
export async function apiDownload(path: string, filename: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError(res.status, "다운로드에 실패했습니다.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** 클라이언트 측 CSV 생성 + 다운로드. */
export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
