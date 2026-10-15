"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type NewJokeState = { error?: string };

export async function createJoke(
  _prev: NewJokeState,
  formData: FormData,
): Promise<NewJokeState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in to add a joke." };

  const setup = String(formData.get("setup") ?? "").trim();
  const punchline = String(formData.get("punchline") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();

  if (!setup || !punchline) {
    return { error: "Setup and punchline are both required." };
  }
  if (setup.length > 200 || punchline.length > 200) {
    return { error: "Setup and punchline need to be 200 characters or fewer." };
  }
  if (category.length > 40) {
    return { error: "Category needs to be 40 characters or fewer." };
  }

  const { error } = await supabase.from("jokes").insert({
    setup,
    punchline,
    category: category || null,
    user_id: user.id,
  });

  if (error) return { error: `Could not save joke: ${error.message}` };

  revalidatePath("/jokes");
  redirect("/jokes");
}
