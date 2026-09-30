import { createClient } from "@/lib/supabase/server";

export type Joke = {
  id: number;
  setup: string;
  punchline: string;
  category: string | null;
  created_at: string;
  user_id: string | null;
};

export async function getJokes(): Promise<Joke[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("jokes")
    .select("id, setup, punchline, category, created_at, user_id")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  return (data ?? []) as Joke[];
}
