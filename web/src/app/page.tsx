"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth";

const ROLE_HOME = {
  MERCHANT: "/merchant",
  INVESTOR: "/marketplace",
  ADMIN: "/admin",
} as const;

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? ROLE_HOME[user.role] : "/login");
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-muted">Eco-Biz Connect…</div>
  );
}
