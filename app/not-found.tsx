import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 py-16">
      <div className="panel p-7 text-center">
        <p className="font-display text-5xl font-black">🤷</p>
        <h1 className="mt-3 font-display text-2xl font-black">
          Nothing here
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          That page doesn&apos;t exist. The jokes are this way.
        </p>
        <Link
          href="/"
          className="press panel-sm mt-6 inline-block bg-comic-yellow px-5 py-2.5 font-bold text-ink-fixed"
        >
          Back to the lineup
        </Link>
      </div>
    </main>
  );
}
