import Link from "next/link";
import { getCurrentUser, getProfile } from "@/lib/auth";
import {
  getFeed,
  getLeadingTodayId,
  getMyVotes,
  getTodayStats,
  getTopAuthors,
  type Author,
  type TodayStats,
  type FeedSort,
  type Generation,
} from "@/lib/generations";
import { hoursUntilNextTheme, themeForToday } from "@/lib/themes";
import { CaptionCard } from "./feed/caption-card";

export const dynamic = "force-dynamic";

const TABS: { key: FeedSort; label: string; hint: string }[] = [
  { key: "top", label: "Top", hint: "Highest scoring of all time" },
  { key: "today", label: "Today", hint: "Posted since midnight UTC" },
  { key: "new", label: "Newest", hint: "Freshest first" },
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const { sort, posted } = await searchParams;
  const postedRaw = Number(Array.isArray(posted) ? posted[0] : posted) || 0;
  // Clamped: this comes straight from the query string.
  const justPosted = Math.min(Math.max(postedRaw, 0), 10);
  const raw = Array.isArray(sort) ? sort[0] : sort;
  const active: FeedSort = raw === "today" || raw === "new" ? raw : "top";

  const user = await getCurrentUser();
  const theme = themeForToday();
  const hoursLeft = hoursUntilNextTheme();

  let generations: Generation[] = [];
  let myVotes: Record<number, number> = {};
  let authors: Author[] = [];
  let leadingId: number | null = null;
  let today: TodayStats = { captions: 0, votes: 0, players: 0 };
  let profile = null;
  let error: string | null = null;

  try {
    [generations, myVotes, authors, leadingId, today, profile] =
      await Promise.all([
        getFeed(active),
        getMyVotes(),
        getTopAuthors(),
        getLeadingTodayId(),
        getTodayStats(),
        getProfile(),
      ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error loading the lineup.";
  }

  const myPoints = generations
    .filter((g) => profile && g.user_id === profile.id)
    .reduce((n, g) => n + g.score, 0);

  return (
    <>
      {/* Masthead strip: the paper's "slogan line", not a full hero block. */}
      <div className="border-b-2 border-ink bg-comic-yellow text-ink-fixed">
        <p className="mx-auto max-w-5xl px-5 py-2 text-center font-display text-sm font-bold sm:text-base">
          The robots write · you decide what&apos;s funny · new theme daily
        </p>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_19rem]">
          {/* Feed column. order-2 on phones so the theme card and its call to
              action are not pushed below the entire lineup. */}
          <div className="order-2 min-w-0 lg:order-1">
            {justPosted > 0 && (
              <div className="panel-sm mb-5 bg-green-tint px-4 py-3">
                <p className="font-display text-base font-black">
                  Nice — {justPosted} caption{justPosted === 1 ? "" : "s"} are live.
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  They&apos;re at the top of Newest. Check back later to see how
                  the room voted.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-display text-2xl font-black sm:text-3xl">
                The lineup
              </h1>
              <nav aria-label="Sort the lineup" className="flex flex-wrap gap-2">
                {TABS.map((tab) => (
                  <Link
                    key={tab.key}
                    href={tab.key === "top" ? "/" : `/?sort=${tab.key}`}
                    title={tab.hint}
                    aria-current={active === tab.key ? "page" : undefined}
                    className={`rounded-full border-2 border-ink px-3.5 py-1 text-sm font-bold transition ${
                      active === tab.key
                        ? "bg-ink text-paper"
                        : "bg-paper-raised text-ink hover:bg-yellow-tint"
                    }`}
                  >
                    {tab.label}
                  </Link>
                ))}
              </nav>
            </div>

            {error ? (
              <div className="panel mt-5 bg-red-tint p-5">
                <h2 className="font-display text-lg font-black">
                  Could not load the lineup
                </h2>
                <p className="mt-1 font-mono text-sm text-ink-soft">{error}</p>
              </div>
            ) : generations.length === 0 ? (
              <div className="panel mt-5 p-8 text-center">
                <p className="font-display text-xl font-black">
                  {active === "today" ? "Quiet so far today." : "Nothing here yet."}
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
                  Hand the AI a topic and see whether the room agrees with you.
                </p>
                <Link
                  href={user ? "/generate" : "/login"}
                  className="press panel-sm mt-5 inline-block bg-comic-yellow px-5 py-2.5 font-bold text-ink-fixed"
                >
                  {user ? "Write the first one" : "Sign in to start"}
                </Link>
              </div>
            ) : (
              <ul className="mt-5 space-y-4">
                {generations.map((generation, i) => (
                  <CaptionCard
                    key={generation.id}
                    generation={generation}
                    myVote={myVotes[generation.id]}
                    signedIn={Boolean(user)}
                    leading={generation.id === leadingId}
                    isMine={Boolean(profile) && generation.user_id === profile!.id}
                    rank={active === "top" ? i : undefined}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* ---------------- Sidebar ---------------- */}
          <aside className="order-1 space-y-5 lg:order-2 lg:sticky lg:top-24 lg:self-start">
            <section className="panel relative overflow-hidden p-5">
              <div className="halftone pointer-events-none absolute inset-0" aria-hidden />
              <div className="relative">
                <p className="text-[11px] font-black uppercase tracking-wide text-ink-soft">
                  Today&apos;s theme
                </p>
                <p className="mt-1.5 font-display text-xl font-black leading-snug">
                  {theme}
                </p>
                <Link
                  href={user ? "/generate" : "/login"}
                  className="press panel-sm mt-4 block bg-comic-red px-4 py-2.5 text-center font-bold text-white"
                >
                  {user ? "Write captions →" : "Sign in to play →"}
                </Link>
                <p className="mt-3 text-center text-[11px] font-semibold text-ink-soft">
                  New theme in {hoursLeft}h
                </p>
              </div>
            </section>

            {today.captions > 0 && (
              <section className="panel-sm bg-yellow-tint px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-wide text-ink-soft">
                  Today so far
                </p>
                <p className="mt-1 text-sm font-semibold leading-relaxed">
                  {today.captions} caption{today.captions === 1 ? "" : "s"} ·{" "}
                  {today.votes} vote{today.votes === 1 ? "" : "s"} ·{" "}
                  {today.players} player{today.players === 1 ? "" : "s"}
                </p>
              </section>
            )}

            {user ? (
              <section className="panel-sm bg-green-tint px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-wide text-ink-soft">
                  Your points on this page
                </p>
                <p className="font-display text-2xl font-black tabular-nums">
                  {myPoints}
                </p>
                <Link
                  href="/profile"
                  className="mt-1 inline-block text-xs font-bold underline underline-offset-2"
                >
                  See all your captions →
                </Link>
              </section>
            ) : (
              <section className="panel-sm bg-blue-tint px-4 py-3">
                <p className="font-display text-base font-black">
                  Reading as a guest
                </p>
                <p className="mt-1 text-xs leading-relaxed">
                  Captions are free to read. Rating them and writing your own
                  take an account — it&apos;s one tap with Google.
                </p>
                <Link
                  href="/login"
                  className="mt-2 inline-block text-xs font-black underline underline-offset-2"
                >
                  Sign in →
                </Link>
              </section>
            )}

            {authors.length > 0 && (
              <section className="panel p-5">
                <p className="text-[11px] font-black uppercase tracking-wide text-ink-soft">
                  Standings
                </p>
                <ol className="mt-3 space-y-2">
                  {authors.map((author, i) => (
                    <li
                      key={author.name}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-comic-yellow text-[10px] font-black tabular-nums text-ink-fixed">
                          {i + 1}
                        </span>
                        <span className="truncate font-semibold">{author.name}</span>
                      </span>
                      <span className="shrink-0 font-display font-black tabular-nums">
                        {author.points}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <p className="text-center text-xs text-ink-soft">
              <Link href="/jokes" className="font-semibold underline underline-offset-2">
                The hand-written jokes
              </Link>{" "}
              live over here.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}
