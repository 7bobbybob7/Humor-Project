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
  if (firstName.length > 40 || lastName.length > 40) {
    return { error: "Names need to be 40 characters or fewer." };
  }

  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();

  // Only accept URLs that point at our own public avatars bucket, so a crafted
  // form post cannot point a profile at an arbitrary external image.
  const allowedPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/`;
  if (avatarUrl && !avatarUrl.startsWith(allowedPrefix)) {
    return { error: "That photo could not be verified. Try uploading it again." };
  }

  // upsert, not update. An .update() against a row that does not exist matches
  // zero rows and reports no error, so the save would appear to succeed while
  // writing nothing - and requireCompleteProfile would then bounce the user
  // back to /onboarding forever. This can happen if the auth.users trigger
  // did not fire. Both the insert and update RLS policies check auth.uid() = id.
  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (error) {
    console.error("[profile update failed]", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId: user.id,
    });
    return { error: `Could not save profile: ${error.message}` };
  }

  revalidatePath("/profile");
  revalidatePath("/");

  const redirectTo = formData.get("redirect_to");
  // "//evil.com" also starts with "/" and is a protocol-relative URL that
  // leaves the site, so same-origin paths must start with exactly one slash.
  if (
    typeof redirectTo === "string" &&
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("//")
  ) {
    redirect(redirectTo);
  }

  return { success: "Profile saved." };
}
