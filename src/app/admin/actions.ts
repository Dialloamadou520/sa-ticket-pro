"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function setEventStatus(id: string, status: "published" | "rejected") {
  if (!isSupabaseConfigured) return;
  const supabase = await createClient();
  await supabase.from("events").update({ status }).eq("id", id);
  revalidatePath("/admin");
}

export async function approveEvent(id: string) {
  await setEventStatus(id, "published");
}

export async function rejectEvent(id: string) {
  await setEventStatus(id, "rejected");
}
