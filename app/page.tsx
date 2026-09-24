import { getJokes, type Joke } from "@/lib/supabase";

// Render on every request so newly added Supabase rows show up without a
// redeploy. Valid here because Cache Components is not enabled in next.config.ts.
export const dynamic = "force-dynamic";

export default async function Home() {
  let jokes: Joke[] = [];
  let error: string | null = null;

  try {
    jokes = await getJokes();
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error loading jokes.";
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Humor Project</h1>
        <p className="mt-2 text-sm opacity-70">
          Jokes served from a Supabase table.
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4">
          <h2 className="font-semibold text-red-600 dark:text-red-400">
            Could not load jokes
          </h2>
          <p className="mt-1 font-mono text-sm opacity-80">{error}</p>
        </div>
      ) : jokes.length === 0 ? (
        <p className="opacity-70">
          No jokes yet. Add rows to the <code>jokes</code> table in Supabase.
        </p>
      ) : (
        <ul className="space-y-4">
          {jokes.map((joke) => (
            <li
              key={joke.id}
              className="rounded-lg border border-black/10 p-5 dark:border-white/15"
            >
              {joke.category && (
                <span className="text-xs font-medium uppercase tracking-wide opacity-60">
                  {joke.category}
                </span>
              )}
              <p className="mt-1 font-medium">{joke.setup}</p>
              <p className="mt-2 opacity-75">{joke.punchline}</p>
            </li>
          ))}
        </ul>
      )}

      {!error && jokes.length > 0 && (
        <p className="mt-10 text-sm opacity-60">
          {jokes.length} {jokes.length === 1 ? "joke" : "jokes"} loaded from Supabase.
        </p>
      )}
    </main>
  );
}
