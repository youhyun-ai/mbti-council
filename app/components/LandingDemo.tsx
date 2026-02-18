"use client";

import { useEffect, useMemo, useState } from "react";

const DEMO_MESSAGES = [
  { type: "ENTJ", emoji: "🔥", message: "효율 따지면 제주도가 맞아. 비자 없고, 이동 짧고." },
  { type: "INFP", emoji: "🌿", message: "근데... 해외가 더 설레지 않아? 새로운 문화도 보고." },
  { type: "ESTP", emoji: "🎯", message: "어디든 상관없는데 빨리 결정해. 성수기 되면 가격 폭등함." },
  { type: "ENTJ", emoji: "🔥", message: "성수기 피해서 제주도. 숙소 퀄리티도 올라갔고." },
  { type: "INFP", emoji: "🌿", message: "그래도 해외는 사진도 예쁘고 추억도 다르잖아..." },
  { type: "ESTP", emoji: "🎯", message: "알았어, 제주도. 내가 숙소 알아볼게. 언제 갈 거야?" },
] as const;

const TYPE_COLORS: Record<string, string> = {
  ENTJ: "#ef4444",
  INFP: "#8b5cf6",
  ESTP: "#f97316",
};

export function LandingDemo() {
  const [visibleCount, setVisibleCount] = useState(0);

  const isFinished = visibleCount >= DEMO_MESSAGES.length;

  useEffect(() => {
    const timeoutMs = isFinished ? 2500 : 1000 + (visibleCount % 2) * 500;

    const timer = setTimeout(() => {
      if (isFinished) {
        setVisibleCount(0);
        return;
      }
      setVisibleCount((prev) => prev + 1);
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [isFinished, visibleCount]);

  const visibleMessages = useMemo(() => DEMO_MESSAGES.slice(0, visibleCount), [visibleCount]);

  return (
    <section className="mt-10 px-5 text-center">
      <h2 className="text-lg font-extrabold text-gray-900">이런 단톡이 만들어져요 👇</h2>
      <div className="mx-auto mt-4 w-full max-w-xs rounded-xl bg-[#b2c7d8] p-3 text-left shadow-sm">
        <p className="text-xs font-semibold text-gray-700">MBTI 단톡방 🔴 Live</p>

        <div className="mt-3 space-y-2.5">
          {visibleMessages.map((item, idx) => {
            const avatarText = item.type[0];
            return (
              <div key={`${item.type}-${idx}`} className="animate-message-in flex items-start gap-2 opacity-100 transition-opacity duration-300">
                <span
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                  style={{ backgroundColor: TYPE_COLORS[item.type] }}
                >
                  {avatarText}
                </span>

                <div>
                  <span className="inline-flex rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                    {item.type} {item.emoji}
                  </span>
                  <p className="mt-1 rounded-2xl bg-white px-3 py-2 text-sm text-gray-800 shadow-sm">{item.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
