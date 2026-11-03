import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sampleEvents } from "@/lib/sample-data";
import type {
  Event,
  FeePayer,
  Organizer,
  Payment,
  Profile,
  PromoCode,
  Ticket,
  TicketTier,
} from "@/lib/types";

/** Code promo enrichi des ventes réalisées avec ce code. */
export interface PromoCodeStats extends PromoCode {
  event: Pick<Event, "id" | "title"> | null;
  /** Nombre de tickets vendus (paiements payés). */
  ticketsSold: number;
  /** Chiffre d'affaires encaissé, réduction déduite. */
  revenue: number;
  /** Total des réductions accordées. */
  discountGiven: number;
}

/**
 * Classement des codes promo par tickets vendus : sert à identifier le
 * collaborateur/ambassadeur qui vend le plus. Service-role (table admin).
 */
export async function getPromoCodeStats(): Promise<PromoCodeStats[]> {
  if (!isSupabaseConfigured) return [];
  const admin = createAdminClient();
  const [{ data: codes }, { data: payments }] = await Promise.all([
    admin
      .from("promo_codes")
      .select("*, event:events(id, title)")
      .order("created_at", { ascending: false }),
    admin
      .from("payments")
      .select("promo_code_id, quantity, amount, discount")
      .eq("status", "paid")
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

  return ((codes ?? []) as PromoCodeStats[])
    .map((c) => ({
      ...c,
      ...(byCode.get(c.id) ?? { ticketsSold: 0, revenue: 0, discountGiven: 0 }),
    }))
    .sort((a, b) => b.ticketsSold - a.ticketsSold || b.revenue - a.revenue);
}

/**
 * Recherche des tickets pour la récupération d'un billet perdu (admin).
 * Cherche par nom/email du participant ou par référence (début du `qr_token`).
 * Réservé à l'administration (page protégée par le layout admin).
 */
export type TicketKindFilter = "all" | "online" | "physical";

export async function searchTickets(
  query: string,
  kind: TicketKindFilter = "all",
): Promise<Ticket[]> {
  if (!isSupabaseConfigured) return [];
  const q = query.trim().replace(/[%,()]/g, "");
  if (!q) return [];
  const admin = createAdminClient();
  const like = `%${q}%`;
  const search = () =>
    admin
      .from("tickets")
      .select("*, event:events(*)")
      .or(
        `holder_email.ilike.${like},holder_name.ilike.${like},qr_token.ilike.${like}`,
      )
      .order("created_at", { ascending: false })
      .limit(50);
  if (kind === "all") {
    const { data } = await search();
    return (data as Ticket[]) ?? [];
  }
  const { data, error } = await search().eq("is_physical", kind === "physical");
  if (error) {
    // migration 0022 pas encore appliquée : aucun billet physique possible
    if (kind === "physical") return [];
    const { data: all } = await search();
    return (all as Ticket[]) ?? [];
  }
  return (data as Ticket[]) ?? [];
}

/** Billets physiques (papier) : générés (hors annulés) et entrés au scanner. */
export interface PhysicalTicketCounts {
  generated: number;
  entered: number;
}

/**
 * Billets physiques par événement. Les billets numériques sont comptés par
 * `events.tickets_sold`, que le trigger n'incrémente pas pour les billets
 * papier. Carte vide si la migration 0022 n'est pas appliquée.
 */
async function getPhysicalCountsByEvent(
  eventIds?: string[],
): Promise<Map<string, PhysicalTicketCounts>> {
  const counts = new Map<string, PhysicalTicketCounts>();
  if (eventIds && eventIds.length === 0) return counts;
  const admin = createAdminClient();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    let query = admin
      .from("tickets")
      .select("id, event_id, status")
      .eq("is_physical", true)
      .in("status", ["valid", "used"]);
    if (eventIds) query = query.in("event_id", eventIds);
    const { data, error } = await query
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) return counts;
    const rows = (data ?? []) as Pick<Ticket, "event_id" | "status">[];
    for (const t of rows) {
      const c = counts.get(t.event_id) ?? { generated: 0, entered: 0 };
      c.generated += 1;
      if (t.status === "used") c.entered += 1;
      counts.set(t.event_id, c);
    }
    if (rows.length < PAGE) break;
  }
  return counts;
}

function sumPhysical(
  counts: Map<string, PhysicalTicketCounts>,
  eventIds: string[],
): PhysicalTicketCounts {
  const total = { generated: 0, entered: 0 };
  for (const id of eventIds) {
    const c = counts.get(id);
    if (!c) continue;
    total.generated += c.generated;
    total.entered += c.entered;
  }
  return total;
}

export interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  pendingEvents: number;
  totalRevenue: number;
  platformCommission: number;
  /** Billets achetés en ligne (`events.tickets_sold`). */
  onlineTickets: number;
  physicalTickets: number;
  physicalEntered: number;
}

