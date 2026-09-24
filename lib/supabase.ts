import { createClient } from "@supabase/supabase-js";

export type Joke = {
  id: number;
  setup: string;
  punchline: string;
  category: string | null;
  created_at: string;
};

/**
 * Built per-request rather than at module scope so a missing environment
 * variable surfaces as a rendered error on the page instead of crashing the
 * build when the module is first imported.
 */
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Add them to .env.local locally, and to Project Settings > Environment Variables on Vercel.",
    );
  }

  return createClient(url, anonKey);
}

export async function getJokes(): Promise<Joke[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("jokes")
    .select("id, setup, punchline, category, created_at")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  return data ?? [];
}
