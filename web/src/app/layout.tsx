import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

// 시스템 폰트(SF Pro) 우선, 비-Apple 환경 폴백용으로 Geist 로드
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Eco-Biz Connect — AI·ESG 통합 금융",
    template: "%s · Eco-Biz Connect",
  },
  description: "소상공인 AI 경영 분석과 개인 투자자 탄소 STO 투자를 잇는 ESG 통합 금융 플랫폼",
  applicationName: "Eco-Biz Connect",
  keywords: ["ESG", "탄소중립", "STO", "소상공인", "AI 경영분석", "블록체인 금융"],
  authors: [{ name: "22311898 김주형" }],
  openGraph: {
    type: "website",
    siteName: "Eco-Biz Connect",
    title: "Eco-Biz Connect — AI·ESG 통합 금융",
    description: "소상공인 AI 경영 분석과 개인 투자자 탄소 STO 투자를 잇는 ESG 통합 금융 플랫폼",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eco-Biz Connect — AI·ESG 통합 금융",
    description: "소상공인 AI 경영 분석과 개인 투자자 탄소 STO 투자를 잇는 ESG 통합 금융 플랫폼",
  },
};

export const viewport = {
  themeColor: "#1f8a52",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* 페인트 전 테마 적용(플래시 방지) — 저장값 우선, 없으면 OS 설정 */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('ebc-theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();",
          }}
        />
      </head>
      <body className="min-h-full">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
