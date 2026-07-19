import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Event, EventController } from "@/lib/types";

/**
 * Contrôleurs assignés à un événement. L'accès est contrôlé en amont par la
 * page (propriétaire ou co-organisateur) ; on lit via le client service-role
 * pour que les co-organisateurs voient aussi la liste.
 */
export async function getEventControllers(
  eventId: string
): Promise<EventController[]> {
  if (!isSupabaseConfigured) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("event_controllers")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  return (data as EventController[]) ?? [];
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
