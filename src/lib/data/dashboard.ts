import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sampleEvents } from "@/lib/sample-data";
import { getCollaboratorEvents } from "@/lib/data/collaborators";
import { TICKET_TYPE_LABELS } from "@/lib/constants";
import { eventEndsAt } from "@/lib/format";
import type {
  DiscountType,
  Event,
  Payment,
  Profile,
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

export type Participant = Ticket & { phone: string | null };

/**
 * Participants (tickets) d'un événement avec le téléphone de l'acheteur
 * (numéro saisi à l'achat, sinon celui du profil). L'accès est contrôlé en
 * amont par la page (propriétaire ou co-organisateur) ; on lit via le client
 * service-role pour que les co-organisateurs voient aussi la liste.
 */
export async function getEventParticipants(
  eventId: string
): Promise<Participant[]> {
  if (!isSupabaseConfigured) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("tickets")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  return withBuyerPhones(admin, (data as Ticket[]) ?? []);
}

async function withBuyerPhones(
  admin: ReturnType<typeof createAdminClient>,
  tickets: Ticket[]
): Promise<Participant[]> {
  const paymentIds = [
    ...new Set(tickets.map((t) => t.payment_id).filter((v): v is string => !!v)),
  ];
  const userIds = [
    ...new Set(tickets.map((t) => t.user_id).filter((v): v is string => !!v)),
  ];

  const [payments, profiles] = await Promise.all([
    paymentIds.length
      ? admin.from("payments").select("id, customer_phone").in("id", paymentIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? admin.from("profiles").select("id, phone").in("id", userIds)
      : Promise.resolve({ data: [] }),
  ]);

  const phoneByPayment = new Map(
    ((payments.data ?? []) as Pick<Payment, "id" | "customer_phone">[]).map(
      (p) => [p.id, p.customer_phone ?? null]
    )
  );
  const phoneByUser = new Map(
    ((profiles.data ?? []) as Pick<Profile, "id" | "phone">[]).map((p) => [
      p.id,
      p.phone,
    ])
  );

  return tickets.map((t) => ({
    ...t,
    phone:
      t.holder_phone ??
      (t.payment_id ? phoneByPayment.get(t.payment_id) : null) ??
      (t.user_id ? phoneByUser.get(t.user_id) : null) ??
      null,
  }));
}

/**
 * Récupération d'un ticket perdu côté organisateur : recherche par nom, email,
 * référence du billet ou téléphone de l'acheteur, limitée aux événements que
 * l'utilisateur gère (propriétaire ou co-organisateur).
 */
export async function searchMyEventTickets(
  query: string
): Promise<Participant[]> {
  if (!isSupabaseConfigured) return [];
  const q = query.trim().replace(/[%,()*]/g, "");
  if (!q) return [];

  const { owned, collaborated } = await getManageableEvents();
  const eventIds = [...owned, ...collaborated].map((e) => e.id);
  if (eventIds.length === 0) return [];

  const admin = createAdminClient();
  const like = `%${q}%`;
  const filters = [
    `holder_name.ilike.${like}`,
    `holder_email.ilike.${like}`,
    `qr_token.ilike.${like}`,
  ];

  const digits = q.replace(/\D/g, "");
  if (digits.length >= 6) {
    // Tolère les espaces / indicatif : « 77 352 53 82 », « +221773525382 »…
    const phoneLike = `%${digits.slice(-9).split("").join("%")}%`;
    const [{ data: pays }, { data: profs }] = await Promise.all([
      admin
        .from("payments")
        .select("id")
        .in("event_id", eventIds)
        .ilike("customer_phone", phoneLike)
        .limit(100),
      admin.from("profiles").select("id").ilike("phone", phoneLike).limit(100),
    ]);
    const { data: guests } = await admin
      .from("tickets")
      .select("id")
      .in("event_id", eventIds)
      .ilike("holder_phone", phoneLike)
      .limit(100);
    const guestIds = ((guests ?? []) as Pick<Ticket, "id">[]).map((t) => t.id);
    if (guestIds.length) filters.push(`id.in.(${guestIds.join(",")})`);
    const payIds = ((pays ?? []) as Pick<Payment, "id">[]).map((p) => p.id);
    const userIds = ((profs ?? []) as Pick<Profile, "id">[]).map((p) => p.id);
    if (payIds.length) filters.push(`payment_id.in.(${payIds.join(",")})`);
    if (userIds.length) filters.push(`user_id.in.(${userIds.join(",")})`);
  }

  const { data } = await admin
    .from("tickets")
    .select("*, event:events(*)")
    .in("event_id", eventIds)
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(50);
  return withBuyerPhones(admin, (data as Ticket[]) ?? []);
}

/**
 * Invitations (billets gratuits) d'un événement. `ready` est faux tant que la
 * migration 0021 n'a pas été appliquée.
 */
export async function getEventInvitations(
  eventId: string
): Promise<{ ready: boolean; invitations: Participant[] }> {
  if (!isSupabaseConfigured) return { ready: true, invitations: [] };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tickets")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_invitation", true)
    .order("created_at", { ascending: false });
  if (error) return { ready: false, invitations: [] };
  return {
    ready: true,
    invitations: ((data as Ticket[]) ?? []).map((t) => ({
      ...t,
      phone: t.holder_phone ?? null,
    })),
  };
}

export interface DailySales {
  key: string;
  label: string;
  weekday: string;
  weekend: boolean;
  tickets: number;
  revenue: number;
}

export interface CategorySales {
  name: string;
  tickets: number;
  revenue: number;
  scanned: number;
}

export interface EventSalesStats {
  daily: DailySales[];
  categories: CategorySales[];
  totalTickets: number;
  totalRevenue: number;
  scanned: number;
  invitations: number;
  invitationsScanned: number;
}

type SalesTicketRow = Pick<
  Ticket,
  "created_at" | "price" | "status" | "tier_name" | "ticket_type" | "is_invitation"
>;

const DAY_MS = 86_400_000;

/**
 * Ventes d'un événement par jour (UTC = heure du Sénégal) et par catégorie.
 * Seuls les billets valides ou utilisés comptent ; les invitations sont
 * comptées à part et ne génèrent aucun revenu.
 */
export async function getEventSalesStats(event: Event): Promise<EventSalesStats> {
  const empty: EventSalesStats = {
    daily: [],
    categories: [],
    totalTickets: 0,
    totalRevenue: 0,
    scanned: 0,
    invitations: 0,
    invitationsScanned: 0,
  };
  if (!isSupabaseConfigured) return empty;

  const admin = createAdminClient();
  const rows: SalesTicketRow[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data } = await admin
      .from("tickets")
      .select("created_at, price, status, tier_name, ticket_type, is_invitation")
      .eq("event_id", event.id)
      .in("status", ["valid", "used"])
      .order("created_at")
      .range(from, from + PAGE - 1);
    const page = (data as SalesTicketRow[]) ?? [];
    rows.push(...page);
    if (page.length < PAGE) break;
  }

  const sales = rows.filter((t) => !t.is_invitation);
  const invitations = rows.filter((t) => t.is_invitation);

  const byCategory = new Map<string, CategorySales>();
  const byDay = new Map<string, { tickets: number; revenue: number }>();
  for (const t of sales) {
    const name = t.tier_name ?? TICKET_TYPE_LABELS[t.ticket_type];
    const cat = byCategory.get(name) ?? { name, tickets: 0, revenue: 0, scanned: 0 };
    cat.tickets += 1;
    cat.revenue += t.price;
    if (t.status === "used") cat.scanned += 1;
    byCategory.set(name, cat);

    const key = t.created_at.slice(0, 10);
    const day = byDay.get(key) ?? { tickets: 0, revenue: 0 };
    day.tickets += 1;
    day.revenue += t.price;
    byDay.set(key, day);
  }

  const daily: DailySales[] = [];
  if (sales.length) {
    const first = Date.parse(`${sales[0].created_at.slice(0, 10)}T00:00:00Z`);
    const lastSale = Date.parse(`${sales[sales.length - 1].created_at.slice(0, 10)}T00:00:00Z`);
    const end = Math.max(lastSale, Math.min(Date.now(), eventEndsAt(event).getTime()));
    for (let t = first; t <= end; t += DAY_MS) {
      const d = new Date(t);
      const key = d.toISOString().slice(0, 10);
      const day = byDay.get(key) ?? { tickets: 0, revenue: 0 };
      daily.push({
        key,
        label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }),
        weekday: d.toLocaleDateString("fr-FR", { weekday: "short", timeZone: "UTC" }),
        weekend: d.getUTCDay() === 0 || d.getUTCDay() === 6,
        ...day,
      });
    }
  }

  return {
    daily,
    categories: [...byCategory.values()].sort((a, b) => b.tickets - a.tickets),
    totalTickets: sales.length,
    totalRevenue: sales.reduce((s, t) => s + t.price, 0),
    scanned: sales.filter((t) => t.status === "used").length,
    invitations: invitations.length,
    invitationsScanned: invitations.filter((t) => t.status === "used").length,
  };
}
