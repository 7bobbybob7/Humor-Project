"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { castVote } from "./actions";

export function VoteButtons({
  generationId,
  score,
  myVote,
  signedIn,
}: {
  generationId: number;
  score: number;
  myVote: number | undefined;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Optimistic local copies so the arrows respond instantly.
  const [localScore, setLocalScore] = useState(score);
  const [localVote, setLocalVote] = useState<number | undefined>(myVote);
  const [error, setError] = useState<string | null>(null);

  // Re-sync when the server sends a different score, which happens after
  // router.refresh() or when someone else votes. Without this the optimistic
  // value sticks and the displayed count drifts from the database.
  const [syncedScore, setSyncedScore] = useState(score);
  const [syncedVote, setSyncedVote] = useState(myVote);
  if (score !== syncedScore || myVote !== syncedVote) {
    setSyncedScore(score);
    setSyncedVote(myVote);
    setLocalScore(score);
    setLocalVote(myVote);
  }

  function vote(value: 1 | -1) {
    if (!signedIn) {
      router.push("/login");
      return;
    }

    const previousScore = localScore;
    const previousVote = localVote;

    // Clicking the active arrow retracts; otherwise the delta spans both signs.
    const next = localVote === value ? undefined : value;
    setLocalVote(next);
    setLocalScore(previousScore - (previousVote ?? 0) + (next ?? 0));
    setError(null);

    startTransition(async () => {
      const result = await castVote(generationId, value);
      if (result.error) {
        setLocalScore(previousScore);
        setLocalVote(previousVote);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  // Guests keep the arrows (they explain what the site does and route to
  // login), but dimmed so the locked state reads before anyone clicks.
  const base = `press flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink text-sm font-bold leading-none transition disabled:opacity-50${
    signedIn ? "" : " opacity-55"
  }`;

  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5">
      <button
        onClick={() => vote(1)}
        disabled={pending}
        aria-label={signedIn ? "Upvote this caption" : "Sign in to vote"}
        aria-pressed={localVote === 1}
        title={signedIn ? "Upvote" : "Sign in to vote"}
        className={`${base} ${
          localVote === 1
            ? "bg-comic-green text-white"
            : "bg-paper-raised text-ink hover:bg-green-tint"
        }`}
      >
        ▲
      </button>

      <span
        className="font-display text-lg font-black tabular-nums"
        aria-live="polite"
      >
        {localScore}
      </span>

      <button
        onClick={() => vote(-1)}
        disabled={pending}
        aria-label={signedIn ? "Downvote this caption" : "Sign in to vote"}
        aria-pressed={localVote === -1}
        title={signedIn ? "Downvote" : "Sign in to vote"}
        className={`${base} ${
          localVote === -1
            ? "bg-comic-red text-white"
            : "bg-paper-raised text-ink hover:bg-red-tint"
        }`}
      >
        ▼
      </button>

      {!signedIn && (
        <span
          title="Sign in to rate"
          aria-hidden
          className="mt-0.5 text-[11px] leading-none text-ink-soft"
        >
          🔒
        </span>
      )}

      {error && (
        <span className="mt-0.5 w-20 rounded bg-red-tint px-1 py-0.5 text-center text-[10px] font-semibold leading-tight text-ink">
          {error}
        </span>
      )}
    </div>
  );
}
