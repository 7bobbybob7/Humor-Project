import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { GoogleButton } from "./google-button";

export const dynamic = "force-dynamic";

const PERKS = [
  "Rate every caption in the lineup",
  "Give the AI your own topics to riff on",
  "Put your name on the ones that land",
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/");

  const { error } = await searchParams;
  const message = Array.isArray(error) ? error[0] : error;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
      <div className="panel p-7 sm:p-8">
        <h1 className="font-display text-3xl font-black">Welcome in</h1>
        <p className="mt-2 text-sm text-ink-soft">
          One tap with Google. No password to remember.
        </p>

        <ul className="mt-6 space-y-2">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-2 text-sm">
              <span
                aria-hidden
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-comic-green text-[10px] font-black text-white"
              >
                ✓
              </span>
              {perk}
            </li>
          ))}
        </ul>

        {message && (
          <p className="panel-sm mt-6 bg-red-tint px-4 py-3 text-sm font-semibold">
            {message}
          </p>
        )}

        <div className="mt-7">
          <GoogleButton />
        </div>
      </div>

      <Link
        href="/"
        className="mt-6 text-center text-sm font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
      >
        ← Back to the lineup
      </Link>
    </main>
  );
}
