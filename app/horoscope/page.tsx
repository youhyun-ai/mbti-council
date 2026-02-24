import type { Metadata } from "next";
import Link from "next/link";

import { MBTI_TYPES } from "@/app/lib/mbti";

export const metadata: Metadata = {
  title: "오늘의 MBTI 운세 | 연애·커리어·행운·인간관계",
  description: "MBTI 성격 기반 오늘의 운세. 내 유형의 연애/커리어/행운/인간관계 운세를 30초 안에 확인하세요.",
  keywords: ["MBTI 운세", "오늘의 운세", "MBTI 성격", "연애 운세", "인간관계 운세"],
  openGraph: {
    title: "오늘의 MBTI 운세",
    description: "MBTI 성격 기반 데일리 운세를 바로 확인해보세요.",
    images: ["/api/horoscope/INTJ/2026-02-25/card"],
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "오늘의 MBTI 운세",
    description: "MBTI 성격 기반 데일리 운세",
    images: ["/api/horoscope/INTJ/2026-02-25/card"],
  },
};

function todayKST() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
}

export default function HoroscopeLandingPage() {
  const date = todayKST();

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-fuchsia-50 px-4 py-10 text-gray-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-black">오늘의 MBTI 운세</h1>
        <p className="mt-2 text-sm text-gray-600">내 유형 오늘 기류 체크하고, 친구랑 바로 공유해봐요 🔮</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MBTI_TYPES.map((item) => (
            <Link
              key={item.code}
              href={`/horoscope/${item.code}/${date}`}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300"
            >
              <span className="mr-1">{item.emoji}</span>
              {item.code}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
