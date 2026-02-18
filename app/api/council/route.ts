import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { saveCouncil } from "@/lib/council-db";
import { normalizeType, isValidMbtiType, type MbtiType } from "@/lib/mbti";
import { checkAndConsumeDailyCouncilLimit } from "@/lib/rate-limit";

type CouncilCreateBody = {
  types?: string[];
  question?: string;
  language?: string;
};

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  let body: CouncilCreateBody;

  try {
    body = (await request.json()) as CouncilCreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawTypes = Array.isArray(body.types) ? body.types : [];
  const normalizedTypes = rawTypes.map((t) => normalizeType(t));
  const uniqueTypes = Array.from(new Set(normalizedTypes));
  const question = body.question?.trim() ?? "";
  const language = (body.language?.trim() || "ko").toLowerCase();

  if (uniqueTypes.length !== 3) {
    return NextResponse.json({ error: "Exactly 3 unique MBTI types are required" }, { status: 400 });
  }

  const invalidType = uniqueTypes.find((type) => !isValidMbtiType(type));
  if (invalidType) {
    return NextResponse.json({ error: `Invalid MBTI type: ${invalidType}` }, { status: 400 });
  }

  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const rate = checkAndConsumeDailyCouncilLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "오늘 토론 횟수를 다 사용했어요! 내일 다시 오세요 🙏" },
      { status: 429 }
    );
  }

  const id = randomUUID();

  // Save stub immediately so counter reflects every started council
  void saveCouncil({
    id,
    question,
    language,
    types: uniqueTypes as MbtiType[],
    messages: [],
    verdict: null,
    status: "in-progress",
  });

  return NextResponse.json({
    id,
    status: "streaming" as const,
    question,
    language,
    types: uniqueTypes as MbtiType[],
  });
}
