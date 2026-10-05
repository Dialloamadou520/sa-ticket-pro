import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

export type ScanOutcome = "valid" | "already_used" | "invalid";

export interface ScanUser {
  id: string;
  email?: string | null;
}

export interface VerifyBody {
  result: ScanOutcome;
  message: string;
  holder?: string | null;
  event?: string;
  usedAt?: string | null;
  usedBy?: string | null;
  ticketsTotal?: number;
  ticketsScanned?: number;
  ticketsRemaining?: number;
}

/** Récupère le token brut depuis un lien /verifier/<token> ou une saisie. */
export function extractToken(value: string): string {
  const trimmed = (value ?? "").trim();
  if (trimmed.includes("/verifier/")) {
    return trimmed.split("/verifier/").pop()?.split(/[?#]/)[0] ?? trimmed;
  }
  return trimmed;
}

/** Admin, organisateur propriétaire ou contrôleur assigné (par email). */
export async function canScanEvent(
  admin: Admin,
  user: ScanUser,
  eventId: string,
  organizerId: string | null
): Promise<boolean> {
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role === "admin") return true;

  const { data: organizer } = await admin
    .from("organizers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (organizer && organizer.id === organizerId) return true;

  if (!user.email) return false;
  const { data: controller } = await admin
    .from("event_controllers")
    .select("id")
    .eq("event_id", eventId)
    .ilike("email", user.email)
    .maybeSingle();
  return Boolean(controller);
}

/** Heure de scan transmise par un appareil hors ligne : bornée à 7 jours. */
function sanitizeScanTime(at: string | undefined): string | null {
  if (!at) return null;
  const t = Date.parse(at);
  if (Number.isNaN(t)) return null;
  const now = Date.now();
  if (t > now + 60_000 || t < now - 7 * 24 * 60 * 60 * 1000) return null;
  return new Date(t).toISOString();
}

/**
 * Valide un ticket au point d'entrée et enregistre le scan :
 *   - valid        : ticket valide, première entrée
 *   - already_used : déjà scanné
 *   - invalid      : token inconnu, annulé ou non autorisé
 *
 * Lecture/écriture via le client service-role : le RLS masquerait les tickets
 * d'invités ou ceux d'autres acheteurs. L'autorisation est vérifiée
 * explicitement par `canScanEvent`.
 */
export async function verifyTicketToken(
  admin: Admin,
  user: ScanUser,
  rawToken: string,
  opts: { scannedAt?: string; counts?: boolean } = {}
): Promise<{ status: number; body: VerifyBody }> {
  const token = extractToken(rawToken);
  const withCounts = opts.counts ?? true;
  const createdAt = sanitizeScanTime(opts.scannedAt);
  const scanRow = (ticketId: string, result: ScanOutcome) => ({
    ticket_id: ticketId,
    scanned_by: user.id,
    result,
    ...(createdAt ? { created_at: createdAt } : {}),
  });

  if (!token) {
    return { status: 200, body: { result: "invalid", message: "Code vide." } };
  }

  const select = "*, event:events(title, starts_at, organizer_id)";

  // 1) Correspondance exacte sur le qr_token (cas du scan QR).
  let { data: ticket } = await admin
    .from("tickets")
    .select(select)
    .eq("qr_token", token)
    .maybeSingle();

  // 2) Repli : saisie manuelle de la référence (préfixe du qr_token affiché
  //    sur le ticket). On exige un préfixe d'au moins 6 caractères et une
  //    correspondance unique.
  if (!ticket && /^[0-9a-fA-F]{6,}$/.test(token)) {
    const { data: rows } = await admin
      .from("tickets")
      .select(select)
      .ilike("qr_token", `${token.toLowerCase()}%`)
      .limit(2);
    if (rows && rows.length === 1) ticket = rows[0];
  }

  if (!ticket) {
    return { status: 200, body: { result: "invalid", message: "Ticket inconnu." } };
  }

  const allowed = await canScanEvent(
    admin,
    user,
    ticket.event_id,
    ticket.event?.organizer_id ?? null
  );
  if (!allowed) {
    return {
      status: 403,
      body: {
        result: "invalid",
        message: "Vous n'êtes pas autorisé à scanner ce ticket.",
      },
    };
  }

  const counts = async () =>
    withCounts ? await eventCounts(admin, ticket.event_id) : {};

  const alreadyUsed = async () => {
    const firstEntry = await firstValidScan(admin, ticket.id);
    await admin.from("scans").insert(scanRow(ticket.id, "already_used"));
    return {
      status: 200,
      body: {
        result: "already_used" as const,
        holder: ticket.holder_name,
        event: ticket.event?.title,
        message: "Ce ticket a déjà été utilisé.",
        usedAt: firstEntry.usedAt,
        usedBy: firstEntry.usedBy,
        ...(await counts()),
      },
    };
  };

  if (ticket.status === "used") return alreadyUsed();

  if (ticket.status !== "valid") {
    return {
      status: 200,
      body: { result: "invalid", message: "Ticket annulé ou remboursé." },
    };
  }

  // Passage valid → used atomique : si deux appareils scannent le même ticket
  // en même temps, un seul obtient l'entrée.
  const { data: claimed } = await admin
    .from("tickets")
    .update({ status: "used" })
    .eq("id", ticket.id)
    .eq("status", "valid")
    .select("id");
  if (!claimed || claimed.length === 0) return alreadyUsed();

  await admin.from("scans").insert(scanRow(ticket.id, "valid"));

  return {
    status: 200,
    body: {
      result: "valid",
      holder: ticket.holder_name,
      event: ticket.event?.title,
      message: "Entrée autorisée.",
      ...(await counts()),
    },
  };
}

/**
 * Date et auteur de la première entrée validée d'un ticket, pour informer le
 * contrôleur de quand le ticket a été utilisé.
 */
async function firstValidScan(
  admin: Admin,
  ticketId: string
): Promise<{ usedAt: string | null; usedBy: string | null }> {
  const { data } = await admin
    .from("scans")
    .select("created_at, scanned_by")
    .eq("ticket_id", ticketId)
    .eq("result", "valid")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return { usedAt: null, usedBy: null };

  let usedBy: string | null = null;
  if (data.scanned_by) {
    const { data: scanner } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", data.scanned_by)
      .maybeSingle();
    usedBy = scanner?.full_name ?? null;
  }
  return { usedAt: data.created_at, usedBy };
}

/**
 * Compteurs d'entrées pour un événement : total de tickets émis, nombre déjà
 * scanné (used) et restant à scanner (valid). Sert au compteur du scanner qui
 * se décrémente à chaque entrée validée.
 */
async function eventCounts(
  admin: Admin,
  eventId: string
): Promise<{ ticketsTotal: number; ticketsScanned: number; ticketsRemaining: number }> {
  const [{ count: total }, { count: scanned }] = await Promise.all([
    admin
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .in("status", ["valid", "used"]),
    admin
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "used"),
  ]);
  const ticketsTotal = total ?? 0;
  const ticketsScanned = scanned ?? 0;
  return {
    ticketsTotal,
    ticketsScanned,
    ticketsRemaining: Math.max(0, ticketsTotal - ticketsScanned),
  };
}
