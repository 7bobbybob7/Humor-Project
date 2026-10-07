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

  const base =
    "flex h-7 w-7 items-center justify-center rounded-md border text-sm transition disabled:opacity-50";

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => vote(1)}
        disabled={pending}
        aria-label="Upvote"
        aria-pressed={localVote === 1}
        title={signedIn ? "Upvote" : "Sign in to vote"}
        className={`${base} ${
          localVote === 1
            ? "border-green-600 bg-green-600/15 text-green-700 dark:text-green-400"
            : "border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        }`}
      >
        ▲
      </button>

      <span className="min-w-6 text-center text-sm font-semibold tabular-nums">
        {localScore}
      </span>

      <button
        onClick={() => vote(-1)}
        disabled={pending}
        aria-label="Downvote"
        aria-pressed={localVote === -1}
        title={signedIn ? "Downvote" : "Sign in to vote"}
        className={`${base} ${
          localVote === -1
            ? "border-red-600 bg-red-600/15 text-red-700 dark:text-red-400"
            : "border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        }`}
      >
        ▼
      </button>

      {error && (
        <span className="w-24 text-center text-[10px] leading-tight text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </div>
  );
}
