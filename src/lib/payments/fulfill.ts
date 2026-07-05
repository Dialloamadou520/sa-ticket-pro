import type { createAdminClient } from "@/lib/supabase/admin";
import type { Payment } from "@/lib/types";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Finalise un paiement confirmé : marque le paiement « payé » et génère les
 * tickets (QR token unique côté base) si ce n'est pas déjà fait. Idempotent :
 * appelable depuis le webhook ET la page de confirmation sans dupliquer les
 * tickets. À n'utiliser qu'avec le client service-role (bypass RLS).
 */
export async function fulfillPaidPayment(
  admin: AdminClient,
  payment: Payment
): Promise<void> {
  const { data: existing } = await admin
    .from("tickets")
    .select("id")
    .eq("payment_id", payment.id)
    .limit(1);

  if (payment.status !== "paid") {
    await admin.from("payments").update({ status: "paid" }).eq("id", payment.id);
  }

  if ((existing?.length ?? 0) > 0) return;

  const unitPrice =
    payment.quantity > 0 ? payment.amount / payment.quantity : payment.amount;
  const tickets = Array.from({ length: payment.quantity }).map(() => ({
    event_id: payment.event_id,
    user_id: payment.user_id,
    payment_id: payment.id,
    ticket_type: payment.ticket_type,
    tier_id: payment.tier_id,
    tier_name: payment.tier_name,
    price: unitPrice,
    holder_name: payment.guest_name,
    holder_email: payment.guest_email,
  }));
  await admin.from("tickets").insert(tickets);
}
