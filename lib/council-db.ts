import { db } from "@/lib/db";
import type { MbtiType } from "@/lib/mbti";

export type CouncilRow = {
  id: string;
  question: string;
  language: string;
  types: MbtiType[];
  messages: Array<{ id: number; type: string; content: string; replyTo: number | null }>;
  verdict: Array<{ type: string; line: string }> | null;
  status: "done" | "in-progress" | "error";
  created_at: string;
};

export async function saveCouncil(row: Omit<CouncilRow, "created_at">): Promise<void> {
  try {
    await db.from("councils").upsert(row);
  } catch {
    // fail silently — sharing won't work but council still runs
  }
}

export async function getCouncil(id: string): Promise<CouncilRow | null> {
  try {
    const { data } = await db
      .from("councils")
      .select("*")
      .eq("id", id)
      .single();
    return data as CouncilRow | null;
  } catch {
    return null;
  }
}

export async function getCouncilCount(): Promise<number | null> {
  try {
    const { count } = await db
      .from("councils")
      .select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return null;
  }
}
