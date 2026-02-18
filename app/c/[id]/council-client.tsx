"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GROUP_STYLES, MBTI_TYPES } from "@/app/lib/mbti";

type CouncilMessage = {
  id: number;
  type: string;
  content: string;
  replyTo: number | null;
};

type ChatGroup = {
  speaker: string;
  items: CouncilMessage[];
};

type VerdictLine = {
  type: string;
  line: string;
};

type CouncilData = {
  id: string;
  status: "in-progress" | "done" | "error";
  question: string;
  language: string;
  types: string[];
  messages: CouncilMessage[];
  verdict: VerdictLine[] | null;
};

type StreamEvent =
  | { type: "message"; payload: CouncilMessage }
  | { type: "verdict"; payload: VerdictLine[] }
  | { type: "model"; payload: { id: string; display: string } }
  | { type: "done" }
  | { type: "error"; payload: { message: string } };

const mbtiMap = new Map(MBTI_TYPES.map((item) => [item.code, item]));

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function groupNameColor(group: (typeof MBTI_TYPES)[number]["group"]) {
  if (group === "analyst") return "text-violet-700";
  if (group === "diplomat") return "text-emerald-700";
  if (group === "sentinel") return "text-sky-700";
  return "text-amber-800";
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-xs font-bold text-gray-500 shadow-sm ring-1 ring-white/70">
        …
      </div>
      <div className="max-w-[70%] rounded-2xl rounded-tl-md bg-white px-3 py-2 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}

type SavedCouncil = {
  id: string;
  question: string;
  language: string;
  types: string[];
  messages: CouncilMessage[];
  verdict: VerdictLine[] | null;
};

export function CouncilClient({
  id,
  initialQuestion,
  initialTypes,
  initialLanguage,
  savedCouncil,
}: {
  id: string;
  initialQuestion: string;
  initialTypes: string[];
  initialLanguage: string;
  savedCouncil?: SavedCouncil;
}) {
  const [data, setData] = useState<CouncilData>(() => {
    if (savedCouncil) {
      return {
        id,
        status: "done",
        question: savedCouncil.question,
        language: savedCouncil.language,
        types: savedCouncil.types,
        messages: savedCouncil.messages,
        verdict: savedCouncil.verdict,
      };
    }
    return {
      id,
      status: "in-progress",
      question: initialQuestion,
      language: initialLanguage,
      types: initialTypes,
      messages: [],
      verdict: null,
    };
  });

  const [fetchError, setFetchError] = useState<string | null>(null);
  const [visibleIds, setVisibleIds] = useState<number[]>(
    savedCouncil ? savedCouncil.messages.map((m) => m.id) : []
  );
  const [messageTimes, setMessageTimes] = useState<Record<number, Date>>(() => {
    if (savedCouncil) {
      const now = new Date();
      return Object.fromEntries(savedCouncil.messages.map((m) => [m.id, now]));
    }
    return {};
  });
  const [copied, setCopied] = useState(false); // fallback copy feedback
  const [questionExpanded, setQuestionExpanded] = useState(false);
  const [modelDisplay, setModelDisplay] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [overtimeStatus, setOvertimeStatus] = useState<"idle" | "streaming">("idle");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derived: are we currently streaming anything?
  const isStreaming = data.status === "in-progress" || overtimeStatus === "streaming";

  const groupedMessages = useMemo(() => {
    const groups: ChatGroup[] = [];

    data.messages.forEach((message) => {
      // USER messages always get their own group (right-aligned)
      if (message.type === "USER") {
        groups.push({ speaker: "USER", items: [message] });
        return;
      }
      const lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.speaker !== message.type) {
        groups.push({ speaker: message.type, items: [message] });
        return;
      }
      lastGroup.items.push(message);
    });

    return groups;
  }, [data.messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleIds]);

  // Initial SSE stream
  useEffect(() => {
    if (savedCouncil) return;

    if (!data.question || data.types.length !== 3) {
      setFetchError("토론 정보를 찾을 수 없어요. /pick에서 다시 시작해주세요.");
      return;
    }

    const url = new URL(`/api/council/${id}/stream`, window.location.origin);
    url.searchParams.set("question", data.question);
    url.searchParams.set("types", data.types.join(","));
    url.searchParams.set("language", data.language || "ko");

    const eventSource = new EventSource(url.toString());

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data as string) as StreamEvent;

        if (parsed.type === "model") {
          setModelDisplay(parsed.payload.display);
          return;
        }

        if (parsed.type === "message") {
          setData((prev) => ({
            ...prev,
            messages: [...prev.messages, parsed.payload],
          }));
          setVisibleIds((prev) => [...new Set([...prev, parsed.payload.id])]);
          setMessageTimes((prev) => ({
            ...prev,
            [parsed.payload.id]: new Date(),
          }));
          return;
        }

        if (parsed.type === "verdict") {
          setData((prev) => ({ ...prev, verdict: parsed.payload }));
          return;
        }

        if (parsed.type === "done") {
          setData((prev) => ({ ...prev, status: "done" }));
          eventSource.close();
          return;
        }

        if (parsed.type === "error") {
          setData((prev) => ({ ...prev, status: "error" }));
          setFetchError(
            parsed.payload.message || "토론 중 오류가 발생했어요."
          );
          eventSource.close();
        }
      } catch {
        setData((prev) => ({ ...prev, status: "error" }));
        setFetchError("실시간 데이터 해석에 실패했어요.");
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setData((prev) =>
        prev.status === "done" ? prev : { ...prev, status: "error" }
      );
      setFetchError(
        (prev) => prev ?? "연결이 끊어졌어요. 새로고침 후 다시 시도해주세요."
      );
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, savedCouncil]);

  // Start an overtime round (with optional user message)
  async function handleOvertime(userMessage?: string) {
    if (isStreaming) return;

    setOvertimeStatus("streaming");

    // If user typed a message, add it to the chat immediately as USER bubble
    let idOffset = data.messages.length;
    if (userMessage?.trim()) {
      const userMsg: CouncilMessage = {
        id: idOffset + 1,
        type: "USER",
        content: userMessage.trim(),
        replyTo: null,
      };
      setData((prev) => ({
        ...prev,
        verdict: null,
        messages: [...prev.messages, userMsg],
      }));
      setVisibleIds((prev) => [...new Set([...prev, userMsg.id])]);
      setMessageTimes((prev) => ({ ...prev, [userMsg.id]: new Date() }));
      idOffset += 1;
    } else {
      // Hide verdict while overtime runs (will show again at end)
      setData((prev) => ({ ...prev, verdict: null }));
    }

    setUserInput("");

    try {
      const response = await fetch(`/api/council/${id}/overtime`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: data.question,
          language: data.language,
          types: data.types,
          history: data.messages.map((m) => ({
            type: m.type,
            content: m.content,
          })),
          userMessage: userMessage?.trim() || null,
          idOffset,
        }),
      });

      if (!response.ok || !response.body) {
        setOvertimeStatus("idle");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6)) as StreamEvent;

            if (parsed.type === "message") {
              setData((prev) => ({
                ...prev,
                messages: [...prev.messages, parsed.payload],
              }));
              setVisibleIds((prev) => [
                ...new Set([...prev, parsed.payload.id]),
              ]);
              setMessageTimes((prev) => ({
                ...prev,
                [parsed.payload.id]: new Date(),
              }));
            } else if (parsed.type === "done") {
              setOvertimeStatus("idle");
            } else if (parsed.type === "error") {
              setOvertimeStatus("idle");
            }
          } catch {
            // skip malformed SSE line
          }
        }
      }
    } catch {
      setOvertimeStatus("idle");
    }

    setOvertimeStatus("idle");
  }

  const handleSend = () => {
    const text = userInput.trim();
    if (!text || isStreaming) return;
    void handleOvertime(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const shareText = data
    ? `${data.question}\n\nMBTI 토론회: ${data.types.join(" vs ")}`
    : "MBTI 토론회";

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title: "MBTI 토론회", text: shareText, url });
        return;
      } catch {
        // user cancelled or not supported — fall through
      }
    }
    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // nothing
    }
  };

  if (fetchError && !data.messages.length) {
    return (
      <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
        {fetchError}
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#b2c7d8]">
      {/* ── Header ── */}
      <header className="shrink-0 bg-white/90 px-4 py-3 shadow-sm ring-1 ring-gray-200">
        <p className="text-[11px] font-bold text-fuchsia-700">MBTI 단톡</p>
        <button
          type="button"
          onClick={() => setQuestionExpanded((v) => !v)}
          className="mt-0.5 w-full text-left"
        >
          <h1
            className={[
              "text-base font-black leading-snug",
              questionExpanded ? "" : "line-clamp-1",
            ].join(" ")}
          >
            {data.question || "MBTI 토론"}
          </h1>
          {!questionExpanded && (data.question?.length ?? 0) > 30 && (
            <span className="text-[10px] font-semibold text-gray-400">더보기</span>
          )}
          {questionExpanded && (
            <span className="text-[10px] font-semibold text-gray-400">접기</span>
          )}
        </button>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {/* model badge hidden — breaks immersion */}
          {data.types.map((code) => {
            const found = mbtiMap.get(code);
            if (!found) return null;
            const style = GROUP_STYLES[found.group];
            return (
              <span
                key={code}
                className={[
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                  style.badge,
                ].join(" ")}
              >
                <span>{found.emoji}</span>
                {code}
              </span>
            );
          })}
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {groupedMessages.map((group) => {
            // USER bubble — right-aligned
            if (group.speaker === "USER") {
              return (
                <div
                  key={`user-${group.items[0]?.id ?? "x"}`}
                  className="flex flex-col items-end gap-1"
                >
                  {group.items.map((message) => {
                    const isVisible = visibleIds.includes(message.id);
                    const timestamp = messageTimes[message.id] ?? new Date();
                    return (
                      <div
                        key={message.id}
                        className={[
                          "flex max-w-[70%] flex-col items-end transition-all duration-300",
                          isVisible
                            ? "animate-message-in opacity-100"
                            : "translate-y-2 opacity-0",
                        ].join(" ")}
                      >
                        <div className="rounded-2xl rounded-tr-md bg-[#FEE500] px-3 py-2 shadow-sm">
                          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-900">
                            {message.content}
                          </p>
                        </div>
                        <p className="mt-0.5 text-[10px] text-gray-500">
                          {formatTime(timestamp)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // MBTI agent bubble — left-aligned
            const found = mbtiMap.get(group.speaker);
            if (!found) return null;
            const style = GROUP_STYLES[found.group];

            return (
              <article
                key={`${group.speaker}-${group.items[0]?.id ?? "x"}`}
                className="flex items-start gap-2.5"
              >
                <div className="mt-0.5 h-8 w-8 shrink-0">
                  <div
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm shadow-sm",
                      style.badge,
                    ].join(" ")}
                  >
                    {found.emoji}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={[
                      "mb-1 text-xs font-bold",
                      groupNameColor(found.group),
                    ].join(" ")}
                  >
                    {group.speaker}
                  </p>

                  <div className="space-y-1.5">
                    {group.items.map((message) => {
                      const isVisible = visibleIds.includes(message.id);
                      const timestamp = messageTimes[message.id] ?? new Date();

                      return (
                        <div
                          key={message.id}
                          className={[
                            "flex max-w-[70%] flex-col transition-all duration-300",
                            isVisible
                              ? "animate-message-in opacity-100"
                              : "translate-y-2 opacity-0",
                          ].join(" ")}
                        >
                          <div className="rounded-2xl rounded-tl-md bg-white px-3 py-2 shadow-sm">
                            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-800">
                              {message.content}
                            </p>
                          </div>
                          <p className="mt-0.5 text-[10px] text-gray-500">
                            {formatTime(timestamp)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })}

          {isStreaming && <TypingIndicator />}

          {data.status === "error" && (
            <div className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
              {fetchError ||
                "앗, 토론이 중간에 멈췄어요. 새로고침 후 다시 시도해주세요 🙏"}
            </div>
          )}

          {/* Share buttons */}
          {data.status === "done" && overtimeStatus === "idle" && (
            <div className="flex gap-2 px-1 pb-1">
              <button
                type="button"
                onClick={handleShare}
                className="rounded-full bg-white/80 px-4 py-1.5 text-xs font-bold text-gray-700 shadow-sm hover:bg-white"
              >
                공유
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1600);
                  } catch { /* nothing */ }
                }}
                className="rounded-full bg-white/80 px-4 py-1.5 text-xs font-bold text-gray-700 shadow-sm hover:bg-white"
              >
                {copied ? "복사됨!" : "링크 복사"}
              </button>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      {/* ── KakaoTalk-style Input Bar ── */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-3 py-2 pb-safe">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={
              isStreaming ? "읽는 중... 🫣" : "토론에 끼어들기... 💬"
            }
            className={[
              "flex-1 rounded-full border px-4 py-2 text-sm outline-none transition-colors",
              isStreaming
                ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 placeholder:text-gray-300"
                : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-400",
            ].join(" ")}
          />

          {/* Send button: shows when input has text */}
          {userInput.trim() ? (
            <button
              type="button"
              onClick={handleSend}
              disabled={isStreaming}
              className="rounded-full bg-[#FEE500] px-4 py-2 text-sm font-bold text-gray-900 shadow-sm transition-opacity disabled:opacity-40 hover:brightness-95"
            >
              보내기
            </button>
          ) : (
            /* 계속 엿듣기: shows when input is empty and done */
            <button
              type="button"
              onClick={() => void handleOvertime()}
              disabled={isStreaming}
              className="whitespace-nowrap rounded-full bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600 shadow-sm transition-opacity disabled:opacity-40 hover:bg-gray-200"
            >
              계속 엿듣기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
