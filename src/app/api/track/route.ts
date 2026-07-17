import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Extrait le slug d'un chemin d'événement `/evenements/<slug>` (hors sous-pages). */
function eventSlugFromPath(path: string): string | null {
  const m = /^\/evenements\/([^/?#]+)$/.exec(path);
  return m ? m[1] : null;
}

/**
 * Enregistre une visite de page (« clic ») pour les statistiques admin.
 * Point d'entrée public : insertion via le client service-role avec des
 * valeurs dérivées côté serveur uniquement.
 */
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured) return new NextResponse(null, { status: 204 });

  let path = "";
  let visitorId: string | null = null;
  try {
    const body = (await request.json()) as { path?: string; visitorId?: string };
    path = (body.path ?? "").trim();
    visitorId = body.visitorId?.trim() || null;
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  if (!path.startsWith("/") || path.length > 512) {
    return new NextResponse(null, { status: 204 });
  }

  const admin = createAdminClient();

  let eventId: string | null = null;
  const slug = eventSlugFromPath(path);
  if (slug) {
    const { data } = await admin
      .from("events")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    eventId = data?.id ?? null;
  }

  await admin
    .from("page_views")
    .insert({ path, event_id: eventId, visitor_id: visitorId });

  return new NextResponse(null, { status: 204 });
}
