export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8" aria-busy="true">
      <p className="sr-only">Loading…</p>
      <div className="grid gap-8 lg:grid-cols-[1fr_19rem]">
        <div className="space-y-4">
          <div className="h-8 w-40 animate-pulse rounded-full bg-ink/10" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="panel flex gap-4 p-5">
              <div className="h-24 w-9 shrink-0 animate-pulse rounded-full bg-ink/10" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-3/4 animate-pulse rounded bg-ink/10" />
                <div className="h-5 w-1/2 animate-pulse rounded bg-ink/10" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-ink/10" />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden h-48 animate-pulse rounded-[1.125rem] bg-ink/10 lg:block" />
      </div>
    </main>
  );
}
