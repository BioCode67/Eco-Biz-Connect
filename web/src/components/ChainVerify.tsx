"use client";

// 온체인 해시 클릭 → 블록체인 검증 모달 (Design UC11 "블록체인 익스플로러 연결" + BlockchainRecord.verify()).
import { useState } from "react";

import { Modal } from "@/components/Modal";
import { Badge } from "@/components/ui";
import { api, safe } from "@/lib/api";
import { dateStr, shortHash } from "@/lib/format";

interface ChainRecord {
  tx_hash: string;
  record_type: string;
  block_number: number;
  network_id: string;
  data_hash: string;
  confirmed_at: string | null;
  verified: boolean;
}

const RECORD_TYPE_KO: Record<string, string> = {
  ESG_ANCHOR: "ESG 점수 앵커링",
  TOKEN_PURCHASE: "토큰 구매",
  DIVIDEND: "배당 분배",
  STO_DEPLOY: "STO 컨트랙트 배포",
};

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderTop: "1px solid var(--line)" }}>
      <span style={{ fontSize: 12.5, color: "var(--ink-soft)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 600, fontFamily: mono ? "monospace" : undefined, wordBreak: "break-all", textAlign: "right" }}>{value}</span>
    </div>
  );
}

export function ChainHash({ hash, label }: { hash: string | null | undefined; label?: string }) {
  const [open, setOpen] = useState(false);
  const [rec, setRec] = useState<ChainRecord | null>(null);
  const [loading, setLoading] = useState(false);

  if (!hash) return null;

  async function openModal() {
    setOpen(true);
    setLoading(true);
    setRec(await safe(api<ChainRecord>(`/chain/verify/${hash}`), null));
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={openModal}
        className="link"
        title="온체인 검증 보기"
        style={{ fontFamily: "monospace", fontSize: 11, background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        ⛓ {label ?? shortHash(hash)}
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)} title="온체인 검증">
          {loading ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--ink-soft)", fontSize: 14 }}>체인 조회 중…</div>
          ) : !rec ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--ink-soft)", fontSize: 14 }}>온체인 레코드를 찾을 수 없습니다.</div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Badge tone={rec.verified ? "green" : "amber"}>{rec.verified ? "✓ 검증됨" : "확정 대기"}</Badge>
                <span style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>{RECORD_TYPE_KO[rec.record_type] ?? rec.record_type}</span>
              </div>
              <Field label="네트워크" value={rec.network_id} />
              <Field label="블록 번호" value={`#${rec.block_number.toLocaleString()}`} />
              <Field label="트랜잭션 해시" value={rec.tx_hash} mono />
              <Field label="데이터 해시 (SHA-256)" value={rec.data_hash} mono />
              <Field label="확정 시각" value={rec.confirmed_at ? dateStr(rec.confirmed_at) : "—"} />
              <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 14, lineHeight: 1.5 }}>
                저장된 데이터 해시를 온체인 레코드와 교차 확인했습니다. 위변조 시 검증이 실패합니다.
              </p>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
