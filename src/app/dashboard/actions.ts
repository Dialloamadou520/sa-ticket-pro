"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { slugify } from "@/lib/slug";
import type { TicketType } from "@/lib/types";

interface TierInput {
  name: string;
  price: number;
  capacity: number;
}

function parseTiers(formData: FormData): TierInput[] {
  const raw = String(formData.get("tiers_json") || "");
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as Array<{
      name?: string;
      price?: number | string;
      capacity?: number | string;
    }>;
    return arr
      .map((t) => ({
        name: String(t.name ?? "").trim(),
        price: Math.max(0, Number(t.price) || 0),
        capacity: Math.max(0, Number(t.capacity) || 0),
      }))
      .filter((t) => t.name.length > 0);
  } catch {
    return [];
  }
}

/**
 * Remplace les catégories de tickets d'un événement (delete + insert) via le
 * client service-role (l'appelant a déjà été authentifié comme propriétaire).
 */
async function syncTiers(eventId: string, tiers: TierInput[]): Promise<void> {
  const admin = createAdminClient();
  await admin.from("ticket_tiers").delete().eq("event_id", eventId);
  if (tiers.length === 0) return;
  await admin.from("ticket_tiers").insert(
    tiers.map((t, i) => ({
      event_id: eventId,
      name: t.name,
      price: t.price,
      capacity: t.capacity,
      position: i,
    }))
  );
}

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

/**
 * Jauge « marketing » affichée au public : entier 0–100, ou null si le champ
 * est laissé vide (aucune jauge affichée).
 */
