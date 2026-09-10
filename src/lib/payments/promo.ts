import { createAdminClient } from "@/lib/supabase/admin";
import type { PromoCode } from "@/lib/types";

export { discountFor } from "@/lib/payments/promo-discount";

/**
 * Retrouve un code actif utilisable pour un événement. Un code sans `event_id`
 * vaut pour tous les événements. Lecture en service-role : la table est
 * réservée aux admins côté RLS.
 */
export async function findPromoCode(
  code: string,
  eventId: string,
): Promise<PromoCode | null> {
  const clean = code.trim();
  if (!clean) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("promo_codes")
    .select("*")
    .ilike("code", clean)
    .maybeSingle();
  const promo = data as PromoCode | null;
  if (!promo || !promo.active) return null;
  if (promo.event_id && promo.event_id !== eventId) return null;
  return promo;
}
