import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyDexpaySignature } from "@/lib/payments/dexpay";

/**
 * Webhook DexpayAfrica. Après un paiement réussi, marque le paiement comme payé
 * et génère les tickets correspondants (avec QR token unique côté base).
 * Utilise le client service-role (bypass RLS) — endpoint serveur uniquement.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const payload = JSON.parse(rawBody) as {
    event?: string;
    data?: { reference?: string; status?: string };
  };

  const signature =
    request.headers.get("x-dexchange-signature") ??
    request.headers.get("x-dexpay-signature");

  const valid = await verifyDexpaySignature(payload, signature);
  if (!valid) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }

  const paymentId = payload.data?.reference;
  if (!paymentId) {
    return NextResponse.json({ error: "Référence manquante." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });
  }

  // Idempotence : ne pas régénérer les tickets si déjà payé.
  if (payment.status === "paid") {
    return NextResponse.json({ ok: true });
  }

  const success =
    payload.event === "checkout.completed" ||
    payload.data?.status === "success" ||
    payload.data?.status === "paid";

  if (!success) {
    await supabase.from("payments").update({ status: "failed" }).eq("id", paymentId);
    return NextResponse.json({ ok: true });
  }

  await supabase.from("payments").update({ status: "paid" }).eq("id", paymentId);

  const tickets = Array.from({ length: payment.quantity }).map(() => ({
    event_id: payment.event_id,
    user_id: payment.user_id,
    payment_id: payment.id,
    ticket_type: payment.ticket_type,
    price: payment.amount / payment.quantity,
    holder_name: payment.guest_name,
    holder_email: payment.guest_email,
  }));
  await supabase.from("tickets").insert(tickets);

  return NextResponse.json({ ok: true });
}
