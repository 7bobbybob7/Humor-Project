import Link from "next/link";
import { requireCompleteProfile } from "@/lib/auth";
import { JokeForm } from "./joke-form";

export const dynamic = "force-dynamic";

/**
 * Protected route. proxy.ts redirects signed-out visitors to /login; the
 * server action re-checks the session before writing.
 */
export default async function NewJokePage() {
  const { profile } = await requireCompleteProfile();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 sm:py-12">
      <Link
        href="/jokes"
        className="text-sm font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
      >
        ← Back to the jokes
      </Link>

      <h1 className="mt-4 font-display text-3xl font-black sm:text-4xl">
        Add a joke
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        Signed in as {profile.first_name} {profile.last_name}. Yours joins the
        hand-written set.
      </p>

      <div className="panel mt-7 p-6 sm:p-7">
        <JokeForm />
      </div>
    </main>
  );
}
