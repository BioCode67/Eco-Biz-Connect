// 인증 컨텍스트(React Native) — 토큰 로드/로그인/회원가입/로그아웃.

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { api, loadToken, setToken } from "./api";
import type { Role, TokenResponse, User } from "./types";

interface RegisterInput {
  email: string;
  password: string;
  role: Role;
  business_reg_no?: string;
  representative_name?: string;
  store_name?: string;
  wallet_address?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const me = await api<User>("/auth/me");
      setUser(me);
    } catch {
      await setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadToken();
        await loadMe();
      } finally {
        setLoading(false); // 어떤 오류에도 스플래시에 멈추지 않도록 항상 로딩 해제
      }
    })();
  }, [loadMe]);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await api<TokenResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    await setToken(tokens.access_token);
    const me = await api<User>("/auth/me");
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    await api("/auth/register", { method: "POST", auth: false, body: input });
  }, []);

  const logout = useCallback(async () => {
    await setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
