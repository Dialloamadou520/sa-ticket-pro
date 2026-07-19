import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Event, EventCollaborator } from "@/lib/types";

/** Co-organisateurs assignés à un événement (lecture réservée au propriétaire). */
export async function getEventCollaborators(
  eventId: string
): Promise<EventCollaborator[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_collaborators")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  return (data as EventCollaborator[]) ?? [];
}

/** Identifiants des événements où l'utilisateur courant est co-organisateur. */
export async function getCollaboratorEventIds(): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return [];
  const { data } = await supabase
    .from("event_collaborators")
    .select("event_id")
    .ilike("email", user.email);
  return (data as { event_id: string }[] | null)?.map((r) => r.event_id) ?? [];
}

/** Événements où l'utilisateur courant est co-organisateur (tous statuts). */
export async function getCollaboratorEvents(): Promise<Event[]> {
  const ids = await getCollaboratorEventIds();
  if (ids.length === 0) return [];
  // Le co-organisateur n'est pas propriétaire : on lit via le client
  // service-role (le RLS « events » ne laisse voir que les événements publiés
  // ou les siens).
  const admin = createAdminClient();
  const { data } = await admin
    .from("events")
    .select("*, category:categories(*)")
    .in("id", ids)
    .order("created_at", { ascending: false });
  return (data as Event[]) ?? [];
}
