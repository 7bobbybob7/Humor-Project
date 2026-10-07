"use client";

import { useActionState, useState } from "react";
import { generate, type GenerateState } from "./actions";

export function GenerateForm({ theme }: { theme: string }) {
  const [state, formAction, pending] = useActionState<GenerateState, FormData>(
    generate,
    {},
  );
  const [topic, setTopic] = useState("");

  return (
    <form action={formAction} className="space-y-5">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Topic</span>
        <input
          name="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          maxLength={120}
          placeholder={theme}
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
        <span className="mt-1 block text-xs opacity-60">
          Anything goes — a place, a feeling, a very specific inconvenience.
        </span>
      </label>

      <button
        type="button"
        onClick={() => setTopic(theme)}
        className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-medium transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
      >
        Use today&apos;s theme: {theme}
      </button>

      {state.error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="block rounded-lg bg-foreground px-5 py-2.5 font-medium text-background transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Writing…" : "Generate 3 captions"}
      </button>

      {pending && (
        <p className="text-sm opacity-60">
          Asking the model for three takes on it. Usually a few seconds.
        </p>
      )}
    </form>
  );
}
