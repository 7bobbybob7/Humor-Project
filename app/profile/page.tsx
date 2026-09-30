import { getProfile, requireUser } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getProfile();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      <p className="mt-2 text-sm opacity-70">
        Update your name and photo.
      </p>

      <div className="mt-8">
        <ProfileForm profile={profile} userId={user.id} email={user.email ?? ""} />
      </div>
    </main>
  );
}
