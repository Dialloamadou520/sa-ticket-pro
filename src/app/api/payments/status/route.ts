import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDexpayCheckoutStatus } from "@/lib/payments/dexpay";
import { fulfillPaidPayment } from "@/lib/payments/fulfill";
import type { Payment } from "@/lib/types";

/**
 * Statut d'un paiement, interrogé par l'écran d'attente du paiement intégré.
 * Vérifie l'état réel auprès de DexPay et génère le ticket dès confirmation
 * (idempotent), sans dépendre du webhook.
 */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "Référence manquante." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("id", ref)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ status: "unknown" }, { status: 404 });
  }

  if ((payment as Payment).status === "paid") {
    return NextResponse.json({ status: "paid" });
  }

  const remote = await getDexpayCheckoutStatus(ref);
  if (remote?.paid) {
    await fulfillPaidPayment(admin, payment as Payment);
    return NextResponse.json({ status: "paid" });
  }
  if (remote && (remote.status === "cancelled" || remote.status === "failed")) {
    return NextResponse.json({ status: "failed" });
  }

  return NextResponse.json({ status: "pending" });
}
