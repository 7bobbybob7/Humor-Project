"use client";

import { useActionState } from "react";
import { createJoke, type NewJokeState } from "./actions";

export function JokeForm() {
  const [state, formAction, pending] = useActionState<NewJokeState, FormData>(
    createJoke,
    {},
  );

  return (
    <form action={formAction} className="space-y-6">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Setup</span>
        <input
          name="setup"
          required
          placeholder="Why do programmers prefer dark mode?"
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Punchline</span>
        <input
          name="punchline"
          required
          placeholder="Because light attracts bugs."
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">
          Category <span className="font-normal opacity-60">(optional)</span>
        </span>
        <input
          name="category"
          placeholder="Programming"
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>

      {state.error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-foreground px-5 py-2.5 font-medium text-background transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add joke"}
      </button>
    </form>
  );
}
