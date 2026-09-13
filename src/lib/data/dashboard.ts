import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sampleEvents } from "@/lib/sample-data";
import { getCollaboratorEvents } from "@/lib/data/collaborators";
import type {
  DiscountType,
  Event,
  Payment,
  PromoCode,
  Ticket,
} from "@/lib/types";

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

/** Code promo enrichi des ventes réalisées sur les événements de l'organisateur. */
export interface OrganizerPromoCodeStats {
  id: string;
  code: string;
  owner_name: string;
  discount_type: DiscountType;
  discount_value: number;
  active: boolean;
  eventTitle: string | null;
  ticketsSold: number;
  revenue: number;
  discountGiven: number;
}

/**
 * Classement, en lecture seule, des codes promo utilisables sur les événements
 * dont l'utilisateur est propriétaire (codes dédiés + codes valables partout).
 * Les ventes comptées sont uniquement celles de ses propres événements.
 */
export async function getMyPromoCodeStats(): Promise<OrganizerPromoCodeStats[]> {
  if (!isSupabaseConfigured) return [];

  const events = await getMyEvents();
  if (events.length === 0) return [];
  const eventIds = events.map((e) => e.id);
  const titleById = new Map(events.map((e) => [e.id, e.title]));

  const admin = createAdminClient();
  const [{ data: codes }, { data: payments }] = await Promise.all([
    admin
      .from("promo_codes")
      .select("*")
      .or(`event_id.is.null,event_id.in.(${eventIds.join(",")})`)
      .order("created_at", { ascending: false }),
    admin
      .from("payments")
      .select("promo_code_id, quantity, amount, discount")
      .eq("status", "paid")
      .in("event_id", eventIds)
      .not("promo_code_id", "is", null),
  ]);

  const rows = (payments ?? []) as Pick<
    Payment,
    "promo_code_id" | "quantity" | "amount" | "discount"
  >[];
  const byCode = new Map<
    string,
    { ticketsSold: number; revenue: number; discountGiven: number }
  >();
  for (const p of rows) {
    if (!p.promo_code_id) continue;
    const acc = byCode.get(p.promo_code_id) ?? {
      ticketsSold: 0,
      revenue: 0,
      discountGiven: 0,
    };
    acc.ticketsSold += p.quantity ?? 0;
    acc.revenue += p.amount ?? 0;
    acc.discountGiven += p.discount ?? 0;
    byCode.set(p.promo_code_id, acc);
  }

  return ((codes ?? []) as PromoCode[])
    .map((c) => ({
      id: c.id,
      code: c.code,
      owner_name: c.owner_name,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      active: c.active,
      eventTitle: c.event_id ? (titleById.get(c.event_id) ?? null) : null,
      ...(byCode.get(c.id) ?? { ticketsSold: 0, revenue: 0, discountGiven: 0 }),
    }))
    .sort((a, b) => b.ticketsSold - a.ticketsSold || b.revenue - a.revenue);
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
