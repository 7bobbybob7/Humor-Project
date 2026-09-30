import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { GoogleButton } from "./google-button";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/");

  const { error } = await searchParams;
  const message = Array.isArray(error) ? error[0] : error;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm opacity-70">
        Sign in to add your own jokes to the Humor Project.
      </p>

      {message && (
        <p className="mt-6 rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
          {message}
        </p>
      )}

      <div className="mt-8">
        <GoogleButton />
      </div>

      <Link href="/" className="mt-8 text-sm underline opacity-70 hover:opacity-100">
        ← Back to the jokes
      </Link>
    </main>
  );
}
