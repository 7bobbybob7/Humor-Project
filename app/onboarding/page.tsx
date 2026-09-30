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
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Welcome! One quick thing.</h1>
      <p className="mt-2 text-sm opacity-70">
        We don&apos;t have your name yet. Add it below to finish setting up your
        account — you can change it any time from your profile.
      </p>

      <div className="mt-8">
        <ProfileForm
          profile={profile}
          userId={user.id}
          email={user.email ?? ""}
          redirectTo="/"
          submitLabel="Finish setup"
        />
      </div>
    </main>
  );
}
