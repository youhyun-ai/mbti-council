import { NextRequest, NextResponse } from "next/server";

import { getQuestionById } from "@/lib/balance-questions";
import { saveVoteAndLoad } from "@/lib/balance-store";
import { isValidMbtiType, normalizeType } from "@/lib/mbti";

type VoteBody = {
  questionId?: string;
  choice?: "A" | "B";
  mbtiType?: string;
};

type VoteRow = {
  question_id: string;
  choice: "A" | "B";
  mbti_type: string;
};

function buildCommentary(questionPrompt: string, aCount: number, bCount: number, aTop: string[], bTop: string[]) {
  const winner = aCount === bCount ? "팽팽" : aCount > bCount ? "A" : "B";
  const lead = Math.abs(aCount - bCount);
  const topA = aTop.length ? aTop.join(", ") : "아직 데이터 적음";
  const topB = bTop.length ? bTop.join(", ") : "아직 데이터 적음";

  return `🧠 Council 코멘트 — "${questionPrompt}"는 ${winner === "팽팽" ? "완전 반반" : `${winner} 쪽 우세(${lead}표 차)`} 분위기. A는 ${topA} 타입이 많이 고르고, B는 ${topB} 타입이 많이 고르는 중!`;
}

function summarize(rows: VoteRow[]) {
  const total = rows.length;
  const aRows = rows.filter((r) => r.choice === "A");
  const bRows = rows.filter((r) => r.choice === "B");

  const byType: Record<string, { A: number; B: number; total: number; lean: "A" | "B" | "tie" }> = {};
  for (const row of rows) {
    const type = row.mbti_type.toUpperCase();
    if (!byType[type]) byType[type] = { A: 0, B: 0, total: 0, lean: "tie" };
    byType[type]!.total += 1;
    byType[type]![row.choice] += 1;
  }

  for (const type of Object.keys(byType)) {
    const item = byType[type]!;
    item.lean = item.A === item.B ? "tie" : item.A > item.B ? "A" : "B";
  }

  const topA = Object.entries(byType)
    .filter(([, v]) => v.lean === "A")
    .sort((a, b) => b[1].A - a[1].A)
    .slice(0, 3)
    .map(([t]) => t);

  const topB = Object.entries(byType)
    .filter(([, v]) => v.lean === "B")
    .sort((a, b) => b[1].B - a[1].B)
    .slice(0, 3)
    .map(([t]) => t);

  return {
    total,
    A: { count: aRows.length, percent: total ? Math.round((aRows.length / total) * 100) : 0, topTypes: topA },
    B: { count: bRows.length, percent: total ? Math.round((bRows.length / total) * 100) : 0, topTypes: topB },
    byType,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VoteBody;
    const questionId = (body.questionId || "").trim();
    const choice = body.choice;
    const mbtiType = normalizeType(body.mbtiType || "");

    const question = getQuestionById(questionId);
    if (!question) return NextResponse.json({ error: "Invalid questionId" }, { status: 400 });
    if (choice !== "A" && choice !== "B") return NextResponse.json({ error: "Invalid choice" }, { status: 400 });
    if (!isValidMbtiType(mbtiType)) return NextResponse.json({ error: "Invalid MBTI type" }, { status: 400 });

    const { rows, source } = await saveVoteAndLoad(questionId, choice, mbtiType);

    const stats = summarize(rows as VoteRow[]);
    const commentary = buildCommentary(question.prompt, stats.A.count, stats.B.count, stats.A.topTypes, stats.B.topTypes);

    return NextResponse.json({ questionId, stats, commentary, source });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
