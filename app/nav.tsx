import Link from "next/link";
import { getCurrentUser, getProfile } from "@/lib/auth";

export async function Nav() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile() : null;

  const displayName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/95 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 py-3">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-xl font-black tracking-tight sm:text-2xl">
            The Humor Project
          </span>
          <span
            aria-hidden
            className="hidden h-2 w-2 rounded-full bg-comic-red transition group-hover:bg-comic-blue sm:block"
          />
        </Link>

        <div className="flex items-center gap-2 text-sm sm:gap-3">
          {user ? (
            <>
              <Link
                href="/generate"
                className="press panel-sm pill bg-comic-yellow px-3.5 py-1.5 font-bold text-ink-fixed"
              >
                + Write
              </Link>

              <Link
                href="/profile"
                title="Your profile"
                className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition hover:bg-ink/5"
              >
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-comic-blue text-xs font-bold text-white">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- user-supplied Storage URL
                    <img
                      src={profile.avatar_url}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (profile?.first_name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()
                  )}
                </span>
                <span className="hidden font-semibold sm:inline">
                  {displayName || "Profile"}
                </span>
              </Link>

              <form action="/auth/signout" method="post" className="hidden sm:block">
                <button
                  type="submit"
                  className="text-ink-soft underline-offset-2 transition hover:text-ink hover:underline"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="press panel-sm pill bg-comic-red px-4 py-1.5 font-bold text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
