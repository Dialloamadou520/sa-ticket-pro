"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { slugify } from "@/lib/slug";
import type { TicketType } from "@/lib/types";

export interface EventFormState {
  error?: string;
  success?: boolean;
}

/** Ensure the current user has an organizer record; returns its id. */
async function ensureOrganizer(): Promise<{ id: string; userId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("organizers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return { id: existing.id, userId: user.id };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: created } = await supabase
    .from("organizers")
    .insert({ user_id: user.id, company_name: profile?.full_name || "Organisateur" })
    .select("id")
    .single();

  // Promote the user to organizer role if needed.
  await supabase.from("profiles").update({ role: "organizer" }).eq("id", user.id);

  return created ? { id: created.id, userId: user.id } : null;
}

function parseEvent(formData: FormData) {
  const date = String(formData.get("date"));
  const time = String(formData.get("time") || "20:00");
  return {
    title: String(formData.get("title")).trim(),
    description: String(formData.get("description") || ""),
    banner_url: String(formData.get("banner_url") || "") || null,
    category_id: String(formData.get("category_id") || "") || null,
    location: String(formData.get("location")).trim(),
    city: String(formData.get("city") || "") || null,
    starts_at: new Date(`${date}T${time}`).toISOString(),
    capacity: Number(formData.get("capacity") || 0),
    price: Number(formData.get("price") || 0),
    ticket_type: String(formData.get("ticket_type") || "standard") as TicketType,
    status: String(formData.get("status") || "pending"),
  };
}

export async function createEvent(
  _prev: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  if (!isSupabaseConfigured) {
    return {
      error:
        "Mode démo : configurez Supabase pour enregistrer réellement vos événements.",
    };
  }
  const organizer = await ensureOrganizer();
  if (!organizer) return { error: "Vous devez être connecté." };

  const values = parseEvent(formData);
  if (!values.title || !values.location) {
    return { error: "Le titre et le lieu sont obligatoires." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    ...values,
    slug: slugify(values.title),
    organizer_id: organizer.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/evenements");
  return { success: true };
}

export async function updateEvent(
  id: string,
  _prev: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  if (!isSupabaseConfigured) {
    return { error: "Mode démo : configurez Supabase." };
  }
  const organizer = await ensureOrganizer();
  if (!organizer) return { error: "Vous devez être connecté." };

  const values = parseEvent(formData);
  const supabase = await createClient();
  const { error } = await supabase.from("events").update(values).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/evenements");
  return { success: true };
}

export async function deleteEvent(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/dashboard/evenements");
}
