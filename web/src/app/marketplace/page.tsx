"use client";

// 투자 마켓플레이스 (proto_03). UC9 탐색(필터·정렬·검색) · UC10 구매(동적계산·위험고지·KYC).

import { useCallback, useEffect, useMemo, useState } from "react";

import DashboardShell from "@/components/DashboardShell";
import { Modal } from "@/app/merchant/page";
import { Badge, Button, EmptyState, ErrorBanner, Section, Skeleton } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { api, ApiError, safe } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { pct, won } from "@/lib/format";
import type { STOAsset } from "@/lib/types";

const NAV = [
  { label: "마켓플레이스", href: "/marketplace", icon: "market", active: true },
  { label: "포트폴리오", href: "/portfolio", icon: "portfolio" },
];

const ASSET_META: Record<string, { icon: string; label: string }> = {
  SOLAR: { icon: "☀", label: "태양광" },
  WIND: { icon: "💨", label: "풍력" },
  FOREST: { icon: "🌲", label: "탄소숲" },
  HYDRO: { icon: "💧", label: "수력" },
};

type SortKey = "yield" | "price" | "recent" | "remaining";

export default function MarketplacePage() {
  const { user } = useAuth();
  return (
    <DashboardShell role="INVESTOR" nav={NAV} title="투자 마켓플레이스" subtitle="탄소중립 STO 조각투자"
      badge={user?.kyc_status === "VERIFIED" ? <Badge tone="green">KYC 인증됨</Badge> : <Badge tone="amber">KYC 미인증</Badge>}>
      <MarketplaceBody />
    </DashboardShell>
  );
}

