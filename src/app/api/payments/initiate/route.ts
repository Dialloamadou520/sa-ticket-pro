import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  createDexpayCheckout,
  isDexpayConfigured,
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
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Body;
  const event = await getEventBySlug(body.eventSlug);
  if (!event) {
    return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
  }

  const quantity = Math.max(1, Math.min(10, Number(body.quantity) || 1));
  const amount = event.price * quantity;

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
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      event_id: event.id,
      amount,
      currency: SITE.currency,
      provider: body.provider,
      status: "pending",
      quantity,
      ticket_type: body.ticketType,
    })
    .select()
    .single();

  if (error || !payment) {
    return NextResponse.json(
      { error: "Impossible de créer le paiement." },
      { status: 500 }
    );
  }

  // Mutations serveur (statut, référence, tickets) : client service-role pour
  // contourner le RLS (le client utilisateur n'a pas de droit UPDATE).
  const admin = createAdminClient();

  // Événement gratuit : générer les tickets immédiatement.
  if (amount === 0) {
    const tickets = Array.from({ length: quantity }).map(() => ({
      event_id: event.id,
      user_id: user.id,
      payment_id: payment.id,
      ticket_type: body.ticketType,
      price: 0,
      holder_name: body.holderName,
    }));
    await admin.from("tickets").insert(tickets);
    await admin.from("payments").update({ status: "paid" }).eq("id", payment.id);
    return NextResponse.json({ redirect: `/profil?tab=tickets` });
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

  try {
    const result = await createDexpayCheckout({
      amount,
      currency: SITE.currency,
      reference: payment.id,
      itemName: `${quantity} ticket(s) — ${event.title}`,
      countryISO: "SN",
      customerName: body.holderName,
      customerEmail: user.email ?? undefined,
      customerPhone: body.phone,
      webhookUrl: `${SITE.url}/api/payments/webhook`,
      successUrl: `${SITE.url}/paiement/confirmation?ref=${payment.id}`,
      failureUrl: `${SITE.url}/evenements/${event.slug}/achat?echec=1`,
      metadata: { provider: body.provider, event_id: event.id },
    });

    await admin
      .from("payments")
      .update({ provider_reference: result.providerReference })
      .eq("id", payment.id);

    return NextResponse.json({ redirect: result.paymentUrl });
  } catch (e) {
    await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de paiement." },
      { status: 502 }
    );
  }
}