function parseFillPercent(formData: FormData): number | null {
  const raw = String(formData.get("display_fill_percent") || "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Vrai si l'erreur vient de la colonne `display_fill_percent` absente : la
 * migration 0010 n'est pas encore appliquée, on réessaie sans ce champ pour ne
 * pas bloquer la création/modification d'événements.
 */
function isMissingFillColumn(message: string): boolean {
  return message.includes("display_fill_percent");
}

function withoutFillPercent<T extends { display_fill_percent: number | null }>(
  values: T,
): Omit<T, "display_fill_percent"> {
  const copy = { ...values };
  delete (copy as { display_fill_percent?: number | null }).display_fill_percent;
  return copy;
}

function parseEvent(formData: FormData) {
  const date = String(formData.get("date"));
  const time = String(formData.get("time") || "20:00");
  const startsAt = new Date(`${date}T${time}`);
  const endTime = String(formData.get("end_time") || "");
  let endsAt: Date | null = endTime ? new Date(`${date}T${endTime}`) : null;
  // Une fin antérieure au début signifie que l'événement se termine après minuit.
  if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
    endsAt = new Date(endsAt.getTime() + 86_400_000);
  }
  return {
    title: String(formData.get("title")).trim(),
    description: String(formData.get("description") || ""),
    banner_url: String(formData.get("banner_url") || "") || null,
    category_id: String(formData.get("category_id") || "") || null,
    location: String(formData.get("location")).trim(),
    city: String(formData.get("city") || "") || null,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt ? endsAt.toISOString() : null,
    capacity: Number(formData.get("capacity") || 0),
    price: Number(formData.get("price") || 0),
    ticket_type: String(formData.get("ticket_type") || "standard") as TicketType,
    status: String(formData.get("status") || "pending"),
    display_fill_percent: parseFillPercent(formData),
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

  const tiers = parseTiers(formData);
  if (tiers.length > 0) {
    values.price = Math.min(...tiers.map((t) => t.price));
    const totalCapacity = tiers.reduce((s, t) => s + t.capacity, 0);
    if (totalCapacity > 0) values.capacity = totalCapacity;
  }

  const supabase = await createClient();
  const row = {
    ...values,
    slug: slugify(values.title),
    organizer_id: organizer.id,
  };
  let { data: created, error } = await supabase
    .from("events")
    .insert(row)
    .select("id")
    .single();
  if (error && isMissingFillColumn(error.message)) {
    ({ data: created, error } = await supabase
      .from("events")
      .insert(withoutFillPercent(row))
      .select("id")
      .single());
  }
  if (error || !created) return { error: error?.message ?? "Erreur." };

  await syncTiers(created.id, tiers);

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
  if (!(await canManageEvent(id))) {
    return { error: "Action non autorisée." };
  }

  const values = parseEvent(formData);
  const tiers = parseTiers(formData);
  if (tiers.length > 0) {
    values.price = Math.min(...tiers.map((t) => t.price));
    const totalCapacity = tiers.reduce((s, t) => s + t.capacity, 0);
    if (totalCapacity > 0) values.capacity = totalCapacity;
  }

  // Client service-role : un co-organisateur n'est pas propriétaire, le RLS
  // « events » bloquerait sa mise à jour. L'accès est déjà vérifié ci-dessus.
  const admin = createAdminClient();
  let { error } = await admin.from("events").update(values).eq("id", id);
  if (error && isMissingFillColumn(error.message)) {
    ({ error } = await admin
      .from("events")
      .update(withoutFillPercent(values))
      .eq("id", id));
  }
  if (error) return { error: error.message };

  await syncTiers(id, tiers);

  revalidatePath("/dashboard/evenements");
  return { success: true };
}

export async function deleteEvent(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  // Seul le propriétaire (ou l'admin) peut supprimer, pas un co-organisateur.
  if (!(await canOwnEvent(id))) return;
  const admin = createAdminClient();
  await admin.from("events").delete().eq("id", id);
  revalidatePath("/dashboard/evenements");
}

// -- Contrôleurs d'événement ---------------------------------------------------

export interface ControllerFormState {
  error?: string;
  success?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Vrai si l'utilisateur courant possède l'événement (ou est admin). */
async function canOwnEvent(eventId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role === "admin") return true;

  const { data: organizer } = await admin
    .from("organizers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!organizer) return false;

  const { data: event } = await admin
    .from("events")
    .select("organizer_id")
    .eq("id", eventId)
    .maybeSingle();
  return Boolean(event && event.organizer_id === organizer.id);
}

/**
 * Vrai si l'utilisateur courant peut gérer l'événement : propriétaire, admin,
 * ou co-organisateur (par email). Ne donne pas accès aux revenus.
 */
async function canManageEvent(eventId: string): Promise<boolean> {
  if (await canOwnEvent(eventId)) return true;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return false;

  const admin = createAdminClient();
  const { data: collab } = await admin
    .from("event_collaborators")
    .select("id")
    .eq("event_id", eventId)
    .ilike("email", user.email)
    .maybeSingle();
  return Boolean(collab);
}

export async function addController(
  eventId: string,
  _prev: ControllerFormState,
  formData: FormData
): Promise<ControllerFormState> {
  if (!isSupabaseConfigured) return { error: "Mode démo : configurez Supabase." };

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Adresse email invalide." };

  if (!(await canManageEvent(eventId))) {
    return { error: "Action non autorisée." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("event_controllers")
    .upsert({ event_id: eventId, email }, { onConflict: "event_id,email" });
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/evenements/${eventId}/controleurs`);
  return { success: true };
}

export async function removeController(
  eventId: string,
  controllerId: string
): Promise<void> {
  if (!isSupabaseConfigured) return;
  if (!(await canManageEvent(eventId))) return;
  const admin = createAdminClient();
  await admin.from("event_controllers").delete().eq("id", controllerId);
  revalidatePath(`/dashboard/evenements/${eventId}/controleurs`);
}

// -- Co-organisateurs d'événement ---------------------------------------------

export interface CollaboratorFormState {
  error?: string;
  success?: boolean;
}

export async function addCollaborator(
  eventId: string,
  _prev: CollaboratorFormState,
  formData: FormData
): Promise<CollaboratorFormState> {
  if (!isSupabaseConfigured) return { error: "Mode démo : configurez Supabase." };

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Adresse email invalide." };

  // Seul le propriétaire (ou l'admin) peut ajouter un co-organisateur.
  if (!(await canOwnEvent(eventId))) {
    return { error: "Action non autorisée." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("event_collaborators")
    .upsert({ event_id: eventId, email }, { onConflict: "event_id,email" });
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/evenements/${eventId}/co-organisateurs`);
  return { success: true };
}

export async function removeCollaborator(
  eventId: string,
  collaboratorId: string
): Promise<void> {
  if (!isSupabaseConfigured) return;
  if (!(await canOwnEvent(eventId))) return;
  const admin = createAdminClient();
  await admin.from("event_collaborators").delete().eq("id", collaboratorId);
  revalidatePath(`/dashboard/evenements/${eventId}/co-organisateurs`);
}
