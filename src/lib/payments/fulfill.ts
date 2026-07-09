import type { createAdminClient } from "@/lib/supabase/admin";
import type { Payment } from "@/lib/types";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Finalise un paiement confirmé : marque le paiement « payé » et génère les
 * tickets (QR token unique côté base) si ce n'est pas déjà fait. Idempotent et
 * sûr en cas d'appels concurrents (webhook + sondage de statut + page de
 * confirmation peuvent se déclencher en même temps).
 *
 * La génération des tickets est protégée par une « prise » atomique : on tente
 * de faire passer le paiement de `pending`/`failed` → `paid` en une seule
 * requête (`.neq("status", "paid")`). Postgres sérialise l'UPDATE sur la ligne,
 * donc un seul appelant obtient la ligne mise à jour ; les autres reçoivent 0
 * ligne (le paiement est déjà `paid`) et s'arrêtent. Seul le gagnant crée les
 * tickets, ce qui empêche les doublons. À n'utiliser qu'avec le client
 * service-role (bypass RLS).
 */
export async function fulfillPaidPayment(
  admin: AdminClient,
  payment: Payment
): Promise<void> {
  // Prise atomique : seul l'appelant qui bascule réellement le statut vers
  // « paid » a le droit de générer les tickets.
  const { data: claimed } = await admin
    .from("payments")
    .update({ status: "paid" })
    .eq("id", payment.id)
    .neq("status", "paid")
    .select("id");

  // Un autre appel concurrent a déjà pris ce paiement (et génère/génère déjà
  // les tickets) : ne rien faire pour éviter les doublons.
  if (!claimed || claimed.length === 0) return;

  // Garde-fou supplémentaire : si des tickets existent déjà pour ce paiement
  // (ex. ancienne génération), ne pas en recréer.
  const { data: existing } = await admin
    .from("tickets")
    .select("id")
    .eq("payment_id", payment.id)
    .limit(1);
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
