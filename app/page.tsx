import Link from "next/link";
import { getCouncilCount } from "@/lib/counter";

export const dynamic = "force-dynamic"; // always fetch fresh count

const EXAMPLES = [
  {
    title: "썸 연락 텀",
    question: "썸남이 3시간째 답장이 없는데 관심 없는 걸까?",
    types: ["ENTJ", "ENFP", "ISFP"],
  },
  {
    title: "퇴사 고민",
    question: "지금 회사에 남을지, 바로 이직할지 너무 고민돼요.",
    types: ["INTJ", "ESFP", "INFJ"],
  },
  {
    title: "친구 관계",
    question: "계속 손해 보는 느낌의 관계, 끊는 게 맞을까요?",
    types: ["ISTP", "ENFJ", "INTP"],
  },
];

export default async function HomePage() {
  const count = await getCouncilCount();

  return (
    <main className="min-h-screen bg-gradient-to-b from-fuchsia-50 via-white to-amber-50 text-gray-900">
      <section className="mx-auto max-w-3xl px-5 pb-10 pt-16 text-center sm:pt-24">
        <p className="inline-block rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-fuchsia-700 ring-1 ring-fuchsia-200">
          오늘의 성격유형 토론
        </p>
        {count !== null && (
          <p className="mt-3 text-sm font-bold text-gray-500">
            전국 MBTI 분쟁 건수: <span className="text-fuchsia-600">{count.toLocaleString("ko-KR")}건</span>
          </p>
        )}
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">MBTI 성격유형 토론회</h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-gray-700 sm:text-lg">
          3가지 유형을 골라서 뭐든 물어보세요. 그들의 토론을 지켜보세요.
        </p>

        <Link
          href="/pick"
          className="mt-8 inline-flex min-h-14 items-center justify-center rounded-2xl bg-gray-900 px-8 text-lg font-extrabold text-white shadow-lg shadow-gray-900/20 transition hover:-translate-y-0.5 hover:bg-black"
        >
          토론 시작하러 가기 🚀
        </Link>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-16">
        <h2 className="text-lg font-extrabold">예시 토론 주제</h2>
        <div className="mt-4 space-y-3">
          {EXAMPLES.map((item) => (
            <article key={item.title} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold text-fuchsia-700">{item.title}</p>
              <p className="mt-1 text-sm font-medium text-gray-800">“{item.question}”</p>
              <p className="mt-2 text-xs text-gray-500">패널: {item.types.join(" · ")}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-200/80 py-8 text-center text-sm text-gray-500">
        Made by Tyche Labs
      </footer>
    </main>
  );
}
