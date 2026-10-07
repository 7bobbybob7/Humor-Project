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
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hand-written jokes</h1>
          <p className="mt-2 text-sm opacity-70">
            The original set, written by people. For the AI captions you can
            vote on, see{" "}
            <Link href="/" className="underline">
              the feed
            </Link>
            .
          </p>
        </div>
        <Link
          href={user ? "/jokes/new" : "/login"}
          className="shrink-0 rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          {user ? "Add a joke" : "Sign in to add"}
        </Link>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4">
          <h2 className="font-semibold text-red-600 dark:text-red-400">
            Could not load jokes
          </h2>
          <p className="mt-1 font-mono text-sm opacity-80">{error}</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {jokes.map((joke) => (
            <li
              key={joke.id}
              className="rounded-lg border border-black/10 p-5 dark:border-white/15"
            >
              <div className="flex items-center gap-2">
                {joke.category && (
                  <span className="text-xs font-medium uppercase tracking-wide opacity-60">
                    {joke.category}
                  </span>
                )}
                {joke.user_id && (
                  <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide opacity-60 dark:bg-white/10">
                    Community
                  </span>
                )}
              </div>
              <p className="mt-1 font-medium">{joke.setup}</p>
              <p className="mt-2 opacity-75">{joke.punchline}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
