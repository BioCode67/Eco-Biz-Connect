// 백엔드(FastAPI) 호출 클라이언트(React Native). JWT 토큰은 expo-secure-store 에 보관한다.

import * as SecureStore from "expo-secure-store";

// 개발용 기본 주소. iOS 시뮬레이터는 localhost, Android 에뮬레이터는 10.0.2.2,
// 실기기는 PC 의 LAN IP 를 사용한다. EXPO_PUBLIC_API_BASE 로 재정의 가능.
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "http://localhost:8000";

const TOKEN_KEY = "ebc_token";
let memToken: string | null = null;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// FastAPI/Pydantic 오류에서 사람이 읽을 메시지만 추출(검증 오류 배열은 msg 만 모아 정리).
function extractErrorMessage(data: unknown, status: number): string {
  const detail = (data as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((e) => (e && typeof e === "object" && "msg" in e ? String((e as { msg: unknown }).msg) : ""))
      .map((m) => m.replace(/^Value error,\s*/i, "").trim())
      .filter(Boolean);
    if (msgs.length) return [...new Set(msgs)].join("\n");
  }
  return `요청 실패 (${status})`;
}

export async function loadToken(): Promise<string | null> {
  try {
    memToken = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    // 일부 환경(웹 등)에서 보안 저장소 접근 실패 시에도 앱이 멈추지 않도록 한다.
    memToken = null;
  }
  return memToken;
}

export async function setToken(token: string | null): Promise<void> {
  memToken = token; // 메모리 토큰은 항상 갱신 — 보안 저장소 실패와 무관하게 세션은 유지된다.
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // 일부 환경(웹 등)에서 보안 저장소 쓰기 실패 시에도 로그인 흐름이 끊기지 않도록 한다.
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  form?: FormData;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, form } = options;
  const headers: Record<string, string> = {};
  if (auth && memToken) headers["Authorization"] = `Bearer ${memToken}`;

  let payload: BodyInit | undefined;
  if (form) {
    payload = form as unknown as BodyInit;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: payload });
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, extractErrorMessage(data, res.status));
  }
  return data as T;
}
