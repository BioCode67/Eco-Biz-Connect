// 온체인 해시 탭 → 블록체인 검증 모달 (Design UC11 + BlockchainRecord.verify()).
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { api } from "../lib/api";
import { dateStr, shortHash } from "../lib/format";
import { colors } from "../theme";
import { AppModal } from "./AppModal";
import { Badge } from "./ui";

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

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.border }}>
      <Text style={{ fontSize: 12.5, color: colors.muted }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 12.5, fontWeight: "600", color: colors.text, textAlign: "right", fontFamily: mono ? "Courier" : undefined }}>{value}</Text>
    </View>
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
    setRec(await api<ChainRecord>(`/chain/verify/${hash}`).catch(() => null));
    setLoading(false);
  }

  return (
    <>
      <Pressable onPress={openModal} hitSlop={6}>
        <Text style={{ fontSize: 11, color: colors.sky, fontWeight: "600" }}>⛓ {label ?? shortHash(hash)}</Text>
      </Pressable>
      <AppModal visible={open} title="온체인 검증" onClose={() => setOpen(false)}>
        {loading ? (
          <Text style={{ color: colors.muted, fontSize: 14, paddingVertical: 16, textAlign: "center" }}>체인 조회 중…</Text>
        ) : !rec ? (
          <Text style={{ color: colors.muted, fontSize: 14, paddingVertical: 16, textAlign: "center" }}>온체인 레코드를 찾을 수 없습니다.</Text>
        ) : (
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Badge tone={rec.verified ? "green" : "amber"}>{rec.verified ? "✓ 검증됨" : "확정 대기"}</Badge>
              <Text style={{ fontSize: 13.5, color: colors.muted }}>{RECORD_TYPE_KO[rec.record_type] ?? rec.record_type}</Text>
            </View>
            <Row label="네트워크" value={rec.network_id} />
            <Row label="블록 번호" value={`#${rec.block_number.toLocaleString()}`} />
            <Row label="트랜잭션 해시" value={shortHash(rec.tx_hash)} mono />
            <Row label="데이터 해시" value={shortHash(rec.data_hash)} mono />
            <Row label="확정 시각" value={rec.confirmed_at ? dateStr(rec.confirmed_at) : "—"} />
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 12, lineHeight: 18 }}>
              저장된 데이터 해시를 온체인 레코드와 교차 확인했습니다. 위변조 시 검증이 실패합니다.
            </Text>
          </View>
        )}
      </AppModal>
    </>
  );
}
