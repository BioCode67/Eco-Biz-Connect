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

export async function loadToken(): Promise<string | null> {
  memToken = await SecureStore.getItemAsync(TOKEN_KEY);
  return memToken;
}

export async function setToken(token: string | null): Promise<void> {
  memToken = token;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
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
