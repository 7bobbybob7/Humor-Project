import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  updated_at: string;
};

/** The signed-in user, or null. Memoized per request. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** The signed-in user's profile row, or null if signed out. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  return data as Profile | null;
});

export function isProfileComplete(profile: Profile | null): boolean {
  return Boolean(profile?.first_name?.trim() && profile?.last_name?.trim());
}

/** Redirects to /login when signed out. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Redirects to /onboarding when the user has not supplied their name yet.
 * Call from protected pages so the prompt cannot be skipped by deep-linking.
 */
export async function requireCompleteProfile() {
  const user = await requireUser();
  const profile = await getProfile();
  if (!isProfileComplete(profile)) redirect("/onboarding");
  return { user, profile: profile! };
}
