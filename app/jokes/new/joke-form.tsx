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
        <span className="mb-1.5 block font-display text-base font-bold">Setup</span>
        <input
          name="setup"
          maxLength={200}
          required
          placeholder="Why do programmers prefer dark mode?"
          className="w-full rounded-xl border-2 border-ink bg-paper-raised px-4 py-2.5 font-medium placeholder:text-ink-soft/60 focus:outline-none focus:ring-4 focus:ring-comic-yellow"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1.5 block font-display text-base font-bold">Punchline</span>
        <input
          name="punchline"
          maxLength={200}
          required
          placeholder="Because light attracts bugs."
          className="w-full rounded-xl border-2 border-ink bg-paper-raised px-4 py-2.5 font-medium placeholder:text-ink-soft/60 focus:outline-none focus:ring-4 focus:ring-comic-yellow"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1.5 block font-display text-base font-bold">
          Category <span className="font-normal opacity-60">(optional)</span>
        </span>
        <input
          name="category"
          maxLength={40}
          placeholder="Programming"
          className="w-full rounded-xl border-2 border-ink bg-paper-raised px-4 py-2.5 font-medium placeholder:text-ink-soft/60 focus:outline-none focus:ring-4 focus:ring-comic-yellow"
        />
      </label>

      {state.error && (
        <p className="panel-sm bg-red-tint px-4 py-3 text-sm font-semibold">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="press panel-sm bg-comic-red px-6 py-3 font-bold text-white disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add joke"}
      </button>
    </form>
  );
}
