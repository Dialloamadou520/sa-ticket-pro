import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDexpayCheckoutStatus } from "@/lib/payments/dexpay";
import { fulfillPaidPayment } from "@/lib/payments/fulfill";
import type { Payment } from "@/lib/types";

/**
 * Webhook DexpayAfrica. Au lieu de faire confiance au contenu notifié, on
 * récupère la référence puis on vérifie l'état réel de la session directement
 * auprès de DexPay (source de vérité). Si le paiement est confirmé, on génère
 * les tickets (QR token unique). Client service-role (bypass RLS).
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let payload: {
    event?: string;
    reference?: string;
    data?: { reference?: string };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const reference = payload.data?.reference ?? payload.reference;
  if (!reference) {
    return NextResponse.json({ error: "Référence manquante." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", reference)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });
  }

  if ((payment as Payment).status === "paid") {
    return NextResponse.json({ ok: true });
  }

  // Vérification indépendante auprès de DexPay (sécurise le webhook sans
  // dépendre de la signature : on interroge directement l'API).
  const status = await getDexpayCheckoutStatus(reference);

  if (status?.paid) {
    await fulfillPaidPayment(supabase, payment as Payment);
    return NextResponse.json({ ok: true });
  }

  if (status && status.status === "cancelled") {
    await supabase
      .from("payments")
      .update({ status: "failed" })
      .eq("id", reference);
  }

  return NextResponse.json({ ok: true });
}
