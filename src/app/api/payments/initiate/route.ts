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
  email?: string;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
  // Achat invité autorisé : pas de connexion requise. Si l'utilisateur est
  // connecté, on rattache l'achat à son compte ; sinon on conserve l'email
  // fourni pour lui envoyer / afficher son ticket.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const guestEmail = (body.email ?? "").trim();
  const buyerEmail = user?.email ?? guestEmail;
  if (!user && !isValidEmail(guestEmail)) {
    return NextResponse.json(
      { error: "Un email valide est requis pour recevoir votre ticket." },
      { status: 400 }
    );
  }

  // Mutations serveur (insert/maj/tickets) : client service-role pour
  // contourner le RLS (un invité n'a pas de session authentifiée).
  const admin = createAdminClient();

  const { data: payment, error } = await admin
    .from("payments")
    .insert({
      user_id: user?.id ?? null,
      guest_email: user ? null : guestEmail,
      guest_name: user ? null : body.holderName,
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
      user_id: user?.id ?? null,
      payment_id: payment.id,
      ticket_type: body.ticketType,
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

  try {
    const result = await createDexpayCheckout({
      amount,
      currency: SITE.currency,
      reference: payment.id,
      itemName: `${quantity} ticket(s) — ${event.title}`,
      countryISO: "SN",
      customerName: body.holderName,
      customerEmail: buyerEmail || undefined,
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