function MarketplaceBody() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const [assets, setAssets] = useState<STOAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyTarget, setBuyTarget] = useState<STOAsset | null>(null);
  const [detailTarget, setDetailTarget] = useState<STOAsset | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sort, setSort] = useState<SortKey>("yield");
  const [netError, setNetError] = useState(false);
  const kycVerified = user?.kyc_status === "VERIFIED";

  const load = useCallback(async () => {
    try {
      setAssets(await safe(api<STOAsset[]>("/marketplace"), [] as STOAsset[]));
      setNetError(false);
    } catch {
      setNetError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function verifyKyc() {
    try {
      await api("/investor/kyc/verify", { method: "POST" });
      await refresh();
      toast.show("KYC 인증이 완료되었습니다. 이제 투자할 수 있습니다.", "success");
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "KYC 실패", "error");
    }
  }

  const visible = useMemo(() => {
    let list = assets.filter((a) => (typeFilter === "ALL" || a.asset_type === typeFilter));
    if (search.trim()) list = list.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()) || (a.location ?? "").includes(search));
    const s = [...list];
    if (sort === "yield") s.sort((a, b) => Number(b.expected_yield) - Number(a.expected_yield));
    else if (sort === "price") s.sort((a, b) => Number(a.token_price) - Number(b.token_price));
    else if (sort === "remaining") s.sort((a, b) => b.remaining_tokens - a.remaining_tokens);
    else s.sort((a, b) => b.id - a.id);
    return s;
  }, [assets, typeFilter, search, sort]);

  return (
    <div>
      {netError && <ErrorBanner onRetry={() => { setLoading(true); load(); }} />}
      {!kycVerified && (
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", marginBottom: 18, background: "var(--gold-soft)", borderColor: "#ecdcc0" }}>
          <span style={{ fontSize: 13.5, color: "var(--gold)" }}>⚠ 토큰 투자를 위해 KYC 본인인증이 필요합니다.</span>
          <Button onClick={verifyKyc}>KYC 인증하기</Button>
        </div>
      )}

      {/* 필터 바 */}
      <div className="card" style={{ display: "flex", gap: 12, alignItems: "center", padding: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <input className="field" placeholder="🔍 상품·지역 검색" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: 180 }} />
        <div style={{ display: "flex", gap: 6 }}>
          {["ALL", "SOLAR", "WIND", "FOREST", "HYDRO"].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)} className="chip" style={{ cursor: "pointer", border: "1px solid var(--line)", background: typeFilter === t ? "var(--forest)" : "transparent", color: typeFilter === t ? "#fff" : "var(--ink-soft)", padding: "6px 11px" }}>
              {t === "ALL" ? "전체" : ASSET_META[t].label}
            </button>
          ))}
        </div>
        <select className="field" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={{ width: 140 }}>
          <option value="yield">수익률순</option>
          <option value="price">최저가순</option>
          <option value="remaining">잔여량순</option>
          <option value="recent">최신순</option>
        </select>
      </div>

      <Section title="탄소중립 STO 상품" description={`${visible.length}개 상품`}>
        {loading ? (
          <div className="grid-3">{[0, 1, 2].map((i) => <Skeleton key={i} height={220} radius={16} />)}</div>
        ) : visible.length === 0 ? (
          <EmptyState icon="🪙" text="조건에 맞는 상품이 없습니다." />
        ) : (
          <div className="grid-cards">
            {visible.map((a) => {
              const meta = ASSET_META[a.asset_type] ?? { icon: "🌱", label: a.asset_type };
              const soldOut = a.status === "SOLD_OUT" || a.remaining_tokens <= 0;
              const soldPct = (1 - a.remaining_tokens / a.total_token_supply) * 100;
              return (
                <div key={a.id} className="card card-hover" onClick={() => setDetailTarget(a)} style={{ padding: 18, display: "flex", flexDirection: "column", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 30 }}>{meta.icon}</span>
                    <Badge tone="green">{meta.label}</Badge>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginTop: 10 }}>{a.name}</div>
                  {a.location && <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>📍 {a.location}</div>}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 12 }}>
                    <span className="font-display" style={{ fontSize: 26, fontWeight: 600, color: "var(--forest)" }}>{pct(a.expected_yield)}</span>
                    <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>예상 연수익률</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>토큰 {won(a.token_price)} · CO₂ {a.co2_offset_per_year}t/년</div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-soft)", marginBottom: 4 }}>
                      <span>잔여 {a.remaining_tokens.toLocaleString()}</span><span>{soldPct.toFixed(0)}% 판매</span>
                    </div>
                    <div style={{ height: 7, borderRadius: 999, background: "var(--paper-2)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${100 - soldPct}%`, background: "linear-gradient(90deg, var(--leaf), var(--forest))", borderRadius: 999 }} />
                    </div>
                  </div>
                  <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }} onClick={(e) => e.stopPropagation()}>
                    <Button onClick={() => setBuyTarget(a)} disabled={soldOut || !kycVerified}>{soldOut ? "판매 완료" : "토큰 구매"}</Button>
                    <button className="link" onClick={() => setDetailTarget(a)} style={{ fontSize: 13 }}>상세보기 →</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {detailTarget && <DetailModal asset={detailTarget} kycVerified={kycVerified} onClose={() => setDetailTarget(null)} onBuy={() => { setBuyTarget(detailTarget); setDetailTarget(null); }} />}
      {buyTarget && <PurchaseModal asset={buyTarget} walletReady={kycVerified} onClose={() => setBuyTarget(null)} onDone={async () => { setBuyTarget(null); await load(); await refresh(); }} />}
    </div>
  );
}

