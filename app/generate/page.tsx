import Link from "next/link";
import { requireCompleteProfile } from "@/lib/auth";
import { themeForToday } from "@/lib/themes";
import { GenerateForm } from "./generate-form";

export const dynamic = "force-dynamic";

// The model call runs inside this page's Server Action. Vercel's default
// function timeout is 10s; the fallback chain can burn a few seconds on a 503
// before it reaches a model that answers.
export const maxDuration = 30;

/**
 * Protected route. proxy.ts redirects signed-out visitors to /login, and the
 * server action re-checks the session before calling the model or writing.
 */
export default async function GeneratePage() {
  const { profile } = await requireCompleteProfile();
  const theme = themeForToday();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 sm:py-12">
      <Link
        href="/"
        className="text-sm font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
      >
        ← Back to the lineup
      </Link>

      <h1 className="mt-4 font-display text-3xl font-black sm:text-4xl">
        Write some captions
      </h1>
      <p className="mt-2 text-sm text-ink-soft sm:text-base">
        Hi {profile.first_name} — pick a topic and the AI writes three takes on
        it. All three join the lineup, and the room votes.
      </p>

      <div className="panel mt-7 p-6 sm:p-7">
        <GenerateForm theme={theme} />
      </div>

      <div className="panel-sm mt-6 bg-blue-tint px-4 py-3 text-sm">
        <span className="font-bold">Tip:</span> the weirdly specific topics do
        best. “The printer in the library basement” beats “college.”
      </div>
    </main>
  );
}
