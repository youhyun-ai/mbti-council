import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

import { MBTI_TYPES, type MbtiGroup } from "@/app/lib/mbti";
import { getCouncil } from "@/lib/council-db";

export const runtime = "edge";

const GROUP_LABEL_KO: Record<MbtiGroup, string> = {
  analyst: "분석가",
  diplomat: "외교관",
  sentinel: "관리자",
  explorer: "탐험가",
};

const GROUP_COLORS: Record<
  MbtiGroup,
  { badgeBg: string; text: string; border: string }
> = {
  analyst: { badgeBg: "rgba(76,29,149,0.3)", text: "#c4b5fd", border: "#7c3aed" },
  diplomat: { badgeBg: "rgba(6,78,59,0.3)", text: "#6ee7b7", border: "#059669" },
  sentinel: { badgeBg: "rgba(12,74,110,0.3)", text: "#7dd3fc", border: "#0284c7" },
  explorer: { badgeBg: "rgba(120,53,15,0.3)", text: "#fcd34d", border: "#d97706" },
};

const MBTI_MAP = new Map(MBTI_TYPES.map((t) => [t.code, t]));

const FALLBACK_QUOTE = "이 토론에서는 모두가 열정적이었습니다 🔥";

async function loadNotoSansKR(weight: 700 | 800): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}`;
  const css = await fetch(cssUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch font css");
    return res.text();
  });

  const match = css.match(/src: url\(([^)]+)\) format\('(woff2|woff)'\)/);
  if (!match?.[1]) {
    throw new Error("Failed to parse font URL");
  }

  const fontUrl = match[1];
  const fontRes = await fetch(fontUrl);
  if (!fontRes.ok) throw new Error("Failed to fetch font file");
  return fontRes.arrayBuffer();
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1)}…`;
}

