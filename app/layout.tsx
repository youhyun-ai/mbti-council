import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MBTI Council — 성격유형 토론회",
  description: "Pick 3 MBTI types, ask anything, watch them debate.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
