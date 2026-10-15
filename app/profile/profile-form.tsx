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
        <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-comic-blue text-xl font-black text-white">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- user-supplied Storage URL; no optimization needed for a small avatar
            <img
              src={preview}
              alt=""
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : (
            (profile?.first_name?.[0] ?? email[0] ?? "?").toUpperCase()
          )}
        </span>

        <label className="text-sm">
          <span className="mb-1.5 block font-display text-base font-bold">Profile photo</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={uploading}
            className="block w-full text-sm file:mr-3 file:rounded-full file:border-2 file:border-ink file:bg-comic-yellow file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-ink-fixed disabled:opacity-60"
          />
          <span className="mt-1.5 block text-xs text-ink-soft">
            {uploading ? "Uploading…" : "PNG or JPG, up to 5 MB."}
          </span>
        </label>
      </div>

      {uploadError && (
        <p className="panel-sm bg-red-tint px-4 py-3 text-sm font-semibold">
          {uploadError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block font-display text-base font-bold">First name</span>
          <input
            name="first_name"
            defaultValue={profile?.first_name ?? ""}
            required
            maxLength={40}
            className="w-full rounded-xl border-2 border-ink bg-paper-raised px-4 py-2.5 font-medium focus:outline-none focus:ring-4 focus:ring-comic-yellow"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-display text-base font-bold">Last name</span>
          <input
            name="last_name"
            defaultValue={profile?.last_name ?? ""}
            required
            maxLength={40}
            className="w-full rounded-xl border-2 border-ink bg-paper-raised px-4 py-2.5 font-medium focus:outline-none focus:ring-4 focus:ring-comic-yellow"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1.5 block font-display text-base font-bold">Email</span>
        <input
          value={email}
          disabled
          className="w-full rounded-xl border-2 border-ink/25 bg-ink/5 px-4 py-2.5 text-ink-soft"
        />
        <span className="mt-1.5 block text-xs text-ink-soft">Managed by Google — not editable.</span>
      </label>

      {state.error && (
        <p className="panel-sm bg-red-tint px-4 py-3 text-sm font-semibold">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="panel-sm bg-green-tint px-4 py-3 text-sm font-semibold">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || uploading}
        className="press panel-sm bg-comic-red px-6 py-3 font-bold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : uploading ? "Waiting for upload…" : submitLabel}
      </button>
    </form>
  );
}
