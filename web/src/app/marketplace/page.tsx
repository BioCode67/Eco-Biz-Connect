"use client";

// 투자 마켓플레이스 (proto_03_marketplace). UC9 탐색 · UC10 구매 (KYC 선결).

import { useCallback, useEffect, useState } from "react";

import DashboardShell from "@/components/DashboardShell";
import { Badge, Button, Section } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { won } from "@/lib/format";
import type { STOAsset } from "@/lib/types";

const NAV = [
  { label: "Marketplace", href: "/marketplace", active: true },
  { label: "Portfolio", href: "/portfolio" },
];

const ASSET_ICON: Record<string, string> = { SOLAR: "☀", WIND: "💨", FOREST: "🌲", HYDRO: "💧" };

export default function MarketplacePage() {
  return (
    <DashboardShell role="INVESTOR" nav={NAV} title="Investment Marketplace" subtitle="Carbon-Neutral STO Products">
      <MarketplaceBody />
    </DashboardShell>
  );
}

function MarketplaceBody() {
  const { user, refresh } = useAuth();
  const [assets, setAssets] = useState<STOAsset[]>([]);
  const [qty, setQty] = useState<Record<number, number>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const kycVerified = user?.kyc_status === "VERIFIED";

  const load = useCallback(async () => {
    setAssets(await api<STOAsset[]>("/marketplace").catch(() => []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function verifyKyc() {
    setMsg(null);
    try {
      await api("/investor/kyc/verify", { method: "POST" });
      await refresh();
      setMsg("KYC 인증이 완료되었습니다. 이제 토큰을 구매할 수 있습니다.");
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "KYC 실패");
    }
  }

  async function buy(asset: STOAsset) {
    const quantity = qty[asset.id] || 1;
    setMsg(null);
    try {
      await api(`/marketplace/${asset.id}/purchase`, { method: "POST", body: { quantity } });
      setMsg(`${asset.name} ${quantity} 토큰을 구매했습니다.`);
      await load();
      await refresh();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "구매 실패");
    }
  }

  return (
    <div>
      {!kycVerified && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning">
          <span>토큰 구매를 위해 KYC 인증이 필요합니다.</span>
          <Button onClick={verifyKyc}>KYC 인증하기</Button>
        </div>
      )}
      {msg && <div className="mb-4 rounded-lg bg-brand-light px-4 py-2 text-sm text-brand-dark">{msg}</div>}

      <Section title="Carbon-Neutral STO Products" description="탄소중립 환경 자산 토큰증권">
        {assets.length === 0 ? (
          <p className="text-sm text-muted">현재 공개된 상품이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assets.map((a) => {
              const soldOut = a.status === "SOLD_OUT" || a.remaining_tokens <= 0;
              return (
                <div key={a.id} className="ebc-card p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-3xl">{ASSET_ICON[a.asset_type] ?? "🌱"}</span>
                    <Badge tone="green">{a.asset_type}</Badge>
                  </div>
                  <div className="font-semibold">{a.name}</div>
                  {a.description && <div className="text-xs text-muted">{a.description}</div>}
                  <div className="mt-3 text-sm">토큰 가격: {won(a.token_price)}</div>
                  <div className="text-xs text-muted">
                    잔여 {a.remaining_tokens.toLocaleString()} / {a.total_token_supply.toLocaleString()}
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-border">
                    <div
                      className="h-1.5 rounded-full bg-brand"
                      style={{ width: `${(a.remaining_tokens / a.total_token_supply) * 100}%` }}
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={a.remaining_tokens}
                      value={qty[a.id] ?? 1}
                      onChange={(e) => setQty({ ...qty, [a.id]: Number(e.target.value) })}
                      disabled={soldOut || !kycVerified}
                      className="ebc-input w-20"
                    />
                    <Button onClick={() => buy(a)} disabled={soldOut || !kycVerified}>
                      {soldOut ? "Sold Out" : "Buy Tokens"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
