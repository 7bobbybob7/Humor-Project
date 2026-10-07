import { requireCompleteProfile } from "@/lib/auth";
import { themeForToday } from "@/lib/themes";
import { GenerateForm } from "./generate-form";

export const dynamic = "force-dynamic";

/**
 * Protected route. proxy.ts redirects signed-out visitors to /login, and the
 * server action re-checks the session before calling the model or writing.
 */
export default async function GeneratePage() {
  const { profile } = await requireCompleteProfile();
  const theme = themeForToday();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Generate captions</h1>
      <p className="mt-2 text-sm opacity-70">
        Hi {profile.first_name} — pick a topic and Gemini will write three
        joke captions. They go straight into the feed for everyone to vote on.
      </p>

      <div className="mt-8">
        <GenerateForm theme={theme} />
      </div>
    </main>
  );
}
