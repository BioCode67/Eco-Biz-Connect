import { ImageResponse } from "next/og";

// 링크 미리보기용 브랜드 OG 이미지 — 폰트 의존을 피해 라틴 텍스트로 구성.
export const alt = "Eco-Biz Connect — ESG · AI · Blockchain finance platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "84px 88px",
          background: "linear-gradient(135deg, #1f8a52 0%, #15633a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 22,
              background: "rgba(255,255,255,0.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <path d="M12 21c-5 0-8-3.5-8-8.5C4 7 8 3 13 3c3 0 6 1 7 2-1 8-4 16-8 16z" fill="#ffffff" />
            </svg>
          </div>
          <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.01em" }}>Eco-Biz Connect</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: "0.18em", opacity: 0.82 }}>
            ESG · AI · BLOCKCHAIN
          </span>
          <span style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.06, letterSpacing: "-0.03em", marginTop: 18 }}>
            Finance that grows business
          </span>
          <span style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.06, letterSpacing: "-0.03em" }}>
            and protects the planet.
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 24, opacity: 0.8 }}>
          <span>AI insights · ESG-tiered lending · Carbon STO investing</span>
          <span style={{ fontWeight: 600 }}>22311898</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
