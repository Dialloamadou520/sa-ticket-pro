import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Event, EventController } from "@/lib/types";

/** Contrôleurs assignés à un événement (lecture réservée à l'organisateur). */
export async function getEventControllers(
  eventId: string
): Promise<EventController[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_controllers")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  return (data as EventController[]) ?? [];
}

/**
 * Nombre d'entrées validées (scans « valid ») par contrôleur pour un événement,
 * indexé par email en minuscules. Lecture via le client service-role : on doit
 * relier les scans aux profils (email) d'autres utilisateurs.
 */
export async function getEventControllerScanCounts(
  eventId: string
): Promise<Record<string, number>> {
  if (!isSupabaseConfigured) return {};
  const admin = createAdminClient();
  const { data } = await admin
    .from("scans")
    .select("scanned_by, ticket:tickets!inner(event_id)")
    .eq("result", "valid")
    .eq("ticket.event_id", eventId);

  const rows = (data as { scanned_by: string | null }[] | null) ?? [];
  const byUser = new Map<string, number>();
  for (const row of rows) {
    if (!row.scanned_by) continue;
    byUser.set(row.scanned_by, (byUser.get(row.scanned_by) ?? 0) + 1);
  }
  if (byUser.size === 0) return {};

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email")
    .in("id", [...byUser.keys()]);

  const counts: Record<string, number> = {};
  for (const p of (profiles as { id: string; email: string | null }[] | null) ?? []) {
    if (!p.email) continue;
    counts[p.email.toLowerCase()] = byUser.get(p.id) ?? 0;
  }
  return counts;
}

/** Identifiants des événements où l'utilisateur courant est contrôleur. */
export async function getControllerEventIds(): Promise<string[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return [];
  const { data } = await supabase
    .from("event_controllers")
    .select("event_id")
    .ilike("email", user.email);
  return (data as { event_id: string }[] | null)?.map((r) => r.event_id) ?? [];
}

/** Événements assignés au contrôleur courant (peu importe leur statut). */
export async function getControllerEvents(): Promise<Event[]> {
  const ids = await getControllerEventIds();
  if (ids.length === 0) return [];
  // Le contrôleur n'est pas propriétaire : on lit via le client service-role
  // (le RLS « events » ne laisse voir que les événements publiés ou les siens).
  const admin = createAdminClient();
  const { data } = await admin
    .from("events")
    .select("*, category:categories(*)")
    .in("id", ids)
    .order("starts_at", { ascending: true });
  return (data as Event[]) ?? [];
}
