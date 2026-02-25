"use client";

import { useState } from "react";

export function ShareButton({ type, date }: { type: string; date: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `https://vitric.ai/horoscope/${type}/${date}`;
    const text = `${type} 오늘의 운세`;

    if (navigator.share) {
      try {
        await navigator.share({ title: text, url });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // Clipboard failed
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="rounded-full border border-fuchsia-300 bg-fuchsia-50 px-4 py-2 text-xs font-bold text-fuchsia-800 transition hover:bg-fuchsia-100"
    >
      {copied ? "링크 복사됨 ✓" : "공유하기"}
    </button>
  );
}
