"use client";

// 관리자 콘솔 (proto_05_admin_console). UC13 모니터링/사용자관리/감사로그 · UC8 STO 발행.

import { useCallback, useEffect, useState } from "react";

import DashboardShell from "@/components/DashboardShell";
import { Badge, Button, Section, StatCard } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { dateStr, won } from "@/lib/format";
import type { AdminUser, AuditLog, STOAsset, SystemMetrics } from "@/lib/types";

const NAV = [
  { label: "System Monitor", href: "#monitor", active: true },
  { label: "Issue New STO", href: "#issue" },
  { label: "User Management", href: "#users" },
  { label: "Audit Log", href: "#audit" },
];

const STATUS_TONE: Record<string, "green" | "amber" | "red"> = {
  UP: "green",
  HEALTHY: "green",
  SYNCED: "green",
  DEGRADED: "amber",
  DOWN: "red",
};

export default function AdminPage() {
  return (
    <DashboardShell role="ADMIN" nav={NAV} title="Admin Console" subtitle="System Monitoring Dashboard">
      <AdminBody />
    </DashboardShell>
  );
}

function AdminBody() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  // STO 발행 폼
  const [assetType, setAssetType] = useState("SOLAR");
  const [name, setName] = useState("");
  const [supply, setSupply] = useState(5000);
  const [price, setPrice] = useState(10000);

  const load = useCallback(async () => {
    setMetrics(await api<SystemMetrics>("/admin/monitor").catch(() => null));
    setUsers(await api<AdminUser[]>("/admin/users").catch(() => []));
    setLogs(await api<AuditLog[]>("/admin/audit-log").catch(() => []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function issueSto(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await api<STOAsset>("/sto", {
        method: "POST",
        body: { asset_type: assetType, name, total_token_supply: supply, token_price: String(price) },
      });
      setMsg(`STO "${name}" 발행 완료 (컨트랙트 배포).`);
      setName("");
      await load();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "STO 발행 실패");
    }
  }

  async function userAction(u: AdminUser, action: "suspend" | "restore") {
    setMsg(null);
    try {
      await api(`/admin/users/${u.id}/${action}`, { method: "POST" });
      await load();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "작업 실패");
    }
  }

  const subsystems = metrics?.subsystems ?? {};

  return (
    <div>
      {msg && <div className="mb-4 rounded-lg bg-brand-light px-4 py-2 text-sm text-brand-dark">{msg}</div>}

      {/* 시스템 모니터 */}
      <Section id="monitor" title="System Monitor" description="서브시스템 실시간 상태(mock 폴링)">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Object.entries(subsystems).map(([key, val]) => {
            const status = String((val as Record<string, unknown>).status ?? "—");
            return (
              <div key={key} className="ebc-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold capitalize">{key.replace(/_/g, " ")}</span>
                  <Badge tone={STATUS_TONE[status] ?? "gray"}>{status}</Badge>
                </div>
                <ul className="mt-2 space-y-0.5 text-xs text-muted">
                  {Object.entries(val as Record<string, unknown>)
                    .filter(([k]) => k !== "status")
                    .map(([k, v]) => (
                      <li key={k}>
                        {k}: <span className="font-medium">{String(v)}</span>
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
        </div>
        {metrics && (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Platform Users" value={String(metrics.totals.users ?? 0)} />
            <StatCard label="On-chain Records" value={String(metrics.totals.onchain_records ?? 0)} />
          </div>
        )}
      </Section>

      {/* STO 발행 */}
      <Section id="issue" title="Issue New STO" description="탄소 환경 자산을 토큰증권으로 발행 (ERC-1400 컨트랙트 배포 mock)">
        <form onSubmit={issueSto} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <select value={assetType} onChange={(e) => setAssetType(e.target.value)} className="ebc-input">
            <option value="SOLAR">Solar Power</option>
            <option value="WIND">Wind Power</option>
            <option value="FOREST">Carbon Forest</option>
            <option value="HYDRO">Hydro Power</option>
          </select>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="자산명 (예: 경주 태양광 3호)"
            className="ebc-input md:col-span-1"
          />
          <input
            type="number"
            min={1}
            value={supply}
            onChange={(e) => setSupply(Number(e.target.value))}
            placeholder="총 발행량"
            className="ebc-input"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              placeholder="토큰가격"
              className="ebc-input"
            />
            <Button type="submit">발행</Button>
          </div>
        </form>
      </Section>

      {/* 사용자 관리 */}
      <Section id="users" title="User Management" description="계정 정지/복원 (감사 로그 기록)">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted">
              <th className="py-2">이메일</th>
              <th>역할</th>
              <th>상태</th>
              <th className="text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="py-2">{u.email}</td>
                <td>
                  <Badge tone="gray">{u.role}</Badge>
                </td>
                <td>
                  <Badge tone={u.is_active ? "green" : "red"}>{u.is_active ? "ACTIVE" : "SUSPENDED"}</Badge>
                </td>
                <td className="text-right">
                  {u.is_active ? (
                    <button
                      onClick={() => userAction(u, "suspend")}
                      className="text-xs font-semibold text-danger hover:underline"
                    >
                      정지
                    </button>
                  ) : (
                    <button
                      onClick={() => userAction(u, "restore")}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      복원
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* 감사 로그 */}
      <Section id="audit" title="Audit Log" description="관리자 작업 감사 로그(불변)">
        {logs.length === 0 ? (
          <p className="text-sm text-muted">감사 로그가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between py-2">
                <div>
                  <span className="font-semibold">{log.action}</span>
                  {log.target_type && (
                    <span className="text-muted">
                      {" "}
                      → {log.target_type}#{log.target_id}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted">{dateStr(log.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
