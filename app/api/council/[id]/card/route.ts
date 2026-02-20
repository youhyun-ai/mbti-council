import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

import { renderCard } from "./card-template";

export const runtime = "edge";

type CouncilData = {
  id: string;
  question: string;
  language: string;
  types: string[];
  messages: Array<{ id: number; type: string; content: string; replyTo: number | null }>;
  verdict: Array<{ type: string; line: string }> | null;
  status: "done" | "in-progress" | "error";
};

const FONT_URLS = {
  700: "https://fonts.gstatic.com/s/notosanskr/v39/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzg01eLQ.ttf",
  800: "https://fonts.gstatic.com/s/notosanskr/v39/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzmo1eLQ.ttf",
} as const;

type Msg = { type: string; content: string };

function determineWinner(messages: Msg[], types: string[]): string {
  const counts = new Map<string, { msgs: number; chars: number }>();
  for (const t of types) counts.set(t, { msgs: 0, chars: 0 });

  for (const m of messages) {
    if (!counts.has(m.type)) continue;
    const c = counts.get(m.type)!;
    c.msgs += 1;
    c.chars += m.content.length;
  }

  return [...counts.entries()].sort((a, b) => b[1].msgs - a[1].msgs || b[1].chars - a[1].chars)[0]?.[0] ?? types[0];
}

async function loadFont(weight: 700 | 800) {
  const res = await fetch(FONT_URLS[weight]);
  if (!res.ok) throw new Error(`Failed to load font: ${weight}`);
  return res.arrayBuffer();
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const format = request.nextUrl.searchParams.get("format") ?? "story";
    const isSquare = format === "square";

    // Fetch council data from the API endpoint (avoids direct DB import in edge runtime)
    const origin = request.nextUrl.origin;
    console.log(`[card] Fetching from: ${origin}/api/council/${id}`);
    
    const councilRes = await fetch(`${origin}/api/council/${id}`, {
      headers: { "Cache-Control": "no-cache" },
    });

    console.log(`[card] Response status: ${councilRes.status}`);

    if (!councilRes.ok) {
      console.error(`[card] Council fetch failed: ${councilRes.status} ${councilRes.statusText}`);
      return new Response("Not found", { status: 404 });
    }

    const council = (await councilRes.json()) as CouncilData;
    console.log(`[card] Council data:`, { status: council.status, types: council.types });
    
    if (council.status !== "done") {
      console.log(`[card] Council not done yet: ${council.status}`);
      return new Response("Not found", { status: 404 });
    }

    const winner = determineWinner(council.messages, council.types);
    const verdictLines = council.verdict ?? [];
    const winnerQuote = verdictLines.find((v) => v.type === winner)?.line ?? null;
    
    console.log(`[card] Winner: ${winner}, verdict lines: ${verdictLines.length}`);

    let fonts: ArrayBuffer[] = [];
    try {
      fonts = await Promise.all([loadFont(700), loadFont(800)]);
      console.log(`[card] Fonts loaded successfully`);
    } catch (e) {
      console.error("[card] Font load failed:", e);
      fonts = [];
    }

    console.log(`[card] Generating ImageResponse...`);
    return new ImageResponse(
    renderCard({
      councilId: id,
      question: council.question,
      types: council.types,
      winner,
      winnerQuote,
      verdictLines,
      isSquare,
    }),
    {
      width: 1080,
      height: isSquare ? 1080 : 1920,
      fonts:
        fonts.length === 2
          ? [
              { name: "Noto Sans KR", data: fonts[0], weight: 700 as const, style: "normal" as const },
              { name: "Noto Sans KR", data: fonts[1], weight: 800 as const, style: "normal" as const },
            ]
          : undefined,
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    }
    );
  } catch (error) {
    console.error("[card] Unhandled error:", error);
    return new Response(`Error generating card: ${error}`, { status: 500 });
  }
}
