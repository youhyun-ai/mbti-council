import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://vitric.ai"),
  title: "MBTI Council — MBTI 성격유형 토론/궁합/운세",
  description: "MBTI 성격 유형 토론, MBTI 궁합, 오늘의 MBTI 운세까지 한 번에 보는 한국형 MBTI 놀이터.",
  keywords: ["MBTI", "MBTI 성격", "MBTI 궁합", "MBTI 토론", "오늘의 운세", "연애 궁합", "성격유형"],
  openGraph: {
    title: "MBTI Council — MBTI 성격유형 토론/궁합/운세",
    description: "MBTI 성격 유형 토론, MBTI 궁합, 오늘의 MBTI 운세를 vitric.ai에서 확인해보세요.",
    type: "website",
    url: "https://vitric.ai",
    images: ["/api/council/0520f5fc-3d8c-49c8-b430-42c1649dc50e/card?format=square"],
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "MBTI Council — MBTI 성격유형 토론/궁합/운세",
    description: "MBTI 성격, 궁합, 토론, 운세를 한 번에.",
    images: ["/api/council/0520f5fc-3d8c-49c8-b430-42c1649dc50e/card?format=square"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