/** Commission de la plateforme par défaut (10%), quand un événement n'a pas de taux défini. */
export const PLATFORM_COMMISSION_RATE = 0.1;

/** Taux de commission effectif d'un événement (défaut plateforme si non défini). */
export function eventCommissionRate(rate: number | null | undefined): number {
  return rate ?? PLATFORM_COMMISSION_RATE;
}

export async function getAdminStats(): Promise<AdminStats> {
  if (!isSupabaseConfigured) {
    const revenue = sampleEvents.reduce((s, e) => s + e.tickets_sold * e.price, 0);
    return {
      totalUsers: 1280,
      totalEvents: sampleEvents.length,
      pendingEvents: 2,
      totalRevenue: revenue,
      platformCommission: Math.round(revenue * PLATFORM_COMMISSION_RATE),
      onlineTickets: sampleEvents.reduce((s, e) => s + e.tickets_sold, 0),
      physicalTickets: 0,
      physicalEntered: 0,
    };
  }

  const supabase = await createClient();
  const [{ count: users }, { data: events }, { data: payments }, physical] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      // `*` (plutôt que colonnes explicites) pour rester tolérant si la
      // colonne `commission_rate` n'est pas encore migrée (fallback 10 %).
      supabase.from("events").select("*"),
      supabase.from("payments").select("event_id, amount").eq("status", "paid"),
      getPhysicalCountsByEvent(),
    ]);

  const eventRows = (events ?? []) as Pick<
    Event,
    "id" | "status" | "tickets_sold" | "price" | "commission_rate"
  >[];
  const rateByEvent = new Map<string, number>();
  for (const e of eventRows) rateByEvent.set(e.id, eventCommissionRate(e.commission_rate));

  const paymentRows = (payments ?? []) as Pick<Payment, "event_id" | "amount">[];
  const revenue = paymentRows.reduce((s, p) => s + (p.amount ?? 0), 0);
  const platformCommission = paymentRows.reduce(
    (s, p) => s + (p.amount ?? 0) * (rateByEvent.get(p.event_id) ?? PLATFORM_COMMISSION_RATE),
    0,
  );

  return {
    totalUsers: users ?? 0,
    totalEvents: eventRows.length,
    pendingEvents: eventRows.filter((e) => e.status === "pending").length,
    totalRevenue: revenue,
    platformCommission: Math.round(platformCommission),
    onlineTickets: eventRows.reduce((s, e) => s + (e.tickets_sold ?? 0), 0),
    physicalTickets: [...physical.values()].reduce((s, c) => s + c.generated, 0),
    physicalEntered: [...physical.values()].reduce((s, c) => s + c.entered, 0),
  };
}

