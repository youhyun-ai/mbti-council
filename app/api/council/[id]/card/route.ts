import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  return NextResponse.json({
    id,
    status: "streaming",
    card: {
      title: "MBTI Council",
      question: "실시간 토론 진행 중",
      participants: [],
      lines: [],
      brand: "vitric.ai",
    },
  });
}