function determineWinner(
  messages: Array<{ type: string; content: string }>,
  types: string[]
): string {
  const counts = new Map<string, { msgs: number; chars: number }>();
  for (const t of types) counts.set(t, { msgs: 0, chars: 0 });

  for (const m of messages) {
    if (!counts.has(m.type)) continue;
    const c = counts.get(m.type)!;
    c.msgs += 1;
    c.chars += m.content.length;
  }

  return [...counts.entries()].sort(
    (a, b) => b[1].msgs - a[1].msgs || b[1].chars - a[1].chars
  )[0][0];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const format = request.nextUrl.searchParams.get("format") === "square" ? "square" : "story";

  const council = await getCouncil(id);
  if (!council || council.status !== "done") {
    return new Response("Not found", { status: 404 });
  }

  const isSquare = format === "square";
  const width = 1080;
  const height = isSquare ? 1080 : 1920;

  const winner = determineWinner(council.messages, council.types);
  const winnerMeta = MBTI_MAP.get(winner) ?? MBTI_TYPES[0];
  const winnerLine = council.verdict?.find((v) => v.type === winner)?.line;
  const winnerQuote = winnerLine ? truncateText(winnerLine, 60) : FALLBACK_QUOTE;

  const question = truncateText(council.question, 40);

  const [bold, extraBold] = await Promise.allSettled([
    loadNotoSansKR(700),
    loadNotoSansKR(800),
  ]);

  const fonts = [
    {
      name: "NotoSansKR",
      data: bold.status === "fulfilled" ? bold.value : undefined,
      weight: 700 as const,
      style: "normal" as const,
    },
    {
      name: "NotoSansKR",
      data: extraBold.status === "fulfilled" ? extraBold.value : undefined,
      weight: 800 as const,
      style: "normal" as const,
    },
  ].filter((f): f is { name: string; data: ArrayBuffer; weight: 700 | 800; style: "normal" } => Boolean(f.data));

  const image = new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          display: "flex",
          flexDirection: "column",
          padding: isSquare ? "60px 64px" : "80px 72px",
          fontFamily: fonts.length ? "NotoSansKR" : "sans-serif",
          background: isSquare
            ? "linear-gradient(135deg, #1a0835 0%, #0f1e40 100%)"
            : "linear-gradient(160deg, #1a0835 0%, #0f1e40 55%, #0a2d1a 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: isSquare ? 44 : 60,
            color: "rgba(255,255,255,0.35)",
            fontSize: isSquare ? 20 : 22,
            fontWeight: 700,
          }}
        >
          <span>MBTI 단톡</span>
          <span>vitric.ai</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 28,
            padding: isSquare ? "32px 40px" : "40px 48px",
            marginBottom: isSquare ? 36 : 48,
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: isSquare ? 22 : 24,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            💬 오늘의 질문
          </span>
          <span
            style={{
              color: "#fff",
              fontSize: isSquare ? 46 : 52,
              lineHeight: 1.3,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            {`"${question}"`}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: isSquare ? 14 : 24,
            marginBottom: isSquare ? 32 : 48,
          }}
        >
          {council.types.map((code) => {
            const meta = MBTI_MAP.get(code) ?? MBTI_TYPES[0];
            const colors = GROUP_COLORS[meta.group];
            return (
              <div
                key={code}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 20,
                  border: `2px solid ${colors.border}`,
                  background: colors.badgeBg,
                  padding: isSquare ? "14px 8px" : "22px 12px",
                }}
              >
                <span style={{ fontSize: isSquare ? 28 : 40 }}>{meta.emoji}</span>
                <span
                  style={{
                    color: colors.text,
                    fontWeight: 800,
                    fontSize: isSquare ? 32 : 36,
                    marginTop: 8,
                  }}
                >
                  {code}
                </span>
                {!isSquare && (
                  <span style={{ color: colors.text, opacity: 0.9, fontSize: 20 }}>
                    {GROUP_LABEL_KO[meta.group]}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {!isSquare && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 48,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 20 }}>
              토론이 끝났습니다
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)" }} />
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "#FEE500",
            borderRadius: 28,
            padding: isSquare ? "36px 44px" : "40px 48px",
            marginBottom: isSquare ? 24 : 36,
          }}
        >
          <span style={{ color: "#1a0835", fontSize: isSquare ? 26 : 28, fontWeight: 700 }}>
            🏆 판결
          </span>
          <span
            style={{
              color: "#1a0835",
              fontSize: isSquare ? 38 : 44,
              fontWeight: 800,
              lineHeight: 1.28,
              marginTop: 12,
              letterSpacing: "-0.02em",
            }}
          >
            {`${winnerMeta.emoji} ${winner}가 이 토론을 주도했습니다`}
          </span>

          <div
            style={{
              marginTop: 20,
              borderTop: "1px solid rgba(26,8,53,0.2)",
              paddingTop: 20,
              color: "#1a0835",
              fontSize: isSquare ? 28 : 30,
              fontWeight: 700,
              lineHeight: 1.4,
            }}
          >
            {`"${winnerQuote}"`}
          </div>
        </div>

        {!isSquare && council.verdict?.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 22, fontWeight: 700 }}>
              각자의 마지막 한마디
            </span>
            {council.verdict.slice(0, 3).map((v) => {
              const meta = MBTI_MAP.get(v.type) ?? MBTI_TYPES[0];
              const colors = GROUP_COLORS[meta.group];
              return (
                <div key={v.type} style={{ display: "flex", color: "rgba(255,255,255,0.92)", fontSize: 24 }}>
                  <span style={{ color: colors.text, marginRight: 8 }}>{`${meta.emoji} ${v.type}:`}</span>
                  <span>{truncateText(v.line, 36)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.55)",
              fontWeight: 700,
              fontSize: isSquare ? 26 : 28,
            }}
          >
            나도 MBTI 토론 보러 가기 →
          </span>
          <span
            style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: isSquare ? 20 : 22,
              fontWeight: 700,
            }}
          >
            {`vitric.ai/c/${id}`}
          </span>
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts,
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    }
  );

  return image;
}
