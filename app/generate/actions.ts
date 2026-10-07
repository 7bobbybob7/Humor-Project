"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateCaptions } from "@/lib/gemini";

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
  // needing read access to the profiles table.
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .maybeSingle();

  let result;
  try {
    result = await generateCaptions(topic);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "The model call failed.",
    };
  }

  const { error } = await supabase.from("generations").insert(
    result.captions.map((caption) => ({
      user_id: user.id,
      author_first_name: profile?.first_name ?? null,
      prompt: topic,
      system_prompt: result.prompt,
      model: result.model,
      caption,
    })),
  );

  if (error) return { error: `Could not save the captions: ${error.message}` };

  revalidatePath("/");
  redirect("/?sort=new");
}
