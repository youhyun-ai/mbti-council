import { kv } from "@vercel/kv";

import { db } from "@/lib/db";

type VoteRow = {
  question_id: string;
  choice: "A" | "B";
  mbti_type: string;
};

const memoryVotes = new Map<string, VoteRow[]>();

function isSupabaseTableMissing(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error || "");
  return msg.includes("Could not find the table") || msg.includes("schema cache");
}

export async function saveVoteAndLoad(questionId: string, choice: "A" | "B", mbtiType: string): Promise<{ rows: VoteRow[]; source: string }> {
  // 1) Supabase (primary)
  try {
    const { error: insertError } = await db.from("balance_votes").insert({
      question_id: questionId,
      choice,
      mbti_type: mbtiType,
    });
    if (insertError) throw new Error(insertError.message);

    const { data, error } = await db
      .from("balance_votes")
      .select("question_id, choice, mbti_type")
      .eq("question_id", questionId);
    if (error) throw new Error(error.message);

    return { rows: (data || []) as VoteRow[], source: "supabase" };
  } catch (error) {
    if (!isSupabaseTableMissing(error)) {
      throw error;
    }
  }

  // 2) Vercel KV fallback (persistent)
  try {
    const key = `balance:votes:${questionId}`;
    const entry: VoteRow = { question_id: questionId, choice, mbti_type: mbtiType };
    await kv.rpush(key, JSON.stringify(entry));
    const raw = (await kv.lrange<string[]>(key, 0, -1)) || [];
    const rows = raw.map((v) => {
      try {
        return JSON.parse(String(v)) as VoteRow;
      } catch {
        return null;
      }
    }).filter(Boolean) as VoteRow[];
    return { rows, source: "vercel-kv" };
  } catch {
    // 3) in-memory fallback (dev safety)
    const arr = memoryVotes.get(questionId) || [];
    arr.push({ question_id: questionId, choice, mbti_type: mbtiType });
    memoryVotes.set(questionId, arr);
    return { rows: arr, source: "memory" };
  }
}
