"use client";

// 인증 컨텍스트 — JWT 로그인/회원가입/로그아웃과 현재 사용자 상태를 관리한다.

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { api, setRefresh, setToken } from "@/lib/api";
import type { Role, TokenResponse, User } from "@/lib/types";

interface RegisterInput {
  email: string;
  password: string;
  role: Role;
  business_reg_no?: string;
  store_name?: string;
  wallet_address?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
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
      setToken(null);
      setRefresh(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadMe();
      setLoading(false);
    })();
  }, [loadMe]);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await api<TokenResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    setToken(tokens.access_token);
    setRefresh(tokens.refresh_token);
    const me = await api<User>("/auth/me");
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    await api("/auth/register", { method: "POST", auth: false, body: input });
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setRefresh(null);
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
