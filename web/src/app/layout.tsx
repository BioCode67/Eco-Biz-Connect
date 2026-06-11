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

export const metadata: Metadata = {
  title: "Eco-Biz Connect — AI·ESG 통합 금융",
  description: "AI 경영 분석과 블록체인 탄소 투자를 결합한 ESG 통합 금융 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
