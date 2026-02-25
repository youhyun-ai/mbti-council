import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { generateDailyHoroscope } from "@/lib/horoscope";
import { isValidMbtiType } from "@/lib/mbti";
import { ShareButton } from "./ShareButton";

type PageProps = {
  params: Promise<{ type: string; date: string }>;
};

function validDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type, date } = await params;
  const up = type.toUpperCase();
  return {
    title: `${up} 오늘의 운세 (${date})`,
    description: `${up}의 ${date} 연애/커리어/행운/인간관계 운세`,
  };
}

export default async function HoroscopeResultPage({ params }: PageProps) {
  const { type, date } = await params;
  const up = type.toUpperCase();

  if (!isValidMbtiType(up) || !validDate(date)) notFound();

  const data = await generateDailyHoroscope(up, date);

  return (
    <main className="min-h-screen bg-gradient-to-b from-fuchsia-50 via-white to-amber-50 px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold text-fuchsia-700">{data.date} · 오늘의 운세</p>
        <h1 className="mt-2 text-3xl font-black">{data.title}</h1>
        <p className="mt-3 rounded-xl bg-fuchsia-50 px-4 py-3 text-sm text-gray-700">{data.overall}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <h2 className="text-sm font-extrabold">💘 연애</h2>
            <p className="mt-1 text-sm text-gray-700">{data.love}</p>
          </section>
          <section className="rounded-xl border border-sky-200 bg-sky-50 p-4">
            <h2 className="text-sm font-extrabold">💼 커리어</h2>
            <p className="mt-1 text-sm text-gray-700">{data.career}</p>
          </section>
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="text-sm font-extrabold">🍀 행운</h2>
            <p className="mt-1 text-sm text-gray-700">{data.luck}</p>
          </section>
          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <h2 className="text-sm font-extrabold">🫂 인간관계</h2>
            <p className="mt-1 text-sm text-gray-700">{data.social}</p>
          </section>
        </div>

        <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p>✨ 럭키 아이템: <span className="font-bold">{data.luckyItem}</span></p>
          <p className="mt-1">⏰ 럭키 타임: <span className="font-bold">{data.luckyTime}</span></p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <ShareButton type={up} date={date} />
          <Link href="/horoscope" className="rounded-full bg-gray-900 px-4 py-2 text-xs font-bold text-white">
            다른 유형 보기
          </Link>
        </div>
      </div>
    </main>
  );
}
