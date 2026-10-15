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
        <span className="mb-1.5 block font-display text-base font-bold">Topic</span>
        <input
          name="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          maxLength={120}
          placeholder={theme}
          className="w-full rounded-xl border-2 border-ink bg-paper-raised px-4 py-3 text-base font-medium placeholder:text-ink-soft/60 focus:outline-none focus:ring-4 focus:ring-comic-yellow"
        />
        <span className="mt-1.5 block text-xs text-ink-soft">
          Anything goes — a place, a feeling, a very specific inconvenience.
        </span>
      </label>

      <button
        type="button"
        onClick={() => setTopic(theme)}
        className="rounded-full border-2 border-ink bg-yellow-tint px-3 py-1.5 text-xs font-bold transition hover:bg-comic-yellow hover:text-ink-fixed"
      >
        Use today&apos;s theme: {theme}
      </button>

      {state.error && (
        <p className="panel-sm bg-red-tint px-4 py-3 text-sm font-semibold">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="press panel-sm block bg-comic-red px-6 py-3 font-bold text-white disabled:opacity-60"
      >
        {pending ? "Writing…" : "Generate 3 captions"}
      </button>

      {pending && (
        <p className="text-sm text-ink-soft">
          Asking the model for three takes on it. Usually a few seconds.
        </p>
      )}
    </form>
  );
}
