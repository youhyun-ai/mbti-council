import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

import { generateDailyHoroscope } from "@/lib/horoscope";
import { isValidMbtiType } from "@/lib/mbti";

export const runtime = "edge";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ type: string; date: string }> }) {
  const { type, date } = await params;
  const mbti = type.toUpperCase();

  if (!isValidMbtiType(mbti) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response("Not found", { status: 404 });
  }

  const data = await generateDailyHoroscope(mbti, date);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #fff7ed 0%, #fdf2f8 45%, #eef2ff 100%)",
          padding: 64,
          color: "#111827",
          fontFamily: "Noto Sans KR, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#c026d3" }}>vitric.ai · 오늘의 MBTI 운세</div>
          <div style={{ marginTop: 12, fontSize: 68, fontWeight: 800 }}>{data.type}</div>
          <div style={{ marginTop: 6, fontSize: 28, color: "#6b7280" }}>{data.date}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.25 }}>{data.title}</div>
          <div style={{ fontSize: 30, lineHeight: 1.35, color: "#374151" }}>{data.overall}</div>
          <div style={{ marginTop: 10, display: "flex", gap: 14, fontSize: 24, color: "#4b5563" }}>
            <span>💘 연애</span>
            <span>💼 커리어</span>
            <span>🍀 행운</span>
            <span>🫂 인간관계</span>
          </div>
        </div>

        <div style={{ fontSize: 24, color: "#6b7280" }}>MBTI 성격 기반 데일리 운세 · vitric.ai/horoscope</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
