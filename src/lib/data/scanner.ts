import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentUser } from "@/lib/data/auth";
import type { ScannableEvent } from "@/lib/tickets/offline-types";

/**
 * Événements en cours ou à venir que l'utilisateur peut scanner (mêmes règles
 * que `canScanEvent`) : proposés au téléchargement pour le mode hors ligne.
 */
export async function getScannableEvents(): Promise<ScannableEvent[]> {
  if (!isSupabaseConfigured) return [];
  const user = await getCurrentUser();
  if (!user) return [];

  const admin = createAdminClient();
  const since = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  let query = admin
    .from("events")
    .select("id, title, starts_at")
    .or(`starts_at.gte."${since}",ends_at.gte."${since}"`)
    .order("starts_at", { ascending: true })
    .limit(50);

  if (user.profile?.role !== "admin") {
    const { data: organizer } = await admin
      .from("organizers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    const { data: controlled } = user.email
      ? await admin.from("event_controllers").select("event_id").ilike("email", user.email)
      : { data: [] };
    const ids = ((controlled as { event_id: string }[] | null) ?? []).map((c) => c.event_id);
    const filters = [
      ...(organizer ? [`organizer_id.eq.${organizer.id}`] : []),
      ...(ids.length ? [`id.in.(${ids.join(",")})`] : []),
    ];
    if (filters.length === 0) return [];
    query = query.or(filters.join(","));
  }

  const { data } = await query;
  return (data as ScannableEvent[]) ?? [];
}
