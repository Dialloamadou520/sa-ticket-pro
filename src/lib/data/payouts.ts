import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { eventCommissionRate } from "@/lib/data/admin";
import type { Event, Organizer, Payment, Payout } from "@/lib/types";

/** Solde d'un organisateur : ce qu'il a gagné, ce qui lui a déjà été envoyé. */
export interface PayoutBalance {
  /** Somme des paiements encaissés (hors frais de service acheteur). */
  revenue: number;
  /** Commission de la plateforme retenue. */
  commission: number;
  /** Frais de service pris en charge par l'organisateur (événements négociés). */
  serviceFee: number;
  /** revenue − commission − serviceFee. */
  net: number;
  /** Reversements déjà envoyés (terminés). */
  paidOut: number;
  /** Reversements en cours (demandés ou en traitement). */
  pending: number;
  /** net − paidOut − pending : montant encore demandable. */
  available: number;
}

function emptyBalance(): PayoutBalance {
  return {
    revenue: 0,
    commission: 0,
    serviceFee: 0,
    net: 0,
    paidOut: 0,
    pending: 0,
    available: 0,
  };
}

/**
 * Calcule le solde de chaque organisateur passé en argument, à partir des
 * paiements encaissés (`status = paid`), de la commission de chaque événement
 * et des reversements déjà effectués ou en cours.
 */
async function computeBalances(
  organizerIds: string[],
): Promise<Map<string, PayoutBalance>> {
  const balances = new Map<string, PayoutBalance>();
  for (const id of organizerIds) balances.set(id, emptyBalance());
  if (organizerIds.length === 0) return balances;

  const admin = createAdminClient();
  const [{ data: events }, { data: payouts }] = await Promise.all([
    admin.from("events").select("*").in("organizer_id", organizerIds),
    admin
      .from("payouts")
      .select("organizer_id, amount, status")
      .in("organizer_id", organizerIds),
  ]);

  const eventRows = (events ?? []) as Pick<
    Event,
    "id" | "organizer_id" | "commission_rate"
  >[];
  if (eventRows.length > 0) {
    const { data: payments } = await admin
      .from("payments")
      .select("event_id, amount, service_fee, fee_paid_by")
      .eq("status", "paid")
      .in(
        "event_id",
        eventRows.map((e) => e.id),
      );

    const byEvent = new Map(
      eventRows.map((e) => [
        e.id,
        {
          organizerId: e.organizer_id,
          rate: eventCommissionRate(e.commission_rate),
        },
      ]),
    );
    for (const p of (payments ?? []) as Pick<
      Payment,
      "event_id" | "amount" | "service_fee" | "fee_paid_by"
    >[]) {
      const meta = byEvent.get(p.event_id);
      if (!meta) continue;
      const acc = balances.get(meta.organizerId);
      if (!acc) continue;
      const amount = p.amount ?? 0;
      acc.revenue += amount;
      acc.commission += amount * meta.rate;
      // Frais négociés à la charge de l'organisateur : l'acheteur ne les a pas
      // payés, ils sont retenus ici sur ce qui lui revient.
      if (p.fee_paid_by === "organizer") acc.serviceFee += p.service_fee ?? 0;
    }
  }

  for (const row of (payouts ?? []) as Pick<
    Payout,
    "organizer_id" | "amount" | "status"
  >[]) {
    const acc = balances.get(row.organizer_id);
    if (!acc) continue;
    if (row.status === "completed") acc.paidOut += row.amount;
    else if (row.status === "requested" || row.status === "processing") {
      acc.pending += row.amount;
    }
  }

  for (const acc of balances.values()) {
    acc.commission = Math.round(acc.commission);
    acc.serviceFee = Math.round(acc.serviceFee);
    acc.net = acc.revenue - acc.commission - acc.serviceFee;
    acc.available = Math.max(0, acc.net - acc.paidOut - acc.pending);
  }
  return balances;
}

export interface MyPayoutPage {
  organizer: Pick<
    Organizer,
    "id" | "company_name" | "payout_phone" | "payout_operator"
  > | null;
  balance: PayoutBalance;
  payouts: Payout[];
}

/** Solde, compte de retrait et historique de l'organisateur connecté. */
export async function getMyPayoutPage(): Promise<MyPayoutPage> {
  if (!isSupabaseConfigured) {
    return { organizer: null, balance: emptyBalance(), payouts: [] };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { organizer: null, balance: emptyBalance(), payouts: [] };

  const { data: organizer } = await supabase
    .from("organizers")
    .select("id, company_name, payout_phone, payout_operator")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!organizer) {
    return { organizer: null, balance: emptyBalance(), payouts: [] };
  }

  const row = organizer as MyPayoutPage["organizer"] & { id: string };
  const admin = createAdminClient();
  const [balances, { data: payouts }] = await Promise.all([
    computeBalances([row.id]),
    admin
      .from("payouts")
      .select("*")
      .eq("organizer_id", row.id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    organizer: row,
    balance: balances.get(row.id) ?? emptyBalance(),
    payouts: (payouts as Payout[]) ?? [],
  };
}

export interface AdminPayout extends Payout {
  organizerName: string;
  /** Solde encore disponible de l'organisateur (hors demandes en cours). */
  available: number;
}

/** Toutes les demandes de reversement, pour l'administration. */
export async function getAdminPayouts(): Promise<AdminPayout[]> {
  if (!isSupabaseConfigured) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("payouts")
    .select("*, organizer:organizers(company_name)")
    .order("created_at", { ascending: false });

  const rows = ((data as (Payout & {
    organizer: { company_name: string } | null;
  })[]) ?? []);
  const balances = await computeBalances([
    ...new Set(rows.map((r) => r.organizer_id)),
  ]);

  return rows.map((r) => ({
    ...r,
    organizerName: r.organizer?.company_name ?? "Organisateur",
    available: balances.get(r.organizer_id)?.available ?? 0,
  }));
}
