"use client";

import { useEffect, useState } from "react";

export const MBTI_JOIN_LINES: Record<string, { join: string; leave: string }> = {
  INTJ: { join: "전략 수립 중... INTJ 합류 👁️", leave: "INTJ가 자리를 떴습니다." },
  INTP: { join: "INTP 접속. 분석 시작.", leave: "INTP가 로그아웃했습니다." },
  ENTJ: { join: "회의 시작합시다. ENTJ 합류 🔥", leave: "ENTJ가 자리를 떴습니다." },
  ENTP: { join: "ENTP 등장! 논쟁 준비 됐나요?", leave: "ENTP가 떠났습니다." },
  INFJ: { join: "INFJ... 조용히 들어왔어요 🌙", leave: "INFJ가 조용히 떠났습니다." },
  INFP: { join: "INFP 왔어요... 🌿", leave: "INFP가 자리를 떴습니다." },
  ENFJ: { join: "ENFJ 합류! 다 함께 해봐요 💪", leave: "ENFJ가 떠났습니다." },
  ENFP: { join: "ENFP 왔어요!!! 진짜 재밌겠다 ✨", leave: "ENFP가 훌쩍 떠났어요." },
  ISTJ: { join: "ISTJ. 규칙대로 합시다.", leave: "ISTJ가 자리를 떴습니다." },
  ISFJ: { join: "ISFJ 왔어요~ 잘 부탁드려요 🙏", leave: "ISFJ가 자리를 떴습니다." },
  ESTJ: { join: "ESTJ 합류. 효율적으로 갑시다.", leave: "ESTJ가 떠났습니다." },
  ESFJ: { join: "ESFJ 왔어요! 다들 잘 지내시죠? 😊", leave: "ESFJ가 먼저 가볼게요." },
  ISTP: { join: "ISTP. 왔다.", leave: "ISTP 감." },
  ISFP: { join: "ISFP... 왔어요 🎨", leave: "ISFP가 슬며시 떠났습니다." },
  ESTP: { join: "ESTP 합류! 바로 시작해요 🎯", leave: "ESTP 나갑니다." },
  ESFP: { join: "ESFP 왔다!!! 신난다 🎉", leave: "ESFP가 떠났어요~" },
};

type MbtiToastProps = {
  message: string | null;
};

export function MbtiToast({ message }: MbtiToastProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setIsVisible(false);
      return;
    }

    setIsMounted(true);
    const raf = requestAnimationFrame(() => setIsVisible(true));

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);

    const unmountTimer = setTimeout(() => {
      setIsMounted(false);
    }, 1800);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hideTimer);
      clearTimeout(unmountTimer);
    };
  }, [message]);

  if (!isMounted || !message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4" style={{ bottom: "calc(80px + env(safe-area-inset-bottom))" }}>
      <div
        className={[
          "max-w-sm rounded-2xl bg-gray-900/95 px-4 py-2.5 text-sm font-semibold text-white shadow-xl",
          "transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0",
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </div>
  );
}
