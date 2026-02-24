"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MBTI_TYPES } from "@/app/lib/mbti";

const RELATIONSHIP_MODES = [
  { value: "romance", label: "Romance", ko: "연애" },
  { value: "friendship", label: "Friendship", ko: "우정" },
  { value: "work", label: "Work", ko: "직장" },
] as const;

type RelationshipMode = (typeof RELATIONSHIP_MODES)[number]["value"];

function buildCompatibilityPrompt(typeA: string, typeB: string, mode: RelationshipMode): string {
  const modeLabel = RELATIONSHIP_MODES.find((m) => m.value === mode)?.label ?? "Romance";
  return `Are ${typeA} and ${typeB} compatible as ${modeLabel.toLowerCase()} partners? Explain strengths, conflict points, and practical advice for this pair.`;
}

export default function CompatibilityPage() {
  const router = useRouter();
  const [typeA, setTypeA] = useState("INTJ");
  const [typeB, setTypeB] = useState("ENFP");
  const [mode, setMode] = useState<RelationshipMode>("romance");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableB = useMemo(() => MBTI_TYPES.filter((t) => t.code !== typeA), [typeA]);

  const canSubmit = !!typeA && !!typeB && typeA !== typeB && !loading;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const question = buildCompatibilityPrompt(typeA, typeB, mode);
      const selectedMode = RELATIONSHIP_MODES.find((m) => m.value === mode);

      // Use existing 3-type council engine: add a mediator voice (ENFJ) for balanced pair analysis
      const types = [typeA, typeB, "ENFJ"].filter((v, i, arr) => arr.indexOf(v) === i);
      if (types.length < 3) {
        const fallback = MBTI_TYPES.map((t) => t.code).find((c) => !types.includes(c)) || "INTP";
        types.push(fallback);
      }

      const res = await fetch("/api/council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          language: "ko",
          types: types.slice(0, 3),
        }),
      });

      if (!res.ok) throw new Error("호환성 토론 생성에 실패했어요.");
      const data = (await res.json()) as { id?: string; question?: string; types?: string[]; language?: string };
      if (!data.id) throw new Error("토론 ID를 받지 못했어요.");

      const sp = new URLSearchParams({
        question: data.question ?? question,
        types: (data.types ?? types).join(","),
        language: data.language ?? "ko",
        mode,
        a: typeA,
        b: typeB,
        compatibility: "1",
        modeLabel: selectedMode?.ko ?? "연애",
      });

      router.push(`/c/${data.id}?${sp.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-indigo-50 px-4 py-8 text-gray-900 sm:py-12">
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-black sm:text-3xl">MBTI Compatibility Checker</h1>
        <p className="mt-2 text-sm text-gray-600">
          두 유형을 선택하면, MBTI 단톡이 연애/우정/직장 궁합을 대신 토론해줘요.
        </p>

        <form className="mt-6 space-y-5" onSubmit={submit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">
              Type A
              <select
                value={typeA}
                onChange={(e) => {
                  const nextA = e.target.value;
                  setTypeA(nextA);
                  if (nextA === typeB) {
                    const nextB = MBTI_TYPES.find((t) => t.code !== nextA)?.code || "ENFP";
                    setTypeB(nextB);
                  }
                }}
                className="mt-2 h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none ring-fuchsia-300 focus:ring"
              >
                {MBTI_TYPES.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.emoji} {type.code}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold">
              Type B
              <select
                value={typeB}
                onChange={(e) => setTypeB(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none ring-fuchsia-300 focus:ring"
              >
                {availableB.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.emoji} {type.code}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold">Relationship mode</p>
            <div className="grid grid-cols-3 gap-2">
              {RELATIONSHIP_MODES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMode(item.value)}
                  className={[
                    "h-11 rounded-xl border text-sm font-bold transition",
                    mode === item.value
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            Prompt preview: <span className="font-medium">{buildCompatibilityPrompt(typeA, typeB, mode)}</span>
          </div>

          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-gray-900 text-base font-extrabold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? "궁합 토론 여는 중..." : "Check compatibility →"}
          </button>
        </form>
      </div>
    </main>
  );
}
