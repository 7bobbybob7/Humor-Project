"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markRequestFailed, runGeneration } from "@/lib/pipeline";

export type GenerateState = { error?: string };

const MAX_TOPIC_LENGTH = 120;

export async function generate(
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in to generate captions." };

  const topic = String(formData.get("topic") ?? "").trim();
  if (!topic) return { error: "Give the model something to work with." };
  if (topic.length > MAX_TOPIC_LENGTH) {
    return { error: `Keep the topic under ${MAX_TOPIC_LENGTH} characters.` };
  }

  // Copied onto each row so the public feed can show attribution without
  // needing read access to the profiles table. Attribution is cosmetic, so
  // losing it must not sink an otherwise good generation.
  let authorFirstName: string | null = null;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .maybeSingle();
    authorFirstName = profile?.first_name ?? null;
  } catch {
    // Leave the captions unattributed.
  }

  let result;
  try {
    result = await runGeneration(user.id, topic);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "The model call failed.",
    };
  }

  // Anything thrown past this point reaches the browser as the generic error
  // page rather than a message this form can show, so the save is guarded as
  // well as checked. redirect() stays outside: it works by throwing.
  try {
    const { error } = await supabase.from("generations").insert(
      result.captions.map((caption) => ({
        user_id: user.id,
        author_first_name: authorFirstName,
        prompt: topic,
        system_prompt: result.systemPrompt,
        model: result.model,
        request_id: result.requestId,
        caption,
      })),
    );

    if (error) {
      // The pipeline already marked the request succeeded when the model
      // answered. The captions never landed, so correct that rather than
      // leaving a request claiming captions that do not exist.
      await markRequestFailed(result.requestId, `Saving captions failed: ${error.message}`);
      return { error: `Could not save the captions: ${error.message}` };
    }
  } catch (e) {
    const reason =
      e instanceof Error ? e.message : "The database was unreachable.";
    await markRequestFailed(result.requestId, `Saving captions failed: ${reason}`);
    return { error: `Could not save the captions: ${reason}` };
  }

  revalidatePath("/");
  redirect(`/?sort=new&posted=${result.captions.length}`);
}
