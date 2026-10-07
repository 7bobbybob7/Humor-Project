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

export function CaptionCard({
  generation,
  myVote,
  signedIn,
}: {
  generation: Generation;
  myVote: number | undefined;
  signedIn: boolean;
}) {
  return (
    <li className="flex gap-4 rounded-lg border border-black/10 p-5 dark:border-white/15">
      <VoteButtons
        generationId={generation.id}
        score={generation.score}
        myVote={myVote}
        signedIn={signedIn}
      />

      <div className="min-w-0 flex-1">
        <p className="font-medium">{generation.caption}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs opacity-60">
          <span className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">
            {generation.prompt}
          </span>
          <span>·</span>
          <span>{generation.author_first_name ?? "someone"}</span>
          <span>·</span>
          <span>{timeAgo(generation.created_at)}</span>
          <span>·</span>
          <span>
            ▲{generation.up_votes} ▼{generation.down_votes}
          </span>
        </div>
      </div>
    </li>
  );
}
