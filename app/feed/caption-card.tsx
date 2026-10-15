import type { Generation } from "@/lib/generations";
import { VoteButtons } from "./vote-buttons";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const RANK_STYLES = [
  "bg-comic-yellow text-ink-fixed",
  "bg-blue-tint text-ink",
  "bg-red-tint text-ink",
];

export function CaptionCard({
  generation,
  myVote,
  signedIn,
  rank,
  leading = false,
}: {
  generation: Generation;
  myVote: number | undefined;
  signedIn: boolean;
  rank?: number;
  leading?: boolean;
}) {
  return (
    <li
      className={`panel panel-hover flex gap-4 p-4 sm:p-5 ${
        leading ? "bg-yellow-tint ring-4 ring-comic-yellow" : ""
      }`}
    >
      <VoteButtons
        generationId={generation.id}
        score={generation.score}
        myVote={myVote}
        signedIn={signedIn}
      />

      <div className="min-w-0 flex-1">
        {leading && (
          <span className="mb-2 mr-2 inline-block rounded-full border-2 border-ink bg-comic-red px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide text-white">
            Out in front
          </span>
        )}

        {rank !== undefined && rank < 3 && (
          <span
            className={`mb-2 inline-block rounded-full border-2 border-ink px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ${RANK_STYLES[rank]}`}
          >
            No. {rank + 1}
          </span>
        )}

        <p className="font-display text-lg font-bold leading-snug break-words sm:text-xl">
          {generation.caption}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
          <span className="max-w-full truncate rounded-full bg-yellow-tint px-2.5 py-1 font-semibold text-ink">
            {generation.prompt}
          </span>
          <span className="font-medium">by {generation.author_first_name ?? "someone"}</span>
          <span aria-hidden>·</span>
          <span>{timeAgo(generation.created_at)}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">
            {generation.up_votes} up / {generation.down_votes} down
          </span>
        </div>
      </div>
    </li>
  );
}
