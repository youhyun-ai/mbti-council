import { promises as fs } from "node:fs";
import path from "node:path";

import type { MbtiType } from "@/lib/mbti";

export type AgentPersona = {
  type: MbtiType;
  voice?: Record<string, unknown>;
  group_behavior?: string;
  responds_to?: string[];
  conflict_style?: string;
  example_lines?: string[];
};

function defaultPersona(type: MbtiType): AgentPersona {
  return {
    type,
    voice: {
      style: "casual",
      tone: "distinct MBTI personality",
      language_hint: "keep responses natural and concise",
    },
    group_behavior: "Participate naturally in a group chat.",
    responds_to: ["direct mention", "disagreement", "new angle to question"],
    conflict_style: "Disagree clearly but stay constructive.",
    example_lines: [],
  };
}

export async function loadAgentPersona(type: MbtiType): Promise<AgentPersona> {
  const filePath = path.join(process.cwd(), "agents", `${type}.json`);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as AgentPersona;

    return {
      ...defaultPersona(type),
      ...parsed,
      type,
    };
  } catch {
    return defaultPersona(type);
  }
}
