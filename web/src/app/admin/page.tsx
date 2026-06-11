"use client";

// 관리자 콘솔 (proto_05). UC13 모니터·통계·사용자관리·감사로그 · UC8 STO 발행.

import { useCallback, useEffect, useState } from "react";

import { DonutBreakdown, MiniBars } from "@/components/charts";
import DashboardShell from "@/components/DashboardShell";
import { Modal } from "@/app/merchant/page";
import { Badge, Button, EmptyState, ErrorBanner, Section, Skeleton } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { api, ApiError, safe } from "@/lib/api";
import { dateStr } from "@/lib/format";
import type { AdminStats, AdminUser, AuditLog, STOAsset, SystemMetrics } from "@/lib/types";

const NAV = [
  { label: "시스템 모니터", href: "#monitor", icon: "monitor", active: true },
  { label: "STO 발행", href: "#issue", icon: "spark" },
  { label: "사용자 관리", href: "#users", icon: "users" },
  { label: "감사 로그", href: "#audit", icon: "log" },
];

const STATUS_TONE: Record<string, "green" | "amber" | "red"> = { UP: "green", HEALTHY: "green", SYNCED: "green", DEGRADED: "amber", DOWN: "red" };

export default function AdminPage() {
  return (
    <DashboardShell role="ADMIN" nav={NAV} title="관리자 콘솔" subtitle="실시간 시스템 모니터링" badge={<Badge tone="green">● LIVE</Badge>}>
      <AdminBody />
    </DashboardShell>
  );
}

