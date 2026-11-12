import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { SavedTicketDesign, TicketDesignMap } from "@/lib/tickets/ticket-design";

interface DesignRow {
  event_id: string;
  category: string;
  image_url: string;
  width_mm: number | string;
  height_mm: number | string;
  qr: SavedTicketDesign["qr"];
  number: SavedTicketDesign["number"];
}

/**
 * Designs de billet des événements donnés. Données non sensibles (visuel
 * imprimé sur les billets) : lues avec le client service-role. Renvoie un objet
 * vide si la migration 0024 n'est pas encore appliquée.
 */
export async function getTicketDesigns(
  eventIds: string[]
): Promise<Record<string, TicketDesignMap>> {
  const ids = [...new Set(eventIds.filter(Boolean))];
  if (!isSupabaseConfigured || ids.length === 0) return {};
  try {
    const { data, error } = await createAdminClient()
      .from("ticket_designs")
      .select("event_id, category, image_url, width_mm, height_mm, qr, number")
      .in("event_id", ids);
    if (error || !data) return {};
    const out: Record<string, TicketDesignMap> = {};
    for (const r of data as DesignRow[]) {
      (out[r.event_id] ??= {})[r.category] = {
        imageUrl: r.image_url,
        widthMm: Number(r.width_mm),
        heightMm: Number(r.height_mm),
        qr: r.qr,
        number: r.number,
      };
    }
    return out;
  } catch {
    return {};
  }
}
