import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { canScanEvent } from "@/lib/tickets/verify-ticket";
import type { OfflinePack } from "@/lib/tickets/offline-types";

const PAGE = 1000;
const CHUNK = 200;

interface TicketRow {
  id: string;
  qr_token: string;
  holder_name: string | null;
  status: "valid" | "used";
}

/** Liste des billets d'un événement, pour scanner sans réseau. */
export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("event");
  if (!isSupabaseConfigured || !eventId) {
    return NextResponse.json({ error: "Événement manquant." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id, title, starts_at, organizer_id")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) {
    return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
  }
  if (!(await canScanEvent(admin, user, event.id, event.organizer_id))) {
    return NextResponse.json(
      { error: "Vous n'êtes pas autorisé à scanner cet événement." },
      { status: 403 }
    );
  }

  const rows: TicketRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("tickets")
      .select("id, qr_token, holder_name, status")
      .eq("event_id", event.id)
      .in("status", ["valid", "used"])
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    rows.push(...((data as TicketRow[]) ?? []));
    if (!data || data.length < PAGE) break;
  }

  const firstScan = new Map<string, { at: string; by: string | null }>();
  const usedIds = rows.filter((r) => r.status === "used").map((r) => r.id);
  for (let i = 0; i < usedIds.length; i += CHUNK) {
    const { data } = await admin
      .from("scans")
      .select("ticket_id, created_at, scanned_by")
      .in("ticket_id", usedIds.slice(i, i + CHUNK))
      .eq("result", "valid")
      .order("created_at", { ascending: true });
    for (const s of (data as { ticket_id: string; created_at: string; scanned_by: string | null }[]) ?? []) {
      if (!firstScan.has(s.ticket_id)) {
        firstScan.set(s.ticket_id, { at: s.created_at, by: s.scanned_by });
      }
    }
  }

  const scannerIds = [
    ...new Set([...firstScan.values()].map((s) => s.by).filter((id): id is string => !!id)),
  ];
  const names = new Map<string, string | null>();
  for (let i = 0; i < scannerIds.length; i += CHUNK) {
    const { data } = await admin
      .from("profiles")
      .select("id, full_name")
      .in("id", scannerIds.slice(i, i + CHUNK));
    for (const p of (data as { id: string; full_name: string | null }[]) ?? []) {
      names.set(p.id, p.full_name);
    }
  }

  const pack: OfflinePack = {
    eventId: event.id,
    title: event.title,
    startsAt: event.starts_at,
    downloadedAt: new Date().toISOString(),
    tickets: rows.map((r) => {
      const token = r.qr_token.toLowerCase();
      const scan = firstScan.get(r.id);
      return {
        h: createHash("sha256").update(token).digest("hex"),
        ref: token.slice(0, 8),
        holder: r.holder_name,
        used: r.status === "used",
        usedAt: scan?.at ?? null,
        usedBy: scan?.by ? (names.get(scan.by) ?? null) : null,
      };
    }),
  };

  return NextResponse.json(pack, { headers: { "Cache-Control": "no-store" } });
}