function DetailModal({ asset, kycVerified, onClose, onBuy }: { asset: STOAsset; kycVerified: boolean; onClose: () => void; onBuy: () => void }) {
  const meta = ASSET_META[asset.asset_type] ?? { icon: "🌱", label: asset.asset_type };
  const soldPct = (1 - asset.remaining_tokens / asset.total_token_supply) * 100;
  const soldOut = asset.status === "SOLD_OUT" || asset.remaining_tokens <= 0;
  const facts: { label: string; value: string }[] = [
    { label: "예상 연수익률", value: pct(asset.expected_yield) },
    { label: "토큰 단가", value: won(asset.token_price) },
    { label: "연 CO₂ 저감", value: `${asset.co2_offset_per_year} ton` },
    { label: "설비 용량", value: asset.installed_capacity_mw ? `${asset.installed_capacity_mw} MW` : "—" },
    { label: "배당 주기", value: `${asset.dividend_period_months}개월` },
    { label: "총 발행량", value: asset.total_token_supply.toLocaleString() },
    { label: "잔여 토큰", value: asset.remaining_tokens.toLocaleString() },
    { label: "판매율", value: `${soldPct.toFixed(0)}%` },
  ];
  return (
    <Modal onClose={onClose} title="">
      <div style={{ marginTop: -8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 40 }}>{meta.icon}</span>
          <div>
            <div className="t-title" style={{ fontSize: 21 }}>{asset.name}</div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{meta.label}{asset.location ? ` · 📍 ${asset.location}` : ""}</div>
          </div>
        </div>
        {asset.description && <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6, margin: "10px 0 16px" }}>{asset.description}</p>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "var(--line)", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
          {facts.map((f) => (
            <div key={f.label} style={{ background: "var(--card)", padding: "12px 14px" }}>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{f.label}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{f.value}</div>
            </div>
          ))}
        </div>

        <div style={{ height: 8, borderRadius: 999, background: "var(--paper-2)", overflow: "hidden", marginBottom: 8 }}>
          <div style={{ height: "100%", width: `${100 - soldPct}%`, background: "linear-gradient(90deg, var(--leaf), var(--forest))", borderRadius: 999 }} />
        </div>

        {asset.contract_address && (
          <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 16, wordBreak: "break-all" }}>
            ⛓ ERC-1400 컨트랙트: <span style={{ fontFamily: "monospace" }}>{asset.contract_address}</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onClose}>닫기</Button>
          <Button onClick={onBuy} disabled={soldOut || !kycVerified}>{soldOut ? "판매 완료" : "토큰 구매"}</Button>
        </div>
      </div>
    </Modal>
  );
}

function PurchaseModal({ asset, walletReady, onClose, onDone }: { asset: STOAsset; walletReady: boolean; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const price = Number(asset.token_price);
  const total = price * qty;
  const expReturn = total * (Number(asset.expected_yield) / 100);
  const co2 = ((asset.co2_offset_per_year * qty) / asset.total_token_supply);

  async function submit() {
    if (!agree) { toast.show("투자 위험 고지에 동의해야 합니다.", "error"); return; }
    setBusy(true);
    try {
      await api(`/marketplace/${asset.id}/purchase`, { method: "POST", body: { quantity: qty } });
      toast.show(`${asset.name} ${qty}토큰을 구매했습니다.`, "success");
      onDone();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "구매 실패", "error");
    } finally { setBusy(false); }
  }

  return (
    <Modal onClose={onClose} title={`${asset.name} 투자`}>
      <label style={{ display: "block", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>구매 수량 (잔여 {asset.remaining_tokens.toLocaleString()})</span>
        <input type="number" className="field" min={1} max={asset.remaining_tokens} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(asset.remaining_tokens, Number(e.target.value))))} />
      </label>
      <div className="card" style={{ padding: 14, background: "var(--paper)", marginBottom: 14 }}>
        <Row label="총 결제 금액" value={won(total)} strong />
        <Row label="예상 연 수익" value={`${won(expReturn)} (${pct(asset.expected_yield)})`} />
        <Row label="탄소 저감 환산" value={`${co2.toFixed(2)} ton CO₂/년`} />
      </div>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, marginBottom: 16, cursor: "pointer", color: "var(--ink-soft)", lineHeight: 1.5 }}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 2 }} />
        본 투자는 원금 손실이 발생할 수 있으며, 토큰 가치는 시장 상황에 따라 변동될 수 있음을 확인했습니다.
      </label>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={onClose}>취소</Button>
        <Button onClick={submit} disabled={busy || !walletReady}>{busy ? "결제 중…" : "결제 및 투자"}</Button>
      </div>
    </Modal>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: strong ? 15 : 13, fontWeight: strong ? 700 : 400, color: strong ? "var(--ink)" : "var(--ink-soft)" }}>
      <span>{label}</span><span style={{ color: strong ? "var(--forest)" : undefined }}>{value}</span>
    </div>
  );
}
