import Link from "next/link";
import { getCurrentUser, getProfile } from "@/lib/auth";

export async function Nav() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile() : null;

  const displayName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <header className="border-b border-black/10 dark:border-white/15">
      <nav className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          Humor Project
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/generate" className="hover:underline">
                Generate
              </Link>
              <Link href="/profile" className="flex items-center gap-2 hover:underline">
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-black/5 text-xs font-semibold dark:border-white/15 dark:bg-white/10">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- user-supplied Storage URL
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (profile?.first_name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()
                  )}
                </span>
                {displayName || "Profile"}
              </Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className="opacity-70 hover:opacity-100 hover:underline">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-black/15 px-3 py-1.5 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