export async function getPendingEvents(): Promise<Event[]> {
  if (!isSupabaseConfigured) {
    return sampleEvents.slice(0, 2).map((e) => ({ ...e, status: "pending" }));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*, category:categories(*)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return (data as Event[]) ?? [];
}

export interface AdminEvent extends Event {
  organizer: Pick<Organizer, "id" | "company_name"> | null;
  revenue: number;
  commission: number;
  /** Taux effectif appliqué (0–1). */
  commissionRate: number;
  physical: PhysicalTicketCounts;
}

/** Liste tous les événements de la plateforme (tous statuts, tous organisateurs). */
export async function getAllEvents(): Promise<AdminEvent[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const [{ data: events }, { data: payments }, physical] = await Promise.all([
    supabase
      .from("events")
      .select("*, category:categories(*), organizer:organizers(id, company_name)")
      .order("created_at", { ascending: false }),
    supabase.from("payments").select("event_id, amount").eq("status", "paid"),
    getPhysicalCountsByEvent(),
  ]);

  const paymentRows = (payments ?? []) as Pick<Payment, "event_id" | "amount">[];
  const revenueByEvent = new Map<string, number>();
  for (const p of paymentRows) {
    revenueByEvent.set(
      p.event_id,
      (revenueByEvent.get(p.event_id) ?? 0) + (p.amount ?? 0),
    );
  }

  return ((events as (Event & { organizer: Pick<Organizer, "id" | "company_name"> | null })[]) ?? []).map((e) => {
    const revenue = revenueByEvent.get(e.id) ?? 0;
    const rate = eventCommissionRate(e.commission_rate);
    return {
      ...e,
      organizer: e.organizer ?? null,
      revenue,
      commission: Math.round(revenue * rate),
      commissionRate: rate,
      physical: physical.get(e.id) ?? { generated: 0, entered: 0 },
    };
  });
}

/** Événement et ses catégories de tickets, pour le réglage des frais. */
export interface EventWithTiers {
  id: string;
  title: string;
  slug: string;
  price: number;
  /** Taux propre à l'événement. `null` = taux global. */
  fee_percent: number | null;
  /** Qui supporte les frais de cet événement. */
  fee_payer: FeePayer;
  tiers: TicketTier[];
}

/**
 * Événements publiés ou à venir avec leurs catégories (Standard, VIP…) :
 * support du réglage des frais de service par catégorie côté admin.
 */
export async function getEventsWithTiers(): Promise<EventWithTiers[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id, title, slug, price, fee_percent, fee_payer, tiers:ticket_tiers(*)")
    .order("created_at", { ascending: false });
  return ((data as EventWithTiers[]) ?? []).map((e) => ({
    ...e,
    fee_percent: e.fee_percent ?? null,
    fee_payer: e.fee_payer === "organizer" ? "organizer" : "buyer",
    tiers: [...(e.tiers ?? [])].sort((a, b) => a.position - b.position),
  }));
}

export interface MonthlyRevenue {
  /** Clé triable au format `YYYY-MM`. */
  key: string;
  /** Libellé lisible, ex. « juin 2026 ». */
  label: string;
  revenue: number;
  commission: number;
  ticketsSold: number;
}

/** Revenus encaissés (paiements « paid ») agrégés par mois, du plus récent au plus ancien. */
export async function getMonthlyRevenue(): Promise<MonthlyRevenue[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const [{ data }, { data: events }] = await Promise.all([
    supabase
      .from("payments")
      .select("event_id, amount, quantity, created_at")
      .eq("status", "paid"),
    supabase.from("events").select("*"),
  ]);

  const rows = (data ?? []) as Pick<
    Payment,
    "event_id" | "amount" | "quantity" | "created_at"
  >[];
  const rateByEvent = new Map<string, number>();
  for (const e of (events ?? []) as Pick<Event, "id" | "commission_rate">[]) {
    rateByEvent.set(e.id, eventCommissionRate(e.commission_rate));
  }

  const byMonth = new Map<
    string,
    { revenue: number; commission: number; ticketsSold: number }
  >();
  for (const p of rows) {
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const acc = byMonth.get(key) ?? { revenue: 0, commission: 0, ticketsSold: 0 };
    const amount = p.amount ?? 0;
    acc.revenue += amount;
    acc.commission +=
      amount * (rateByEvent.get(p.event_id) ?? PLATFORM_COMMISSION_RATE);
    acc.ticketsSold += p.quantity ?? 0;
    byMonth.set(key, acc);
  }

  return Array.from(byMonth.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, v]) => {
      const [year, month] = key.split("-").map(Number);
      const label = new Date(year, month - 1, 1).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
      return {
        key,
        label,
        revenue: v.revenue,
        commission: Math.round(v.commission),
        ticketsSold: v.ticketsSold,
      };
    });
}

export async function getAllUsers(): Promise<Profile[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as Profile[]) ?? [];
}

export interface OrganizerWithStats extends Organizer {
  owner: Pick<Profile, "full_name" | "email" | "phone"> | null;
  eventsCount: number;
  publishedEvents: number;
  ticketsSold: number;
  physicalTickets: number;
  physicalEntered: number;
  revenue: number;
  commission: number;
}

type OrganizerRow = Organizer & {
  owner: Pick<Profile, "full_name" | "email" | "phone"> | null;
};

/** Liste tous les organisateurs avec leurs statistiques d'activité. */
export async function getAllOrganizers(): Promise<OrganizerWithStats[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();

  const [{ data: organizers }, { data: events }, { data: payments }, physical] =
    await Promise.all([
      supabase
        .from("organizers")
        .select("*, owner:profiles(full_name, email, phone)")
        .order("created_at", { ascending: false }),
      // `*` pour rester tolérant si `commission_rate` n'est pas encore migré.
      supabase.from("events").select("*"),
      supabase.from("payments").select("event_id, amount").eq("status", "paid"),
      getPhysicalCountsByEvent(),
    ]);

  const eventRows = (events ?? []) as Pick<
    Event,
    "id" | "organizer_id" | "status" | "tickets_sold" | "price" | "commission_rate"
  >[];
  const paymentRows = (payments ?? []) as Pick<Payment, "event_id" | "amount">[];

  // event_id -> organizer_id (pour rattacher les paiements à un organisateur).
  const eventToOrganizer = new Map<string, string>();
  const rateByEvent = new Map<string, number>();
  for (const e of eventRows) {
    eventToOrganizer.set(e.id, e.organizer_id);
    rateByEvent.set(e.id, eventCommissionRate(e.commission_rate));
  }

  // organizer_id -> revenus encaissés et commission (somme des paiements "paid").
  const revenueByOrganizer = new Map<string, number>();
  const commissionByOrganizer = new Map<string, number>();
  for (const p of paymentRows) {
    const organizerId = eventToOrganizer.get(p.event_id);
    if (!organizerId) continue;
    const amount = p.amount ?? 0;
    revenueByOrganizer.set(
      organizerId,
      (revenueByOrganizer.get(organizerId) ?? 0) + amount,
    );
    commissionByOrganizer.set(
      organizerId,
      (commissionByOrganizer.get(organizerId) ?? 0) +
        amount * (rateByEvent.get(p.event_id) ?? PLATFORM_COMMISSION_RATE),
    );
  }

  return ((organizers as OrganizerRow[]) ?? []).map((o) => {
    const own = eventRows.filter((e) => e.organizer_id === o.id);
    const revenue = revenueByOrganizer.get(o.id) ?? 0;
    const paper = sumPhysical(physical, own.map((e) => e.id));
    return {
      ...o,
      owner: o.owner ?? null,
      eventsCount: own.length,
      publishedEvents: own.filter((e) => e.status === "published").length,
      ticketsSold: own.reduce((s, e) => s + (e.tickets_sold ?? 0), 0),
      physicalTickets: paper.generated,
      physicalEntered: paper.entered,
      revenue,
      commission: Math.round(commissionByOrganizer.get(o.id) ?? 0),
    };
  });
}

