import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.mbti_council_SUPABASE_URL!;
const supabaseServiceKey = process.env.mbti_council_SUPABASE_SERVICE_ROLE_KEY!;

export const db = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});
