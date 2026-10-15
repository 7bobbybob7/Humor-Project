import { redirect } from "next/navigation";
import { getProfile, isProfileComplete, requireUser } from "@/lib/auth";
import { ProfileForm } from "../profile/profile-form";

export const dynamic = "force-dynamic";

/**
 * Shown after first login, when the auth.users trigger has created a profile
 * row but first_name / last_name are still null.
 */
export default async function OnboardingPage() {
  const user = await requireUser();
  const profile = await getProfile();

  if (isProfileComplete(profile)) redirect("/");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 sm:py-12">
      <div className="panel relative overflow-hidden p-6 sm:p-8">
        <div className="halftone pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative">
          <span className="rounded-full border-2 border-ink bg-comic-yellow px-3 py-1 text-xs font-black uppercase tracking-wide text-ink-fixed">
            One quick thing
          </span>
          <h1 className="mt-4 font-display text-3xl font-black sm:text-4xl">
            What should we call you?
          </h1>
          <p className="mt-2 text-sm text-ink-soft sm:text-base">
            Your name goes on the captions you write, so the room knows who to
            credit. A photo is optional.
          </p>
        </div>
      </div>

      <div className="panel mt-6 p-6 sm:p-7">
        <ProfileForm
          profile={profile}
          userId={user.id}
          email={user.email ?? ""}
          redirectTo="/"
          submitLabel="Finish setup →"
        />
      </div>
    </main>
  );
}
