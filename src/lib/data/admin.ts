import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { sampleEvents } from "@/lib/sample-data";
import type { Event, Organizer, Payment, Profile } from "@/lib/types";

export interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  pendingEvents: number;
  totalRevenue: number;
  platformCommission: number;
}

/** Commission de la plateforme (10%). */
export const PLATFORM_COMMISSION_RATE = 0.1;

export async function getAdminStats(): Promise<AdminStats> {
  if (!isSupabaseConfigured) {
    const revenue = sampleEvents.reduce((s, e) => s + e.tickets_sold * e.price, 0);
    return {
      totalUsers: 1280,
      totalEvents: sampleEvents.length,
      pendingEvents: 2,
      totalRevenue: revenue,
      platformCommission: Math.round(revenue * PLATFORM_COMMISSION_RATE),
    };
  }

  const supabase = await createClient();
  const [{ count: users }, { data: events }, { data: payments }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("events").select("status, tickets_sold, price"),
      supabase.from("payments").select("amount").eq("status", "paid"),
    ]);

  const revenue = (payments ?? []).reduce((s, p) => s + (p.amount ?? 0), 0);
  const eventRows = events ?? [];

  return {
    totalUsers: users ?? 0,
    totalEvents: eventRows.length,
    pendingEvents: eventRows.filter((e) => e.status === "pending").length,
    totalRevenue: revenue,
    platformCommission: Math.round(revenue * PLATFORM_COMMISSION_RATE),
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
}

/** Liste tous les événements de la plateforme (tous statuts, tous organisateurs). */
export async function getAllEvents(): Promise<AdminEvent[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const [{ data: events }, { data: payments }] = await Promise.all([
    supabase
      .from("events")
      .select("*, category:categories(*), organizer:organizers(id, company_name)")
      .order("created_at", { ascending: false }),
    supabase.from("payments").select("event_id, amount").eq("status", "paid"),
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
    return {
      ...e,
      organizer: e.organizer ?? null,
      revenue,
      commission: Math.round(revenue * PLATFORM_COMMISSION_RATE),
    };
  });
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
  const { data } = await supabase
    .from("payments")
    .select("amount, quantity, created_at")
    .eq("status", "paid");

  const rows = (data ?? []) as Pick<
    Payment,
    "amount" | "quantity" | "created_at"
  >[];

  const byMonth = new Map<string, { revenue: number; ticketsSold: number }>();
  for (const p of rows) {
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const acc = byMonth.get(key) ?? { revenue: 0, ticketsSold: 0 };
    acc.revenue += p.amount ?? 0;
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
        commission: Math.round(v.revenue * PLATFORM_COMMISSION_RATE),
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

  const [{ data: organizers }, { data: events }, { data: payments }] =
    await Promise.all([
      supabase
        .from("organizers")
        .select("*, owner:profiles(full_name, email, phone)")
        .order("created_at", { ascending: false }),
      supabase.from("events").select("id, organizer_id, status, tickets_sold, price"),
      supabase.from("payments").select("event_id, amount").eq("status", "paid"),
    ]);

  const eventRows = (events ?? []) as Pick<
    Event,
    "id" | "organizer_id" | "status" | "tickets_sold" | "price"
  >[];
  const paymentRows = (payments ?? []) as Pick<Payment, "event_id" | "amount">[];

  // event_id -> organizer_id (pour rattacher les paiements à un organisateur).
  const eventToOrganizer = new Map<string, string>();
  for (const e of eventRows) eventToOrganizer.set(e.id, e.organizer_id);

  // organizer_id -> revenus encaissés (somme des paiements "paid").
  const revenueByOrganizer = new Map<string, number>();
  for (const p of paymentRows) {
    const organizerId = eventToOrganizer.get(p.event_id);
    if (!organizerId) continue;
    revenueByOrganizer.set(
      organizerId,
      (revenueByOrganizer.get(organizerId) ?? 0) + (p.amount ?? 0),
    );
  }

  return ((organizers as OrganizerRow[]) ?? []).map((o) => {
    const own = eventRows.filter((e) => e.organizer_id === o.id);
    const revenue = revenueByOrganizer.get(o.id) ?? 0;
    return {
      ...o,
      owner: o.owner ?? null,
      eventsCount: own.length,
      publishedEvents: own.filter((e) => e.status === "published").length,
      ticketsSold: own.reduce((s, e) => s + (e.tickets_sold ?? 0), 0),
      revenue,
      commission: Math.round(revenue * PLATFORM_COMMISSION_RATE),
    };
  });
}

export interface OrganizerActivity {
  organizer: OrganizerWithStats;
  events: Event[];
  payments: Payment[];
  scansCount: number;
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
  let scansCount = 0;
  if (eventIds.length > 0) {
    const [{ data: payments }, { count }] = await Promise.all([
      supabase
        .from("payments")
        .select("*")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("scans")
        .select("id, ticket:tickets!inner(event_id)", {
          count: "exact",
          head: true,
        })
        .in("ticket.event_id", eventIds),
    ]);
    paymentRows = (payments as Payment[]) ?? [];
    scansCount = count ?? 0;
  }

  const revenue = paymentRows
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + (p.amount ?? 0), 0);

  return {
    organizer: {
      ...org,
      owner: org.owner ?? null,
      eventsCount: eventRows.length,
      publishedEvents: eventRows.filter((e) => e.status === "published").length,
      ticketsSold: eventRows.reduce((s, e) => s + (e.tickets_sold ?? 0), 0),
      revenue,
      commission: Math.round(revenue * PLATFORM_COMMISSION_RATE),
    },
    events: eventRows,
    payments: paymentRows,
    scansCount,
  };
}
