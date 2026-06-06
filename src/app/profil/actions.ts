"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface ProfileFormState {
  error?: string;
  success?: boolean;
}

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  if (!isSupabaseConfigured) {
    return { error: "Mode démo : configurez Supabase." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connexion requise." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("full_name") || ""),
      phone: String(formData.get("phone") || ""),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/profil");
  return { success: true };
}
