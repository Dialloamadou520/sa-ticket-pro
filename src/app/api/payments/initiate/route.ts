import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  createDexpayCheckout,
  createDexpayPaymentAttempt,
  isDexpayConfigured,
  normalizeSenegalPhone,
  toDexpayOperator,
} from "@/lib/payments/dexpay";
import { getEventBySlug } from "@/lib/data/events";
import { SITE } from "@/lib/constants";
import type { PaymentProvider, TicketType } from "@/lib/types";

interface Body {
  eventSlug: string;
  quantity: number;
  ticketType: TicketType;
  holderName: string;
  provider: PaymentProvider;
  phone?: string;
  tierId?: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Body;
  const event = await getEventBySlug(body.eventSlug);
  if (!event) {
    return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
  }

  const quantity = Math.max(1, Math.min(10, Number(body.quantity) || 1));

  // Catégorie de ticket choisie (Standard/VIP/…) : le prix fait foi côté
  // serveur. À défaut de catégorie, on retombe sur le prix unique de l'événement.
  let unitPrice = event.price;
  let tierId: string | null = null;
  let tierName: string | null = null;
  if (body.tierId && isSupabaseConfigured) {
    const lookup = createAdminClient();
    const { data: tier } = await lookup
      .from("ticket_tiers")
      .select("id, name, price, event_id")
      .eq("id", body.tierId)
      .maybeSingle();
    if (!tier || tier.event_id !== event.id) {
      return NextResponse.json(
        { error: "Catégorie de ticket invalide." },
        { status: 400 }
      );
    }
    unitPrice = tier.price;
    tierId = tier.id;
    tierName = tier.name;
  }
  const amount = unitPrice * quantity;

  // ---- Mode démo : aucun backend configuré -----------------------------------
  if (!isSupabaseConfigured) {
    const params = new URLSearchParams({
      demo: "1",
      event: event.slug,
      qty: String(quantity),
      name: body.holderName || "Invité",
    });
    return NextResponse.json({
      redirect: `/paiement/confirmation?${params.toString()}`,
    });
  }

  // ---- Mode réel -------------------------------------------------------------
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const buyerEmail = user?.email ?? null;

  // Mutations serveur (insert/maj/tickets) : client service-role pour
  // contourner le RLS (un invité n'a pas de session authentifiée).
  const admin = createAdminClient();

  const { data: payment, error } = await admin
    .from("payments")
    .insert({
      user_id: user?.id ?? null,
      guest_email: null,
      guest_name: user ? null : body.holderName,
      event_id: event.id,
      amount,
      currency: SITE.currency,
      provider: body.provider,
      status: "pending",
      quantity,
      ticket_type: body.ticketType,
      tier_id: tierId,
      tier_name: tierName,
    })
    .select()
    .single();

  if (error || !payment) {
    return NextResponse.json(
      { error: "Impossible de créer le paiement." },
      { status: 500 }
    );
  }

  // Événement gratuit : générer les tickets immédiatement.
  if (amount === 0) {
    const tickets = Array.from({ length: quantity }).map(() => ({
      event_id: event.id,
      user_id: user?.id ?? null,
      payment_id: payment.id,
      ticket_type: body.ticketType,
      tier_id: tierId,
      tier_name: tierName,
      price: 0,
      holder_name: body.holderName,
      holder_email: buyerEmail || null,
    }));
    await admin.from("tickets").insert(tickets);
    await admin.from("payments").update({ status: "paid" }).eq("id", payment.id);
    return NextResponse.json({
      redirect: `/paiement/confirmation?ref=${payment.id}`,
    });
  }

  if (!isDexpayConfigured()) {
    return NextResponse.json(
      {
        error:
          "Paiement mobile non configuré. Ajoutez DEXPAY_PUBLIC_KEY dans les variables d'environnement.",
      },
      { status: 503 }
    );
  }

  const operator = toDexpayOperator(body.provider);
  const phone = normalizeSenegalPhone(body.phone ?? "");
  if (operator && !phone) {
    await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
    return NextResponse.json(
      { error: "Numéro de téléphone valide requis (9 chiffres)." },
      { status: 400 }
    );
  }

  try {
    const result = await createDexpayCheckout({
      amount,
      currency: SITE.currency,
      reference: payment.id,
      itemName: `${quantity} ticket(s) — ${event.title}`,
      countryISO: "SN",
      customerName: body.holderName,
      customerEmail: buyerEmail || undefined,
      customerPhone: phone ?? body.phone,
      webhookUrl: `${SITE.url}/api/payments/webhook`,
      successUrl: `${SITE.url}/paiement/confirmation?ref=${payment.id}`,
      failureUrl: `${SITE.url}/evenements/${event.slug}/achat?echec=1`,
      metadata: { provider: body.provider, event_id: event.id },
    });

    await admin
      .from("payments")
      .update({ provider_reference: result.providerReference })
      .eq("id", payment.id);

    // Paiement intégré (sans page DexPay) : on déclenche directement la
    // tentative sur l'opérateur choisi. Wave → lien pay.wave.com ; Orange
    // Money → validation par push/USSD sur le téléphone. En cas d'échec on
    // retombe sur la page de paiement hébergée.
    if (operator && phone) {
      try {
        const attempt = await createDexpayPaymentAttempt({
          reference: payment.id,
          operator,
          customerName: body.holderName,
          customerPhone: phone,
        });
        return NextResponse.json({
          mode: "integrated",
          provider: body.provider,
          paymentId: payment.id,
          cashoutUrl: attempt.cashoutUrl,
          confirmUrl: `/paiement/confirmation?ref=${payment.id}`,
        });
      } catch {
        // Repli : page de paiement hébergée DexPay.
        return NextResponse.json({ redirect: result.paymentUrl });
      }
    }

    return NextResponse.json({ redirect: result.paymentUrl });
  } catch (e) {
    await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de paiement." },
      { status: 502 }
    );
  }
}
