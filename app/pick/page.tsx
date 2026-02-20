"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MbtiTypeCard } from "@/app/components/mbti-type-card";
import { MbtiToast, MBTI_JOIN_LINES } from "@/app/components/MbtiToast";
import { GROUP_LABEL, GROUP_STYLES, MBTI_TYPES } from "@/app/lib/mbti";

const MAX_SELECTION = 3;

export default function PickPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const router = useRouter();

  const canSubmit = selected.length === MAX_SELECTION && question.trim().length > 0 && !loading;

  const grouped = useMemo(() => {
    return {
      analyst: MBTI_TYPES.filter((x) => x.group === "analyst"),
      diplomat: MBTI_TYPES.filter((x) => x.group === "diplomat"),
      sentinel: MBTI_TYPES.filter((x) => x.group === "sentinel"),
      explorer: MBTI_TYPES.filter((x) => x.group === "explorer"),
    };
  }, []);

  const toggleType = (code: string) => {
    setError(null);
    setSelected((prev) => {
      const line = MBTI_JOIN_LINES[code];

      if (prev.includes(code)) {
        setToastMessage(line?.leave ?? `${code}가 자리를 떴습니다.`);
        return prev.filter((v) => v !== code);
      }

      if (prev.length >= MAX_SELECTION) return prev;

      setToastMessage(line?.join ?? `${code}가 합류했습니다 👋`);
      return [...prev, code];
    });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          types: selected,
          question: question.trim(),
          language: "ko",
        }),
      });

      if (!res.ok) {
        throw new Error("토론을 시작하지 못했어요. 잠시 후 다시 시도해주세요.");
      }

      const data = (await res.json()) as { id?: string; question?: string; types?: string[]; language?: string };
      if (!data.id) throw new Error("토론 ID를 받지 못했어요.");

      const sp = new URLSearchParams({
        question: data.question ?? question.trim(),
        types: (data.types ?? selected).join(","),
        language: data.language ?? "ko",
      });

      router.push(`/c/${data.id}?${sp.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-amber-50 px-4 py-6 text-gray-900 sm:py-10">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-black">지금 단톡에 누구 부를까?</h1>
        <p className="mt-1 text-sm text-gray-600">섞일수록 더 재밌어짐. 나랑 반대 유형도 불러봐.</p>

        <div className="mt-3 rounded-xl bg-white/80 p-3 text-sm shadow-sm ring-1 ring-gray-200">
          <span className="font-extrabold">{selected.length}명</span> 합류 중
          {selected.length >= 3 ? <span className="ml-1 text-rose-500">· 꽉 참 🔥</span> : <span className="text-gray-400"> (딱 3명)</span>}
        </div>

        <form className="mt-5 space-y-5" onSubmit={onSubmit}>
          {(Object.keys(grouped) as Array<keyof typeof grouped>).map((groupKey) => {
            const groupStyle = GROUP_STYLES[groupKey];
            return (
              <section key={groupKey}>
                <h2
                  className={[
                    "mb-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
                    groupStyle.badge,
                  ].join(" ")}
                >
                  {GROUP_LABEL[groupKey]}
                </h2>

                <div className="grid grid-cols-4 gap-2">
                  {grouped[groupKey].map((item) => {
                    const isSelected = selected.includes(item.code);
                    const disabled = selected.length >= MAX_SELECTION;
                    const order = selected.findIndex((v) => v === item.code) + 1;
                    return (
                      <MbtiTypeCard
                        key={item.code}
                        item={item}
                        selected={isSelected}
                        disabled={disabled}
                        order={order > 0 ? order : undefined}
                        onClick={toggleType}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}

          <div>
            <label htmlFor="question" className="mb-2 block text-sm font-bold">
              질문
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="아무거나 — ex) 나 우울해서 머리했어 ✂️"
              className="min-h-28 w-full rounded-2xl border border-gray-200 bg-white p-3 text-sm shadow-sm outline-none ring-fuchsia-300 placeholder:text-gray-400 focus:ring"
              maxLength={240}
            />
            <p className="mt-1 text-right text-xs text-gray-400">{question.length}/240</p>
          </div>

          {error ? <p className="text-sm font-semibold text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={!canSubmit}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-gray-900 text-base font-extrabold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? "단톡 여는 중..." : "단톡 시작"}
          </button>
        </form>
      </div>

      <MbtiToast message={toastMessage} />
    </main>
  );
}
