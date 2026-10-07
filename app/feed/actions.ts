"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type VoteResult = { error?: string };

/**
 * Casts, changes or retracts the caller's vote on one caption.
 *
 * Voting requires a session: anonymous callers are rejected here, and the RLS
 * policy on `votes` would reject the write anyway even if this check were
 * bypassed. Clicking the same arrow twice retracts the vote.
 */
export async function castVote(
  generationId: number,
  value: 1 | -1,
): Promise<VoteResult> {
  if (value !== 1 && value !== -1) return { error: "Invalid vote." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in to vote." };

  // RLS limits this read to the caller's own vote.
  const { data: existing } = await supabase
    .from("votes")
    .select("id, value")
    .eq("generation_id", generationId)
    .maybeSingle();

  if (existing && existing.value === value) {
    const { error } = await supabase.from("votes").delete().eq("id", existing.id);
    if (error) return { error: `Could not retract vote: ${error.message}` };
  } else if (existing) {
    const { error } = await supabase
      .from("votes")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return { error: `Could not change vote: ${error.message}` };
  } else {
    const { error } = await supabase.from("votes").insert({
      generation_id: generationId,
      user_id: user.id,
      value,
    });
    if (error) return { error: `Could not save vote: ${error.message}` };
  }

  revalidatePath("/");
  return {};
}
