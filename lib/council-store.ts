import type { MbtiType } from "@/lib/mbti";

export type CouncilMessage = {
  id: number;
  type: MbtiType;
  content: string;
  replyTo: number | null;
  createdAt: string;
};

export type VerdictLine = {
  type: MbtiType;
  line: string;
};

export type CouncilStatus = "in-progress" | "done" | "error";

export type CouncilSession = {
  id: string;
  status: CouncilStatus;
  question: string;
  language: string;
  types: MbtiType[];
  messages: CouncilMessage[];
  verdict: VerdictLine[] | null;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

const councils = new Map<string, CouncilSession>();

export function createCouncilSession(input: {
  id: string;
  question: string;
  language: string;
  types: MbtiType[];
}): CouncilSession {
  const now = new Date().toISOString();
  const session: CouncilSession = {
    id: input.id,
    status: "in-progress",
    question: input.question,
    language: input.language,
    types: input.types,
    messages: [],
    verdict: null,
    createdAt: now,
    updatedAt: now,
  };

  councils.set(input.id, session);
  return session;
}

export function getCouncilSession(id: string): CouncilSession | undefined {
  return councils.get(id);
}

export function appendCouncilMessage(
  id: string,
  message: Omit<CouncilMessage, "id" | "createdAt">
): CouncilMessage | null {
  const session = councils.get(id);
  if (!session) return null;

  const entry: CouncilMessage = {
    ...message,
    id: session.messages.length + 1,
    createdAt: new Date().toISOString(),
  };

  session.messages.push(entry);
  session.updatedAt = new Date().toISOString();
  councils.set(id, session);
  return entry;
}

export function completeCouncilSession(id: string, verdict: VerdictLine[]): void {
  const session = councils.get(id);
  if (!session) return;

  session.verdict = verdict;
  session.status = "done";
  session.updatedAt = new Date().toISOString();
  councils.set(id, session);
}

export function failCouncilSession(id: string, error: string): void {
  const session = councils.get(id);
  if (!session) return;

  session.status = "error";
  session.error = error;
  session.updatedAt = new Date().toISOString();
  councils.set(id, session);
}
