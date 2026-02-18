import { NextRequest } from "next/server";

import { isValidMbtiType, normalizeType, type MbtiType } from "@/lib/mbti";
import { runOvertimeStreamOrchestration } from "@/lib/orchestrator";

export const runtime = "nodejs";

type OvertimeBody = {
  question: string;
  language: string;
  types: string[];
  history: Array<{ type: string; content: string }>;
  userMessage: string | null;
  idOffset: number;
};

type StreamEvent =
  | { type: "message"; payload: unknown }
  | { type: "done" }
  | { type: "error"; payload: { message: string } };

function writeSse(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  event: StreamEvent
) {
  return writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // id not used but required by Next.js

  let body: OvertimeBody;
  try {
    body = (await request.json()) as OvertimeBody;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { question, language, history, userMessage, idOffset } = body;

  const types = Array.from(
    new Set(
      (body.types ?? [])
        .map((v) => normalizeType(v))
        .filter((v): v is MbtiType => isValidMbtiType(v))
    )
  );

  if (!question || types.length !== 3) {
    return new Response("Missing required fields: question, types(3)", {
      status: 400,
    });
  }

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  void (async () => {
    try {
      await runOvertimeStreamOrchestration({
        question,
        language: language || "ko",
        types,
        history: history ?? [],
        userMessage: userMessage ?? null,
        idOffset: idOffset ?? 0,
        onMessage: async (message) => {
          await writeSse(writer, encoder, { type: "message", payload: message });
        },
      });

      await writeSse(writer, encoder, { type: "done" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown overtime error";
      await writeSse(writer, encoder, { type: "error", payload: { message } });
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
