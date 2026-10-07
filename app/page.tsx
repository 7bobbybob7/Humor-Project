import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getFeed, getMyVotes, type FeedSort } from "@/lib/generations";
import { themeForToday } from "@/lib/themes";
import { CaptionCard } from "./feed/caption-card";

export const dynamic = "force-dynamic";

const TABS: { key: FeedSort; label: string }[] = [
  { key: "top", label: "Top" },
  { key: "today", label: "Today" },
  { key: "new", label: "Newest" },
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const { sort } = await searchParams;
  const raw = Array.isArray(sort) ? sort[0] : sort;
  const active: FeedSort =
    raw === "today" || raw === "new" ? raw : "top";

  const user = await getCurrentUser();
  const theme = themeForToday();

  let error: string | null = null;
  let generations: Awaited<ReturnType<typeof getFeed>> = [];
  let myVotes: Record<number, number> = {};

  try {
    [generations, myVotes] = await Promise.all([getFeed(active), getMyVotes()]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error loading the feed.";
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Humor Project</h1>
        <p className="mt-2 text-sm opacity-70">
          AI-written captions, ranked by you.
        </p>
      </header>

      <section className="mb-8 rounded-lg border border-black/10 bg-black/[0.03] p-5 dark:border-white/15 dark:bg-white/[0.04]">
        <p className="text-xs font-medium uppercase tracking-wide opacity-60">
          Today&apos;s theme
        </p>
        <p className="mt-1 text-lg font-semibold">{theme}</p>
        <Link
          href={user ? "/generate" : "/login"}
          className="mt-3 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
        >
          {user ? "Write captions on this" : "Sign in to play"}
        </Link>
      </section>

      <nav className="mb-6 flex gap-1 border-b border-black/10 dark:border-white/15">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "top" ? "/" : `/?sort=${tab.key}`}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition ${
              active === tab.key
                ? "border-foreground font-semibold"
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4">
          <h2 className="font-semibold text-red-600 dark:text-red-400">
            Could not load the feed
          </h2>
          <p className="mt-1 font-mono text-sm opacity-80">{error}</p>
        </div>
      ) : generations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 p-8 text-center dark:border-white/20">
          <p className="font-medium">
            {active === "today" ? "Nothing today yet." : "No captions yet."}
          </p>
          <p className="mt-1 text-sm opacity-70">
            Be the first — generate a few and see how they rank.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {generations.map((generation) => (
            <CaptionCard
              key={generation.id}
              generation={generation}
              myVote={myVotes[generation.id]}
              signedIn={Boolean(user)}
            />
          ))}
        </ul>
      )}

      <p className="mt-10 text-sm opacity-60">
        Looking for the original hand-written jokes?{" "}
        <Link href="/jokes" className="underline">
          They&apos;re over here
        </Link>
        .
      </p>
    </main>
  );
}
