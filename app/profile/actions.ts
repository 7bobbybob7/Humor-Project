"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { error?: string; success?: string };

/**
 * Saves the profile. The avatar arrives as a URL, not as bytes: the browser
 * uploads the image straight to Supabase Storage, which keeps the image out of
 * the Server Action request body (capped at 1 MB by Next, ~4.5 MB by Vercel)
 * and out of the database, as the assignment requires.
 */
export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in to edit your profile." };

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();

  if (!firstName || !lastName) {
    return { error: "First name and last name are both required." };
  }

  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();

  // Only accept URLs that point at our own public avatars bucket, so a crafted
  // form post cannot point a profile at an arbitrary external image.
  const allowedPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/`;
  if (avatarUrl && !avatarUrl.startsWith(allowedPrefix)) {
    return { error: "That photo could not be verified. Try uploading it again." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: `Could not save profile: ${error.message}` };

  revalidatePath("/profile");
  revalidatePath("/");

  const redirectTo = formData.get("redirect_to");
  if (typeof redirectTo === "string" && redirectTo.startsWith("/")) {
    redirect(redirectTo);
  }

  return { success: "Profile saved." };
}
