import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Ligne générique d'une table archivée (colonnes conservées telles quelles). */
export type SnapshotRow = Record<string, unknown>;

/**
 * Photo complète d'un événement et de ses données liées, prise juste avant la
 * suppression. Les clés correspondent aux tables restaurées dans cet ordre.
 */
export interface EventSnapshot {
  event: SnapshotRow;
  tiers: SnapshotRow[];
  payments: SnapshotRow[];
  tickets: SnapshotRow[];
  scans: SnapshotRow[];
  controllers: SnapshotRow[];
  collaborators: SnapshotRow[];
  promoCodes: SnapshotRow[];
}

/** Entrée de la corbeille telle qu'affichée dans l'administration. */
export interface DeletedEvent {
  id: string;
  title: string;
  organizerName: string | null;
  startsAt: string | null;
  ticketsSold: number;
  deletedAt: string;
  ticketCount: number;
  paymentCount: number;
}

interface DeletedEventRow {
  id: string;
  title: string;
  organizer_name: string | null;
  starts_at: string | null;
  tickets_sold: number;
  deleted_at: string;
  snapshot: EventSnapshot;
}

/** Vrai si la migration 0018 (table `deleted_events`) n'a pas encore été appliquée. */
function isMissingTrashTable(message: string) {
  return (
    /deleted_events/i.test(message) &&
    /(does not exist|schema cache|not find the table)/i.test(message)
  );
}

/** La corbeille est-elle disponible en base ? (migration 0018 appliquée) */
export async function isTrashAvailable(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const admin = createAdminClient();
  const { error } = await admin
    .from("deleted_events")
    .select("id", { head: true, count: "exact" })
    .limit(1);
  return !error;
}

/** Événements présents dans la corbeille, du plus récemment supprimé au plus ancien. */
export async function getDeletedEvents(): Promise<DeletedEvent[]> {
  if (!isSupabaseConfigured) return [];
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("deleted_events")
    .select("id, title, organizer_name, starts_at, tickets_sold, deleted_at, snapshot")
    .order("deleted_at", { ascending: false });
  if (error) return [];
  return ((data ?? []) as DeletedEventRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    organizerName: row.organizer_name,
    startsAt: row.starts_at,
    ticketsSold: row.tickets_sold,
    deletedAt: row.deleted_at,
    ticketCount: row.snapshot?.tickets?.length ?? 0,
    paymentCount: row.snapshot?.payments?.length ?? 0,
  }));
}

/**
 * Archive un événement et toutes ses données liées dans la corbeille.
 * À appeler avant le `delete` (la suppression en base est en cascade).
 */
export async function archiveEvent(eventId: string, deletedBy: string | null) {
  if (!isSupabaseConfigured) return;
  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("*, organizer:organizers(company_name)")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return;

  const { organizer, ...eventRow } = event as SnapshotRow & {
    organizer: { company_name: string } | null;
  };

  const [tiers, payments, tickets, controllers, collaborators, promoCodes] =
    await Promise.all([
      admin.from("ticket_tiers").select("*").eq("event_id", eventId),
      admin.from("payments").select("*").eq("event_id", eventId),
      admin.from("tickets").select("*").eq("event_id", eventId),
      admin.from("event_controllers").select("*").eq("event_id", eventId),
      admin.from("event_collaborators").select("*").eq("event_id", eventId),
      admin.from("promo_codes").select("*").eq("event_id", eventId),
    ]);

  const ticketRows = (tickets.data ?? []) as SnapshotRow[];
  const ticketIds = ticketRows
    .map((t) => t.id)
    .filter((id): id is string => typeof id === "string");
  const scans = ticketIds.length
    ? await admin.from("scans").select("*").in("ticket_id", ticketIds)
    : { data: [] as SnapshotRow[] };

  const snapshot: EventSnapshot = {
    event: eventRow,
    tiers: (tiers.data ?? []) as SnapshotRow[],
    payments: (payments.data ?? []) as SnapshotRow[],
    tickets: ticketRows,
    scans: (scans.data ?? []) as SnapshotRow[],
    controllers: (controllers.data ?? []) as SnapshotRow[],
    collaborators: (collaborators.data ?? []) as SnapshotRow[],
    promoCodes: (promoCodes.data ?? []) as SnapshotRow[],
  };

  const { error } = await admin.from("deleted_events").upsert({
    id: eventId,
    title: String(eventRow.title ?? "Événement"),
    organizer_id: typeof eventRow.organizer_id === "string" ? eventRow.organizer_id : null,
    organizer_name: organizer?.company_name ?? null,
    starts_at: typeof eventRow.starts_at === "string" ? eventRow.starts_at : null,
    tickets_sold: typeof eventRow.tickets_sold === "number" ? eventRow.tickets_sold : 0,
    snapshot,
    deleted_at: new Date().toISOString(),
    deleted_by: deletedBy,
  });
  // Migration 0018 pas encore appliquée : la suppression reste possible, mais
  // sans archivage (la page corbeille affiche l'avertissement correspondant).
  if (error && !isMissingTrashTable(error.message)) {
    throw new Error("Archivage de l'événement impossible.");
  }
}

/**
 * Réinsère un événement archivé et ses données liées, dans l'ordre des
 * dépendances, puis vide son entrée de corbeille.
 */
export async function restoreEvent(eventId: string) {
  const admin = createAdminClient();
  const { data, error: readError } = await admin
    .from("deleted_events")
    .select("snapshot")
    .eq("id", eventId)
    .maybeSingle();
  if (readError || !data) throw new Error("Événement introuvable dans la corbeille.");
  const snapshot = (data as { snapshot: EventSnapshot }).snapshot;

  const steps: { table: string; rows: SnapshotRow[] }[] = [
    { table: "events", rows: [snapshot.event] },
    { table: "ticket_tiers", rows: snapshot.tiers ?? [] },
    { table: "payments", rows: snapshot.payments ?? [] },
    { table: "tickets", rows: snapshot.tickets ?? [] },
    { table: "scans", rows: snapshot.scans ?? [] },
    { table: "event_controllers", rows: snapshot.controllers ?? [] },
    { table: "event_collaborators", rows: snapshot.collaborators ?? [] },
    { table: "promo_codes", rows: snapshot.promoCodes ?? [] },
  ];

  for (const step of steps) {
    if (step.rows.length === 0) continue;
    const { error } = await admin.from(step.table).upsert(step.rows);
    if (error) {
      throw new Error(
        step.table === "events"
          ? "Restauration impossible : l'organisateur de cet événement n'existe plus."
          : `Restauration partielle : les données « ${step.table} » n'ont pas pu être remises.`,
      );
    }
  }

  // Le trigger increment_tickets_sold a recompté chaque ticket réinséré :
  // on remet le compteur d'origine de l'événement.
  const restoredTickets = snapshot.tickets ?? [];
  if (restoredTickets.length > 0) {
    const originalSold = snapshot.event.tickets_sold;
    await admin
      .from("events")
      .update({
        tickets_sold:
          typeof originalSold === "number" ? originalSold : restoredTickets.length,
      })
      .eq("id", eventId);
  }

  await admin.from("deleted_events").delete().eq("id", eventId);
}

/** Supprime définitivement une entrée de corbeille (plus aucune récupération). */
export async function purgeDeletedEvent(eventId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("deleted_events").delete().eq("id", eventId);
  if (error) throw new Error("Suppression définitive impossible.");
}
