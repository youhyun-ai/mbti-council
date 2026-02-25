"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { MBTI_TYPES } from "@/app/lib/mbti";

type Choice = "A" | "B";

type Question = {
  id: string;
  prompt: string;
  choices: Array<{ id: Choice; text: string; leanType: string }>;
};

type VoteStats = {
  total: number;
  A: { count: number; percent: number; topTypes: string[] };
  B: { count: number; percent: number; topTypes: string[] };
  byType: Record<string, { A: number; B: number; total: number; lean: "A" | "B" | "tie" }>;
};

function parseBreakdown(raw: string | null) {
  if (!raw) return [] as Array<[string, number]>;
  return raw
    .split(",")
    .map((item) => item.split(":"))
    .filter((v) => v.length === 2)
    .map(([k, v]) => [k, Number(v)] as [string, number])
    .filter(([, n]) => Number.isFinite(n));
}

export default function BalancePage() {
  const [sharedType, setSharedType] = useState<string | null>(null);
  const [sharedScore, setSharedScore] = useState<string | null>(null);
  const [sharedBreakdown, setSharedBreakdown] = useState<Array<[string, number]>>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    setSharedType(sp.get("type"));
    setSharedScore(sp.get("score"));
    setSharedBreakdown(parseBreakdown(sp.get("breakdown")));
  }, []);

  const isSharedResult = Boolean(sharedType && sharedScore);

  const [mbtiType, setMbtiType] = useState("ENFP");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState<VoteStats | null>(null);
  const [commentary, setCommentary] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  const current = questions[index];

  const result = useMemo(() => {
    const values = Object.values(answers);
    if (!values.length) return null;

    const counts: Record<string, number> = {};
    for (const type of values) counts[type] = (counts[type] || 0) + 1;

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    if (!top) return null;

    const score = Math.round((top[1] / values.length) * 100);
    return {
      type: top[0],
      score,
      breakdown: sorted,
    };
  }, [answers]);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch("/api/balance/questions");
      const data = await res.json();
      setQuestions(data.questions || []);
      setIndex(0);
      setStats(null);
      setAnswers({});
      setDone(false);
    } finally {
      setLoading(false);
    }
  }

  async function vote(choice: Choice) {
    if (!current) return;
    const pickedLeanType = current.choices.find((c) => c.id === choice)?.leanType;

    const res = await fetch("/api/balance/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: current.id,
        choice,
        mbtiType,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "투표 저장 실패");
      return;
    }

    setStats(data.stats as VoteStats);
    setCommentary(String(data.commentary || ""));
    if (pickedLeanType) {
      setAnswers((prev) => ({ ...prev, [current.id]: pickedLeanType }));
    }
  }

  function next() {
    setStats(null);
    setCommentary("");
    if (index + 1 >= questions.length) {
      setDone(true);
      return;
    }
    setIndex((v) => v + 1);
  }

  async function copyShare() {
    if (!result) return;
    const url = `${window.location.origin}/balance?type=${encodeURIComponent(result.type)}&score=${result.score}&breakdown=${encodeURIComponent(result.breakdown.map(([t, n]) => `${t}:${n}`).join(","))}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (isSharedResult) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-rose-50 px-4 py-10 text-gray-900">
        <div className="mx-auto max-w-xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold text-fuchsia-700">MBTI 밸런스 게임 결과</p>
          <h1 className="mt-2 text-3xl font-black">나는 {sharedScore}% {sharedType} 성향</h1>
          <div className="mt-4 space-y-2">
            {sharedBreakdown.map(([type, count]) => (
              <div key={type} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <span>{type}</span>
                <span>{count}표</span>
              </div>
            ))}
          </div>
          <Link href="/balance" className="mt-5 inline-flex rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white">
            나도 해보기 →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-rose-50 px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-black">MBTI 밸런스 게임</h1>
        <p className="mt-2 text-sm text-gray-600">30초 컷. 선택하고, 실시간 MBTI 성향 분포를 확인해봐 🔥</p>

        {!questions.length ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <label className="text-sm font-bold">내 MBTI</label>
            <select value={mbtiType} onChange={(e) => setMbtiType(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-gray-300 px-3 text-sm">
              {MBTI_TYPES.map((t) => (
                <option key={t.code} value={t.code}>{t.emoji} {t.code}</option>
              ))}
            </select>
            <button onClick={() => void start()} disabled={loading} className="mt-4 w-full rounded-2xl bg-gray-900 py-3 text-sm font-extrabold text-white">
              {loading ? "불러오는 중..." : "게임 시작"}
            </button>
          </div>
        ) : done && result ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-fuchsia-700">결과 요약</p>
            <h2 className="mt-2 text-2xl font-black">나는 {result.score}% {result.type} 성향</h2>
            <div className="mt-4 space-y-2">
              {result.breakdown.map(([type, count]) => (
                <div key={type} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
                  <span>{type}</span>
                  <span>{count}개 선택</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => void copyShare()} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold">{copied ? "복사됨!" : "결과 링크 복사"}</button>
              <button onClick={() => { setQuestions([]); setDone(false); }} className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white">다시하기</button>
            </div>
          </div>
        ) : current ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-500">문항 {index + 1} / {questions.length}</p>
            <h2 className="mt-2 text-xl font-black">{current.prompt}</h2>

            <div className="mt-4 grid gap-2">
              {current.choices.map((choice) => (
                <button key={choice.id} onClick={() => void vote(choice.id)} disabled={Boolean(stats)} className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-sm font-semibold hover:border-gray-400 disabled:opacity-60">
                  {choice.text}
                </button>
              ))}
            </div>

            {stats ? (
              <div className="mt-5 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg border border-gray-200 bg-white p-2">
                    <p className="font-bold">A {stats.A.percent}%</p>
                    <p className="text-xs text-gray-500">{stats.A.count}표 · {stats.A.topTypes.join(", ") || "-"}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-2">
                    <p className="font-bold">B {stats.B.percent}%</p>
                    <p className="text-xs text-gray-500">{stats.B.count}표 · {stats.B.topTypes.join(", ") || "-"}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-3 text-xs text-gray-700">
                  {commentary}
                </div>

                <div className="max-h-40 overflow-auto rounded-lg border border-gray-200 bg-white p-2 text-xs">
                  <p className="mb-1 font-semibold">MBTI별 성향</p>
                  <div className="space-y-1">
                    {Object.entries(stats.byType).sort((a, b) => b[1].total - a[1].total).map(([type, v]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span>{type}</span>
                        <span>{v.lean === "tie" ? "반반" : `${v.lean} 성향`} ({v.total})</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={next} className="w-full rounded-xl bg-gray-900 py-2 text-sm font-bold text-white">다음 문항</button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
