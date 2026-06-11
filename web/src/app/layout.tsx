import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";

import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

// 디스플레이용 세리프 — 기본 산세리프 일변도에서 벗어나 '디자인된' 인상을 준다.
const fraunces = Fraunces({
  variable: "--font-display",
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
    <html lang="ko" className={`${geistSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
