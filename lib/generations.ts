import { createClient } from "@/lib/supabase/server";

export type Generation = {
  id: number;
  user_id: string;
  author_first_name: string | null;
  prompt: string;
  model: string;
  caption: string;
  up_votes: number;
  down_votes: number;
  score: number;
  created_at: string;
};

export type FeedSort = "top" | "today" | "new";

const COLUMNS =
  "id, user_id, author_first_name, prompt, model, caption, up_votes, down_votes, score, created_at";

function startOfUtcDay(): string {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

export async function getFeed(sort: FeedSort = "top"): Promise<Generation[]> {
  const supabase = await createClient();
  let query = supabase.from("generations").select(COLUMNS);

  if (sort === "today") {
    query = query.gte("created_at", startOfUtcDay());
  }

  query =
    sort === "new"
      ? query.order("created_at", { ascending: false })
      : query
          .order("score", { ascending: false })
          .order("created_at", { ascending: false });

  const { data, error } = await query.limit(60);
  if (error) throw new Error(`Could not load the feed: ${error.message}`);
  return (data ?? []) as Generation[];
}

/**
 * The signed-in user's own votes, keyed by generation id.
 *
 * No filter on user_id is needed: the RLS policy on `votes` only exposes rows
 * belonging to the caller, so this returns nothing for anonymous visitors.
 */
export async function getMyVotes(): Promise<Record<number, number>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase.from("votes").select("generation_id, value");
  if (error) return {};

  return Object.fromEntries(
    (data ?? []).map((v) => [v.generation_id as number, v.value as number]),
  );
}

export async function getMyGenerations(): Promise<Generation[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("generations")
    .select(COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []) as Generation[];
}
