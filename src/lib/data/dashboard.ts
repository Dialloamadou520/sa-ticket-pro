import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sampleEvents } from "@/lib/sample-data";
import { getCollaboratorEvents } from "@/lib/data/collaborators";
import type { Event, Ticket } from "@/lib/types";

export interface OrganizerStats {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  publishedEvents: number;
}

export async function getMyEvents(): Promise<Event[]> {
  if (!isSupabaseConfigured) return sampleEvents;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: organizer } = await supabase
    .from("organizers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!organizer) return [];

  const { data } = await supabase
    .from("events")
    .select("*, category:categories(*)")
    .eq("organizer_id", organizer.id)
    .order("created_at", { ascending: false });

  return (data as Event[]) ?? [];
}

/**
 * Événements que l'utilisateur courant peut gérer : ceux qu'il possède et ceux
 * où il est co-organisateur. Les revenus ne sont jamais calculés ici.
 */
export async function getManageableEvents(): Promise<{
  owned: Event[];
  collaborated: Event[];
}> {
  const [owned, collaborated] = await Promise.all([
    getMyEvents(),
    getCollaboratorEvents(),
  ]);
  const ownedIds = new Set(owned.map((e) => e.id));
  return {
    owned,
    collaborated: collaborated.filter((e) => !ownedIds.has(e.id)),
  };
}

/** Un événement géré par l'utilisateur (propriétaire ou co-organisateur), sinon null. */
export async function getManageableEventById(
  id: string
): Promise<{ event: Event; isOwner: boolean } | null> {
  if (!isSupabaseConfigured) {
    const demo = sampleEvents.find((e) => e.id === id);
    return demo ? { event: demo, isOwner: true } : null;
  }
  const { owned, collaborated } = await getManageableEvents();
  const ownedEvent = owned.find((e) => e.id === id);
  if (ownedEvent) return { event: ownedEvent, isOwner: true };
  const collabEvent = collaborated.find((e) => e.id === id);
  if (collabEvent) return { event: collabEvent, isOwner: false };
  return null;
}

export async function getOrganizerStats(): Promise<OrganizerStats> {
  const events = await getMyEvents();
  return {
    totalEvents: events.length,
    publishedEvents: events.filter((e) => e.status === "published").length,
    totalTicketsSold: events.reduce((s, e) => s + e.tickets_sold, 0),
    totalRevenue: events.reduce((s, e) => s + e.tickets_sold * e.price, 0),
  };
}

/**
 * Participants (tickets) d'un événement. L'accès est contrôlé en amont par la
 * page (propriétaire ou co-organisateur) ; on lit via le client service-role
 * pour que les co-organisateurs voient aussi la liste.
 */
export async function getEventParticipants(eventId: string): Promise<Ticket[]> {
  if (!isSupabaseConfigured) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("tickets")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  return (data as Ticket[]) ?? [];
}
