import Link from "next/link";
import { getJokes, type Joke } from "@/lib/jokes";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function JokesPage() {
  const user = await getCurrentUser();

  let jokes: Joke[] = [];
  let error: string | null = null;

  try {
    jokes = await getJokes();
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error loading jokes.";
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:py-12">
      <Link
        href="/"
        className="text-sm font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
      >
        ← Back to the lineup
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black sm:text-4xl">
            Hand-written jokes
          </h1>
          <p className="mt-2 max-w-md text-sm text-ink-soft">
            The original set, written by actual people. No voting here — that
            happens on the AI captions in the lineup.
          </p>
        </div>
        <Link
          href={user ? "/jokes/new" : "/login"}
          className="press panel-sm shrink-0 bg-comic-yellow px-4 py-2 font-bold text-ink-fixed"
        >
          {user ? "+ Add a joke" : "Sign in to add"}
        </Link>
      </header>

      {error ? (
        <div className="panel mt-7 bg-red-tint p-5">
          <h2 className="font-display text-lg font-black">Could not load jokes</h2>
          <p className="mt-1 font-mono text-sm text-ink-soft">{error}</p>
        </div>
      ) : (
        <ul className="mt-7 space-y-4">
          {jokes.map((joke) => (
            <li key={joke.id} className="panel panel-hover p-5">
              <div className="flex flex-wrap items-center gap-2">
                {joke.category && (
                  <span className="rounded-full bg-blue-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                    {joke.category}
                  </span>
                )}
                {joke.user_id && (
                  <span className="rounded-full bg-green-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
                    Community
                  </span>
                )}
              </div>
              <p className="mt-2 font-display text-lg font-bold leading-snug">
                {joke.setup}
              </p>
              <p className="mt-1.5 text-ink-soft">{joke.punchline}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
