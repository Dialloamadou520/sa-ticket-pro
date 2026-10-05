import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { verifyTicketToken } from "@/lib/tickets/verify-ticket";
import type { SyncResult } from "@/lib/tickets/offline-types";

const MAX_SCANS = 200;

/**
 * Envoie au serveur les entrées validées hors connexion. Chaque scan est
 * revérifié : un billet déjà entré ailleurs revient en `already_used`
 * (doublon à signaler au contrôleur).
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const body = (await request.json()) as {
    scans?: { id: string; token: string; scannedAt: string }[];
  };
  const scans = (body.scans ?? []).slice(0, MAX_SCANS);

  const admin = createAdminClient();
  const results: SyncResult[] = [];
  for (const scan of scans) {
    if (typeof scan.id !== "string" || typeof scan.token !== "string") continue;
    const { body: verdict } = await verifyTicketToken(admin, user, scan.token, {
      scannedAt: scan.scannedAt,
      counts: false,
    });
    results.push({
      id: scan.id,
      result: verdict.result,
      message: verdict.message,
      holder: verdict.holder,
      usedAt: verdict.usedAt,
      usedBy: verdict.usedBy,
    });
  }

  return NextResponse.json({ results });
}
