import type { MetadataRoute } from "next";

// PWA 매니페스트 — 설치 가능·홈 화면 추가 시 브랜드 표시.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eco-Biz Connect — AI·ESG 통합 금융",
    short_name: "Eco-Biz Connect",
    description: "소상공인 AI 경영 분석과 개인 투자자 탄소 STO 투자를 잇는 ESG 통합 금융 플랫폼",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f7",
    theme_color: "#1f8a52",
    lang: "ko",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