function AdminBody() {
  const toast = useToast();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIssue, setShowIssue] = useState(false);
  const [netError, setNetError] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, s, u, l] = await Promise.all([
        safe(api<SystemMetrics | null>("/admin/monitor"), null),
        safe(api<AdminStats | null>("/admin/stats"), null),
        safe(api<AdminUser[]>("/admin/users"), [] as AdminUser[]),
        safe(api<AuditLog[]>("/admin/audit-log"), [] as AuditLog[]),
      ]);
      setMetrics(m); setStats(s); setUsers(u); setLogs(l);
      setNetError(false);
    } catch {
      setNetError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function userAction(u: AdminUser, action: "suspend" | "restore") {
    try {
      await api(`/admin/users/${u.id}/${action}`, { method: "POST" });
      toast.show(`${u.email} 계정을 ${action === "suspend" ? "정지" : "복원"}했습니다.`, "success");
      await load();
    } catch (err) { toast.show(err instanceof ApiError ? err.message : "작업 실패", "error"); }
  }

  if (loading) return <div className="grid-3">{[0, 1, 2].map((i) => <Skeleton key={i} height={110} radius={16} />)}</div>;

  const subsystems = metrics?.subsystems ?? {};
  const volume = stats?.tx_volume_7d ?? [];

  return (
    <div>
      {netError && <ErrorBanner onRetry={() => { setLoading(true); load(); }} />}
      {/* 서브시스템 모니터 */}
      <div id="monitor" className="grid-3" style={{ marginBottom: 20 }}>
        {Object.entries(subsystems).map(([key, val]) => {
          const status = String((val as Record<string, unknown>).status ?? "—");
          return (
            <div key={key} className="card card-hover" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14, textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</span>
                <Badge tone={STATUS_TONE[status] ?? "gray"}>{status}</Badge>
              </div>
              {Object.entries(val as Record<string, unknown>).filter(([k]) => k !== "status").map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--ink-soft)", padding: "1px 0" }}>
                  <span>{k}</span><span style={{ fontWeight: 600, color: "var(--ink)" }}>{String(v)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* 통계 */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <Section title="거래량 (최근 7일)" description="플랫폼 STO 거래 금액">
          {volume.length === 0 ? <EmptyState text="거래 데이터가 없습니다." /> : (
            <MiniBars values={volume.map((v) => v.amount)} labels={volume.map((v) => v.label)} />
          )}
        </Section>
        <Section title="플랫폼 사용자" description="역할별 구성">
          <DonutBreakdown
            segments={[
              { label: "소상공인", value: stats?.merchants ?? 0, color: "var(--forest)" },
              { label: "투자자", value: stats?.investors ?? 0, color: "var(--sky)" },
              { label: "관리자", value: stats?.admins ?? 0, color: "var(--gold)" },
            ]}
            centerLabel={String(stats?.total_users ?? 0)}
            centerSub="총 사용자"
          />
          <div style={{ display: "flex", gap: 22, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)", fontSize: 13, color: "var(--ink-soft)" }}>
            <span>STO 자산 <b style={{ color: "var(--ink)" }}>{stats?.total_sto ?? 0}</b></span>
            <span>온체인 기록 <b style={{ color: "var(--ink)" }}>{stats?.onchain_records ?? 0}</b></span>
            <span>총 거래 <b style={{ color: "var(--ink)" }}>{stats?.total_transactions ?? 0}</b></span>
          </div>
        </Section>
      </div>

      {/* STO 발행 */}
      <Section id="issue" title="STO 발행" description="탄소 환경 자산을 토큰증권으로 발행 (ERC-1400)" action={<Button onClick={() => setShowIssue(true)}>+ 새 STO 발행</Button>}>
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>총 {stats?.total_sto ?? 0}개 자산이 발행되었습니다. 발행 시 스마트 컨트랙트가 배포되고 마켓플레이스에 공개됩니다.</p>
      </Section>

      {/* 사용자 관리 */}
      <Section id="users" title="사용자 관리" description="계정 정지 / 복원 (감사 로그 기록)">
        <table style={{ width: "100%", fontSize: 13.5, borderCollapse: "collapse" }}>
          <thead><tr style={{ textAlign: "left", color: "var(--ink-soft)", fontSize: 11.5 }}>
            <th style={{ padding: "0 0 8px" }}>이메일</th><th>역할</th><th>상태</th><th style={{ textAlign: "right" }}>작업</th>
          </tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: "10px 0" }}>{u.email}</td>
                <td><Badge tone="gray">{u.role}</Badge></td>
                <td><Badge tone={u.is_active ? "green" : "red"}>{u.is_active ? "활성" : "정지"}</Badge></td>
                <td style={{ textAlign: "right" }}>
                  <button onClick={() => userAction(u, u.is_active ? "suspend" : "restore")} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12.5, color: u.is_active ? "var(--danger)" : "var(--forest)" }}>
                    {u.is_active ? "정지" : "복원"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* 감사 로그 */}
      <Section id="audit" title="감사 로그" description="불변 관리 작업 기록">
        {logs.length === 0 ? <EmptyState icon="🗂" text="감사 로그가 없습니다." /> : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {logs.map((log) => (
              <div key={log.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--line)", fontSize: 13 }}>
                <div><span style={{ fontWeight: 600 }}>{log.action}</span>{log.target_type && <span style={{ color: "var(--ink-soft)" }}> → {log.target_type}#{log.target_id}</span>}</div>
                <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{dateStr(log.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {showIssue && <IssueModal onClose={() => setShowIssue(false)} onDone={async () => { setShowIssue(false); await load(); }} />}
    </div>
  );
}

function IssueModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ asset_type: "SOLAR", name: "", location: "", total_token_supply: 5000, token_price: 10000, expected_yield: 6.0, co2_offset_per_year: 40, installed_capacity_mw: 2.5, dividend_period_months: 3 });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  async function submit() {
    if (!f.name.trim()) { toast.show("자산명을 입력하세요.", "error"); return; }
    setBusy(true);
    try {
      await api<STOAsset>("/sto", { method: "POST", body: { ...f, token_price: String(f.token_price), expected_yield: String(f.expected_yield), installed_capacity_mw: String(f.installed_capacity_mw) } });
      toast.show(`STO "${f.name}" 발행 완료.`, "success");
      onDone();
    } catch (err) { toast.show(err instanceof ApiError ? err.message : "발행 실패", "error"); }
    finally { setBusy(false); }
  }

  const field = (label: string, k: string, type = "text", opts?: string[]) => (
    <label style={{ display: "block" }}>
      <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{label}</span>
      {opts ? (
        <select className="field" value={f[k as keyof typeof f]} onChange={(e) => set(k, e.target.value)}>{opts.map((o) => <option key={o} value={o}>{o}</option>)}</select>
      ) : (
        <input className="field" type={type} value={f[k as keyof typeof f]} onChange={(e) => set(k, type === "number" ? Number(e.target.value) : e.target.value)} />
      )}
    </label>
  );

  return (
    <Modal onClose={onClose} title="새 STO 발행">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {field("자산 유형", "asset_type", "text", ["SOLAR", "WIND", "FOREST", "HYDRO"])}
        {field("자산명", "name")}
        {field("위치", "location")}
        {field("설비용량 (MW)", "installed_capacity_mw", "number")}
        {field("총 발행량", "total_token_supply", "number")}
        {field("토큰 단가 (원)", "token_price", "number")}
        {field("예상 수익률 (%)", "expected_yield", "number")}
        {field("연 CO₂ 저감 (t)", "co2_offset_per_year", "number")}
        {field("배당 주기 (월)", "dividend_period_months", "number")}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={onClose}>취소</Button>
        <Button onClick={submit} disabled={busy}>{busy ? "배포 중…" : "배포 및 발행"}</Button>
      </div>
    </Modal>
  );
}
