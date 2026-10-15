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

export type Author = { name: string; points: number; captions: number };

/**
 * Standings by total points earned. Aggregated in JS from recent rows rather
 * than in SQL, because the votes table is owner-only readable and a grouped
 * view would need its own security-definer wrapper for no real benefit here.
 */
export async function getTopAuthors(limit = 5): Promise<Author[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("generations")
    .select("author_first_name, score")
    .order("created_at", { ascending: false })
    .limit(500);

  const tally = new Map<string, Author>();
  for (const row of data ?? []) {
    const name = (row.author_first_name as string | null)?.trim() || "anonymous";
    const entry = tally.get(name) ?? { name, points: 0, captions: 0 };
    entry.points += (row.score as number) ?? 0;
    entry.captions += 1;
    tally.set(name, entry);
  }

  return [...tally.values()]
    .sort((a, b) => b.points - a.points || b.captions - a.captions)
    .slice(0, limit);
}

/**
 * The caption currently leading today. Shown as a ribbon on its own card in
 * the feed rather than duplicated into a separate block, so the feed stays
 * the single place captions live.
 */
export async function getLeadingTodayId(): Promise<number | null> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("generations")
    .select("id")
    .gte("created_at", since)
    .gt("score", 0)
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.id as number | undefined) ?? null;
}

export type TodayStats = { captions: number; votes: number; players: number };

/** A pulse-check on today, shown in the sidebar so the place feels alive. */
export async function getTodayStats(): Promise<TodayStats> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("generations")
    .select("user_id, up_votes, down_votes")
    .gte("created_at", startOfUtcDay());

  const rows = data ?? [];
  return {
    captions: rows.length,
    votes: rows.reduce(
      (n, r) => n + ((r.up_votes as number) ?? 0) + ((r.down_votes as number) ?? 0),
      0,
    ),
    players: new Set(rows.map((r) => r.user_id as string)).size,
  };
}