export interface OrganizerActivity {
  organizer: OrganizerWithStats;
  events: Event[];
  payments: Payment[];
  /** Entrées réelles : tickets distincts validés au scanner (tous types). */
  entriesCount: number;
  entriesByEvent: Record<string, number>;
  physicalByEvent: Record<string, PhysicalTicketCounts>;
  /** Tentatives refusées sur un ticket déjà utilisé (non comptées en entrées). */
  repeatScans: number;
}

/** Détail d'activité d'un organisateur : événements, paiements, scans. */
export async function getOrganizerActivity(
  id: string,
): Promise<OrganizerActivity | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();

  const { data: organizer } = await supabase
    .from("organizers")
    .select("*, owner:profiles(full_name, email, phone)")
    .eq("id", id)
    .maybeSingle();
  if (!organizer) return null;
  const org = organizer as OrganizerRow;

  const { data: events } = await supabase
    .from("events")
    .select("*, category:categories(*)")
    .eq("organizer_id", id)
    .order("starts_at", { ascending: false });
  const eventRows = (events as Event[]) ?? [];
  const eventIds = eventRows.map((e) => e.id);

  let paymentRows: Payment[] = [];
  let entriesCount = 0;
  let repeatScans = 0;
  const entriesByEvent: Record<string, number> = {};
  let physical = new Map<string, PhysicalTicketCounts>();
  if (eventIds.length > 0) {
    const [{ data: payments }, usedCounts, { count: repeats }, paper] =
      await Promise.all([
        supabase
          .from("payments")
          .select("*")
          .in("event_id", eventIds)
          .order("created_at", { ascending: false }),
        Promise.all(
          eventIds.map((eventId) =>
            supabase
              .from("tickets")
              .select("id", { count: "exact", head: true })
              .eq("event_id", eventId)
              .eq("status", "used"),
          ),
        ),
        supabase
          .from("scans")
          .select("id, ticket:tickets!inner(event_id)", {
            count: "exact",
            head: true,
          })
          .eq("result", "already_used")
          .in("ticket.event_id", eventIds),
        getPhysicalCountsByEvent(eventIds),
      ]);
    physical = paper;
    paymentRows = (payments as Payment[]) ?? [];
    eventIds.forEach((eventId, i) => {
      const n = usedCounts[i].count ?? 0;
      entriesByEvent[eventId] = n;
      entriesCount += n;
    });
    repeatScans = repeats ?? 0;
  }

  const rateByEvent = new Map<string, number>();
  for (const e of eventRows) rateByEvent.set(e.id, eventCommissionRate(e.commission_rate));

  const paidPayments = paymentRows.filter((p) => p.status === "paid");
  const revenue = paidPayments.reduce((s, p) => s + (p.amount ?? 0), 0);
  const commission = paidPayments.reduce(
    (s, p) => s + (p.amount ?? 0) * (rateByEvent.get(p.event_id) ?? PLATFORM_COMMISSION_RATE),
    0,
  );

  const paper = sumPhysical(physical, eventIds);

  return {
    organizer: {
      ...org,
      owner: org.owner ?? null,
      eventsCount: eventRows.length,
      publishedEvents: eventRows.filter((e) => e.status === "published").length,
      ticketsSold: eventRows.reduce((s, e) => s + (e.tickets_sold ?? 0), 0),
      physicalTickets: paper.generated,
      physicalEntered: paper.entered,
      revenue,
      commission: Math.round(commission),
    },
    events: eventRows,
    payments: paymentRows,
    entriesCount,
    entriesByEvent,
    physicalByEvent: Object.fromEntries(physical),
    repeatScans,
  };
}
