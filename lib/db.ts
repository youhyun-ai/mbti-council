import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _db: SupabaseClient | null = null;

function getDb(): SupabaseClient {
  if (_db) return _db;

  const supabaseUrl = process.env.mbti_council_SUPABASE_URL;
  const supabaseServiceKey = process.env.mbti_council_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase env vars");
  }

  _db = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  return _db;
}

export const db = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getDb()[prop as keyof SupabaseClient];
  },
});
