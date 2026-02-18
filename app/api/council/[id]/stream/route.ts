import { NextRequest } from "next/server";

import { saveCouncil } from "@/lib/council-db";
import { isValidMbtiType, normalizeType, type MbtiType } from "@/lib/mbti";
import { MODEL_DISPLAY, MODEL_ID, runCouncilStreamOrchestration } from "@/lib/orchestrator";

export const runtime = "nodejs";

type StreamEvent =
  | { type: "message"; payload: unknown }
  | { type: "verdict"; payload: unknown }
  | { type: "model"; payload: { id: string; display: string } }
  | { type: "done" }
  | { type: "error"; payload: { message: string } };

function writeSse(writer: WritableStreamDefaultWriter<Uint8Array>, encoder: TextEncoder, event: StreamEvent) {
  return writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
}

function parseTypes(raw: string | null): MbtiType[] {
  if (!raw) return [];

  const unique = Array.from(
    new Set(
      raw
        .split(",")
        .map((v) => normalizeType(v))
        .filter((v): v is MbtiType => isValidMbtiType(v))
    )
  );

  return unique;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const question = request.nextUrl.searchParams.get("question")?.trim() || "";
  const language = (request.nextUrl.searchParams.get("language")?.trim() || "ko").toLowerCase();
  const types = parseTypes(request.nextUrl.searchParams.get("types"));

  if (!question || types.length < 1 || types.length > 3) {
    return new Response("Missing required query params: question, types(1-3)", { status: 400 });
  }

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  void (async () => {
    try {
      await writeSse(writer, encoder, { type: "model", payload: { id: MODEL_ID, display: MODEL_DISPLAY } });
      const collectedMessages: Array<{ id: number; type: string; content: string; replyTo: number | null }> = [];

      const verdict = await runCouncilStreamOrchestration({
        question,
        language,
        types,
        onMessage: async (message) => {
          collectedMessages.push(message);
          await writeSse(writer, encoder, { type: "message", payload: message });
        },
      });

      await writeSse(writer, encoder, { type: "verdict", payload: verdict });

      // Persist to Supabase before signaling done — must await or Vercel kills the fn first
      await saveCouncil({
        id,
        question,
        language,
        types,
        messages: collectedMessages,
        verdict,
        status: "done",
      });

      await writeSse(writer, encoder, { type: "done" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown orchestration error";
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
