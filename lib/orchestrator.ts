import Anthropic from "@anthropic-ai/sdk";

import { loadAgentPersona, type AgentPersona } from "@/lib/agents";
import type { MbtiType } from "@/lib/mbti";

export type CouncilMessage = {
  id: number;
  type: string; // MbtiType or "USER"
  content: string;
  replyTo: number | null;
};

export type VerdictLine = {
  type: MbtiType;
  line: string;
};

export const MODEL_ID = "claude-sonnet-4-5";
export const MODEL_DISPLAY = "Claude Sonnet";
const MODEL = MODEL_ID;
const MIN_TURNS = 4;
const MAX_TURNS = 5;

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is missing");
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  return anthropicClient;
}

function buildSystemPrompt(persona: AgentPersona, language: string): string {
  // Strip example_lines from persona before serializing — they're too literal
  // and cause the model to repeat them verbatim across unrelated sessions.
  const { example_lines, ...personaCore } = persona as AgentPersona & { example_lines?: string[] };

  return [
    `You are the MOST EXTREME version of MBTI type ${persona.type}. Every trait is dialed to 100%.`,
    "Be a caricature — over-the-top, unmistakable. Never moderate your personality.",
    `If you're E: boundless energy, can't stop talking, hates silence.`,
    `If you're I: minimal words, one-liners, uncomfortable with oversharing.`,
    `If you're N: abstract, pattern-obsessed, always reads deeper meaning.`,
    `If you're S: hyper-literal, grounded, eye-rolls at theory.`,
    `If you're T: ruthless logic, zero sympathy, facts over feelings always.`,
    `If you're F: overwhelmingly emotional, takes everything personally.`,
    `If you're J: decisive, impatient, needs a plan and a conclusion NOW.`,
    `If you're P: open-ended, hates being pinned down, detours constantly.`,
    `User language preference: ${language}. Default to Korean when language is ko.`,
    "You are in a KakaoTalk group chat. Keep each message SHORT — 1 to 2 sentences max, like texting. No long paragraphs.",
    "IMPORTANT: Generate fresh, topic-specific responses every time. Never repeat memorized phrases.",
    "Return ONLY raw JSON — no code fences, no markdown, no extra text before or after.",
    'Exact shape: {"message":"...","next_speaker":"TYPE","done":false}',
    "Rules:",
    "- next_speaker must be one of the 3 council types.",
    "- done=true only if discussion has naturally concluded.",
    "- No code fences. No backticks. Raw JSON only.",
    `Persona calibration: ${JSON.stringify(personaCore)}`,
  ].join("\n");
}

function getTextFromResponse(response: Anthropic.Messages.Message): string {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

/** Extract the message field from JSON text — handles truncated (cut-off) JSON */
function extractMessageFromJson(raw: string): string | null {
  // Try complete quoted string first
  const full = raw.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (full?.[1]) return unescapeJson(full[1]);

  // Partial match — JSON truncated before closing quote
  const partial = raw.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)/);
  if (partial?.[1]) return unescapeJson(partial[1]);

  return null;
}

function unescapeJson(s: string): string {
  return s
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\")
    .trim();
}

function parseAgentTurn(raw: string, allowed: MbtiType[]): {
  message: string;
  nextSpeaker: MbtiType;
  done: boolean;
} {
  const fallback = {
    message: "(no response)",
    nextSpeaker: allowed[0],
    done: false,
  };

  try {
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");

    if (firstBrace < 0 || lastBrace < firstBrace) {
      // No complete JSON — could be truncated. Try regex extraction.
      const extracted = extractMessageFromJson(raw);
      if (extracted) return { ...fallback, message: extracted };

      // Truly no JSON — treat as plain text (strip code fences just in case)
      const stripped = raw.replace(/```[a-z]*\n?/g, "").trim();
      return { ...fallback, message: stripped || "(no response)" };
    }

    const parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1)) as {
      message?: string | null;
      next_speaker?: string;
      done?: boolean;
      nextSpeaker?: string;
    };

    const nextRaw = (parsed.next_speaker ?? parsed.nextSpeaker ?? "").toUpperCase();
    const nextSpeaker = allowed.find((t) => t === nextRaw) ?? fallback.nextSpeaker;

    // Never fall back to raw JSON — if message is missing/null, use safe placeholder
    const message =
      typeof parsed.message === "string" && parsed.message.trim()
        ? parsed.message.trim()
        : "(no response)";

    return {
      message,
      nextSpeaker,
      done: Boolean(parsed.done),
    };
  } catch {
    // JSON.parse threw — try regex extraction before giving up
    const extracted = extractMessageFromJson(raw);
    if (extracted) return { ...fallback, message: extracted };

    const stripped = raw.replace(/```[a-z]*\n?/g, "").trim();
    return { ...fallback, message: stripped || "(no response)" };
  }
}

async function runSingleTurn(input: {
  speaker: MbtiType;
  types: MbtiType[];
  personas: Record<MbtiType, AgentPersona>;
  language: string;
  question: string;
  history: Array<{ type: string; content: string }>;
}): Promise<{ message: string; nextSpeaker: MbtiType; done: boolean }> {
  const system = buildSystemPrompt(input.personas[input.speaker], input.language);
  const historyText = input.history
    .map((item, idx) => `${idx + 1}. ${item.type}: ${item.content}`)
    .join("\n");

  const userPrompt = [
    `Topic/상황: ${input.question}`,
    `Participants: ${input.types.join(", ")}`,
    `Current speaker: ${input.speaker}`,
    "Conversation so far:",
    historyText || "(none yet)",
    "Write the next message in-character and pick next_speaker.",
  ].join("\n\n");

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    temperature: 0.9,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  return parseAgentTurn(getTextFromResponse(response), input.types);
}

async function generateVerdictLine(input: {
  type: MbtiType;
  persona: AgentPersona;
  question: string;
  language: string;
  transcript: string;
}): Promise<string> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 80,
    temperature: 0.7,
    system: [
      `You are MBTI agent ${input.type}.`,
      `User language preference: ${input.language}.`,
      "Return exactly one single-line verdict in character.",
      "No markdown. No quotes. Keep it concise.",
      `Persona: ${JSON.stringify(input.persona)}`,
    ].join("\n"),
    messages: [
      {
        role: "user",
        content: `Topic/상황: ${input.question}\n\nConversation transcript:\n${input.transcript}\n\nGive your one-line reaction or verdict, in character.`,
      },
    ],
  });

  const text = getTextFromResponse(response).split("\n")[0]?.trim();
  return text || "판단 보류 — 정보가 더 필요해.";
}

