// 모바일 공통 색상/간격 토큰 — 웹과 동일한 Apple 스타일 디자인 언어.

export const colors = {
  bg: "#f5f5f7", // Apple 라이트 그레이 배경
  text: "#1d1d1f",
  muted: "#86868b", // Apple 정확 그레이
  mutedFaint: "#aeaeb2",
  card: "#ffffff",
  border: "#e5e5ea", // 얇은 헤어라인 톤
  brand: "#1f8a52", // 녹색 액센트(최소한)
  brandDark: "#15633a",
  brandLight: "#f0f7f2",
  leaf: "#30b85a",
  sky: "#0071e3", // Apple 블루(보조 액센트)
  gold: "#bf8a30",
  danger: "#d6342a",
  warning: "#b9842a",
  white: "#ffffff",
};

export const radius = 22;
export const radiusSm = 14;

// iOS/Android 공통 카드 그림자(은은하게 — 웹 shadow-sm 톤)
export const shadow = {
  shadowColor: "#000000",
  shadowOpacity: 0.05,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 1,
};
