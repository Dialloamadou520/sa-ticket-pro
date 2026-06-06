import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  createDexpayPayment,
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
    await supabase.from("tickets").insert(tickets);
    await supabase.from("payments").update({ status: "paid" }).eq("id", payment.id);
    return NextResponse.json({ redirect: `/profil?tab=tickets` });
  }

  if (!isDexpayConfigured()) {
    return NextResponse.json(
      {
        error:
          "Paiement mobile non configuré. Ajoutez DEXPAY_API_KEY dans les variables d'environnement.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await createDexpayPayment({
      amount,
      currency: SITE.currency,
      provider: body.provider,
      reference: payment.id,
      customerName: body.holderName,
      customerEmail: user.email ?? undefined,
      customerPhone: body.phone,
      description: `Tickets — ${event.title}`,
      callbackUrl: `${SITE.url}/api/payments/webhook`,
      returnUrl: `${SITE.url}/paiement/confirmation?ref=${payment.id}`,
    });

    await supabase
      .from("payments")
      .update({ provider_reference: result.providerReference })
      .eq("id", payment.id);

    return NextResponse.json({ redirect: result.checkoutUrl });
  } catch (e) {
    await supabase.from("payments").update({ status: "failed" }).eq("id", payment.id);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur de paiement." },
      { status: 502 }
    );
  }
}