export async function runCouncilStreamOrchestration(input: {
  question: string;
  language: string;
  types: MbtiType[];
  onMessage: (message: CouncilMessage) => void | Promise<void>;
}): Promise<VerdictLine[]> {
  const personas = Object.fromEntries(
    await Promise.all(
      input.types.map(async (type) => [type, await loadAgentPersona(type)] as const)
    )
  ) as Record<MbtiType, AgentPersona>;

  const messages: CouncilMessage[] = [];
  let speaker = input.types[0];
  const turnTarget =
    Math.floor(Math.random() * (MAX_TURNS - MIN_TURNS + 1)) + MIN_TURNS;

  for (let turn = 0; turn < turnTarget; turn += 1) {
    const result = await runSingleTurn({
      speaker,
      types: input.types,
      personas,
      language: input.language,
      question: input.question,
      history: messages.map((m) => ({ type: m.type, content: m.content })),
    });

    const message: CouncilMessage = {
      id: messages.length + 1,
      type: speaker,
      content: result.message,
      replyTo: null,
    };

    messages.push(message);

    // Natural typing delay: base 600ms + ~18ms per character, capped at 3.5s
    const typingDelay = Math.min(600 + message.content.length * 18, 3500);
    await new Promise((resolve) => setTimeout(resolve, typingDelay));

    await input.onMessage(message);

    speaker = result.nextSpeaker;
    if (turn + 1 >= MIN_TURNS && result.done) {
      break;
    }
  }

  const transcript = messages.map((m) => `${m.type}: ${m.content}`).join("\n");

  const verdictLines = await Promise.all(
    input.types.map(async (type) => ({
      type,
      line: await generateVerdictLine({
        type,
        persona: personas[type],
        question: input.question,
        language: input.language,
        transcript,
      }),
    }))
  );

  return verdictLines;
}

/**
 * Overtime round: continue the council with full prior history as context.
 * If userMessage is provided, it's injected into the transcript so agents respond to it.
 */
export async function runOvertimeStreamOrchestration(input: {
  question: string;
  language: string;
  types: MbtiType[];
  history: Array<{ type: string; content: string }>;
  userMessage: string | null;
  idOffset: number;
  onMessage: (message: CouncilMessage) => void | Promise<void>;
}): Promise<void> {
  const personas = Object.fromEntries(
    await Promise.all(
      input.types.map(async (type) => [type, await loadAgentPersona(type)] as const)
    )
  ) as Record<MbtiType, AgentPersona>;

  // Build context history — include USER message at end if provided
  const contextHistory: Array<{ type: string; content: string }> = [
    ...input.history,
    ...(input.userMessage
      ? [{ type: "나 (유저)", content: input.userMessage }]
      : []),
  ];

  const messages: CouncilMessage[] = [];
  // Start from a random participant
  let speaker =
    input.types[Math.floor(Math.random() * input.types.length)] as MbtiType;
  const turnTarget =
    Math.floor(Math.random() * (MAX_TURNS - MIN_TURNS + 1)) + MIN_TURNS;

  for (let turn = 0; turn < turnTarget; turn += 1) {
    const result = await runSingleTurn({
      speaker,
      types: input.types,
      personas,
      language: input.language,
      question: input.question,
      history: [
        ...contextHistory,
        ...messages.map((m) => ({ type: m.type, content: m.content })),
      ],
    });

    const message: CouncilMessage = {
      id: input.idOffset + messages.length + 1,
      type: speaker,
      content: result.message,
      replyTo: null,
    };

    messages.push(message);

    const typingDelay = Math.min(600 + message.content.length * 18, 3500);
    await new Promise((resolve) => setTimeout(resolve, typingDelay));

    await input.onMessage(message);

    speaker = result.nextSpeaker;
    if (turn + 1 >= MIN_TURNS && result.done) {
      break;
    }
  }
}
