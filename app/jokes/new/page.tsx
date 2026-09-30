import { requireCompleteProfile } from "@/lib/auth";
import { JokeForm } from "./joke-form";

export const dynamic = "force-dynamic";

/**
 * Protected route. Signed-out visitors are redirected to /login by proxy.ts;
 * signed-in users without a name are sent to /onboarding first.
 */
export default async function NewJokePage() {
  const { profile } = await requireCompleteProfile();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Add a joke</h1>
      <p className="mt-2 text-sm opacity-70">
        Signed in as {profile.first_name} {profile.last_name}. Your joke will be
        added to the list on the home page.
      </p>

      <div className="mt-8">
        <JokeForm />
      </div>
    </main>
  );
}
