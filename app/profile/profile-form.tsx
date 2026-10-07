"use client";

import { useActionState, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile, type ProfileFormState } from "./actions";
import type { Profile } from "@/lib/auth";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

export function ProfileForm({
  profile,
  userId,
  email,
  redirectTo,
  submitLabel = "Save changes",
}: {
  profile: Profile | null;
  userId: string;
  email: string;
  redirectTo?: string;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateProfile,
    {},
  );

  const [preview, setPreview] = useState<string | null>(profile?.avatar_url ?? null);
  // Starts empty on purpose, and is only filled by a successful upload below.
  // Seeding it from profile.avatar_url would post the existing value straight
  // back, and an avatar seeded from Google by the auth.users trigger is not a
  // URL in our Storage bucket - the action would reject it and block the save.
  // Left blank, the action keeps whatever avatar the profile already has.
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /**
   * Uploads straight from the browser to Supabase Storage as soon as a file is
   * chosen, so the image never travels through a Server Action body.
   */
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("That file is not an image.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setUploadError("Image is larger than 5 MB. Pick a smaller one.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    // Storage policy only permits writes inside a folder named for the user id.
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, upsert: true });

    if (error) {
      setUploadError(`Upload failed: ${error.message}`);
      setPreview(profile?.avatar_url ?? null);
      setUploading(false);
      return;
    }

    const publicUrl = supabase.storage.from("avatars").getPublicUrl(path)
      .data.publicUrl;
    setAvatarUrl(publicUrl);
    setPreview(publicUrl);
    setUploading(false);
  }

  return (
    <form action={formAction} className="space-y-6">
      {redirectTo && <input type="hidden" name="redirect_to" value={redirectTo} />}
      <input type="hidden" name="avatar_url" value={avatarUrl} />

      <div className="flex items-center gap-4">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-black/5 text-xl font-semibold dark:border-white/15 dark:bg-white/10">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- user-supplied Storage URL; no optimization needed for a small avatar
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            (profile?.first_name?.[0] ?? email[0] ?? "?").toUpperCase()
          )}
        </span>

        <label className="text-sm">
          <span className="mb-1 block font-medium">Profile photo</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={uploading}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-black/10 file:px-3 file:py-1.5 file:text-sm file:font-medium disabled:opacity-60 dark:file:bg-white/15"
          />
          <span className="mt-1 block text-xs opacity-60">
            {uploading ? "Uploading…" : "PNG or JPG, up to 5 MB."}
          </span>
        </label>
      </div>

      {uploadError && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
          {uploadError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">First name</span>
          <input
            name="first_name"
            defaultValue={profile?.first_name ?? ""}
            required
            className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Last name</span>
          <input
            name="last_name"
            defaultValue={profile?.last_name ?? ""}
            required
            className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Email</span>
        <input
          value={email}
          disabled
          className="w-full rounded-lg border border-black/10 bg-black/5 px-3 py-2 opacity-60 dark:border-white/15 dark:bg-white/5"
        />
        <span className="mt-1 block text-xs opacity-60">Managed by Google — not editable.</span>
      </label>

      {state.error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg border border-green-600/40 bg-green-600/5 p-3 text-sm text-green-700 dark:text-green-400">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || uploading}
        className="rounded-lg bg-foreground px-5 py-2.5 font-medium text-background transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : uploading ? "Waiting for upload…" : submitLabel}
      </button>
    </form>
  );
}
