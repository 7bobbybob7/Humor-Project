import Link from "next/link";
import { getProfile, requireUser } from "@/lib/auth";
import { getMyGenerations } from "@/lib/generations";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile, mine] = await Promise.all([getProfile(), getMyGenerations()]);

  const totalScore = mine.reduce((sum, g) => sum + g.score, 0);
  const best = mine.reduce<number>((max, g) => Math.max(max, g.score), 0);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8 sm:py-12">
      <Link
        href="/"
        className="text-sm font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
      >
        ← Back to the lineup
      </Link>

      <h1 className="mt-4 font-display text-3xl font-black sm:text-4xl">
        Your profile
      </h1>

      {/* A small scoreboard: a reason to come back and beat it. */}
      <dl className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "Captions", value: mine.length, tint: "bg-yellow-tint" },
          { label: "Total points", value: totalScore, tint: "bg-green-tint" },
          { label: "Best caption", value: best, tint: "bg-blue-tint" },
        ].map((stat) => (
          <div key={stat.label} className={`panel-sm ${stat.tint} px-3 py-4 text-center`}>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
              {stat.label}
            </dt>
            <dd className="font-display text-2xl font-black tabular-nums">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="panel mt-7 p-6 sm:p-7">
        <h2 className="font-display text-xl font-black">Details</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Your name shows on every caption you post.
        </p>
        <div className="mt-6">
          <ProfileForm
            profile={profile}
            userId={user.id}
            email={user.email ?? ""}
          />
        </div>
      </div>
    </main>
  );
}
